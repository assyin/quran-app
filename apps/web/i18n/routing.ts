import { defineRouting } from "next-intl/routing";
import { DEFAULT_LOCALE, LOCALES } from "@quran/i18n";

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localeDetection: true,
});
