import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { SURAHS_METADATA } from "@quran/data";
import { LOCALES, type Locale } from "@quran/i18n";
import { Link } from "../../i18n/navigation";
import { toArabicNumerals } from "../../lib/arabic-numerals";

type PageProps = {
  params: Promise<{ locale: string }>;
};

const TOTAL_VERSES = SURAHS_METADATA.reduce((acc, s) => acc + s.verseCount, 0);
const TOTAL_SURAHS = SURAHS_METADATA.length;
const TOTAL_LANGUAGES = LOCALES.length;

export default async function Home({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomeView locale={locale as Locale} />;
}

function HomeView({ locale }: { locale: Locale }) {
  const t = useTranslations("home");

  const fmt = (n: number) =>
    locale === "ar" ? toArabicNumerals(n) : String(n);

  // Direction-aware arrow for the CTA: in RTL the "forward" direction is
  // visually leftward, so we use a left-pointing arrow there.
  const arrow = locale === "ar" ? "←" : "→";

  return (
    <main className="relative flex flex-col items-center justify-center text-center px-4 py-20 min-h-[calc(100vh-3.5rem)]">
      {/* Soft radial glow at the top to give the hero some depth. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-96 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(245, 158, 11, 0.06) 0%, transparent 60%)",
        }}
      />

      <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">
        {t("eyebrow")}
      </p>

      <h1
        dir="rtl"
        lang="ar"
        className="font-quran text-5xl md:text-6xl text-amber-300 font-normal mb-2 leading-tight"
      >
        {t("titleArabic")}
      </h1>

      {t("subtitle") && (
        <p className="text-lg text-gray-300 mb-8">{t("subtitle")}</p>
      )}

      <div className="flex justify-center items-center gap-6 sm:gap-8 mb-10">
        <Stat value={fmt(TOTAL_SURAHS)} label={t("stats.surahs")} />
        <Separator />
        <Stat value={fmt(TOTAL_VERSES)} label={t("stats.verses")} />
        <Separator />
        <Stat value={fmt(TOTAL_LANGUAGES)} label={t("stats.languages")} />
      </div>

      <Link
        href="/quran"
        className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold bg-gradient-to-br from-amber-300 to-amber-500 text-amber-900 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
      >
        <span>{t("cta")}</span>
        <span aria-hidden="true">{arrow}</span>
      </Link>

      <p className="text-xs text-gray-500 mt-6">{t("tagline")}</p>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl sm:text-3xl text-amber-300 font-medium tabular-nums">
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 mt-1">
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return <div aria-hidden="true" className="w-px h-8 bg-white/10" />;
}
