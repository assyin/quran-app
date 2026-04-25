import { Fragment } from "react";
import { useTranslations } from "next-intl";
import type { Locale } from "@quran/i18n";
import { TRANSLATORS, type SurahDisplay } from "@quran/data";
import { toArabicNumerals } from "../lib/arabic-numerals";
import { getTranslationForLocale } from "../lib/verse-helpers";

type SurahMushafViewProps = {
  display: SurahDisplay;
  locale: Locale;
};

// Continuous-flow renderer for the surah text in the style of the printed
// Mushaf: verses run together with circular ayah markers between them, and
// the translation (when applicable) is shown as a single block underneath.
export function SurahMushafView({ display, locale }: SurahMushafViewProps) {
  const t = useTranslations("surah");

  // Lookup human-readable translator name from a translation we already
  // resolved for this locale (any verse will do — they all use the same one).
  const sampleTranslation = display.displayVerses
    .map(({ verse }) => getTranslationForLocale(verse, locale))
    .find((tr) => tr !== null);

  const translatorName = sampleTranslation
    ? (TRANSLATORS.find((t) => t.id === sampleTranslation.translator)
        ?.nameNative ??
      TRANSLATORS.find((t) => t.id === sampleTranslation.translator)?.nameEn ??
      sampleTranslation.translator)
    : null;

  return (
    <>
      {display.bismillah && (
        <section className="py-10 border-b border-gray-800 text-center">
          <p
            dir="rtl"
            lang="ar"
            className="font-quran text-4xl md:text-5xl text-amber-400 leading-loose"
          >
            {display.bismillah}
          </p>
          {locale !== "ar" && (
            <p className="mt-4 text-sm text-gray-400 italic">
              {t("bismillahTranslation")}
            </p>
          )}
        </section>
      )}

      <section className="mt-8 rounded-md border border-amber-300/15 bg-amber-50/[0.03] p-6 md:p-8">
        <p
          dir="rtl"
          lang="ar"
          className="font-quran text-2xl md:text-3xl leading-loose text-justify text-gray-100"
        >
          {display.displayVerses.map(({ verse, displayNumber }) => (
            <Fragment key={verse.id}>
              {verse.textArabic.hafs}
              {" "}
              <span
                className="ayah-marker mx-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-800 text-sm font-sans align-middle text-amber-300"
                aria-label={`${t("verse")} ${displayNumber}`}
              >
                {toArabicNumerals(displayNumber)}
              </span>
              {" "}
            </Fragment>
          ))}
        </p>
      </section>

      {locale !== "ar" && sampleTranslation && (
        <section className="mt-8">
          <h2 className="text-xs uppercase tracking-wider text-gray-500">
            {t("displayMode.translation")}
            {translatorName ? ` · ${translatorName}` : ""}
          </h2>
          <p className="mt-3 text-base text-gray-300 leading-relaxed">
            {display.displayVerses.map(({ verse, displayNumber }) => {
              const tr = getTranslationForLocale(verse, locale);
              if (!tr) return null;
              return (
                <Fragment key={verse.id}>
                  <span className="me-1 font-medium text-amber-300/80">
                    {displayNumber}.
                  </span>
                  {tr.text}{" "}
                </Fragment>
              );
            })}
          </p>
        </section>
      )}
    </>
  );
}
