import { useTranslations } from "next-intl";
import type { SurahMetadata } from "@quran/core";
import type { Locale } from "@quran/i18n";
import { Link } from "../i18n/navigation";

type SurahNavigationProps = {
  previous: SurahMetadata | null;
  next: SurahMetadata | null;
  locale: Locale;
};

// Bidi-mirrored single angle quotation marks. They auto-flip in RTL contexts,
// so the chevron always visually points in the reading direction. See
// CLAUDE.md Rule 10 for context: mirroring is undesired in math comparisons
// but exactly what we want for directional arrows. Combined with `flex
// justify-between` (which respects dir="rtl" and reverses item positions),
// the resulting layout reads naturally in both directions.
const PREV_CHEVRON = "‹";
const NEXT_CHEVRON = "›";

export function SurahNavigation({
  previous,
  next,
  locale,
}: SurahNavigationProps) {
  const t = useTranslations("surah");

  return (
    <nav className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {previous ? (
        <NavLink
          href={`/surahs/${previous.slug}`}
          chevron={PREV_CHEVRON}
          chevronSide="start"
          label={t("previousSurah")}
          surah={previous}
          locale={locale}
        />
      ) : (
        <span aria-hidden="true" className="hidden sm:block" />
      )}
      <IndexLink label={t("allSurahs")} />
      {next ? (
        <NavLink
          href={`/surahs/${next.slug}`}
          chevron={NEXT_CHEVRON}
          chevronSide="end"
          label={t("nextSurah")}
          surah={next}
          locale={locale}
        />
      ) : (
        <span aria-hidden="true" className="hidden sm:block" />
      )}
    </nav>
  );
}

function IndexLink({ label }: { label: string }) {
  return (
    <Link
      href="/quran"
      className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800/50 hover:text-gray-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
    >
      <GridIcon />
      <span>{label}</span>
    </Link>
  );
}

function GridIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

type NavLinkProps = {
  href: string;
  chevron: string;
  chevronSide: "start" | "end";
  label: string;
  surah: SurahMetadata;
  locale: Locale;
};

function NavLink({
  href,
  chevron,
  chevronSide,
  label,
  surah,
  locale,
}: NavLinkProps) {
  const chevronEl = (
    <span aria-hidden="true" className="text-2xl text-gray-500">
      {chevron}
    </span>
  );

  const nameEl =
    locale === "ar" ? (
      <span
        dir="rtl"
        lang="ar"
        className="font-quran text-lg text-amber-300 leading-tight"
      >
        {surah.nameArabic}
      </span>
    ) : (
      <span className="text-base font-medium text-gray-100">
        {surah.nameTransliterated}
      </span>
    );

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-md border border-gray-800 bg-gray-800/50 px-4 py-3 transition-colors hover:bg-gray-800 hover:border-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
    >
      {chevronSide === "start" && chevronEl}
      <span
        className={`flex flex-col ${
          chevronSide === "start" ? "items-start" : "items-end"
        }`}
      >
        <span className="text-xs text-gray-400">{label}</span>
        {nameEl}
      </span>
      {chevronSide === "end" && chevronEl}
    </Link>
  );
}
