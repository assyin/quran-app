"use client";

import { useTranslations } from "next-intl";
import { SURAHS_METADATA } from "@quran/data";
import type { Locale } from "@quran/i18n";
import type { SearchMode } from "../lib/search";

const MODES: SearchMode[] = ["phrase", "exact", "root"];

type SearchFiltersProps = {
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  surahNumber: number | null;
  onSurahChange: (n: number | null) => void;
  locale: Locale;
};

// Format a surah option label per locale: Arabic uses the native name,
// FR/EN use "{number} — {transliteration}" so users can recognize the
// universally-reconignized transliteration (Al-Baqara) rather than the
// translated name (which varies by translator).
function formatSurahLabel(
  surah: (typeof SURAHS_METADATA)[number],
  locale: Locale,
): string {
  if (locale === "ar") return surah.nameArabic;
  return `${surah.number} — ${surah.nameTransliterated}`;
}

const MODE_HELP_KEY: Record<SearchMode, string> = {
  phrase: "helpPhrase",
  exact: "helpExact",
  root: "helpRoot",
};

const MODE_LABEL_KEY: Record<SearchMode, string> = {
  phrase: "modePhrase",
  exact: "modeExact",
  root: "modeRoot",
};

export function SearchFilters({
  mode,
  onModeChange,
  surahNumber,
  onSurahChange,
  locale,
}: SearchFiltersProps) {
  const t = useTranslations("search.filters");

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1 text-sm sm:flex-1">
          <span className="text-gray-400">{t("surahLabel")}</span>
          <select
            value={surahNumber ?? 0}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10);
              onSurahChange(n === 0 ? null : n);
            }}
            aria-label={t("surahLabel")}
            className="h-10 px-3 rounded-md bg-gray-800/60 border border-gray-700 text-white focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/40 transition-colors"
          >
            <option value={0}>{t("allSurahs")}</option>
            {SURAHS_METADATA.map((surah) => (
              <option key={surah.number} value={surah.number}>
                {formatSurahLabel(surah, locale)}
              </option>
            ))}
          </select>
        </label>

        <div
          role="group"
          aria-label={t("modeLabel")}
          className="flex flex-col gap-1 text-sm"
        >
          <span className="text-gray-400">{t("modeLabel")}</span>
          <div className="flex gap-1 rounded-md bg-white/5 p-1">
            {MODES.map((m) => {
              const isActive = m === mode;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => onModeChange(m)}
                  aria-pressed={isActive}
                  className={[
                    "px-3 h-8 rounded text-xs font-medium transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300",
                    isActive
                      ? "bg-amber-300/15 text-amber-300 border border-amber-300/40"
                      : "text-gray-400 hover:text-gray-200 border border-transparent",
                  ].join(" ")}
                >
                  {t(MODE_LABEL_KEY[m])}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500" aria-live="polite">
        {t(MODE_HELP_KEY[mode])}
      </p>

      {mode === "root" && (
        <p className="text-xs italic text-amber-300/70">
          {t("helpRootMvp")}
        </p>
      )}
    </div>
  );
}
