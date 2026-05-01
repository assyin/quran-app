import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import type { Locale } from "@quran/i18n";
import { routing } from "./routing";

type MessageBundle = {
  common: Record<string, unknown>;
  home: Record<string, unknown>;
  surah: Record<string, unknown>;
  quranIndex: Record<string, unknown>;
  about: Record<string, unknown>;
  mushaf: Record<string, unknown>;
};

const loaders: Record<Locale, () => Promise<MessageBundle>> = {
  ar: async () => ({
    common: (await import("@quran/i18n/locales/ar/common.json")).default,
    home: (await import("@quran/i18n/locales/ar/home.json")).default,
    surah: (await import("@quran/i18n/locales/ar/surah.json")).default,
    quranIndex: (await import("@quran/i18n/locales/ar/quran-index.json"))
      .default,
    about: (await import("@quran/i18n/locales/ar/about.json")).default,
    mushaf: (await import("@quran/i18n/locales/ar/mushaf.json")).default,
  }),
  fr: async () => ({
    common: (await import("@quran/i18n/locales/fr/common.json")).default,
    home: (await import("@quran/i18n/locales/fr/home.json")).default,
    surah: (await import("@quran/i18n/locales/fr/surah.json")).default,
    quranIndex: (await import("@quran/i18n/locales/fr/quran-index.json"))
      .default,
    about: (await import("@quran/i18n/locales/fr/about.json")).default,
    mushaf: (await import("@quran/i18n/locales/fr/mushaf.json")).default,
  }),
  en: async () => ({
    common: (await import("@quran/i18n/locales/en/common.json")).default,
    home: (await import("@quran/i18n/locales/en/home.json")).default,
    surah: (await import("@quran/i18n/locales/en/surah.json")).default,
    quranIndex: (await import("@quran/i18n/locales/en/quran-index.json"))
      .default,
    about: (await import("@quran/i18n/locales/en/about.json")).default,
    mushaf: (await import("@quran/i18n/locales/en/mushaf.json")).default,
  }),
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const { common, home, surah, quranIndex, about, mushaf } =
    await loaders[locale]();

  return {
    locale,
    messages: {
      ...common,
      home,
      surah,
      quranIndex,
      about,
      mushaf,
    },
  };
});
