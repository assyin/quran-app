"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { SurahMetadata, RevelationType } from "@quran/core";
import type { Locale } from "@quran/i18n";
import { SurahCard } from "./SurahCard";
import { SurahListItem } from "./SurahListItem";
import { toArabicNumerals } from "../lib/arabic-numerals";
import { getPreference, setPreference } from "../lib/preferences";

type TypeFilter = "all" | RevelationType;
type JuzFilter = "all" | number;
type SizeFilter = "all" | "short" | "medium" | "long";
type ViewMode = "grid" | "list";
type SortMode = "number" | "alpha" | "longest" | "shortest";

const VIEW_MODES = ["grid", "list"] as const;
const SORT_MODES = ["number", "alpha", "longest", "shortest"] as const;

const COOKIE_VIEW = "quran-index-view";
const COOKIE_SORT = "quran-index-sort";

type SurahIndexClientProps = {
  surahs: SurahMetadata[];
  locale: Locale;
};

const LATIN_COMBINING_MARKS = /[̀-ͯ]/g;
const ARABIC_HARAKAT = /[ً-ٰٟ]/g;

function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(LATIN_COMBINING_MARKS, "")
    .replace(ARABIC_HARAKAT, "")
    .toLowerCase()
    .trim();
}

function matchesSize(verseCount: number, size: SizeFilter): boolean {
  switch (size) {
    case "all":
      return true;
    case "short":
      return verseCount <= 20;
    case "medium":
      return verseCount > 20 && verseCount <= 100;
    case "long":
      return verseCount > 100;
  }
}

const JUZ_NUMBERS = Array.from({ length: 30 }, (_, i) => i + 1);

