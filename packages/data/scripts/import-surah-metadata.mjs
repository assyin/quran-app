// Fetches chapter metadata from api.quran.com/api/v4 (English + French names,
// revelation place, verse count, juz mapping) and rebuilds entries 3..114 of
// packages/data/quran/metadata/surahs.json. Entries 1 and 2 (Al-Fatiha,
// Al-Baqara) are preserved byte-for-byte — this script never touches them.
//
// Slugs are hardcoded below rather than derived from the API's name_simple.
// The kebab-case forms in use by the project (e.g. "al-baqara" not
// "al-baqarah", "ya-sin" not "yasin", "ta-ha" not "taha", "at-tawba" not
// "at-tawbah") don't map algorithmically from quran.com's romanization, and
// URL stability is a first-class project decision — not an accident of the
// upstream API's output.
//
// Transliteration normalization: the existing hand-crafted entries for 1 and
// 2 drop the trailing 'h' on the feminine -ah ending ("Al-Fatiha" not
// "Al-Fatihah"). We apply the same rule to the new entries to keep the
// nameTransliterated style consistent across the file.
//
// French proper-noun capitalization: the API returns French names like
// "La famille de 'imran" with a lowercase letter after the ayin apostrophe.
// In French, proper nouns require a capital. We uppercase the letter
// immediately following a *space-preceded* apostrophe — this catches
// 'Imran / 'Ad / 'Ali without touching contractions (l'homme, d'Allah) where
// the apostrophe is preceded by a letter, not a space.
//
// Revelation-place convention: we preserve the classification given by
// api.quran.com, which follows the Mushaf of Cairo 1924. A handful of surahs
// (e.g. Ar-Rahman) are classified differently in other scholarly traditions —
// divergences are a live academic question and will be tracked separately
// rather than resolved by this script.
//
// Idempotent: reruns fetch fresh API data and overwrite entries 3..114, but
// 1 and 2 remain untouched. Safe to run repeatedly.
//
// Usage:
//   node packages/data/scripts/import-surah-metadata.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const METADATA_PATH = path.resolve(__dirname, "../quran/metadata/surahs.json");
const API = "https://api.quran.com/api/v4";

// Index = surah number. Index 0 is unused. Canonical kebab-case slugs.
const SLUGS = [
  null,
  "al-fatiha",        // 1
  "al-baqara",        // 2
  "al-imran",         // 3
  "an-nisa",          // 4
  "al-maida",         // 5
  "al-anam",          // 6
  "al-araf",          // 7
  "al-anfal",         // 8
  "at-tawba",         // 9
  "yunus",            // 10
  "hud",              // 11
  "yusuf",            // 12
  "ar-rad",           // 13
  "ibrahim",          // 14
  "al-hijr",          // 15
  "an-nahl",          // 16
  "al-isra",          // 17
  "al-kahf",          // 18
  "maryam",           // 19
  "ta-ha",            // 20
  "al-anbiya",        // 21
  "al-hajj",          // 22
  "al-muminun",       // 23
  "an-nur",           // 24
  "al-furqan",        // 25
  "ash-shuara",       // 26
  "an-naml",          // 27
  "al-qasas",         // 28
  "al-ankabut",       // 29
  "ar-rum",           // 30
  "luqman",           // 31
  "as-sajda",         // 32
  "al-ahzab",         // 33
  "saba",             // 34
  "fatir",            // 35
  "ya-sin",           // 36
  "as-saffat",        // 37
  "sad",              // 38
  "az-zumar",         // 39
  "ghafir",           // 40
  "fussilat",         // 41
  "ash-shura",        // 42
  "az-zukhruf",       // 43
  "ad-dukhan",        // 44
  "al-jathiya",       // 45
  "al-ahqaf",         // 46
  "muhammad",         // 47
  "al-fath",          // 48
  "al-hujurat",       // 49
  "qaf",              // 50
  "adh-dhariyat",     // 51
  "at-tur",           // 52
  "an-najm",          // 53
  "al-qamar",         // 54
  "ar-rahman",        // 55
  "al-waqia",         // 56
  "al-hadid",         // 57
  "al-mujadila",      // 58
  "al-hashr",         // 59
  "al-mumtahana",     // 60
  "as-saff",          // 61
  "al-jumua",         // 62
  "al-munafiqun",     // 63
  "at-taghabun",      // 64
  "at-talaq",         // 65
  "at-tahrim",        // 66
  "al-mulk",          // 67
  "al-qalam",         // 68
  "al-haqqa",         // 69
  "al-maarij",        // 70
  "nuh",              // 71
  "al-jinn",          // 72
  "al-muzzammil",     // 73
  "al-muddaththir",   // 74
  "al-qiyama",        // 75
  "al-insan",         // 76
  "al-mursalat",      // 77
  "an-naba",          // 78
  "an-naziat",        // 79
  "abasa",            // 80
  "at-takwir",        // 81
  "al-infitar",       // 82
  "al-mutaffifin",    // 83
  "al-inshiqaq",      // 84
  "al-buruj",         // 85
  "at-tariq",         // 86
  "al-ala",           // 87
  "al-ghashiya",      // 88
  "al-fajr",          // 89
  "al-balad",         // 90
  "ash-shams",        // 91
  "al-layl",          // 92
  "ad-duha",          // 93
  "ash-sharh",        // 94
  "at-tin",           // 95
  "al-alaq",          // 96
  "al-qadr",          // 97
  "al-bayyina",       // 98
  "az-zalzala",       // 99
  "al-adiyat",        // 100
  "al-qaria",         // 101
  "at-takathur",      // 102
  "al-asr",           // 103
  "al-humaza",        // 104
  "al-fil",           // 105
  "quraysh",          // 106
  "al-maun",          // 107
  "al-kawthar",       // 108
  "al-kafirun",       // 109
  "an-nasr",          // 110
  "al-masad",         // 111
  "al-ikhlas",        // 112
  "al-falaq",         // 113
  "an-nas",           // 114
];

