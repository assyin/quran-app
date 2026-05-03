// Full-text Quran search backed by a lazy MiniSearch index over the
// pre-built parallel-fields JSON in @quran/data/search-index.
//
// Three query paths are exposed:
//   - parseReference("2:255") returns the verse coordinates if the input
//     looks like a canonical reference, so callers can skip the search
//     altogether and jump straight to the verse.
//   - searchQuran("...", { mode, surahNumber }) runs the user's query
//     through script-aware normalization (Arabic vs Latin), then through
//     MiniSearch with a per-mode strategy (phrase/exact/root) and an
//     optional surah-number filter applied post-search.
//   - highlightTerms(text, terms) wraps matched tokens in <mark> for
//     rendering matched portions of the original (non-normalized) text.
//
// No "use client" directive: this module is intentionally isomorphic so
// future server components and route handlers can call it the same way.

import MiniSearch, { type SearchOptions as MiniSearchOptions } from "minisearch";
import React from "react";
import {
  detectScript,
  extractRoot,
  normalizeArabicForSearch,
  normalizeLatinForSearch,
  normalizeQuery,
} from "@quran/core";
import searchIndex from "@quran/data/search-index";
import type { SearchIndexVerse } from "@quran/data/search-index";
import { getQacRoot } from "@quran/data/qac-surface-roots";

// Resolve an already-normalized Arabic surface form to its root, with QAC
// (academic morphology) as the primary source and the heuristic stripper
// as a fallback for words absent from the QAC vocabulary.
function resolveArabicRoot(normalizedToken: string): string {
  return (
    getQacRoot(normalizedToken) ??
    extractRoot(normalizedToken) ??
    normalizedToken
  );
}

let cachedSearch: MiniSearch<SearchIndexVerse> | null = null;

function getSearchIndex(): MiniSearch<SearchIndexVerse> {
  if (cachedSearch) return cachedSearch;

  // All four searchable Arabic/translation fields are indexed up front so
  // per-call searchOptions.fields can pick the right one per mode:
  //   - phrase  → textArabicExpanded (clitic-tolerant)
  //   - exact   → textArabicSimple (strict, no clitic match)
  //   - root    → textRoot (academic root via QAC)
  // Translation fields stay indexed for cross-language phrase search.
  const ms = new MiniSearch<SearchIndexVerse>({
    fields: [
      "textArabicSimple",
      "textArabicExpanded",
      "textRoot",
      "textFrNormalized",
      "textEnNormalized",
    ],
    storeFields: [
      "id",
      "surahNumber",
      "verseNumber",
      "textArabic",
      "textFr",
      "textEn",
    ],
  });

  ms.addAll(searchIndex.verses);
  cachedSearch = ms;
  return ms;
}

export type SearchMode = "phrase" | "exact" | "root";

export interface SearchOptions {
  mode?: SearchMode;
  // Restrict results to a single surah (1-114). null/undefined disables.
  surahNumber?: number | null;
  limit?: number;
}

export interface SearchResult {
  id: string;
  surahNumber: number;
  verseNumber: number;
  textArabic: string;
  textFr: string;
  textEn: string;
  score: number;
  matchedTerms: string[];
}

export interface ParsedReference {
  surahNumber: number;
  verseNumber: number;
}

// Al-Baqara is the longest surah at 286 verses; this is the upper bound
// for any plausible verse number in a reference.
const MAX_VERSES_PER_SURAH = 286;
const REFERENCE_RE = /^(\d{1,3})\s*[:\-\.\s]\s*(\d{1,3})$/;

// Detect whether a query is a verse reference like "2:255", "3-185",
// "1.7", or "10 5". Returns null when the input doesn't look like a
// reference or when the parsed coordinates fall outside the valid Quran
// range (1-114 for surah, 1-286 for verse).
export function parseReference(query: string): ParsedReference | null {
  const trimmed = query.trim();
  const match = REFERENCE_RE.exec(trimmed);
  if (!match) return null;
  const [, surahStr, verseStr] = match;
  if (!surahStr || !verseStr) return null;
  const surahNumber = Number.parseInt(surahStr, 10);
  const verseNumber = Number.parseInt(verseStr, 10);
  if (surahNumber < 1 || surahNumber > 114) return null;
  if (verseNumber < 1 || verseNumber > MAX_VERSES_PER_SURAH) return null;
  return { surahNumber, verseNumber };
}

