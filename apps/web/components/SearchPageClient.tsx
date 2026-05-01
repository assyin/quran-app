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
  type SearchMode,
  type SearchResult,
} from "../lib/search";
import { SearchFilters } from "./SearchFilters";
import { SearchPagination } from "./SearchPagination";
import { SearchResultCard } from "./SearchResultCard";

const PAGE_SIZE = 20;
// Hard ceiling on results we keep in memory; well above what any reasonable
// query produces (the most common Arabic root maxes out around ~600 hits).
const MAX_RESULTS = 1000;

type SearchPageClientProps = {
  locale: Locale;
};

// Validate a raw URL "mode" param against the allowed SearchMode values.
function parseModeParam(raw: string | null): SearchMode {
  if (raw === "exact" || raw === "root") return raw;
  return "phrase";
}

// Validate a raw URL "surah" param: must be 1-114, otherwise null.
function parseSurahParam(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  if (Number.isFinite(n) && n >= 1 && n <= 114) return n;
  return null;
}

// Build a /search URL preserving the canonical defaults convention:
// mode=phrase and no surah filter are omitted from the query string so
// the URL stays as short as possible for users who don't customize.
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

export function SearchPageClient({ locale }: SearchPageClientProps) {
  const t = useTranslations("search");
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryFromURL = searchParams.get("q") ?? "";
  const modeFromURL = parseModeParam(searchParams.get("mode"));
  const surahFromURL = parseSurahParam(searchParams.get("surah"));
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
  // index build). `executedKey` records which (q, mode, surah) tuple the
  // current results belong to, so render can derive isLoading without an
  // extra setState.
  const executionKey = `${queryFromURL}|${modeFromURL}|${surahFromURL ?? 0}`;
  const [executedKey, setExecutedKey] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  const isFresh = executedKey === executionKey;
  const isLoading = !!queryFromURL && !isRedirecting && !isFresh;
  const displayResults = isFresh ? results : [];

  // Run the search whenever any of (q, mode, surah) change. setState calls
  // live inside the setTimeout callback so they don't trigger
  // setState-in-effect.
  useEffect(() => {
    if (!queryFromURL || isRedirecting) return;
    const handle = setTimeout(() => {
      const r = searchQuran(queryFromURL, {
        mode: modeFromURL,
        surahNumber: surahFromURL,
        limit: MAX_RESULTS,
      });
      setResults(r);
      setExecutedKey(executionKey);
    }, 0);
    return () => clearTimeout(handle);
  }, [queryFromURL, modeFromURL, surahFromURL, isRedirecting, executionKey]);

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
    router.push(buildSearchHref(trimmed, modeFromURL, surahFromURL, 1));
  };

  const handleClear = () => {
    setInputValue("");
    router.push("/search");
  };

  // Mode and surah changes use router.replace so they don't pollute browser
  // history — the user can hit Back from a search-results page and return
  // to where they came from rather than scrolling through filter tweaks.
  // Page is reset to 1 on every filter change since the new result set
  // would make the previous page index meaningless.
  const handleModeChange = (newMode: SearchMode) => {
    router.replace(buildSearchHref(queryFromURL, newMode, surahFromURL, 1));
  };

  const handleSurahChange = (newSurah: number | null) => {
    router.replace(buildSearchHref(queryFromURL, modeFromURL, newSurah, 1));
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
    <div className="mt-6 space-y-5">
      <SearchFilters
        mode={modeFromURL}
        onModeChange={handleModeChange}
        surahNumber={surahFromURL}
        onSurahChange={handleSurahChange}
        locale={locale}
      />

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
                    <SearchResultCard
                      result={r}
                      locale={locale}
                      mode={modeFromURL}
                    />
                  </li>
                ))}
              </ul>
              <SearchPagination
                currentPage={safePage}
                totalPages={totalPages}
                query={queryFromURL}
                mode={modeFromURL}
                surahNumber={surahFromURL}
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
