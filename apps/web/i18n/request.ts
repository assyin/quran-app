import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import type { Locale } from "@quran/i18n";
import { routing } from "./routing";

type MessageBundle = {
  common: Record<string, unknown>;
  home: Record<string, unknown>;
};

const loaders: Record<Locale, () => Promise<MessageBundle>> = {
  ar: async () => ({
    common: (await import("@quran/i18n/locales/ar/common.json")).default,
    home: (await import("@quran/i18n/locales/ar/home.json")).default,
  }),
  fr: async () => ({
    common: (await import("@quran/i18n/locales/fr/common.json")).default,
    home: (await import("@quran/i18n/locales/fr/home.json")).default,
  }),
  en: async () => ({
    common: (await import("@quran/i18n/locales/en/common.json")).default,
    home: (await import("@quran/i18n/locales/en/home.json")).default,
  }),
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const { common, home } = await loaders[locale]();

  return {
    locale,
    messages: {
      ...common,
      home,
    },
  };
});
