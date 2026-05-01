import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import {
  TOTAL_MUSHAF_PAGES,
  getMushafPageMapping,
} from "@quran/data";
import type { Locale } from "@quran/i18n";
import { Breadcrumb } from "../../../../components/Breadcrumb";
import { MushafPageNavigation } from "../../../../components/MushafPageNavigation";
import { MushafPaginatedView } from "../../../../components/MushafPaginatedView";
import { MushafThemeToggle } from "../../../../components/MushafThemeToggle";
import { toArabicNumerals } from "../../../../lib/arabic-numerals";
import {
  COOKIE_MUSHAF_THEME,
  DEFAULT_MUSHAF_THEME,
  MUSHAF_THEMES,
  type MushafTheme,
} from "../../../../lib/preferences";

type PageProps = {
  params: Promise<{ locale: string; page: string }>;
};

// Pre-render every Mushaf page once. 604 pages × 3 locales = 1812 routes.
// The per-page render is light (a single MushafPageMapping lookup + Unicode
// rendering, no font loading). If build time becomes an issue, we can switch
// to on-demand generation by removing this export.
export function generateStaticParams() {
  return Array.from({ length: TOTAL_MUSHAF_PAGES }, (_, i) => ({
    page: String(i + 1),
  }));
}

export default async function MushafPage({ params }: PageProps) {
  const { locale, page } = await params;
  setRequestLocale(locale);

  const pageNum = Number.parseInt(page, 10);
  if (
    !Number.isFinite(pageNum) ||
    pageNum < 1 ||
    pageNum > TOTAL_MUSHAF_PAGES
  ) {
    notFound();
  }

  const pageMapping = getMushafPageMapping(pageNum);
  if (!pageMapping) {
    notFound();
  }

  // Read the user's theme preference from the cookie (set by
  // MushafThemeToggle on the client). Reading cookies opts the page out of
  // static caching for that visit, which is fine — we still benefit from
  // the per-route generateStaticParams plus RSC streaming.
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(COOKIE_MUSHAF_THEME)?.value;
  const theme: MushafTheme = (MUSHAF_THEMES as readonly string[]).includes(
    cookieValue ?? "",
  )
    ? (cookieValue as MushafTheme)
    : DEFAULT_MUSHAF_THEME;

  return (
    <MushafPageView
      pageNumber={pageNum}
      pageMapping={pageMapping}
      locale={locale as Locale}
      theme={theme}
    />
  );
}

type MushafPageViewProps = {
  pageNumber: number;
  pageMapping: NonNullable<ReturnType<typeof getMushafPageMapping>>;
  locale: Locale;
  theme: MushafTheme;
};

// Sync sub-component so we can call useTranslations alongside the async page.
function MushafPageView({
  pageNumber,
  pageMapping,
  locale,
  theme,
}: MushafPageViewProps) {
  const tSurah = useTranslations("surah");
  const tMushaf = useTranslations("mushaf");

  const pageLabel =
    locale === "ar" ? toArabicNumerals(pageNumber) : String(pageNumber);

  return (
    <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
      <Breadcrumb
        items={[
          { label: tSurah("breadcrumbQuran"), href: "/quran" },
          { label: tMushaf("breadcrumbMushaf"), href: "/mushaf/1" },
          { label: `${tMushaf("page")} ${pageLabel}` },
        ]}
      />

      <div className="mt-4 flex justify-center">
        <MushafThemeToggle />
      </div>

      <div className="mt-4">
        <MushafPageNavigation currentPage={pageNumber} locale={locale} />
      </div>

      <div className="mt-6">
        <MushafPaginatedView
          page={pageMapping}
          locale={locale}
          theme={theme}
        />
      </div>

      <div className="mt-6">
        <MushafPageNavigation currentPage={pageNumber} locale={locale} />
      </div>
    </main>
  );
}
