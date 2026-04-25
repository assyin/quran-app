import { useTranslations } from "next-intl";
import type { Verse } from "@quran/core";
import type { Locale } from "@quran/i18n";
import { toArabicNumerals } from "../lib/arabic-numerals";
import { renderQuranicTextWithWaqf } from "../lib/quran-text";
import { getTranslationForLocale } from "../lib/verse-helpers";

type VerseDisplayProps = {
  verse: Verse;
  displayNumber: number;
  locale: Locale;
};

export function VerseDisplay({
  verse,
  displayNumber,
  locale,
}: VerseDisplayProps) {
  const t = useTranslations("surah");
  const translation = getTranslationForLocale(verse, locale);
  const arabicText = verse.textArabic.hafs ?? "";

  return (
    <article className="py-6 border-b border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">
          {t("verse")} {displayNumber}
        </span>
        <span
          aria-hidden="true"
          className="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-full bg-gray-800 text-gray-300 text-sm"
        >
          {toArabicNumerals(displayNumber)}
        </span>
      </div>

      <p
        dir="rtl"
        lang="ar"
        className="font-quran text-3xl md:text-4xl text-right leading-loose text-gray-100"
      >
        {renderQuranicTextWithWaqf(arabicText)}
      </p>

      {translation && (
        <p className="mt-4 text-base text-gray-400 leading-relaxed">
          {translation.text}
        </p>
      )}
    </article>
  );
}
