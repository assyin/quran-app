// CLI sanity check for the Phase 1 search pipeline.
//
// Replicates the same MiniSearch configuration and normalization rules
// used by apps/web/lib/search.ts and packages/core/src/text-normalize.ts,
// then runs five representative queries to validate that:
//   - Arabic queries find Arabic matches (script auto-detection works)
//   - Latin queries find translation matches in FR and EN
//   - "2:255" is recognized as a verse reference, not a search query
//   - Root-style queries surface verses across multiple surahs
//
// Usage:
//   node packages/data/scripts/test-search.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MiniSearch from "minisearch";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_PATH = path.resolve(__dirname, "../quran/search-index.json");

const HARAKAT = /[ً-ٰٟ]/g;
const QURAN_MARKS = /[ۖ-ۭ]/g;
const TATWEEL = /ـ/g;
const ALEF_VARIANTS = /[ٱآأإ]/g;
const YA_VARIANTS = /ي/g;
const TA_MARBOUTA = /ة/g;
const ZW_CHARS = /[‌-‏‪-‮⁦-⁩﻿]/g;
const LATIN_DIACRITICS = /[̀-ͯ]/g;
const ARABIC_BLOCK = /[؀-ۿݐ-ݿ]/;

function normalizeArabicForSearch(text) {
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

function normalizeLatinForSearch(text) {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(LATIN_DIACRITICS, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeQuery(text) {
  return ARABIC_BLOCK.test(text)
    ? normalizeArabicForSearch(text)
    : normalizeLatinForSearch(text);
}

const REFERENCE_RE = /^(\d{1,3})\s*[:\-\.\s]\s*(\d{1,3})$/;
const MAX_VERSES_PER_SURAH = 286;

function parseReference(query) {
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

console.log("Loading search-index.json...");
const startLoad = Date.now();
const data = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
console.log(`  ${data.verses.length} verses loaded in ${Date.now() - startLoad} ms.`);

console.log("Building MiniSearch index...");
const startIndex = Date.now();
const ms = new MiniSearch({
  fields: ["textArabicSimple", "textFrNormalized", "textEnNormalized"],
  storeFields: ["id", "surahNumber", "verseNumber", "textArabic", "textFr", "textEn"],
  searchOptions: {
    boost: { textArabicSimple: 3 },
    prefix: true,
    fuzzy: 0.2,
  },
});
ms.addAll(data.verses);
console.log(`  index built in ${Date.now() - startIndex} ms.`);

const truncate = (s, n) => (s.length > n ? s.slice(0, n) + "…" : s);

const queries = [
  { label: "Arabic content", query: "الرحمن" },
  { label: "French translation", query: "miséricordieux" },
  { label: "English translation", query: "mercy" },
  { label: "Verse reference", query: "2:255" },
  { label: "Arabic root word (book)", query: "كتاب" },
];

for (const { label, query } of queries) {
  console.log(`\n=== ${label}: ${JSON.stringify(query)} ===`);

  const ref = parseReference(query);
  if (ref) {
    console.log(
      `  → reference detected: surah ${ref.surahNumber}, verse ${ref.verseNumber} (no search performed)`,
    );
    continue;
  }

  const normalized = normalizeQuery(query);
  console.log(`  normalized: ${JSON.stringify(normalized)}`);

  const startQuery = Date.now();
  const results = ms.search(normalized);
  const elapsed = Date.now() - startQuery;
  console.log(`  ${results.length} hits in ${elapsed} ms.`);

  for (const r of results.slice(0, 3)) {
    console.log(`    [${r.id}] score=${r.score.toFixed(2)} terms=${JSON.stringify(r.terms)}`);
    console.log(`      AR: ${truncate(r.textArabic, 80)}`);
    console.log(`      FR: ${truncate(r.textFr, 80)}`);
  }
}

console.log("\nAll five test queries completed successfully.");
