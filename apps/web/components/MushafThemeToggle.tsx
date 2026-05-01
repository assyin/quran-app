"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  COOKIE_MUSHAF_THEME,
  DEFAULT_MUSHAF_THEME,
  MUSHAF_THEMES,
  type MushafTheme,
  getPreference,
  setPreference,
} from "../lib/preferences";

// Theme switcher for the paginated Mushaf view. Mirrors the
// DisplayModeToggle pattern: cookie-backed, server-rendering driven, with
// router.refresh() so the new theme markup arrives without a full page
// reload. The default stays "cream" so existing visitors keep their
// print-faithful look.
export function MushafThemeToggle() {
  const t = useTranslations("mushaf");
  const router = useRouter();

  const [theme, setTheme] = useState<MushafTheme>(DEFAULT_MUSHAF_THEME);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setTheme(
      getPreference(COOKIE_MUSHAF_THEME, MUSHAF_THEMES, DEFAULT_MUSHAF_THEME),
    );
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const onSelect = (next: MushafTheme) => {
    if (next === theme) return;
    setPreference(COOKIE_MUSHAF_THEME, next);
    setTheme(next);
    router.refresh();
  };

  const buttonClass = (active: boolean) =>
    `inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors ${
      active
        ? "bg-amber-300 text-amber-900"
        : "bg-transparent text-gray-400 hover:text-gray-200"
    }`;

  return (
    <div
      role="group"
      aria-label={t("theme.label")}
      className="inline-flex gap-1 rounded-md bg-gray-800 p-1"
    >
      <button
        type="button"
        onClick={() => onSelect("cream")}
        aria-pressed={theme === "cream"}
        className={buttonClass(theme === "cream")}
      >
        <PaperIcon />
        <span>{t("theme.cream")}</span>
      </button>
      <button
        type="button"
        onClick={() => onSelect("dark")}
        aria-pressed={theme === "dark"}
        className={buttonClass(theme === "dark")}
      >
        <MoonIcon />
        <span>{t("theme.dark")}</span>
      </button>
    </div>
  );
}

function PaperIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
