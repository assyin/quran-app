// Lucene-inspired Arabic normalization for search indexing.
//
// Applied ONLY to a parallel field (textArabicSimple), never mutates the
// source Quranic text in hafs.json (CLAUDE.md rules 8 and 9). The 7-step
// pipeline transforms surface variations to a canonical search-friendly
// form so users can type "السلام" or "السَّلَامُ" and find the same verses.
//
// Mirror: packages/data/scripts/build-search-fields.mjs inlines the same
// regexes for the offline indexer. If you change one, change the other.
//
// Char classes are written with explicit \uXXXX escapes rather than literal
// glyphs to keep range endpoints unambiguous and matchable to the spec.

const HARAKAT = /[ً-ٰٟ]/g;
const QURAN_MARKS = /[ۖ-ۭ]/g;
const TATWEEL = /ـ/g;
const ALEF_VARIANTS = /[ٱآأإ]/g;
const YA_VARIANTS = /ي/g;
const TA_MARBOUTA = /ة/g;
const ZW_CHARS = /[‌-‏‪-‮⁦-⁩﻿]/g;
const LATIN_DIACRITICS = /[̀-ͯ]/g;
const ARABIC_BLOCK = /[؀-ۿݐ-ݿ]/;

export function normalizeArabicForSearch(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFC")
    .replace(HARAKAT, "")
    .replace(QURAN_MARKS, "")
    .replace(TATWEEL, "")
    .replace(ALEF_VARIANTS, "ا")
    .replace(YA_VARIANTS, "ى")
    .replace(TA_MARBOUTA, "ه")
    .replace(ZW_CHARS, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Normalize Latin queries (lowercase, strip accents) to match pre-computed
// transliterated fields and translation indexes.
export function normalizeLatinForSearch(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(LATIN_DIACRITICS, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Auto-detect script: Arabic (basic + supplement blocks) vs Latin.
export function detectScript(text: string): "arabic" | "latin" {
  return ARABIC_BLOCK.test(text) ? "arabic" : "latin";
}

// Apply the right normalization based on detected script. Used at query
// time; index-time normalization is handled per-field by the build script.
export function normalizeQuery(text: string): string {
  return detectScript(text) === "arabic"
    ? normalizeArabicForSearch(text)
    : normalizeLatinForSearch(text);
}