export function SurahIndexClient({ surahs, locale }: SurahIndexClientProps) {
  const t = useTranslations("quranIndex");

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [juzFilter, setJuzFilter] = useState<JuzFilter>("all");
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortMode, setSortMode] = useState<SortMode>("number");

  // Read durable prefs from cookie after mount. Reading at useState init time
  // would cause hydration mismatches because the server has no cookie access.
  // The single mount-time setState is the standard React pattern for this and
  // the cascading-render cost is one render, only on first paint.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setViewMode(getPreference(COOKIE_VIEW, VIEW_MODES, "grid"));
    setSortMode(getPreference(COOKIE_SORT, SORT_MODES, "number"));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    setPreference(COOKIE_VIEW, viewMode);
  }, [viewMode]);

  useEffect(() => {
    setPreference(COOKIE_SORT, sortMode);
  }, [sortMode]);

  const visible = useMemo(() => {
    const q = normalize(searchQuery);
    const numericQuery = /^\d+$/.test(searchQuery.trim())
      ? Number(searchQuery.trim())
      : null;

    const filtered = surahs.filter((s) => {
      if (typeFilter !== "all" && s.revelationType !== typeFilter) return false;
      if (juzFilter !== "all" && !s.position.juz.includes(juzFilter))
        return false;
      if (!matchesSize(s.verseCount, sizeFilter)) return false;

      if (q.length === 0) return true;
      if (numericQuery !== null && s.number === numericQuery) return true;

      const haystacks = [
        s.nameArabic,
        s.nameTransliterated,
        s.nameTranslations.fr,
        s.nameTranslations.en,
      ].map(normalize);
      return haystacks.some((h) => h.includes(q));
    });

    // Copy before sorting so we don't mutate the prop array.
    const sorted = [...filtered];
    switch (sortMode) {
      case "number":
        sorted.sort((a, b) => a.number - b.number);
        break;
      case "alpha":
        sorted.sort((a, b) =>
          a.nameTransliterated.localeCompare(b.nameTransliterated, "en"),
        );
        break;
      case "longest":
        sorted.sort((a, b) => b.verseCount - a.verseCount);
        break;
      case "shortest":
        sorted.sort((a, b) => a.verseCount - b.verseCount);
        break;
    }
    return sorted;
  }, [surahs, searchQuery, typeFilter, juzFilter, sizeFilter, sortMode]);

  const resultCount =
    locale === "ar" ? toArabicNumerals(visible.length) : String(visible.length);

  const juzLabel = (n: number) =>
    locale === "ar" ? toArabicNumerals(n) : String(n);

  const inputClass =
    "rounded-md border border-gray-800 bg-gray-900 px-3 py-2.5 text-sm text-gray-100 focus:border-emerald-500 focus:outline-none";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("search.placeholder")}
          aria-label={t("search.placeholder")}
          className={`flex-1 px-4 ${inputClass}`}
        />
        <ViewToggle
          viewMode={viewMode}
          onChange={setViewMode}
          gridLabel={t("view.grid")}
          listLabel={t("view.list")}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          aria-label={t("filters.type")}
          className={inputClass}
        >
          <option value="all">
            {t("filters.type")} — {t("filters.typeAll")}
          </option>
          <option value="meccan">{t("filters.typeMeccan")}</option>
          <option value="medinan">{t("filters.typeMedinan")}</option>
        </select>

        <select
          value={juzFilter === "all" ? "all" : String(juzFilter)}
          onChange={(e) => {
            const v = e.target.value;
            setJuzFilter(v === "all" ? "all" : Number(v));
          }}
          aria-label={t("filters.juz")}
          className={inputClass}
        >
          <option value="all">
            {t("filters.juz")} — {t("filters.juzAll")}
          </option>
          {JUZ_NUMBERS.map((n) => (
            <option key={n} value={String(n)}>
              {t("filters.juz")} {juzLabel(n)}
            </option>
          ))}
        </select>

        <select
          value={sizeFilter}
          onChange={(e) => setSizeFilter(e.target.value as SizeFilter)}
          aria-label={t("filters.size")}
          className={inputClass}
        >
          <option value="all">
            {t("filters.size")} — {t("filters.sizeAll")}
          </option>
          <option value="short">{t("filters.sizeShort")}</option>
          <option value="medium">{t("filters.sizeMedium")}</option>
          <option value="long">{t("filters.sizeLong")}</option>
        </select>

        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          aria-label={t("sort.label")}
          className={inputClass}
        >
          <option value="number">
            {t("sort.label")} — {t("sort.number")}
          </option>
          <option value="alpha">{t("sort.alpha")}</option>
          <option value="longest">{t("sort.longest")}</option>
          <option value="shortest">{t("sort.shortest")}</option>
        </select>
      </div>

      <p className="text-sm text-gray-400">
        {t("results.count", { count: resultCount })}
      </p>

      {visible.length === 0 ? (
        <p className="py-12 text-center text-gray-500">{t("results.empty")}</p>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {visible.map((s) => (
            <SurahCard key={s.number} surah={s} locale={locale} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col rounded-md border border-gray-800 bg-gray-900/40 overflow-hidden">
          {visible.map((s) => (
            <SurahListItem key={s.number} surah={s} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}

type ViewToggleProps = {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
  gridLabel: string;
  listLabel: string;
};

function ViewToggle({
  viewMode,
  onChange,
  gridLabel,
  listLabel,
}: ViewToggleProps) {
  const buttonClass = (active: boolean) =>
    `flex h-9 w-9 items-center justify-center rounded transition-colors ${
      active
        ? "bg-amber-300 text-amber-900"
        : "bg-transparent text-gray-400 hover:text-gray-200"
    }`;

  return (
    <div
      className="flex gap-1 rounded-md bg-gray-800 p-1 self-start sm:self-auto"
      role="group"
    >
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-label={gridLabel}
        aria-pressed={viewMode === "grid"}
        className={buttonClass(viewMode === "grid")}
      >
        <GridIcon />
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-label={listLabel}
        aria-pressed={viewMode === "list"}
        className={buttonClass(viewMode === "list")}
      >
        <ListIcon />
      </button>
    </div>
  );
}

function GridIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
