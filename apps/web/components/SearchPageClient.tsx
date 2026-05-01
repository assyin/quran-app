"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { getSurahByNumber } from "@quran/data";
import type { Locale } from "@quran/i18n";
import { useRouter } from "../i18n/navigation";
import { toArabicNumerals } from "../lib/arabic-numerals";
import {
  parseReference,
  searchQuran,
  type SearchResult,
} from "../lib/search";
import { SearchPagination } from "./SearchPagination";
import { SearchResultCard } from "./SearchResultCard";

const PAGE_SIZE = 20;
// Hard ceiling on results we keep in memory; well above what any reasonable
// query produces (the most common Arabic root maxes out around ~600 hits).
const MAX_RESULTS = 1000;

type SearchPageClientProps = {
  locale: Locale;
};

export function SearchPageClient({ locale }: SearchPageClientProps) {
  const t = useTranslations("search");
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryFromURL = searchParams.get("q") ?? "";
  const pageFromURL = Math.max(
    1,
    Number(searchParams.get("page") ?? "1") || 1,
  );

  // Reference deep-link is fully derivable from the URL — no need to mirror
  // it in state. Render computes "are we navigating away?" each pass; an
  // effect below issues the actual router.replace.
  const ref = queryFromURL ? parseReference(queryFromURL) : null;
  const redirectSurah = ref ? getSurahByNumber(ref.surahNumber) : null;
  const isRedirecting = ref !== null && redirectSurah !== null;
  const redirectSlug = redirectSurah?.slug ?? null;

  // Input is locally controlled. We deliberately do NOT sync it with URL
  // changes — once the user has typed, their text wins until they submit
  // or clear. This matches Google/most search-as-search-page UX.
  const [inputValue, setInputValue] = useState(queryFromURL);

  // Results are state because the search runs async (deferred via setTimeout
  // so the loading state has a chance to paint before the first MiniSearch
  // index build). `executedQuery` records which query the current results
  // belong to, so render can derive isLoading without an extra setState.
  const [executedQuery, setExecutedQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  const isFresh = executedQuery === queryFromURL;
  const isLoading = !!queryFromURL && !isRedirecting && !isFresh;
  const displayResults = isFresh ? results : [];

  // Run the search whenever the URL query changes. setState calls live
  // inside the setTimeout callback so they don't trigger setState-in-effect.
  useEffect(() => {
    if (!queryFromURL || isRedirecting) return;
    const handle = setTimeout(() => {
      setResults(searchQuran(queryFromURL, MAX_RESULTS));
      setExecutedQuery(queryFromURL);
    }, 0);
    return () => clearTimeout(handle);
  }, [queryFromURL, isRedirecting]);

  // Issue the redirect when the URL parses as a verse reference.
  useEffect(() => {
    if (isRedirecting && redirectSlug) {
      router.replace(`/surahs/${redirectSlug}`);
    }
  }, [isRedirecting, redirectSlug, router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleClear = () => {
    setInputValue("");
    router.push("/search");
  };

  const totalResults = displayResults.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const safePage = Math.min(pageFromURL, totalPages);
  const pageResults = displayResults.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const formatNum = (n: number) =>
    locale === "ar" ? toArabicNumerals(n) : String(n);

  return (
    <div className="mt-6">
      <form onSubmit={handleSubmit} className="relative flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t("placeholder")}
            aria-label={t("title")}
            autoFocus
            className="w-full h-11 ps-4 pe-10 rounded-md bg-gray-800/60 border border-gray-700 text-white placeholder:text-gray-500 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/40 transition-colors"
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              aria-label={t("clear")}
              className="absolute end-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:text-amber-300 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
            >
              <ClearIcon />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-11 px-5 rounded-md bg-amber-300 text-amber-900 font-medium hover:bg-amber-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 transition-colors"
        >
          {t("submit")}
        </button>
      </form>

      {isRedirecting && ref && (
        <p className="mt-8 text-sm text-gray-400 text-center" role="status">
          {t("referenceRedirect", {
            surah: formatNum(ref.surahNumber),
            verse: formatNum(ref.verseNumber),
          })}
        </p>
      )}

      {!queryFromURL && !isRedirecting && (
        <p className="mt-12 text-center text-gray-500">{t("empty")}</p>
      )}

      {queryFromURL && isLoading && !isRedirecting && (
        <p className="mt-12 text-center text-gray-500" role="status">
          {t("loading")}
        </p>
      )}

      {queryFromURL && !isLoading && !isRedirecting && (
        <div className="mt-6">
          {totalResults === 0 ? (
            <p className="text-center text-gray-500 mt-12">
              {t("noResults", { query: queryFromURL })}
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-400 mb-2">
                {t("resultsCount", {
                  count: formatNum(totalResults),
                  query: queryFromURL,
                })}
              </p>
              <ul>
                {pageResults.map((r) => (
                  <li key={r.id}>
                    <SearchResultCard result={r} locale={locale} />
                  </li>
                ))}
              </ul>
              <SearchPagination
                currentPage={safePage}
                totalPages={totalPages}
                query={queryFromURL}
                locale={locale}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ClearIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
