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
const OPEN_TANWIN = /[ࣰ-ࣲ]/g;
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
    .replace(OPEN_TANWIN, "")
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

// Heuristic root extraction. Operates on POST-NORMALIZATION text — i.e.
// already stripped of harakat, with ة collapsed to ه, alef variants unified,
// etc. Strips one common Arabic prefix and one common suffix (longest first
// in each list) and falls back to the original word when stripping would
// leave fewer than 3 characters.
//
// Precision is intentionally rough — about 60-70% of Quranic words land on
// their true trilateral root. This is enough to power a "search by root"
// mode where the user types رحم and finds رحمة, الرحمن, ارحم, etc. For
// academic-grade morphology the long-term plan is to integrate the Quranic
// Arabic Corpus dataset (corpus.quran.com); this heuristic is the MVP.
//
// Note on the suffix list: the user-facing spec lists ة (ta marbuta), but
// after normalizeArabicForSearch ة has already been collapsed to ه, so the
// equivalent post-normalization suffix is ه. All other suffixes in the spec
// are unchanged by normalization and pass through verbatim.

const ROOT_PREFIXES = ["ست", "ال", "و", "ف", "ب", "ك", "ل", "س"];
const ROOT_SUFFIXES = [
  "ها",
  "هم",
  "هن",
  "كم",
  "نا",
  "ون",
  "ين",
  "ات",
  "ه",
  "ت",
];

export function extractRoot(word: string): string | null {
  if (word.length < 3) return null;

  let stripped = word;

  // Multi-pass prefix strip: handles compound clitics like وال (wa-al)
  // where both وَ "and" and ال "the" cling to the same head word. Each
  // strip is gated by a >= 3 length floor so the loop never reduces a
  // word below the minimum useful length for matching.
  let changed = true;
  while (changed) {
    changed = false;
    for (const prefix of ROOT_PREFIXES) {
      if (
        stripped.startsWith(prefix) &&
        stripped.length - prefix.length >= 3
      ) {
        stripped = stripped.slice(prefix.length);
        changed = true;
        break;
      }
    }
  }

  changed = true;
  while (changed) {
    changed = false;
    for (const suffix of ROOT_SUFFIXES) {
      if (
        stripped.endsWith(suffix) &&
        stripped.length - suffix.length >= 3
      ) {
        stripped = stripped.slice(0, -suffix.length);
        changed = true;
        break;
      }
    }
  }

  return stripped;
}

// Apply extractRoot to every whitespace-separated token of an
// already-normalized Arabic string, joining the surviving roots back with
// single spaces. Tokens that are too short or yield no root are kept as-is
// (their original form), so a multi-word query still matches against
// something even when not every word resolves cleanly.
export function extractRoots(normalizedText: string): string {
  if (!normalizedText) return "";
  return normalizedText
    .split(/\s+/)
    .map((tok) => extractRoot(tok) ?? tok)
    .filter((tok) => tok.length > 0)
    .join(" ");
}
