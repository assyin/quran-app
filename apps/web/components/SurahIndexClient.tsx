"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { SurahMetadata, RevelationType } from "@quran/core";
import type { Locale } from "@quran/i18n";
import { SurahCard } from "./SurahCard";
import { toArabicNumerals } from "../lib/arabic-numerals";

type TypeFilter = "all" | RevelationType;
type JuzFilter = "all" | number;

type SurahIndexClientProps = {
  surahs: SurahMetadata[];
  locale: Locale;
};

// Latin combining diacritical marks (used for accent stripping after NFD).
const LATIN_COMBINING_MARKS = /[̀-ͯ]/g;
// Arabic harakat (tashkeel) + dagger alef. Stripping these lets users find
// surahs without typing fully voweled Arabic.
const ARABIC_HARAKAT = /[ً-ٰٟ]/g;

// Normalize search input so it matches across casing, accents, and harakat.
function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(LATIN_COMBINING_MARKS, "")
    .replace(ARABIC_HARAKAT, "")
    .toLowerCase()
    .trim();
}

const JUZ_NUMBERS = Array.from({ length: 30 }, (_, i) => i + 1);

export function SurahIndexClient({ surahs, locale }: SurahIndexClientProps) {
  const t = useTranslations("quranIndex");

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [juzFilter, setJuzFilter] = useState<JuzFilter>("all");

  const filtered = useMemo(() => {
    const q = normalize(searchQuery);
    const numericQuery = /^\d+$/.test(searchQuery.trim())
      ? Number(searchQuery.trim())
      : null;

    return surahs.filter((s) => {
      if (typeFilter !== "all" && s.revelationType !== typeFilter) return false;
      if (juzFilter !== "all" && !s.position.juz.includes(juzFilter))
        return false;

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
  }, [surahs, searchQuery, typeFilter, juzFilter]);

  const resultCount =
    locale === "ar"
      ? toArabicNumerals(filtered.length)
      : String(filtered.length);

  const juzLabel = (n: number) =>
    locale === "ar" ? toArabicNumerals(n) : String(n);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("search.placeholder")}
          aria-label={t("search.placeholder")}
          className="flex-1 rounded-md border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 focus:border-emerald-500 focus:outline-none"
        />

        <div className="flex gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            aria-label={t("filters.type")}
            className="rounded-md border border-gray-800 bg-gray-900 px-3 py-2.5 text-sm text-gray-100 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">{t("filters.typeAll")}</option>
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
            className="rounded-md border border-gray-800 bg-gray-900 px-3 py-2.5 text-sm text-gray-100 focus:border-emerald-500 focus:outline-none"
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
        </div>
      </div>

      <p className="text-sm text-gray-400">
        {t("results.count", { count: resultCount })}
      </p>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-gray-500">{t("results.empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {filtered.map((s) => (
            <SurahCard key={s.number} surah={s} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
