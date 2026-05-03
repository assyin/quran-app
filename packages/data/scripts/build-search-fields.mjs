// Generates packages/data/quran/search-index.json: a flat list of 6236
// verses with parallel normalized fields ready to feed into a MiniSearch
// index on the client.
//
// Source files are read-only; nothing in hafs.json or the translation
// JSONs is mutated (CLAUDE.md rules 8 and 9). The output is regenerated
// from scratch each run, so the script is idempotent.
//
// textRoot field source (Phase C-2 onward): the per-verse Arabic roots
// come from packages/data/quran/search/qac-roots.json, which is itself
// generated from the Quranic Arabic Corpus v0.4 (Leeds Univ., GNU GPL)
// by packages/data/scripts/import-qac.mjs. The earlier per-word
// heuristic stripper (extractRoots) has been removed from this script
// — the canonical extractRoot helper still lives in
// packages/core/src/text-normalize.ts for query-side use.
//
// Normalization mirror: the regexes below MUST stay in sync with
// packages/core/src/text-normalize.ts. Both are hand-rolled from the
// Lucene ArabicNormalizer specification and from the project's own
// rules on diacritic / mark stripping. They are duplicated here because
// this script runs under plain Node (no TS build step in @quran/core).
//
// Usage:
//   node packages/data/scripts/build-search-fields.mjs
//
// Prerequisite: run packages/data/scripts/import-qac.mjs first to
// produce qac-roots.json.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../quran");
const HAFS_PATH = path.join(DATA_DIR, "text/hafs.json");
const FR_PATH = path.join(DATA_DIR, "translations/fr-hamidullah.json");
const EN_PATH = path.join(DATA_DIR, "translations/en-sahih-international.json");
const QAC_ROOTS_PATH = path.join(DATA_DIR, "search/qac-roots.json");
const SURFACE_MAP_PATH = path.join(DATA_DIR, "search/qac-surface-to-root.json");
const OUTPUT_PATH = path.join(DATA_DIR, "search-index.json");

const HARAKAT = /[ً-ٰٟ]/g;
const QURAN_MARKS = /[ۖ-ۭ]/g;
const OPEN_TANWIN = /[ࣰ-ࣲ]/g;
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
    .replace(OPEN_TANWIN, "")
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

if (!fs.existsSync(QAC_ROOTS_PATH)) {
  console.error(
    `\nMissing prerequisite: ${path.relative(process.cwd(), QAC_ROOTS_PATH)}`,
  );
  console.error("Run packages/data/scripts/import-qac.mjs first.\n");
  process.exit(1);
}

const hafs = JSON.parse(fs.readFileSync(HAFS_PATH, "utf8"));
const fr = JSON.parse(fs.readFileSync(FR_PATH, "utf8"));
const en = JSON.parse(fs.readFileSync(EN_PATH, "utf8"));
const qacRootsFile = JSON.parse(fs.readFileSync(QAC_ROOTS_PATH, "utf8"));

// Common Arabic clitic prefixes that fuse to the next word in the Mushaf
// orthography. Listed longest-first so multi-character compound clitics
// (e.g. وَال = "and the") get tried before their single-letter components.
// "ى" covers the vocative يَٰ (e.g. يَٰمُوسَىٰ) which after normalization
// becomes ى prefixed to the addressed name.
const PHRASE_PREFIXES = [
  "وال",
  "بال",
  "فال",
  "كال",
  "لل",
  "ست",
  "ال",
  "ى",
  "و",
  "ف",
  "ب",
  "ل",
  "ك",
  "س",
];

// Build a corpus-wide set of bare normalized tokens. A prefix-stripped
// variant only gets emitted into textArabicExpanded if its result lives
// in this set — that gates against false positives like الموسع → موسع
// where the "stripped" form isn't an attested word in the Quran (so it
// would be a meaningless inflation of the index, not a real synonym).
function collectBareTokens(verses) {
  const set = new Set();
  for (const v of verses) {
    const text = normalizeArabicForSearch(v.text);
    for (const tok of text.split(/\s+/)) {
      if (tok.length >= 3) set.add(tok);
    }
  }
  return set;
}

// For one normalized token, return the unique tokens to index in the
// expanded field: the original PLUS any prefix-stripped variant whose
// bare form actually appears in the corpus. Single-pass: we don't try
// to peel off two clitics in a row beyond what the compound list above
// already covers.
function expandToken(token, bareTokens) {
  if (token.length < 3) return [token];
  const variants = new Set([token]);
  for (const prefix of PHRASE_PREFIXES) {
    if (
      token.startsWith(prefix) &&
      token.length - prefix.length >= 3
    ) {
      const stripped = token.slice(prefix.length);
      if (bareTokens.has(stripped)) {
        variants.add(stripped);
      }
    }
  }
  return [...variants];
}

const bareTokens = collectBareTokens(hafs.verses);
console.log(`First pass: collected ${bareTokens.size} bare normalized tokens.`);

const frByVerseId = new Map(fr.translations.map((t) => [t.verseId, t.text]));
const enByVerseId = new Map(en.translations.map((t) => [t.verseId, t.text]));

// O(1) lookup for the (surah:verse:wordIndex) → root mapping.
const qacRootsMap = new Map(Object.entries(qacRootsFile.roots));

