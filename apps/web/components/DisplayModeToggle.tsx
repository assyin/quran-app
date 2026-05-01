"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getFirstPageOfSurah } from "@quran/data";
import { useRouter } from "../i18n/navigation";
import {
  COOKIE_DISPLAY_MODE,
  DEFAULT_DISPLAY_MODE,
  DISPLAY_MODES,
  type DisplayMode,
  getPreference,
  setPreference,
} from "../lib/preferences";

type DisplayModeToggleProps = {
  surahNumber: number;
};

export function DisplayModeToggle({ surahNumber }: DisplayModeToggleProps) {
  const t = useTranslations("surah");
  const router = useRouter();

  // Mirrors the cookie value. The actual rendering is driven server-side from
  // the same cookie, so the visual state of the buttons may briefly disagree
  // with the rendered surah right after a switch — router.refresh() resolves
  // that on the next paint. Note: only "verses" and "mushaf" are ever
  // persisted; "mushaf-paginated" is a navigation shortcut so the third
  // button is never shown as pressed on the surah page.
  const [mode, setMode] = useState<DisplayMode>(DEFAULT_DISPLAY_MODE);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const stored = getPreference(
      COOKIE_DISPLAY_MODE,
      DISPLAY_MODES,
      DEFAULT_DISPLAY_MODE,
    );
    setMode(stored === "mushaf-paginated" ? DEFAULT_DISPLAY_MODE : stored);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const onSelectInline = (next: Exclude<DisplayMode, "mushaf-paginated">) => {
    if (next === mode) return;
    setPreference(COOKIE_DISPLAY_MODE, next);
    setMode(next);
    // Trigger a server-side re-render so page.tsx re-reads the cookie and
    // ships the correct view markup. No full reload — just RSC refetch.
    router.refresh();
  };

  const onSelectPaginated = () => {
    // The paginated Mushaf lives at a different route. We don't persist this
    // choice to the cookie because that would force a redirect every time the
    // user returns to a surah page — annoying. The third button is a one-shot
    // jump into the Mushaf at the page where this surah starts.
    const firstPage = getFirstPageOfSurah(surahNumber);
    if (firstPage === null) return;
    router.push(`/mushaf/${firstPage}`);
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
        onClick={() => onSelectInline("verses")}
        aria-pressed={mode === "verses"}
        className={buttonClass(mode === "verses")}
      >
        <VersesIcon />
        <span>{t("displayMode.verses")}</span>
      </button>
      <button
        type="button"
        onClick={() => onSelectInline("mushaf")}
        aria-pressed={mode === "mushaf"}
        className={buttonClass(mode === "mushaf")}
      >
        <MushafIcon />
        <span>{t("displayMode.mushaf")}</span>
      </button>
      <button
        type="button"
        onClick={onSelectPaginated}
        aria-pressed={false}
        className={buttonClass(false)}
      >
        <MushafPaginatedIcon />
        <span>{t("displayMode.mushafPaginated")}</span>
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

// Open book: two facing pages with a central spine. Distinguishes the
// paginated Mushaf (page-by-page navigation) from the continuous "mushaf"
// mode which is conceptually a single document.
function MushafPaginatedIcon() {
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
      <path d="M2 5c2.5-1 5-1 7 0v14c-2-1-4.5-1-7 0z" />
      <path d="M22 5c-2.5-1-5-1-7 0v14c2-1 4.5-1 7 0z" />
      <line x1="12" y1="6" x2="12" y2="19" />
    </svg>
  );
}
