// Cookie-backed user preferences. Shared constants are the single source of
// truth so server components (reading via next/headers) and client toggles
// (reading/writing via document.cookie) always agree on cookie names and
// allowed values.

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Surah page display mode. Read server-side (in [slug]/page.tsx) to decide
// which view to render, and toggled client-side via DisplayModeToggle which
// then triggers router.refresh() to re-fetch with the new mode.
export const COOKIE_DISPLAY_MODE = "surah-display-mode";
export const DISPLAY_MODES = ["verses", "mushaf"] as const;
export type DisplayMode = (typeof DISPLAY_MODES)[number];
export const DEFAULT_DISPLAY_MODE: DisplayMode = "verses";

export function getPreference<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  if (typeof document === "undefined") return fallback;

  const prefix = `${encodeURIComponent(key)}=`;
  const cookies = document.cookie.split(";");
  for (const raw of cookies) {
    const trimmed = raw.trim();
    if (trimmed.startsWith(prefix)) {
      const value = decodeURIComponent(trimmed.slice(prefix.length));
      if ((allowed as readonly string[]).includes(value)) return value as T;
      return fallback;
    }
  }
  return fallback;
}

export function setPreference(key: string, value: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(
    value,
  )}; max-age=${ONE_YEAR_SECONDS}; path=/; SameSite=Lax`;
}
