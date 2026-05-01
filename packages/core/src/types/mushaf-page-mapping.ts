// Page-to-verse mapping for the standard 604-page Mushaf of Medina layout.
// This is purely positional metadata: it tells you "which verses appear on
// page N" + "which juz/hizb that page belongs to". Verse text and
// translations live elsewhere (hafs.json, fr-hamidullah.json, etc.) and
// are joined in by id at render time.

export interface MushafPageVerse {
  surahNumber: number;
  verseNumber: number;
}

export interface MushafPageMapping {
  pageNumber: number; // 1..604
  juzNumber: number; // 1..30 — value at the page's first verse
  hizbNumber: number; // 1..60 — value at the page's first verse
  verses: MushafPageVerse[]; // ordered list, in reading order
  surahsOnPage: number[]; // unique surah numbers, ascending — typically 1, occasionally 2 at transitions
}

export interface MushafPagesMeta {
  downloadedAt: string; // YYYY-MM-DD
  source: string; // upstream URL
  totalPages: number;
  totalVerses: number;
}

export interface MushafPagesData {
  _meta: MushafPagesMeta;
  pages: MushafPageMapping[];
}