// Sanity: every index from 1 to 114 must have a non-null slug, and the list
// must be exactly 115 elements (index 0 + 114 surahs). Caught here, not at
// runtime, so a typo in the table fails loud before any network traffic.
if (SLUGS.length !== 115) {
  throw new Error(`SLUGS table must have 115 entries (got ${SLUGS.length})`);
}
for (let n = 1; n <= 114; n++) {
  if (typeof SLUGS[n] !== "string" || SLUGS[n].length === 0) {
    throw new Error(`SLUGS[${n}] is missing or empty`);
  }
}

// --- helpers ---

async function fetchJson(url, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 500 * 2 ** i));
    }
  }
  throw new Error(`Failed ${url}: ${lastErr?.message ?? lastErr}`);
}

// Strip the trailing 'h' on -ah endings to match the convention already set
// by "Al-Fatiha" and "Al-Baqara". Never triggers on "Ta-Ha" / "Nuh" / etc.
// because those don't end in lowercase 'ah'.
function normalizeTransliteration(name) {
  return name.replace(/ah$/, "a");
}

// Capitalize the letter after an ayin apostrophe when the apostrophe is
// preceded by whitespace (i.e. starts a word). See rationale in the top-level
// doc comment.
function capitalizeAfterApostrophe(text) {
  return text.replace(
    /(\s')([a-zàâäéèêëîïôöùûü])/g,
    (_, apos, ch) => apos + ch.toUpperCase(),
  );
}

// --- main ---

console.log("Fetching chapter metadata (en)…");
const enData = await fetchJson(`${API}/chapters?language=en`);
console.log("Fetching chapter metadata (fr)…");
const frData = await fetchJson(`${API}/chapters?language=fr`);
console.log("Fetching juz metadata…");
const juzData = await fetchJson(`${API}/juzs`);

const enChapters = new Map(enData.chapters.map((c) => [c.id, c]));
const frChapters = new Map(frData.chapters.map((c) => [c.id, c]));

// Build surah -> sorted juz list from the juz verse_mapping. Each juz has a
// verse_mapping { "<surah_id>": "start-end", ... } listing every surah it
// touches; we invert that into surah -> juz[].
//
// Note: the /juzs endpoint returns 60 entries (two copies of each juz_number
// 1..30, with different `id`s but identical `verse_mapping`). This duplication
// appears tied to alternate qira'at divisions in the upstream data. We store
// juz_number in a Set so duplicates collapse naturally.
const surahJuz = new Map();
for (const juz of juzData.juzs) {
  for (const surahStr of Object.keys(juz.verse_mapping)) {
    const n = Number(surahStr);
    if (!surahJuz.has(n)) surahJuz.set(n, new Set());
    surahJuz.get(n).add(juz.juz_number);
  }
}

const existing = JSON.parse(fs.readFileSync(METADATA_PATH, "utf8"));
const preserved = existing.filter((s) => s.number === 1 || s.number === 2);
if (preserved.length !== 2) {
  throw new Error(`Expected entries for surahs 1 and 2 in metadata, found ${preserved.length}`);
}

const fresh = [];
for (let n = 3; n <= 114; n++) {
  const enC = enChapters.get(n);
  const frC = frChapters.get(n);
  if (!enC) throw new Error(`Missing English chapter ${n} from api.quran.com`);
  if (!frC) throw new Error(`Missing French chapter ${n} from api.quran.com`);
  const juzSet = surahJuz.get(n);
  if (!juzSet || juzSet.size === 0) throw new Error(`No juz mapping for surah ${n}`);
  const juz = [...juzSet].sort((a, b) => a - b);

  fresh.push({
    number: n,
    slug: SLUGS[n],
    nameArabic: enC.name_arabic,
    nameTransliterated: normalizeTransliteration(enC.name_simple),
    nameTranslations: {
      fr: capitalizeAfterApostrophe(
        frC.translated_name?.name ?? enC.translated_name?.name ?? enC.name_simple,
      ),
      en: enC.translated_name?.name ?? enC.name_simple,
    },
    revelationType: enC.revelation_place === "makkah" ? "meccan" : "medinan",
    verseCount: enC.verses_count,
    position: {
      juz,
      hizb: [1],
      page: [1],
    },
  });
}

// Preserve the two hand-crafted entries at the head; append the 112 new ones.
// The _meta block lives as an extra property on the first entry (existing
// project convention — unusual placement, kept for compatibility).
const final = [...preserved, ...fresh];
final[0]._meta = {
  ...(final[0]._meta ?? {}),
  version: "2.0.0",
  sourceMetadata: "api.quran.com/api/v4 (chapters + juzs)",
  downloadedAt: new Date().toISOString().slice(0, 10),
  chapters: final.length,
  preserved: [1, 2],
};

fs.writeFileSync(METADATA_PATH, JSON.stringify(final, null, 2) + "\n");
console.log(`✓ Wrote ${final.length} entries to ${path.relative(process.cwd(), METADATA_PATH)}`);
console.log(`  Preserved: surahs 1, 2. Refreshed: surahs 3..114.`);
