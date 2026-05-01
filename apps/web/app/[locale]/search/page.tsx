import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { type Locale } from "@quran/i18n";
import { routing } from "../../../i18n/routing";
import { Breadcrumb } from "../../../components/Breadcrumb";
import { SearchPageClient } from "../../../components/SearchPageClient";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function SearchPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SearchPageView locale={locale as Locale} />;
}

function SearchPageView({ locale }: { locale: Locale }) {
  const t = useTranslations("search");
  const tSurah = useTranslations("surah");

  return (
    <main className="max-w-3xl mx-auto px-4 md:px-6 py-8">
      <Breadcrumb
        items={[
          { label: tSurah("breadcrumbQuran"), href: "/quran" },
          { label: t("title") },
        ]}
      />
      <h1 className="mt-4 text-2xl md:text-3xl font-medium text-amber-300">
        {t("title")}
      </h1>

      <Suspense fallback={null}>
        <SearchPageClient locale={locale} />
      </Suspense>
    </main>
  );
}