// Walk a verse's normalized words once: emit the textRoot field (unique
// QAC roots in source order) AND populate the global surfaceToRoot map
// (each normalized word → its QAC root, used at query-time so users
// typing "محمد" find the H-M-D family instead of literal "محمد").
//
// Word-level alignment between hafs.json's whitespace splits and QAC's
// wordIndex was validated for sample verses (1:1, 1:2, 3:144, 47:2,
// 48:29) — counts and positions match exactly. Words for which QAC has
// no root (particles, foreign-origin proper nouns, etc.) are silently
// dropped from textRoot and skipped in the surface map.
function processVerse(surahNumber, verseNumber, normalizedArabic) {
  const words = normalizedArabic.split(/\s+/).filter(Boolean);
  const seen = new Set();
  const ordered = [];
  for (let i = 0; i < words.length; i++) {
    const root = qacRootsMap.get(`${surahNumber}:${verseNumber}:${i + 1}`);
    if (!root) continue;
    if (!seen.has(root)) {
      seen.add(root);
      ordered.push(root);
    }
    // Surface map: first occurrence wins. Same-surface / different-root
    // collisions are tracked but kept silent unless > 0 (logged at end).
    const word = words[i];
    if (!word) continue;
    if (!surfaceToRoot.has(word)) {
      surfaceToRoot.set(word, root);
    } else if (surfaceToRoot.get(word) !== root) {
      surfaceCollisions++;
    }
  }
  return ordered.join(" ");
}

const surfaceToRoot = new Map();
let surfaceCollisions = 0;
let qacRootHits = 0;
let versesWithEmptyRoot = 0;

// Build the expanded-tokens text for one verse. Phrase mode searches this
// instead of textArabicSimple so users can find words even when the
// Mushaf attaches clitics to them (e.g. typing موسى surfaces verses
// containing وَمُوسَىٰ, بِمُوسَىٰ, يَٰمُوسَىٰ).
function buildTextArabicExpanded(textArabicSimple) {
  const out = [];
  for (const tok of textArabicSimple.split(/\s+/)) {
    if (!tok) continue;
    for (const variant of expandToken(tok, bareTokens)) out.push(variant);
  }
  return out.join(" ");
}

let totalExpansions = 0;

const verses = hafs.verses.map((v) => {
  const textFr = frByVerseId.get(v.id) ?? "";
  const textEn = enByVerseId.get(v.id) ?? "";
  const textArabicSimple = normalizeArabicForSearch(v.text);
  const textRoot = processVerse(v.surahNumber, v.verseNumber, textArabicSimple);
  const textArabicExpanded = buildTextArabicExpanded(textArabicSimple);
  totalExpansions += textArabicExpanded.split(/\s+/).length - textArabicSimple.split(/\s+/).length;
  if (textRoot.length > 0) qacRootHits++;
  else versesWithEmptyRoot++;
  return {
    id: v.id,
    surahNumber: v.surahNumber,
    verseNumber: v.verseNumber,
    textArabic: v.text,
    textArabicSimple,
    textArabicExpanded,
    textRoot,
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
    rootSource: "qac-v0.4-with-overrides",
    rootSourceFile: "packages/data/quran/search/qac-roots.json",
    rootSourceCitation:
      "Quranic Arabic Corpus v0.4 (Leeds Univ., Kais Dukes 2011, GNU GPL) — http://corpus.quran.com",
    normalizationMirror: "packages/core/src/text-normalize.ts",
  },
  verses,
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output) + "\n");

// Emit the surface→root map as a separate file. Sorted alphabetically so
// the diff is readable when QAC or overrides change.
const surfaceMapSorted = Object.fromEntries(
  [...surfaceToRoot.entries()].sort(([a], [b]) => a.localeCompare(b, "ar")),
);
const surfaceMapOutput = {
  _meta: {
    generatedAt: new Date().toISOString(),
    totalEntries: surfaceToRoot.size,
    surfaceCollisions,
    source:
      "Surface forms from hafs.json (post-normalize) paired with their QAC root via wordIndex alignment.",
    purpose:
      "Query-side lookup: when a user types an Arabic word in root mode, this map resolves it to the academic root before searching textRoot.",
  },
  map: surfaceMapSorted,
};
fs.writeFileSync(
  SURFACE_MAP_PATH,
  JSON.stringify(surfaceMapOutput, null, 2) + "\n",
);

const sizeBytes = fs.statSync(OUTPUT_PATH).size;
const sizeMb = (sizeBytes / 1024 / 1024).toFixed(2);
const surfaceSizeBytes = fs.statSync(SURFACE_MAP_PATH).size;
const surfaceSizeKb = (surfaceSizeBytes / 1024).toFixed(1);
console.log(
  `Wrote ${verses.length} verses to ${path.relative(process.cwd(), OUTPUT_PATH)} (${sizeMb} MB raw).`,
);
console.log(
  `Wrote surface→root map to ${path.relative(process.cwd(), SURFACE_MAP_PATH)} (${surfaceSizeKb} KB, ${surfaceToRoot.size} entries).`,
);
console.log(`Verses with non-empty textRoot: ${qacRootHits}`);
console.log(`Verses with empty textRoot:     ${versesWithEmptyRoot}`);
console.log(
  `Prefix-strip expansions emitted into textArabicExpanded: ${totalExpansions}`,
);
if (surfaceCollisions > 0) {
  console.log(
    `Surface collisions (same form, different root, first-wins kept): ${surfaceCollisions}`,
  );
}

const missingFr = verses.filter((v) => !v.textFr).length;
const missingEn = verses.filter((v) => !v.textEn).length;
if (missingFr > 0 || missingEn > 0) {
  console.log(`Coverage gaps: ${missingFr} verses without FR, ${missingEn} without EN.`);
}
