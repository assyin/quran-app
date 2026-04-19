// Imports surahs 3..114 from fawazahmed0/quran-api into the 3 canonical
// JSON stores (Hafs Arabic + Hamidullah FR + Sahih International EN).
//
// Surahs 1 (Al-Fatiha) and 2 (Al-Baqara) were imported and proofread manually
// and are INTENTIONALLY skipped — this script never touches them.
//
// Shape alignment: new entries are appended in the exact same format already
// used by the existing 1..2 verses (see hafs.json / fr-hamidullah.json /
// en-sahih-international.json for the canonical shape).
//
// Cleanup: the Hafs Arabic text is passed through the same narrow regex used
// by scripts/clean-open-tanwin-spaces.mjs:
//   /\u08F0\s+(?=[\u0627\u0649])/g
// which collapses the print-typography whitespace between an open fathatan
// and a following silent alef/alef-maksura (alef al-wiqâyah convention).
// Every other sibling pattern (U+08F1, U+08F2, U+08F0+و, U+08F0+anything-else)
// is preserved as a real word boundary. See CLAUDE.md rule 9 and the
// comment block in clean-open-tanwin-spaces.mjs for the full rationale.
//
// Idempotent: if all target surahs are already present in hafs.json, the
// script exits 0 without writing anything (so _meta.downloadedAt stays stable).
//
// Usage:
//   node packages/data/scripts/import-remaining-surahs.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_ROOT = path.resolve(__dirname, "..");

const HAFS_PATH = path.resolve(DATA_ROOT, "quran/text/hafs.json");
const FR_PATH = path.resolve(DATA_ROOT, "quran/translations/fr-hamidullah.json");
const EN_PATH = path.resolve(DATA_ROOT, "quran/translations/en-sahih-international.json");

const EDITIONS = {
  ar: "ara-quranuthmanihaf",
  fr: "fra-muhammadhamidul",
  en: "eng-ummmuhammad",
};
const BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions";

const RANGE_FROM = 3;
const RANGE_TO = 114;
const EXPECTED_TOTAL = 6236;
const CONCURRENCY = 5;
const FETCH_TIMEOUT_MS = 20000;
const RETRY_ATTEMPTS = 4;

const CLEANUP_PATTERN = /\u08F0\s+(?=[\u0627\u0649])/g;
const CLEANUP_TAG = "collapsed-open-fathatan-silent-letter-spaces";

// --- helpers ---

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url) {
  let lastErr;
  for (let i = 0; i < RETRY_ATTEMPTS; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (i < RETRY_ATTEMPTS - 1) await sleep(500 * 2 ** i);
    }
  }
  throw new Error(`Failed ${url} after ${RETRY_ATTEMPTS} attempts: ${lastErr?.message ?? lastErr}`);
}

// fawazahmed0 per-surah files have been seen in these shapes depending on the
// edition and on the commit pinned behind @1. We normalize all of them to
// [{ verseNumber, text }, ...] and error clearly if the shape is unknown.
function normalizeVerses(json, edition, surahNum) {
  const arr = Array.isArray(json?.chapter)
    ? json.chapter
    : Array.isArray(json?.verses)
      ? json.verses
      : null;
  if (!arr) {
    throw new Error(
      `Unexpected shape for ${edition}/${surahNum}.json (top-level keys: ${Object.keys(json ?? {}).join(", ")})`,
    );
  }
  return arr.map((v) => {
    const verseNumber = v.verse ?? v.ayah ?? v.number;
    const text = v.text;
    if (typeof verseNumber !== "number" || typeof text !== "string") {
      throw new Error(
        `Malformed verse entry in ${edition}/${surahNum}: ${JSON.stringify(v).slice(0, 200)}`,
      );
    }
    return { verseNumber, text };
  });
}

async function fetchSurah(editionKey, surahNum) {
  const url = `${BASE}/${EDITIONS[editionKey]}/${surahNum}.json`;
  return normalizeVerses(await fetchJson(url), EDITIONS[editionKey], surahNum);
}

async function pMap(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const idx = next++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return results;
}

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const writeJson = (p, data) => fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n");

// --- main ---

const hafs = readJson(HAFS_PATH);
const fr = readJson(FR_PATH);
const en = readJson(EN_PATH);

const present = new Set(hafs.verses.map((v) => v.surahNumber));
const toImport = [];
for (let n = RANGE_FROM; n <= RANGE_TO; n++) if (!present.has(n)) toImport.push(n);

if (toImport.length === 0) {
  console.log(`✓ Surahs ${RANGE_FROM}..${RANGE_TO} already present. No-op.`);
  process.exit(0);
}

console.log(`Importing ${toImport.length} surahs: ${toImport[0]}..${toImport.at(-1)} (concurrency=${CONCURRENCY})`);

