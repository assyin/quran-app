import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { SURAHS_METADATA } from "@quran/data";
import { type Locale } from "@quran/i18n";
import { routing } from "../../../i18n/routing";
import { SurahIndexClient } from "../../../components/SurahIndexClient";
import { toArabicNumerals } from "../../../lib/arabic-numerals";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const TOTAL_SURAHS = 114;
const TOTAL_VERSES = 6236;

export default async function QuranIndexPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <QuranIndexView locale={locale as Locale} />;
}

// Sync sub-component so we can call useTranslations alongside the async page.
function QuranIndexView({ locale }: { locale: Locale }) {
  const t = useTranslations("quranIndex");

  const surahCount =
    locale === "ar" ? toArabicNumerals(TOTAL_SURAHS) : String(TOTAL_SURAHS);
  const verseCount =
    locale === "ar" ? toArabicNumerals(TOTAL_VERSES) : String(TOTAL_VERSES);

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <header className="text-center pb-8 md:pb-10">
        <h1
          className={`text-4xl md:text-5xl font-bold tracking-tight ${
            locale === "ar" ? "font-quran text-amber-300" : ""
          }`}
        >
          {t("title")}
        </h1>
        <p className="mt-3 text-sm text-gray-400">
          {t("subtitle", { count: surahCount, verses: verseCount })}
        </p>
      </header>

      <SurahIndexClient surahs={SURAHS_METADATA} locale={locale} />
    </main>
  );
}
