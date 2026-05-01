// Generates packages/data/quran/search-index.json: a flat list of 6236
// verses with parallel normalized fields ready to feed into a MiniSearch
// index on the client.
//
// Source files are read-only; nothing in hafs.json or the translation
// JSONs is mutated (CLAUDE.md rules 8 and 9). The output is regenerated
// from scratch each run, so the script is idempotent.
//
// Normalization mirror: the regexes below MUST stay in sync with
// packages/core/src/text-normalize.ts. Both are hand-rolled from the
// Lucene ArabicNormalizer specification and from the project's own
// rules on diacritic / mark stripping. They are duplicated here because
// this script runs under plain Node (no TS build step in @quran/core).
//
// Usage:
//   node packages/data/scripts/build-search-fields.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../quran");
const HAFS_PATH = path.join(DATA_DIR, "text/hafs.json");
const FR_PATH = path.join(DATA_DIR, "translations/fr-hamidullah.json");
const EN_PATH = path.join(DATA_DIR, "translations/en-sahih-international.json");
const OUTPUT_PATH = path.join(DATA_DIR, "search-index.json");

const HARAKAT = /[ً-ٰٟ]/g;
const QURAN_MARKS = /[ۖ-ۭ]/g;
const TATWEEL = /ـ/g;
const ALEF_VARIANTS = /[ٱآأإ]/g;
const YA_VARIANTS = /ي/g;
const TA_MARBOUTA = /ة/g;
const ZW_CHARS = /[‌-‏‪-‮⁦-⁩﻿]/g;
const LATIN_DIACRITICS = /[̀-ͯ]/g;

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

const hafs = JSON.parse(fs.readFileSync(HAFS_PATH, "utf8"));
const fr = JSON.parse(fs.readFileSync(FR_PATH, "utf8"));
const en = JSON.parse(fs.readFileSync(EN_PATH, "utf8"));

const frByVerseId = new Map(fr.translations.map((t) => [t.verseId, t.text]));
const enByVerseId = new Map(en.translations.map((t) => [t.verseId, t.text]));

const verses = hafs.verses.map((v) => {
  const textFr = frByVerseId.get(v.id) ?? "";
  const textEn = enByVerseId.get(v.id) ?? "";
  return {
    id: v.id,
    surahNumber: v.surahNumber,
    verseNumber: v.verseNumber,
    textArabic: v.text,
    textArabicSimple: normalizeArabicForSearch(v.text),
    textFr,
    textFrNormalized: normalizeLatinForSearch(textFr),
    textEn,
    textEnNormalized: normalizeLatinForSearch(textEn),
  };
});

const output = {
  _meta: {
    generatedAt: new Date().toISOString(),
    totalVerses: verses.length,
    normalizationVersion: "lucene-7step-2026-05",
    normalizationMirror: "packages/core/src/text-normalize.ts",
  },
  verses,
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output) + "\n");

const sizeBytes = fs.statSync(OUTPUT_PATH).size;
const sizeMb = (sizeBytes / 1024 / 1024).toFixed(2);
console.log(
  `Wrote ${verses.length} verses to ${path.relative(process.cwd(), OUTPUT_PATH)} (${sizeMb} MB raw).`,
);

const missingFr = verses.filter((v) => !v.textFr).length;
const missingEn = verses.filter((v) => !v.textEn).length;
if (missingFr > 0 || missingEn > 0) {
  console.log(`Coverage gaps: ${missingFr} verses without FR, ${missingEn} without EN.`);
}
