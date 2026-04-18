import type { Verse, VerseTranslation } from "@quran/core";
import type { Locale } from "@quran/i18n";

// Returns the appropriate translation for a verse given the active UI locale.
// Returns null when the active locale is Arabic (no translation needed) or when
// the expected translation for that locale is not yet populated in the data.
export function getTranslationForLocale(
  verse: Verse,
  locale: Locale,
): VerseTranslation | null {
  if (locale === "ar") return null;
  if (locale === "fr") return verse.translations["fr-hamidullah"] ?? null;
  if (locale === "en") return verse.translations["en-sahih-international"] ?? null;
  return null;
}
