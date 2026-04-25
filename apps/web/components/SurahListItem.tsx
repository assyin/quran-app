"use client";

import { useTranslations } from "next-intl";
import type { SurahMetadata } from "@quran/core";
import type { Locale } from "@quran/i18n";
import { Link } from "../i18n/navigation";
import { toArabicNumerals } from "../lib/arabic-numerals";

type SurahListItemProps = {
  surah: SurahMetadata;
  locale: Locale;
};

export function SurahListItem({ surah, locale }: SurahListItemProps) {
  const tSurah = useTranslations("surah");

  const number =
    locale === "ar" ? toArabicNumerals(surah.number) : String(surah.number);
  const verseCount =
    locale === "ar"
      ? toArabicNumerals(surah.verseCount)
      : String(surah.verseCount);

  const translatedName =
    locale === "ar"
      ? null
      : locale === "fr"
        ? surah.nameTranslations.fr
        : surah.nameTranslations.en;

  const verseSuffix = locale === "ar" ? "آية" : "v.";
  const typeLabel = tSurah(surah.revelationType);

  // Build the descriptive middle line. We use bullets between segments and
  // skip the translated-name segment for Arabic UI (the canonical Arabic
  // name on the right already plays that role).
  const middleSegments = [surah.nameTransliterated];
  if (translatedName) middleSegments.push(translatedName);
  middleSegments.push(typeLabel);
  middleSegments.push(`${verseCount} ${verseSuffix}`);

  return (
    <Link
      href={`/surahs/${surah.slug}`}
      className="group flex items-center gap-4 border-b border-gray-800 px-3 py-3 transition-colors hover:bg-gray-800/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-800 text-xs font-medium tabular-nums text-gray-300"
        aria-hidden="true"
      >
        {number}
      </span>

      <span className="flex-1 truncate text-sm text-gray-300">
        <span className="font-semibold text-gray-100">
          {middleSegments[0]}
        </span>
        {middleSegments.slice(1).map((seg, i) => (
          <span key={i} className="text-gray-400">
            {" · "}
            {seg}
          </span>
        ))}
      </span>

      <span
        dir="rtl"
        lang="ar"
        className="font-quran text-[1.375rem] leading-tight text-amber-300 shrink-0"
      >
        {surah.nameArabic}
      </span>
    </Link>
  );
}
