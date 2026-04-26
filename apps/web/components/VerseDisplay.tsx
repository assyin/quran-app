import { useTranslations } from "next-intl";
import type { Verse } from "@quran/core";
import type { Locale } from "@quran/i18n";
import { renderQuranicTextWithWaqf } from "../lib/quran-text";
import { isSajdahVerse } from "../lib/sajdah";
import { getTranslationForLocale } from "../lib/verse-helpers";
import { AyahMarker } from "./AyahMarker";
import { SajdahMarker } from "./SajdahMarker";

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

  // Use canonical verse number for sajdah lookup, not displayNumber, since
  // SAJDAH_VERSES is keyed by canonical {surah:verse} ids.
  const isSajdah = isSajdahVerse(verse.surahNumber, verse.verseNumber);

  return (
    <article className="py-6 border-b border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">
          {t("verse")} {displayNumber}
        </span>
        <div className="flex items-center gap-2">
          {isSajdah && <SajdahMarker />}
          <AyahMarker number={displayNumber} locale={locale} />
        </div>
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
