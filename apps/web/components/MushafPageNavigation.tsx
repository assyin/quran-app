import { useTranslations } from "next-intl";
import { TOTAL_MUSHAF_PAGES } from "@quran/data";
import type { Locale } from "@quran/i18n";
import { Link } from "../i18n/navigation";
import { toArabicNumerals } from "../lib/arabic-numerals";

type MushafPageNavigationProps = {
  currentPage: number;
  locale: Locale;
};

// Bidi-mirrored single angle quotation marks. They auto-flip in RTL contexts
// so the chevron always visually points in the reading direction. See
// CLAUDE.md Rule 10 for context (mirroring is desired here, not the math
// comparison case the rule warns against).
const PREV_CHEVRON = "‹";
const NEXT_CHEVRON = "›";

export function MushafPageNavigation({
  currentPage,
  locale,
}: MushafPageNavigationProps) {
  const t = useTranslations("mushaf");

  const fmt = (n: number) =>
    locale === "ar" ? toArabicNumerals(n) : String(n);

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < TOTAL_MUSHAF_PAGES;

  return (
    <nav className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {hasPrev ? (
        <NavLink
          href={`/mushaf/${currentPage - 1}`}
          chevron={PREV_CHEVRON}
          chevronSide="start"
          label={t("previousPage")}
          number={fmt(currentPage - 1)}
        />
      ) : (
        <span aria-hidden="true" className="hidden sm:block" />
      )}

      <div className="flex items-center gap-3 self-center text-xs text-gray-400">
        <span>
          {t("page")} {fmt(currentPage)} {t("of")} {fmt(TOTAL_MUSHAF_PAGES)}
        </span>
        <Link
          href="/quran"
          className="rounded-md border border-gray-700 px-3 py-1.5 text-gray-300 transition-colors hover:border-amber-300 hover:text-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        >
          {t("allSurahs")}
        </Link>
      </div>

      {hasNext ? (
        <NavLink
          href={`/mushaf/${currentPage + 1}`}
          chevron={NEXT_CHEVRON}
          chevronSide="end"
          label={t("nextPage")}
          number={fmt(currentPage + 1)}
        />
      ) : (
        <span aria-hidden="true" className="hidden sm:block" />
      )}
    </nav>
  );
}

type NavLinkProps = {
  href: string;
  chevron: string;
  chevronSide: "start" | "end";
  label: string;
  number: string;
};

function NavLink({ href, chevron, chevronSide, label, number }: NavLinkProps) {
  const chevronEl = (
    <span aria-hidden="true" className="text-2xl text-gray-500">
      {chevron}
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
        <span className="text-base font-medium text-gray-100 tabular-nums">
          {number}
        </span>
      </span>
      {chevronSide === "end" && chevronEl}
    </Link>
  );
}
