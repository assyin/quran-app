export type Locale = "ar" | "fr" | "en";

export const LOCALES = ["ar", "fr", "en"] as const satisfies readonly Locale[];

export const DEFAULT_LOCALE: Locale = "ar";

export const RTL_LOCALES = ["ar"] as const satisfies readonly Locale[];

export function isRtlLocale(locale: Locale): boolean {
  return (RTL_LOCALES as readonly Locale[]).includes(locale);
}
