import { useTranslations } from "next-intl";
import type { Locale } from "@quran/i18n";
import { Link } from "../i18n/navigation";
import { toArabicNumerals } from "../lib/arabic-numerals";
import type { SearchMode } from "../lib/search";

type SearchPaginationProps = {
  currentPage: number;
  totalPages: number;
  query: string;
  mode: SearchMode;
  surahNumber: number | null;
  locale: Locale;
};

// Preserve the active query, mode, and surah filter when building
// pagination links. Defaults (mode=phrase, no surah) are omitted from
// the URL to keep the canonical form short.
function buildSearchHref(
  query: string,
  mode: SearchMode,
  surahNumber: number | null,
  page: number,
): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (mode !== "phrase") params.set("mode", mode);
  if (surahNumber) params.set("surah", String(surahNumber));
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

// Build a compact pagination strip: first, ellipsis, current ± 2, ellipsis,
// last. Drops the ellipses when the gaps are small enough to just list every
// page. Returns the entries the renderer should walk.
function buildPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 2);
  const end = Math.min(total - 1, current + 2);
  if (start > 2) pages.push("…");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

export function SearchPagination({
  currentPage,
  totalPages,
  query,
  mode,
  surahNumber,
  locale,
}: SearchPaginationProps) {
  const t = useTranslations("search.pagination");

  if (totalPages <= 1) return null;

  const pages = buildPageList(currentPage, totalPages);
  const formatPage = (n: number) =>
    locale === "ar" ? toArabicNumerals(n) : String(n);

  const hrefForPage = (n: number) =>
    buildSearchHref(query, mode, surahNumber, n);

  const baseLink =
    "min-w-[2.25rem] h-9 inline-flex items-center justify-center rounded-md border text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300";
  const inactive =
    "border-gray-800 text-gray-400 hover:text-amber-300 hover:border-gray-700";
  const active =
    "border-amber-300 bg-amber-300/10 text-amber-300";
  const disabled =
    "border-gray-900 text-gray-600 pointer-events-none";

  return (
    <nav
      aria-label={t("page", { n: currentPage })}
      className="mt-8 flex flex-wrap items-center justify-center gap-2"
    >
      {currentPage > 1 ? (
        <Link
          href={hrefForPage(currentPage - 1)}
          className={`${baseLink} ${inactive} px-3`}
          aria-label={t("previous")}
        >
          {t("previous")}
        </Link>
      ) : (
        <span className={`${baseLink} ${disabled} px-3`} aria-hidden="true">
          {t("previous")}
        </span>
      )}

      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`gap-${i}`}
            className="px-1 text-gray-500 select-none"
            aria-hidden="true"
          >
            {t("ellipsis")}
          </span>
        ) : p === currentPage ? (
          <span
            key={p}
            className={`${baseLink} ${active}`}
            aria-current="page"
            aria-label={t("current", { n: p })}
          >
            {formatPage(p)}
          </span>
        ) : (
          <Link
            key={p}
            href={hrefForPage(p)}
            className={`${baseLink} ${inactive}`}
            aria-label={t("page", { n: p })}
          >
            {formatPage(p)}
          </Link>
        ),
      )}

      {currentPage < totalPages ? (
        <Link
          href={hrefForPage(currentPage + 1)}
          className={`${baseLink} ${inactive} px-3`}
          aria-label={t("next")}
        >
          {t("next")}
        </Link>
      ) : (
        <span className={`${baseLink} ${disabled} px-3`} aria-hidden="true">
          {t("next")}
        </span>
      )}
    </nav>
  );
}
