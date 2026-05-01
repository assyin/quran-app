// Cookie-backed user preferences. Shared constants are the single source of
// truth so server components (reading via next/headers) and client toggles
// (reading/writing via document.cookie) always agree on cookie names and
// allowed values.

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Surah page display mode. Read server-side (in [slug]/page.tsx) to decide
// which view to render, and toggled client-side via DisplayModeToggle which
// then triggers router.refresh() to re-fetch with the new mode.
export const COOKIE_DISPLAY_MODE = "surah-display-mode";
// "mushaf-paginated" is a navigation shortcut, not a per-page render mode:
// the toggle button for it routes to /[locale]/mushaf/{firstPage} instead of
// re-rendering the surah page. It still appears in the whitelist so cookie
// reads accept it without falling back, but the surah page treats anything
// other than "mushaf" as the verses view.
export const DISPLAY_MODES = ["verses", "mushaf", "mushaf-paginated"] as const;
export type DisplayMode = (typeof DISPLAY_MODES)[number];
export const DEFAULT_DISPLAY_MODE: DisplayMode = "verses";

// Mushaf paginated mode theme. Default is "cream" — the print-faithful
// look — so existing visitors keep their current experience. "dark" is
// an alternative consistent with the rest of the app for night reading.
export const COOKIE_MUSHAF_THEME = "mushaf-theme";
export const MUSHAF_THEMES = ["cream", "dark"] as const;
export type MushafTheme = (typeof MUSHAF_THEMES)[number];
export const DEFAULT_MUSHAF_THEME: MushafTheme = "cream";

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
