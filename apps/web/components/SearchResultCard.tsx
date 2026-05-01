import { useTranslations } from "next-intl";
import { getSurahByNumber } from "@quran/data";
import type { Locale } from "@quran/i18n";
import { Link } from "../i18n/navigation";
import { toArabicNumerals } from "../lib/arabic-numerals";
import { highlightTerms, type SearchResult } from "../lib/search";

type SearchResultCardProps = {
  result: SearchResult;
  locale: Locale;
};

// One verse-card in the search-results list. Mirrors the visual hierarchy
// of VerseDisplay in the surah reading view (Arabic prominent in
// font-quran, translation as secondary text), with a clickable header that
// jumps to the verse's surah page.
export function SearchResultCard({ result, locale }: SearchResultCardProps) {
  const t = useTranslations("search");
  const surah = getSurahByNumber(result.surahNumber);

  const verseDisplay =
    locale === "ar"
      ? toArabicNumerals(result.verseNumber)
      : String(result.verseNumber);
  const surahDisplay =
    locale === "ar"
      ? toArabicNumerals(result.surahNumber)
      : String(result.surahNumber);

  const surahName = surah
    ? locale === "ar"
      ? surah.nameArabic
      : surah.nameTransliterated
    : `#${result.surahNumber}`;

  const translation =
    locale === "fr"
      ? result.textFr
      : locale === "en"
        ? result.textEn
        : null;

  return (
    <article className="py-6 border-b border-gray-800">
      <header className="flex items-baseline justify-between gap-3 mb-3">
        {surah ? (
          <Link
            href={`/surahs/${surah.slug}`}
            aria-label={t("openSurah", { surah: surahName })}
            className="text-sm text-amber-300 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 rounded-sm"
          >
            {surahName}
            <span className="text-gray-500 mx-2" aria-hidden="true">
              ·
            </span>
            <span className="text-gray-300 tabular-nums">
              {surahDisplay}:{verseDisplay}
            </span>
          </Link>
        ) : (
          <span className="text-sm text-gray-400">
            {surahDisplay}:{verseDisplay}
          </span>
        )}
      </header>

      <p
        dir="rtl"
        lang="ar"
        className="font-quran text-2xl md:text-3xl text-right leading-loose text-gray-100"
      >
        {highlightTerms(result.textArabic, result.matchedTerms)}
      </p>

      {translation && (
        <p className="mt-3 text-base text-gray-400 leading-relaxed">
          {highlightTerms(translation, result.matchedTerms)}
        </p>
      )}
    </article>
  );
}
