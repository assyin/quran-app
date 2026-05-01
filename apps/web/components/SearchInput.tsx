import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation";

// Header entry point for the /search page. Kept intentionally minimal —
// just a locale-aware link with an icon — so the heavy MiniSearch index
// import stays gated to the /search route's bundle, not the global header.
export function SearchInput() {
  const t = useTranslations("search");

  return (
    <Link
      href="/search"
      aria-label={t("headerSearchAriaLabel")}
      className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:text-amber-300 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 transition-colors"
    >
      <SearchIcon />
    </Link>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
