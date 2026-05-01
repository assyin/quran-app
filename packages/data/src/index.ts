import type {
  Surah,
  SurahMetadata,
  Verse,
  VerseTranslation,
  Translator,
} from "@quran/core";

export * from "./mushaf-pages";
import surahsMetadata from "../quran/metadata/surahs.json";
import hafsText from "../quran/text/hafs.json";
import frHamidullah from "../quran/translations/fr-hamidullah.json";
import enSahihInternational from "../quran/translations/en-sahih-international.json";
import translators from "../common/translators.json";

type HafsVerse = {
  id: string;
  surahNumber: number;
  verseNumber: number;
  text: string;
  meta: {
    juz: number;
    hizb: number;
    page: number;
    ruku: number;
    sajda: boolean;
  };
};

type TranslationEntry = {
  verseId: string;
  text: string;
};

export const SURAHS_METADATA = surahsMetadata as unknown as SurahMetadata[];

const SURAHS_BY_NUMBER = new Map<number, SurahMetadata>(
  SURAHS_METADATA.map((s) => [s.number, s]),
);

export function getSurahByNumber(num: number): SurahMetadata | null {
  return SURAHS_BY_NUMBER.get(num) ?? null;
}

export const HAFS_VERSES = hafsText.verses as unknown as HafsVerse[];
export const FR_HAMIDULLAH_TRANSLATIONS =
  frHamidullah.translations as unknown as TranslationEntry[];
export const EN_SAHIH_TRANSLATIONS =
  enSahihInternational.translations as unknown as TranslationEntry[];
export const TRANSLATORS = translators.translators as unknown as Translator[];

// Returns the surrounding surahs (by canonical number) for a given slug, useful
// for prev/next navigation between surah pages. Either neighbor is null at the
// boundaries (1 has no previous, 114 has no next) and `current` is null when
// the slug is unknown.
export function getSurahNeighbors(slug: string): {
  previous: SurahMetadata | null;
  current: SurahMetadata | null;
  next: SurahMetadata | null;
} {
  const current = SURAHS_METADATA.find((s) => s.slug === slug) ?? null;
  if (!current) return { previous: null, current: null, next: null };
  const previous =
    SURAHS_METADATA.find((s) => s.number === current.number - 1) ?? null;
  const next =
    SURAHS_METADATA.find((s) => s.number === current.number + 1) ?? null;
  return { previous, current, next };
}

// Build a fully-assembled Surah by slug. Only Al-Fatiha is populated in the MVP;
// returns null when the slug is unknown or no verses are available yet.
export function getSurahBySlug(slug: string): Surah | null {
  const metadata = SURAHS_METADATA.find((s) => s.slug === slug);
  if (!metadata) return null;

  const verses: Verse[] = HAFS_VERSES.filter(
    (v) => v.surahNumber === metadata.number,
  ).map((v) => {
    const frTranslation = FR_HAMIDULLAH_TRANSLATIONS.find(
      (t) => t.verseId === v.id,
    );
    const enTranslation = EN_SAHIH_TRANSLATIONS.find(
      (t) => t.verseId === v.id,
    );

    const translations: Record<string, VerseTranslation> = {};
    if (frTranslation) {
      translations["fr-hamidullah"] = {
        language: "fr",
        translator: "hamidullah",
        text: frTranslation.text,
      };
    }
    if (enTranslation) {
      translations["en-sahih-international"] = {
        language: "en",
        translator: "sahih-international",
        text: enTranslation.text,
      };
    }

    return {
      id: v.id,
      surahNumber: v.surahNumber,
      verseNumber: v.verseNumber,
      textArabic: { hafs: v.text },
      translations,
      meta: v.meta,
    };
  });

  return { ...metadata, verses };
}

// A verse paired with the number under which it should be displayed in the UI.
// For most surahs the display number equals the verse's canonical verseNumber,
// but for Al-Fatiha the numbering is shifted by one because verse 1:1 (the
// Bismillah) is pulled out and shown as a header instead of a numbered verse.
export type DisplayVerse = {
  verse: Verse;
  displayNumber: number;
};

// Result of applying the Bismillah convention to a surah, ready for rendering.
// `bismillah` holds the Arabic text to render as a header block, or null when
// the surah has no Bismillah header (At-Tawbah).
export type SurahDisplay = {
  bismillah: string | null;
  displayVerses: DisplayVerse[];
};

// Resolves Bismillah handling per traditional Uthmani convention:
//   - Surah 1 (Al-Fatiha): verse 1:1 IS the Bismillah and counts as verse 1 of
//     the surah. It is extracted from the verse list and shown as a header,
//     and the remaining 6 verses are displayed numbered 1 through 6.
//   - Surah 9 (At-Tawbah): has NO Bismillah at all. All verses are rendered
//     as-is with no header block.
//   - All other surahs: the Bismillah is a universal surah separator that is
//     NOT counted among the surah's verses. Its text is pulled from Al-Fatiha
//     1:1 as the single source of truth to guarantee character-identical
//     rendering across the whole Mushaf, and all verses are displayed under
//     their canonical verseNumber.
export function getSurahDisplay(surah: Surah): SurahDisplay {
  if (surah.number === 1) {
    const [first, ...rest] = surah.verses;
    if (!first) {
      return { bismillah: null, displayVerses: [] };
    }
    return {
      bismillah: first.textArabic.hafs ?? null,
      displayVerses: rest.map((verse, i) => ({
        verse,
        displayNumber: i + 1,
      })),
    };
  }

  if (surah.number === 9) {
    return {
      bismillah: null,
      displayVerses: surah.verses.map((verse) => ({
        verse,
        displayNumber: verse.verseNumber,
      })),
    };
  }

  const fatiha = getSurahBySlug("al-fatiha");
  const bismillah = fatiha?.verses[0]?.textArabic.hafs ?? null;
  return {
    bismillah,
    displayVerses: surah.verses.map((verse) => ({
      verse,
      displayNumber: verse.verseNumber,
    })),
  };
}
