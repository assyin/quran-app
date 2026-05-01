import type { MushafPageMapping, MushafPagesData } from "@quran/core";
import hafsData from "../quran/text/hafs.json";
import data from "../quran/pages/mushaf-pages.json";

const MUSHAF_DATA = data as unknown as MushafPagesData;

// Indexed verse lookup for the page renderer: given a "S:V" key, returns the
// canonical Arabic text + sajda flag in O(1). Built once at module load.
type HafsVerseRow = {
  id: string;
  surahNumber: number;
  verseNumber: number;
  text: string;
  meta: { juz: number; hizb: number; page: number; ruku: number; sajda: boolean };
};
const HAFS_BY_KEY = new Map<string, HafsVerseRow>(
  (hafsData.verses as unknown as HafsVerseRow[]).map((v) => [v.id, v]),
);

export interface MushafVerseText {
  surahNumber: number;
  verseNumber: number;
  text: string;
  isSajda: boolean;
}

export function getMushafVerseText(
  surahNumber: number,
  verseNumber: number,
): MushafVerseText | null {
  const v = HAFS_BY_KEY.get(`${surahNumber}:${verseNumber}`);
  if (!v) return null;
  return {
    surahNumber: v.surahNumber,
    verseNumber: v.verseNumber,
    text: v.text,
    isSajda: v.meta.sajda,
  };
}

export const TOTAL_MUSHAF_PAGES = 604;

// Indexed lookup tables built once at module load. The page-by-number map
// gives O(1) navigation; the verse-to-page map gives O(1) "where in the
// Mushaf is this ayah" without scanning the 6236-verse list each call.
const PAGES_BY_NUMBER = new Map<number, MushafPageMapping>(
  MUSHAF_DATA.pages.map((p) => [p.pageNumber, p]),
);

const VERSE_TO_PAGE = new Map<string, number>();
for (const page of MUSHAF_DATA.pages) {
  for (const v of page.verses) {
    VERSE_TO_PAGE.set(`${v.surahNumber}:${v.verseNumber}`, page.pageNumber);
  }
}

export function getMushafPageMapping(
  pageNumber: number,
): MushafPageMapping | null {
  return PAGES_BY_NUMBER.get(pageNumber) ?? null;
}

// Returns the page number that contains a given verse, or null if the
// verse coordinates don't match any indexed verse.
export function findPageForVerse(
  surahNumber: number,
  verseNumber: number,
): number | null {
  return VERSE_TO_PAGE.get(`${surahNumber}:${verseNumber}`) ?? null;
}

// Returns the page where a surah starts (page of its first verse).
// Useful for "switch to paginated mode at this surah" navigation.
export function getFirstPageOfSurah(surahNumber: number): number | null {
  return findPageForVerse(surahNumber, 1);
}
