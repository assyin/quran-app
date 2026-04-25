"use client";

import { useTranslations } from "next-intl";
import type { SurahMetadata } from "@quran/core";
import type { Locale } from "@quran/i18n";
import { Link } from "../i18n/navigation";
import { toArabicNumerals } from "../lib/arabic-numerals";

type SurahCardProps = {
  surah: SurahMetadata;
  locale: Locale;
};

export function SurahCard({ surah, locale }: SurahCardProps) {
  const tSurah = useTranslations("surah");

  const number =
    locale === "ar" ? toArabicNumerals(surah.number) : String(surah.number);
  const verseCount =
    locale === "ar"
      ? toArabicNumerals(surah.verseCount)
      : String(surah.verseCount);

  // For non-Arabic UI we display the localized translation of the surah name.
  // For Arabic UI the canonical Arabic name already serves that role, so we
  // pair it with the transliteration as a secondary line and skip translation.
  const translatedName =
    locale === "ar"
      ? null
      : locale === "fr"
        ? surah.nameTranslations.fr
        : surah.nameTranslations.en;

  const isMeccan = surah.revelationType === "meccan";
  const badgeLabel = tSurah(surah.revelationType);

  // verseCount localization: keep the abbreviated form short and locale-aware.
  const verseSuffix = locale === "ar" ? "آية" : "v.";

  return (
    <Link
      href={`/surahs/${surah.slug}`}
      className="group relative flex min-h-[7.5rem] flex-col items-center justify-center gap-1 rounded-md border border-gray-800 bg-gray-800/60 p-4 text-center transition-all duration-150 hover:scale-[1.02] hover:border-gray-700 hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
    >
      <span
        className="absolute top-2 start-2 text-xs font-medium tabular-nums text-gray-400"
        aria-hidden="true"
      >
        {number}
      </span>

      <span
        className={`absolute top-2 end-2 rounded-sm px-1.5 py-0.5 text-[0.65rem] font-medium leading-none ${
          isMeccan
            ? "bg-amber-300/10 text-amber-300"
            : "bg-emerald-300/10 text-emerald-300"
        }`}
      >
        {badgeLabel}
      </span>

      <span
        dir="rtl"
        lang="ar"
        className="font-quran text-3xl text-amber-300 leading-tight mt-3"
      >
        {surah.nameArabic}
      </span>

      <span className="text-sm text-gray-300">{surah.nameTransliterated}</span>

      <span className="text-xs text-gray-500">
        {translatedName ? `${translatedName} · ` : ""}
        {verseCount} {verseSuffix}
      </span>
    </Link>
  );
}