// Per-mode MiniSearch strategy:
//   - "phrase":  default fuzzy/prefix search, but with a guard for short
//                Arabic queries (≤ 4 chars) where fuzzy 0.15 was making
//                "محمد" surface "بحمد" — short queries demand AND combine
//                and no fuzzy.
//   - "exact":   strictest match, AND combine, no prefix, no fuzzy.
//   - "root":    query goes through extractRoot, then matches the textRoot
//                field exclusively. Useful for finding morphological
//                variants of a triliteral root.
function buildSearchOptions(
  mode: SearchMode,
  normalized: string,
): { queryToUse: string; options: MiniSearchOptions } {
  if (mode === "exact") {
    return {
      queryToUse: normalized,
      options: {
        fields: ["textArabicSimple", "textFrNormalized", "textEnNormalized"],
        boost: { textArabicSimple: 3 },
        combineWith: "AND",
        prefix: false,
        fuzzy: false,
      },
    };
  }

  if (mode === "root") {
    const isArabic = detectScript(normalized) === "arabic";
    // For Latin queries in root mode, we have no morphology to apply, so
    // we fall back to passing the normalized query through; the textRoot
    // field is Arabic-only and won't match, so result will be empty.
    // That's the documented behavior.
    //
    // For Arabic queries, resolveArabicRoot consults the QAC vocabulary
    // map first (academic precision), then falls back to the heuristic
    // stripper for words outside the corpus. This is what makes "محمد"
    // resolve to "حمد" (via the QAC override) and surface the full H-M-D
    // family in results.
    const rootQuery = isArabic
      ? normalized.split(/\s+/).map(resolveArabicRoot).join(" ")
      : normalized;
    return {
      queryToUse: rootQuery,
      options: {
        fields: ["textRoot"],
        combineWith: "AND",
        prefix: false,
        fuzzy: false,
      },
    };
  }

  // mode === "phrase" — search the clitic-expanded Arabic field so a query
  // like "موسى" still finds verses containing وَمُوسَىٰ / يَٰمُوسَىٰ /
  // بِمُوسَىٰ. The strict, non-expanded textArabicSimple stays available
  // for the "exact" branch above.
  const isShortQuery = normalized.length <= 4;
  return {
    queryToUse: normalized,
    options: {
      fields: ["textArabicExpanded", "textFrNormalized", "textEnNormalized"],
      boost: { textArabicExpanded: 3 },
      combineWith: isShortQuery ? "AND" : "OR",
      prefix: true,
      fuzzy: isShortQuery ? false : 0.15,
    },
  };
}

// Run a full-text search and return up to `limit` results ordered by
// relevance score. Returns [] for queries shorter than 2 characters or
// queries that normalize to an empty string.
export function searchQuran(
  query: string,
  options: SearchOptions = {},
): SearchResult[] {
  const { mode = "phrase", surahNumber, limit = 50 } = options;

  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const normalized = normalizeQuery(trimmed);
  if (!normalized) return [];

  const { queryToUse, options: msOpts } = buildSearchOptions(mode, normalized);

  const index = getSearchIndex();
  let rawResults = index.search(queryToUse, msOpts);

  // Surah filter is applied post-search rather than via MiniSearch's
  // filter callback because the filter callback runs per-token-match
  // inside the engine; for our scale (≤ ~600 hits per query) the
  // post-filter is simpler and cheap.
  if (surahNumber && surahNumber >= 1 && surahNumber <= 114) {
    rawResults = rawResults.filter(
      (r) => (r["surahNumber"] as number) === surahNumber,
    );
  }

  return rawResults.slice(0, limit).map((r) => ({
    id: r["id"] as string,
    surahNumber: r["surahNumber"] as number,
    verseNumber: r["verseNumber"] as number,
    textArabic: r["textArabic"] as string,
    textFr: r["textFr"] as string,
    textEn: r["textEn"] as string,
    score: r.score,
    matchedTerms: r.terms ?? [],
  }));
}

// Wrap matched tokens in <mark> for highlighting in the original (non-
// normalized) text. We split on whitespace, then for each non-whitespace
// token compare its normalized form against the matched terms via equality
// or prefix — equality covers exact hits, prefix covers MiniSearch's
// prefix-mode matches as well as adjacent punctuation in the original
// (e.g. "rahman," normalizes to "rahman," which prefix-matches "rahman").
//
// In `mode: "root"` the per-token comparison is upgraded so that a
// surface form like الغفور (al-Ghafur) and a query like غفور both
// resolve to the same root before being compared. The resolution uses
// resolveArabicRoot — QAC vocabulary first, heuristic stripper second —
// so highlights stay aligned with what the index actually returned.
// Root matching is Arabic-only and skipped for Latin text; calling
// highlightTerms with `mode: "root"` on a translation column is safe.
//
// The whole thing is purely render-time; safe to call from server or
// client components since it returns React nodes, not stateful elements.
export function highlightTerms(
  text: string,
  terms: string[],
  options: { mode?: SearchMode } = {},
): React.ReactNode[] {
  if (!text) return [];
  if (!terms.length) return [text];

  const isArabic = detectScript(text) === "arabic";
  const normalize = isArabic
    ? normalizeArabicForSearch
    : normalizeLatinForSearch;

  const matchByRoot = options.mode === "root" && isArabic;

  const lcTerms = terms.map((t) => t.toLowerCase()).filter((t) => t.length > 0);
  if (!lcTerms.length) return [text];

  const tokens = text.split(/(\s+)/);

  return tokens.map((token, i) => {
    if (!token || /^\s+$/.test(token)) return token;

    const normalized = normalize(token);
    if (!normalized) return token;

    const comparable = matchByRoot ? resolveArabicRoot(normalized) : normalized;

    const matches = lcTerms.some((term) =>
      matchByRoot
        ? comparable === term
        : comparable === term || comparable.startsWith(term),
    );

    if (matches) {
      return React.createElement(
        "mark",
        { key: i, className: "search-mark" },
        token,
      );
    }
    return token;
  });
}
