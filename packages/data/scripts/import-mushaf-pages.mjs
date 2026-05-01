// Imports the page-to-verse mapping for the standard 604-page Mushaf of
// Medina layout from api.quran.com. The result is a single static JSON dump
// at packages/data/quran/pages/mushaf-pages.json that maps each page number
// (1..604) to the ordered list of verses it contains, plus its juz and hizb
// numbers.
//
// We only persist what we actually need for navigation: page → verses,
// page → juz/hizb, and the surahs that appear on each page. We do NOT
// persist verse text here — the existing hafs.json + translations remain
// the single source of truth for actual Quranic content. This file is the
// glue between page-based browsing and the existing per-surah data.
//
// Idempotent: if mushaf-pages.json already exists with all 604 pages and
// the verse total matches 6236, the script exits 0 without re-fetching.
// To force a refetch, delete the file first.
//
// Usage:
//   node packages/data/scripts/import-mushaf-pages.mjs
//   node packages/data/scripts/import-mushaf-pages.mjs --force

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.resolve(
  __dirname,
  "../quran/pages/mushaf-pages.json",
);
const API = "https://api.quran.com/api/v4";

const TOTAL_PAGES = 604;
const EXPECTED_TOTAL_VERSES = 6236;
const CONCURRENCY = 5;
const FETCH_TIMEOUT_MS = 20000;
const RETRY_ATTEMPTS = 4;
const FORCE = process.argv.includes("--force");

// --- Idempotency check ------------------------------------------------

function isExistingDumpComplete() {
  if (!fs.existsSync(OUT_PATH)) return false;
  try {
    const data = JSON.parse(fs.readFileSync(OUT_PATH, "utf8"));
    if (!Array.isArray(data?.pages)) return false;
    if (data.pages.length !== TOTAL_PAGES) return false;
    const total = data.pages.reduce(
      (acc, p) => acc + (p.verses?.length ?? 0),
      0,
    );
    return total === EXPECTED_TOTAL_VERSES;
  } catch {
    return false;
  }
}

if (!FORCE && isExistingDumpComplete()) {
  console.log(`✓ ${OUT_PATH} already complete (604 pages / 6236 verses).`);
  console.log("  Nothing to do. Pass --force to refetch.");
  process.exit(0);
}

// --- Fetch with retries ------------------------------------------------

async function fetchWithRetry(url, attempts = RETRY_ATTEMPTS) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
      return await res.json();
    } catch (err) {
      lastError = err;
      const wait = Math.min(500 * 2 ** i, 8000);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastError;
}

async function fetchPage(pageNumber) {
  const url = `${API}/verses/by_page/${pageNumber}?fields=verse_number,verse_key,juz_number,hizb_number&per_page=50`;
  const data = await fetchWithRetry(url);
  const verses = data.verses ?? [];
  if (verses.length === 0) {
    throw new Error(`Page ${pageNumber}: no verses returned`);
  }
  // Map verse_key "X:Y" → { surahNumber, verseNumber } and preserve API order.
  const mappedVerses = verses.map((v) => {
    const [s, n] = v.verse_key.split(":").map(Number);
    return { surahNumber: s, verseNumber: n };
  });
  const surahsOnPage = [
    ...new Set(mappedVerses.map((v) => v.surahNumber)),
  ].sort((a, b) => a - b);
  return {
    pageNumber,
    juzNumber: verses[0].juz_number,
    hizbNumber: verses[0].hizb_number,
    verses: mappedVerses,
    surahsOnPage,
  };
}

// --- Concurrency pool --------------------------------------------------

async function poolMap(items, concurrency, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  let completed = 0;

  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
      completed++;
      if (completed % 20 === 0 || completed === items.length) {
        process.stdout.write(
          `\r  fetched ${completed}/${items.length} pages...`,
        );
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  process.stdout.write("\n");
  return results;
}

// --- Main --------------------------------------------------------------

console.log(
  `Fetching ${TOTAL_PAGES} pages from ${API} (concurrency=${CONCURRENCY})...`,
);
const start = Date.now();
const pageNumbers = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1);
const pages = await poolMap(pageNumbers, CONCURRENCY, fetchPage);
const elapsed = ((Date.now() - start) / 1000).toFixed(1);
console.log(`  done in ${elapsed}s`);

// --- Validation --------------------------------------------------------

console.log("Validating...");

// 1. All page numbers present and contiguous 1..604
for (let i = 0; i < TOTAL_PAGES; i++) {
  if (pages[i].pageNumber !== i + 1) {
    throw new Error(
      `Page index ${i} has pageNumber ${pages[i].pageNumber}, expected ${i + 1}`,
    );
  }
}

// 2. Total verses across all pages == 6236
const totalVerses = pages.reduce((acc, p) => acc + p.verses.length, 0);
if (totalVerses !== EXPECTED_TOTAL_VERSES) {
  throw new Error(
    `Total verses ${totalVerses} != expected ${EXPECTED_TOTAL_VERSES}`,
  );
}

// 3. No duplicate verses across pages
const seen = new Set();
for (const page of pages) {
  for (const v of page.verses) {
    const key = `${v.surahNumber}:${v.verseNumber}`;
    if (seen.has(key)) {
      throw new Error(`Duplicate verse ${key} found (page ${page.pageNumber})`);
    }
    seen.add(key);
  }
}

console.log("  ✓ 604 pages contiguous 1..604");
console.log(`  ✓ total verses = ${totalVerses}`);
console.log(`  ✓ no duplicate verses (${seen.size} unique)`);

// --- Write -------------------------------------------------------------

const out = {
  _meta: {
    downloadedAt: new Date().toISOString().slice(0, 10),
    source: `${API}/verses/by_page/`,
    totalPages: TOTAL_PAGES,
    totalVerses,
  },
  pages,
};

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n");
const sizeKb = (fs.statSync(OUT_PATH).size / 1024).toFixed(1);
console.log(`✓ wrote ${OUT_PATH} (${sizeKb} KB)`);
