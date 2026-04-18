// Qira'at identifier (Quranic reading). Multi-Qira'at is baked in from day one
// per CLAUDE.md, but only "hafs" is populated in the MVP; others come later.
export type QiraatId = "hafs" | "warsh" | "qalun" | "duri";

// Positional metadata for a verse within the Mushaf.
export interface VerseMeta {
  juz: number;
  hizb: number;
  page: number;
  ruku: number;
  sajda: boolean;
}

// Audio recitation of a verse by a given reciter under a specific Qira'at.
export interface AudioRecitation {
  url: string;
  qiraatId: QiraatId;
}

// A translation of a single verse.
export interface VerseTranslation {
  language: "fr" | "en" | "ar";
  translator: string;
  text: string;
  footnotes?: string[];
}

// A Quranic verse. Arabic text is indexed by Qira'at (partial because only
// "hafs" is shipped for the MVP); translations are indexed by "{lang}-{translator}".
export interface Verse {
  id: string;
  surahNumber: number;
  verseNumber: number;
  textArabic: Partial<Record<QiraatId, string>>;
  textArabicSimple?: string;
  translations: Record<string, VerseTranslation>;
  audio?: Record<string, AudioRecitation>;
  meta: VerseMeta;
}
