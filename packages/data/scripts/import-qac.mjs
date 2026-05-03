// Imports the Quranic Arabic Corpus (QAC) v0.4 morphology dataset and
// produces packages/data/quran/search/qac-roots.json: a per-word lookup
// from "(surah:verse:wordIndex)" to the Arabic-Unicode triliteral root of
// the word's lexical stem.
//
// Source dataset:
//   - Quranic Arabic Corpus (morphology, version 0.4) by Kais Dukes (2011)
//   - License: GNU GPL — distribution requires attribution and a link to
//     http://corpus.quran.com (we honor this in the output _meta block and
//     in the user-facing search disclaimer).
//   - Mirror used for download: https://github.com/cltk/arabic_morphology_quranic-corpus
//     (snapshot of QAC v0.4, identical to the upstream file).
//
// Output policy:
//   - The raw 6.3 MB QAC TSV is cached at packages/data/.qac-cache/ and
//     gitignored — we never commit upstream data unmodified.
//   - The derived qac-roots.json IS committed (Phase C-2 needs it to
//     enrich the per-verse textRoot field; Phase C-3 wires it into the
//     search runtime).
//
// Idempotence:
//   - If the cached morphology file is already present and matches the
//     expected size, the download is skipped.
//   - Re-running the script after the input is up-to-date regenerates
//     qac-roots.json deterministically (sorted keys, identical bytes).
//
// Usage:
//   node packages/data/scripts/import-qac.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(PACKAGE_DIR, "quran");
const CACHE_DIR = path.join(PACKAGE_DIR, ".qac-cache");
const TARBALL_PATH = path.join(CACHE_DIR, "qac.tar.gz");
const EXTRACT_DIR = path.join(
  CACHE_DIR,
  "arabic_morphology_quranic-corpus-master",
);
const QAC_TXT_PATH = path.join(EXTRACT_DIR, "quranic-corpus-morphology-0.4.txt");
const OUTPUT_DIR = path.join(DATA_DIR, "search");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "qac-roots.json");

const QAC_URL =
  "https://codeload.github.com/cltk/arabic_morphology_quranic-corpus/tar.gz/master";
const EXPECTED_QAC_SIZE_BYTES = 6309503;

// Buckwalter → Arabic Unicode mapping. Standard 40-character table per
// Tim Buckwalter's transliteration plus QAC-specific extensions:
//   - "p" maps to ة (ta marbuta, distinct from "h" → ه in Buckwalter)
//   - "{" maps to ٱ (alef wasla, Quranic-specific)
//   - "`" maps to ٰ (superscript alef, Quranic combining mark)
//   - "^" is a QAC encoding artifact for alef-madda variants in some
//     stems (e.g. A^xir = آخر); treated as a no-op so that the surrounding
//     base letters render correctly.
const BUCKWALTER_TO_ARABIC = {
  A: "ا",
  b: "ب",
  t: "ت",
  v: "ث",
  j: "ج",
  H: "ح",
  x: "خ",
  d: "د",
  "*": "ذ",
  r: "ر",
  z: "ز",
  s: "س",
  $: "ش",
  S: "ص",
  D: "ض",
  T: "ط",
  Z: "ظ",
  E: "ع",
  g: "غ",
  _: "ـ",
  f: "ف",
  q: "ق",
  k: "ك",
  l: "ل",
  m: "م",
  n: "ن",
  h: "ه",
  w: "و",
  Y: "ى",
  y: "ي",
  F: "ً",
  N: "ٌ",
  K: "ٍ",
  a: "َ",
  u: "ُ",
  i: "ِ",
  "~": "ّ",
  o: "ْ",
  "`": "ٰ",
  "{": "ٱ",
  "'": "ء",
  ">": "أ",
  "&": "ؤ",
  "<": "إ",
  "}": "ئ",
  "|": "آ",
  p: "ة",
  "^": "",
};

function buckwalterToArabic(s) {
  if (!s) return "";
  let out = "";
  for (const c of s) out += BUCKWALTER_TO_ARABIC[c] ?? c;
  return out;
}

