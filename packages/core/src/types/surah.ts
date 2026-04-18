import type { Verse } from "./verse";

export type RevelationType = "meccan" | "medinan";

// Positional footprint of a surah across juz/hizb/page boundaries.
export interface SurahPosition {
  juz: number[];
  hizb: number[];
  page: number[];
}

// Translated surah names (Arabic and transliterated names live on SurahMetadata itself).
export interface SurahNames {
  fr: string;
  en: string;
}

// A surah without its verses, suitable for navigation, listings and search.
export interface SurahMetadata {
  number: number;
  slug: string;
  nameArabic: string;
  nameTransliterated: string;
  nameTranslations: SurahNames;
  revelationType: RevelationType;
  verseCount: number;
  position: SurahPosition;
}

// A fully-loaded surah with its verses.
export interface Surah extends SurahMetadata {
  verses: Verse[];
}