const hafsAdd = [];
const frAdd = [];
const enAdd = [];

let tanwinStripped = 0;
let noSukunWarnings = 0;
let done = 0;

try {
  await pMap(toImport, CONCURRENCY, async (num) => {
    const [ar, frV, enV] = await Promise.all([
      fetchSurah("ar", num),
      fetchSurah("fr", num),
      fetchSurah("en", num),
    ]);

    if (ar.length === 0) throw new Error(`Empty Hafs payload for surah ${num}`);
    if (ar.length !== frV.length || ar.length !== enV.length) {
      throw new Error(
        `Verse count mismatch for surah ${num}: hafs=${ar.length} fr=${frV.length} en=${enV.length}`,
      );
    }
    // Verify verse numbers are contiguous 1..N across all three editions.
    for (const set of [ar, frV, enV]) {
      for (let i = 0; i < set.length; i++) {
        if (set[i].verseNumber !== i + 1) {
          throw new Error(
            `Non-contiguous verseNumber in surah ${num}: expected ${i + 1}, got ${set[i].verseNumber}`,
          );
        }
      }
    }

    // Integrity check: rasm uthmani text must carry U+06E1 (dotless head of
    // khah / sukun) somewhere in every reasonably long surah. Very short
    // surahs (≤5 verses) may legitimately lack it — we warn instead of error.
    const hasSukun = ar.some((v) => v.text.includes("\u06E1"));
    if (!hasSukun && ar.length > 5) noSukunWarnings++;

    for (const v of ar) {
      const matches = v.text.match(CLEANUP_PATTERN);
      const cleaned = matches ? v.text.replace(CLEANUP_PATTERN, "\u08F0") : v.text;
      if (matches) tanwinStripped += matches.length;
      hafsAdd.push({
        id: `${num}:${v.verseNumber}`,
        surahNumber: num,
        verseNumber: v.verseNumber,
        text: cleaned,
        // Placeholder meta: juz/hizb/page/ruku/sajda will be enriched in a
        // follow-up pass from a canonical reference (Tanzil metadata).
        meta: { juz: 1, hizb: 1, page: 1, ruku: 1, sajda: false },
      });
    }
    for (const v of frV) frAdd.push({ verseId: `${num}:${v.verseNumber}`, text: v.text });
    for (const v of enV) enAdd.push({ verseId: `${num}:${v.verseNumber}`, text: v.text });

    done++;
    const flag = !hasSukun && ar.length > 5 ? "  ⚠ no U+06E1" : "";
    process.stdout.write(
      `  ${String(done).padStart(3)}/${toImport.length}  surah ${String(num).padStart(3)} (${ar.length} verses)${flag}\n`,
    );
  });
} catch (err) {
  console.error(`\n✗ Import failed: ${err.message}`);
  console.error("  No files were modified.");
  process.exit(1);
}

// --- merge + sort + persist ---

const cmpV = (a, b) => (a.surahNumber - b.surahNumber) || (a.verseNumber - b.verseNumber);
const cmpT = (a, b) => {
  const [aS, aV] = a.verseId.split(":").map(Number);
  const [bS, bV] = b.verseId.split(":").map(Number);
  return (aS - bS) || (aV - bV);
};

hafs.verses = [...hafs.verses, ...hafsAdd].sort(cmpV);
fr.translations = [...fr.translations, ...frAdd].sort(cmpT);
en.translations = [...en.translations, ...enAdd].sort(cmpT);

const surahList = [...new Set(hafs.verses.map((v) => v.surahNumber))].sort((a, b) => a - b);
const stamp = new Date().toISOString().slice(0, 10);

for (const doc of [hafs, fr, en]) {
  doc._meta.surahs = surahList;
  doc._meta.downloadedAt = stamp;
}

// The cleanup tag is Arabic-only. Translations are not subject to the
// open-fathatan whitespace artefact, so their _meta gets no new tag.
const pp = new Set(hafs._meta.postProcessing ?? []);
pp.add(CLEANUP_TAG);
hafs._meta.postProcessing = Array.from(pp);

writeJson(HAFS_PATH, hafs);
writeJson(FR_PATH, fr);
writeJson(EN_PATH, en);

console.log("");
console.log(`✓ Imported ${hafsAdd.length} verses across ${toImport.length} surahs`);
console.log(`  Open-fathatan whitespace collapsed: ${tanwinStripped}`);
console.log(
  `  Total verses now: ${hafs.verses.length}${hafs.verses.length === EXPECTED_TOTAL ? " ✓ (matches canonical 6236)" : ` ⚠ expected ${EXPECTED_TOTAL}`}`,
);
if (noSukunWarnings > 0) {
  console.log(`  ⚠ ${noSukunWarnings} surah(s) longer than 5 verses had no U+06E1 — review manually`);
}