// Manual override table: 6 entries. Applied ONLY when QAC returns
// ROOT=null for the matching lemma, never to overwrite an existing tag.
//
// Justification for every entry — these are Arabic proper nouns whose
// triliteral root is uncontroversial in classical lexicography (Lisan
// al-Arab, Mufradat al-Raghib) but which QAC tags as opaque PN. Aligning
// with the المعجم المفهرس convention here lets users searching "محمد" by
// root surface the praise-related vocabulary that shares the H-M-D root.
const OVERRIDES = {
  muHam_ad: "Hmd",
};
// Note: JS object literals can't carry "~" as a bare identifier and we want
// to keep the override keys 1-for-1 with QAC's LEM strings (which include
// "~" for shadda). Using bracketed form below for that reason.
OVERRIDES["muHam~ad"] = "Hmd";
OVERRIDES[">aHomad"] = "Hmd";
OVERRIDES["yaHoyaY`"] = "Hyy";
OVERRIDES["mak~ap"] = "mkk";
OVERRIDES["bak~ap"] = "bkk";
OVERRIDES["qurayo$"] = "qr$";
delete OVERRIDES.muHam_ad; // remove the placeholder used to seed the literal

const OVERRIDES_DOC = [
  {
    form_buckwalter: "muHam~ad",
    form_arabic: "محمد",
    root_buckwalter: "Hmd",
    root_arabic: "حمد",
    lemma_meaning: "Muhammad — 'the most praised one' (passive participle of H-M-D)",
    occurrences: 4,
    justification:
      "Classical etymology (Lisan al-Arab) derives Muhammad from root H-M-D 'praise'. QAC tags as opaque PN.",
  },
  {
    form_buckwalter: ">aHomad",
    form_arabic: "أحمد",
    root_buckwalter: "Hmd",
    root_arabic: "حمد",
    lemma_meaning: "Ahmad — 'the most praiseworthy' (elative form of H-M-D)",
    occurrences: 1,
    justification:
      "Variant name of Prophet Muhammad ﷺ (Q 61:6) from same root H-M-D. QAC: opaque PN.",
  },
  {
    form_buckwalter: "yaHoyaY`",
    form_arabic: "يحيى",
    root_buckwalter: "Hyy",
    root_arabic: "حيي",
    lemma_meaning: "Yahya (John the Baptist) — 'he lives' (imperfect of H-Y-Y 'to live')",
    occurrences: 5,
    justification:
      "Arabic theophoric name from root H-Y-Y. QAC tags as opaque PN.",
  },
  {
    form_buckwalter: "mak~ap",
    form_arabic: "مكة",
    root_buckwalter: "mkk",
    root_arabic: "مكك",
    lemma_meaning: "Makkah — sanctuary city of Hijaz",
    occurrences: 1,
    justification:
      "Classical lexicographers link Makkah to root M-K-K (Lisan al-Arab). QAC: opaque PN.",
  },
  {
    form_buckwalter: "bak~ap",
    form_arabic: "بكة",
    root_buckwalter: "bkk",
    root_arabic: "بكك",
    lemma_meaning: "Bakkah — older Quranic name for the Sanctuary at Makkah (Q 3:96)",
    occurrences: 1,
    justification:
      "Variant of Makkah from root B-K-K (Lisan al-Arab, Tafsir al-Tabari). QAC: opaque PN.",
  },
  {
    form_buckwalter: "qurayo$",
    form_arabic: "قريش",
    root_buckwalter: "qr$",
    root_arabic: "قرش",
    lemma_meaning: "Quraysh — Arab tribe of Makkah, custodians of the Ka'bah",
    occurrences: 1,
    justification:
      "Classical etymology (Lisan al-Arab) links Quraysh to root Q-R-SH ('to gather/collect'). QAC: opaque PN.",
  },
];

