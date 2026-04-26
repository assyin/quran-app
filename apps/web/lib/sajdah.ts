// List of verses requiring (or recommending) prostration when recited or read.
// Source: traditional Sunni scholarship — 15-verse position which is the
// majority opinion. The Hanafi madhhab counts 14, excluding 38:24 which is
// considered recommended (mustahabb) rather than confirmed (sunnah mu'akkadah).
// We keep the uniform display and document the nuance in comments.
//
// The set is keyed by "{surahNumber}:{verseNumber}" using the canonical
// verse numbers (not display numbers), matching Verse.id.
export const SAJDAH_VERSES = new Set<string>([
  "7:206", // Al-A'raf (last verse)
  "13:15", // Ar-Ra'd
  "16:50", // An-Nahl
  "17:109", // Al-Isra
  "19:58", // Maryam
  "22:18", // Al-Hajj (first sajdah)
  "22:77", // Al-Hajj (second sajdah)
  "25:60", // Al-Furqan
  "27:26", // An-Naml
  "32:15", // As-Sajdah
  "38:24", // Sad (recommended sajdah, not strict in Hanafi madhhab)
  "41:38", // Fussilat
  "53:62", // An-Najm (last verse)
  "84:21", // Al-Inshiqaq
  "96:19", // Al-'Alaq (last verse)
]);

export function isSajdahVerse(
  surahNumber: number,
  verseNumber: number,
): boolean {
  return SAJDAH_VERSES.has(`${surahNumber}:${verseNumber}`);
}
