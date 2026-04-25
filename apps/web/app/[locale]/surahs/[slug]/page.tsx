import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { Surah, SurahMetadata } from "@quran/core";
import {
  getSurahBySlug,
  getSurahDisplay,
  getSurahNeighbors,
  SURAHS_METADATA,
  type SurahDisplay,
} from "@quran/data";
import { type Locale } from "@quran/i18n";
import { Breadcrumb } from "../../../../components/Breadcrumb";
import { SurahNavigation } from "../../../../components/SurahNavigation";
import { VerseDisplay } from "../../../../components/VerseDisplay";
import { toArabicNumerals } from "../../../../lib/arabic-numerals";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return SURAHS_METADATA.map((s) => ({ slug: s.slug }));
}

export default async function SurahPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const surah = getSurahBySlug(slug);
  if (!surah) notFound();

  const display = getSurahDisplay(surah);
  const { previous, next } = getSurahNeighbors(slug);

  return (
    <SurahView
      surah={surah}
      display={display}
      previous={previous}
      next={next}
      locale={locale as Locale}
    />
  );
}

type SurahViewProps = {
  surah: Surah;
  display: SurahDisplay;
  previous: SurahMetadata | null;
  next: SurahMetadata | null;
  locale: Locale;
};

// Presentational sub-component so we can cleanly call useTranslations from a
// synchronous context (hooks can't be used inside an async server component).
function SurahView({ surah, display, previous, next, locale }: SurahViewProps) {
  const t = useTranslations("surah");

  return (
    <main className="max-w-3xl mx-auto px-4 md:px-6 py-8">
      <Breadcrumb
        items={[
          { label: t("breadcrumbQuran"), href: "/quran" },
          {
            label: locale === "ar" ? surah.nameArabic : surah.nameTransliterated,
          },
        ]}
      />

      <header className="text-center py-8 border-b border-gray-800">
        <p className="text-sm text-gray-500">#{surah.number}</p>
        <h1
          dir="rtl"
          lang="ar"
          className="font-quran text-5xl md:text-6xl text-amber-400 mt-3 leading-snug"
        >
          {surah.nameArabic}
        </h1>
        <p className="text-xl text-gray-300 mt-3">{surah.nameTransliterated}</p>
        <p className="text-sm text-gray-500 mt-3">
          {t(surah.revelationType)}
          {" · "}
          {t("versesCount", {
            count:
              locale === "ar"
                ? toArabicNumerals(surah.verseCount)
                : surah.verseCount,
          })}
        </p>
      </header>

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

      <section>
        {display.displayVerses.map(({ verse, displayNumber }) => (
          <VerseDisplay
            key={verse.id}
            verse={verse}
            displayNumber={displayNumber}
            locale={locale}
          />
        ))}
      </section>

      <SurahNavigation previous={previous} next={next} locale={locale} />

      <footer className="mt-12 pt-6 border-t border-gray-800 text-center text-sm text-gray-500">
        {t("attribution")}
      </footer>
    </main>
  );
}