// Download the QAC tarball if not already cached, extract, and verify the
// expected morphology file is present at the expected size.
function downloadQacIfNeeded() {
  if (fs.existsSync(QAC_TXT_PATH)) {
    const size = fs.statSync(QAC_TXT_PATH).size;
    if (size === EXPECTED_QAC_SIZE_BYTES) {
      console.log(
        `QAC already cached at ${path.relative(process.cwd(), QAC_TXT_PATH)} (${size} bytes), skipping download.`,
      );
      return;
    }
    console.log(
      `Cached QAC has unexpected size ${size} (expected ${EXPECTED_QAC_SIZE_BYTES}), re-downloading.`,
    );
  }

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  console.log(`Downloading QAC tarball from ${QAC_URL}...`);
  execSync(`curl -sL -o "${TARBALL_PATH}" "${QAC_URL}"`, { stdio: "inherit" });
  const tarballSize = fs.statSync(TARBALL_PATH).size;
  console.log(`Downloaded ${(tarballSize / 1024 / 1024).toFixed(2)} MB.`);

  console.log("Extracting...");
  // --force-local prevents GNU tar from interpreting "C:\..." paths on
  // Windows as remote host:path syntax. No-op on macOS/Linux tarballs
  // since their paths never have colons in archive members.
  execSync(`tar --force-local -xzf "${TARBALL_PATH}" -C "${CACHE_DIR}"`, {
    stdio: "inherit",
  });

  if (!fs.existsSync(QAC_TXT_PATH)) {
    throw new Error(
      `Extraction succeeded but morphology file not found at ${QAC_TXT_PATH}`,
    );
  }
  const extractedSize = fs.statSync(QAC_TXT_PATH).size;
  if (extractedSize !== EXPECTED_QAC_SIZE_BYTES) {
    console.warn(
      `Warning: extracted file size ${extractedSize} differs from expected ${EXPECTED_QAC_SIZE_BYTES}. Continuing anyway.`,
    );
  }
  console.log(
    `Cached morphology file at ${path.relative(process.cwd(), QAC_TXT_PATH)}.`,
  );
}

// Parse a single QAC TSV data line. Returns null for header / comment /
// blank lines or for any line that doesn't conform to the (s:v:w:seg)
// LOCATION format.
//
// The FEATURES field looks like:
//   STEM|POS:N|LEM:Hamod|ROOT:Hmd|M|NOM
//   PREFIX|bi+
//   SUFFIX|...
//
// We treat the first pipe-separated token as the segment kind (STEM /
// PREFIX / SUFFIX). Only STEM segments carry a meaningful lexical root.
function parseQacLine(line) {
  if (!line || line.startsWith("#") || !line.startsWith("(")) return null;
  const parts = line.split("\t");
  if (parts.length < 4) return null;
  const [loc, form, tag, feats] = parts;
  const m = loc.match(/^\((\d+):(\d+):(\d+):(\d+)\)$/);
  if (!m) return null;

  let isStem = false;
  let root = null;
  let lemma = null;
  if (feats) {
    const tokens = feats.split("|");
    for (const f of tokens) {
      if (f === "STEM") isStem = true;
      else if (f.startsWith("ROOT:")) root = f.slice(5);
      else if (f.startsWith("LEM:")) lemma = f.slice(4);
    }
  }

  return {
    surahNumber: Number(m[1]),
    verseNumber: Number(m[2]),
    wordIndex: Number(m[3]),
    segmentIndex: Number(m[4]),
    form: form ?? "",
    tag: tag ?? "",
    isStem,
    root,
    lemma,
  };
}

// Walk every line of the QAC file, keep the STEM segment of each word
// (one per s:v:w address), and resolve its root via QAC's ROOT field or,
// when that is null, via the override table keyed on lemma.
function buildWordRootMap(qacText) {
  const map = new Map(); // "s:v:w" -> { rootBw, rootAr, source }
  let totalSegments = 0;
  let stemSegments = 0;
  let qacHits = 0;
  let overrideHits = 0;
  let nullHits = 0;

  for (const line of qacText.split("\n")) {
    const parsed = parseQacLine(line);
    if (!parsed) continue;
    totalSegments++;
    if (!parsed.isStem) continue;
    stemSegments++;

    let rootBw = parsed.root;
    let source = rootBw ? "qac" : null;

    if (!rootBw && parsed.lemma && OVERRIDES[parsed.lemma]) {
      rootBw = OVERRIDES[parsed.lemma];
      source = "override";
    }

    const key = `${parsed.surahNumber}:${parsed.verseNumber}:${parsed.wordIndex}`;
    map.set(key, {
      rootBw,
      rootAr: rootBw ? buckwalterToArabic(rootBw) : null,
      source,
    });

    if (source === "qac") qacHits++;
    else if (source === "override") overrideHits++;
    else nullHits++;
  }

  return { map, totalSegments, stemSegments, qacHits, overrideHits, nullHits };
}

function compareWordKeys(a, b) {
  const [as, av, aw] = a.split(":").map(Number);
  const [bs, bv, bw] = b.split(":").map(Number);
  return as - bs || av - bv || aw - bw;
}

