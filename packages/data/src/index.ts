import type {
  Surah,
  SurahMetadata,
  Verse,
  VerseTranslation,
  Translator,
} from "@quran/core";
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
export const HAFS_VERSES = hafsText.verses as unknown as HafsVerse[];
export const FR_HAMIDULLAH_TRANSLATIONS =
  frHamidullah.translations as unknown as TranslationEntry[];
export const EN_SAHIH_TRANSLATIONS =
  enSahihInternational.translations as unknown as TranslationEntry[];
export const TRANSLATORS = translators.translators as unknown as Translator[];

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
