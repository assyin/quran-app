// Cookie-backed user preferences for the index page. We use cookies (rather
// than localStorage) so the values can be read server-side later if we ever
// want SSR-aware defaults — but for now reads happen client-side only to keep
// hydration simple.

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

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