function main() {
  downloadQacIfNeeded();

  console.log("\nParsing morphology file...");
  const qacText = fs.readFileSync(QAC_TXT_PATH, "utf8");
  const { map, totalSegments, stemSegments, qacHits, overrideHits, nullHits } =
    buildWordRootMap(qacText);

  // Build the output: only words WITH a resolved root are emitted, to keep
  // the file tight. Phase C-2 treats absence as "no root for this word".
  const rootsObj = {};
  const distinctRoots = new Set();
  const sortedKeys = [...map.keys()].sort(compareWordKeys);
  for (const key of sortedKeys) {
    const entry = map.get(key);
    if (!entry.rootAr) continue;
    rootsObj[key] = entry.rootAr;
    distinctRoots.add(entry.rootAr);
  }

  const output = {
    _meta: {
      source:
        "Quranic Arabic Corpus v0.4 (Leeds Univ., Kais Dukes 2011) + 6 manual overrides for Arabic proper nouns with classical triliteral roots.",
      sourceUrl: "https://corpus.quran.com",
      mirrorUsed:
        "https://github.com/cltk/arabic_morphology_quranic-corpus (snapshot of v0.4, byte-identical to upstream)",
      license:
        "GNU GPL — attribution required: cite 'Quranic Arabic Corpus' and link to http://corpus.quran.com.",
      generatedAt: new Date().toISOString(),
      totalSegments,
      stemSegments,
      totalWordsMapped: map.size,
      wordsWithRootFromQac: qacHits,
      wordsWithRootFromOverride: overrideHits,
      wordsWithoutRoot: nullHits,
      distinctRoots: distinctRoots.size,
      overrides: OVERRIDES_DOC,
    },
    roots: rootsObj,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n");

  const outputSize = fs.statSync(OUTPUT_PATH).size;
  const sizeKb = (outputSize / 1024).toFixed(1);
  console.log(
    `\nWrote ${path.relative(process.cwd(), OUTPUT_PATH)} (${sizeKb} KB).`,
  );

  // Recap
  console.log("\n=== Coverage ===");
  console.log(`Total segments parsed:       ${totalSegments}`);
  console.log(`STEM segments (one per word): ${stemSegments}`);
  console.log(`Total words mapped:          ${map.size}`);
  console.log(
    `  with root via QAC:        ${qacHits} (${((qacHits / map.size) * 100).toFixed(1)}%)`,
  );
  console.log(
    `  with root via override:   ${overrideHits} (${((overrideHits / map.size) * 100).toFixed(1)}%)`,
  );
  console.log(
    `  no root (PN/particle/etc): ${nullHits} (${((nullHits / map.size) * 100).toFixed(1)}%)`,
  );
  console.log(`Distinct Arabic roots:       ${distinctRoots.size}`);

  // Sample lookups
  console.log("\n=== Sample lookups ===");
  const samples = [
    "1:1:1",
    "1:1:2",
    "1:2:1",
    "3:144:2",
    "33:40:3",
    "47:2:9",
    "48:29:1",
    "61:6:24",
    "112:1:3",
    "106:1:2",
  ];
  for (const k of samples) {
    const r = rootsObj[k] ?? "(no root)";
    console.log(`  ${k.padEnd(10)} → ${r}`);
  }

  // Inline tests
  console.log("\n=== Inline tests ===");
  const muhammadKeys = ["3:144:2", "33:40:3", "47:2:9", "48:29:1"];
  const allMuhammadOk = muhammadKeys.every((k) => rootsObj[k] === "حمد");
  console.log(
    `${allMuhammadOk ? "✓" : "✗"} All 4 Muhammad mentions map to "حمد" (override applied)`,
  );

  const ahmadOk = rootsObj["61:6:24"] === "حمد";
  console.log(
    `${ahmadOk ? "✓" : "✗"} Ahmad (61:6) maps to "حمد" (override applied)`,
  );

  const fatihaHamdOk = rootsObj["1:2:1"] === "حمد";
  console.log(
    `${fatihaHamdOk ? "✓" : "✗"} Al-Fatiha 1:2:1 (Hamodu) maps to "حمد" (QAC native)`,
  );

  const hmdWords = Object.values(rootsObj).filter((r) => r === "حمد").length;
  console.log(
    `H-M-D family total: ${hmdWords} words (target ~67 = 63 QAC + 4 Muhammad)`,
  );

  const allTestsPassed = allMuhammadOk && ahmadOk && fatihaHamdOk;
  if (!allTestsPassed) {
    console.error("\n❌ One or more inline tests failed.");
    process.exit(1);
  }
  console.log("\n✓ All inline tests passed.");
}

main();
