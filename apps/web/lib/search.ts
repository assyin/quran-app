// Full-text Quran search backed by a lazy MiniSearch index over the
// pre-built parallel-fields JSON in @quran/data/search-index.
//
// Two query paths are exposed:
//   - parseReference("2:255") returns the verse coordinates if the input
//     looks like a canonical reference, so callers can skip the search
//     altogether and jump straight to the verse.
//   - searchQuran("...") runs the user's query through script-aware
//     normalization (Arabic vs Latin), then through MiniSearch with the
//     Arabic field boosted 3× to preserve the primacy of the source text.
//
// No "use client" directive: this module is intentionally isomorphic so
// future server components and route handlers can call it the same way.

import MiniSearch from "minisearch";
import React from "react";
import {
  detectScript,
  normalizeArabicForSearch,
  normalizeLatinForSearch,
  normalizeQuery,
} from "@quran/core";
import searchIndex from "@quran/data/search-index";
import type { SearchIndexVerse } from "@quran/data/search-index";

let cachedSearch: MiniSearch<SearchIndexVerse> | null = null;

function getSearchIndex(): MiniSearch<SearchIndexVerse> {
  if (cachedSearch) return cachedSearch;

  const ms = new MiniSearch<SearchIndexVerse>({
    fields: ["textArabicSimple", "textFrNormalized", "textEnNormalized"],
    storeFields: [
      "id",
      "surahNumber",
      "verseNumber",
      "textArabic",
      "textFr",
      "textEn",
    ],
    searchOptions: {
      boost: { textArabicSimple: 3 },
      prefix: true,
      fuzzy: 0.2,
    },
  });

  ms.addAll(searchIndex.verses);
  cachedSearch = ms;
  return ms;
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

// Run a full-text search and return up to `limit` results ordered by
// relevance score. Returns [] for queries shorter than 2 characters or
// queries that normalize to an empty string.
export function searchQuran(query: string, limit = 50): SearchResult[] {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const normalized = normalizeQuery(trimmed);
  if (!normalized) return [];

  const index = getSearchIndex();
  const rawResults = index.search(normalized);

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
// The whole thing is purely render-time; safe to call from server or
// client components since it returns React nodes, not stateful elements.
export function highlightTerms(
  text: string,
  terms: string[],
): React.ReactNode[] {
  if (!text) return [];
  if (!terms.length) return [text];

  const normalize =
    detectScript(text) === "arabic"
      ? normalizeArabicForSearch
      : normalizeLatinForSearch;

  const lcTerms = terms.map((t) => t.toLowerCase()).filter((t) => t.length > 0);
  if (!lcTerms.length) return [text];

  const tokens = text.split(/(\s+)/);

  return tokens.map((token, i) => {
    if (!token || /^\s+$/.test(token)) return token;

    const normalized = normalize(token);
    if (!normalized) return token;

    const matches = lcTerms.some(
      (term) => normalized === term || normalized.startsWith(term),
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
