"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  COOKIE_DISPLAY_MODE,
  DEFAULT_DISPLAY_MODE,
  DISPLAY_MODES,
  type DisplayMode,
  getPreference,
  setPreference,
} from "../lib/preferences";

export function DisplayModeToggle() {
  const t = useTranslations("surah");
  const router = useRouter();

  // Mirrors the cookie value. The actual rendering is driven server-side from
  // the same cookie, so the visual state of the buttons may briefly disagree
  // with the rendered surah right after a switch — router.refresh() resolves
  // that on the next paint.
  const [mode, setMode] = useState<DisplayMode>(DEFAULT_DISPLAY_MODE);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setMode(
      getPreference(COOKIE_DISPLAY_MODE, DISPLAY_MODES, DEFAULT_DISPLAY_MODE),
    );
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const onSelect = (next: DisplayMode) => {
    if (next === mode) return;
    setPreference(COOKIE_DISPLAY_MODE, next);
    setMode(next);
    // Trigger a server-side re-render so page.tsx re-reads the cookie and
    // ships the correct view markup. No full reload — just RSC refetch.
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
      aria-label={t("displayMode.label")}
      className="inline-flex gap-1 rounded-md bg-gray-800 p-1"
    >
      <button
        type="button"
        onClick={() => onSelect("verses")}
        aria-pressed={mode === "verses"}
        className={buttonClass(mode === "verses")}
      >
        <VersesIcon />
        <span>{t("displayMode.verses")}</span>
      </button>
      <button
        type="button"
        onClick={() => onSelect("mushaf")}
        aria-pressed={mode === "mushaf"}
        className={buttonClass(mode === "mushaf")}
      >
        <MushafIcon />
        <span>{t("displayMode.mushaf")}</span>
      </button>
    </div>
  );
}

function VersesIcon() {
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
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function MushafIcon() {
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
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="14" y2="17" />
    </svg>
  );
}
