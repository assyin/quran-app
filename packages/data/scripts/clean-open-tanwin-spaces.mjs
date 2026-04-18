// Collapse the print-typography whitespace inserted by the Mushaf of Medina
// source between a U+08F0 ARABIC OPEN FATHATAN and the following silent letter
// (alef al-wiqâyah convention: tanwin fath + ا | و | ى).
//
// Source: fawazahmed0/quran-api (ara-quranuthmanihaf).
//
// Problem: in KFGQPC print layout the open fathatan is rendered suspended
// above the space between its base consonant and the following silent letter.
// Encoded literally in the JSON this introduces a U+0020 that breaks HTML word
// rendering (e.g. "هُدࣰ ى" split in two at the middle of the single word
// "هُدࣰى").
//
// Scope (IMPORTANT): this collapse is restricted to U+08F0 followed by ا
// (U+0627, alef) or ى (U+0649, alef maksura). These are the two silent-letter
// forms taken by the alef al-wiqâyah, and in those contexts the embedded
// U+0020 is a pure typographic artefact of the print convention.
//
// All other sibling patterns are explicitly excluded:
//   - U+08F1 OPEN DAMMATAN: always word-final in Quranic orthography (no silent
//     letter ever follows a /un/ tanwin) — trailing space is a word boundary.
//   - U+08F2 OPEN KASRATAN: same as above for /in/ tanwin.
//   - U+08F0 + و: Quranic orthography does not use a silent waw after tanwin
//     fath, so the و is always the conjunction starting a new word (e.g.
//     "بِنَآءࣰ وَأَنزَلَ" → the space is a word boundary, not an artefact).
//   - U+08F0 + anything else (consonant / hamza / etc.): word boundary.
//
// History: the first iteration used /[\u08F0\u08F1\u08F2]\s+/g which collapsed
// 225 legitimate word boundaries in Al-Baqara. The second iteration tightened
// the lookahead to [ا|و|ى] but that still misclassified 8 و-boundaries in
// Al-Baqara (verses 2:22, 2:81, 2:143, etc.). The current narrowed form
// targets ONLY the true alef al-wiqâyah contexts.
//
// Idempotent: running the script twice is a no-op.
//
// Usage:
//   node packages/data/scripts/clean-open-tanwin-spaces.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HAFS_PATH = path.resolve(__dirname, "../quran/text/hafs.json");
const PATTERN = /\u08F0\s+(?=[\u0627\u0649])/g;
const TAG = "collapsed-open-fathatan-silent-letter-spaces";

const raw = fs.readFileSync(HAFS_PATH, "utf8");
const data = JSON.parse(raw);

let totalRemoved = 0;
let versesAffected = 0;

for (const verse of data.verses) {
  const original = verse.text;
  const matches = original.match(PATTERN);
  if (!matches) continue;
  // The pattern captures U+08F0 + whitespace; the lookahead for the silent
  // letter is not captured, so replacing with the U+08F0 literal drops only
  // the whitespace and leaves the silent letter in place.
  verse.text = original.replace(PATTERN, "\u08F0");
  totalRemoved += matches.length;
  versesAffected++;
}

if (totalRemoved === 0) {
  console.log(
    "No U+08F0 + whitespace + silent-letter patterns found. File already clean — nothing written.",
  );
  process.exit(0);
}

if (!Array.isArray(data._meta.postProcessing)) {
  data._meta.postProcessing = [];
}
if (!data._meta.postProcessing.includes(TAG)) {
  data._meta.postProcessing.push(TAG);
}

fs.writeFileSync(HAFS_PATH, JSON.stringify(data, null, 2) + "\n");

console.log(
  `Collapsed ${totalRemoved} open-fathatan + silent-letter space(s) across ${versesAffected} verse(s).`,
);
console.log(`_meta.postProcessing is now: [${data._meta.postProcessing.join(", ")}]`);
