import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NavLinks } from "./NavLinks";
import { SearchInput } from "./SearchInput";

export function Header() {
  const t = useTranslations("brand");

  return (
    <header className="sticky top-0 z-50 h-14 backdrop-blur-md bg-gray-900/80 border-b border-white/5">
      <div className="h-full max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 rounded-sm"
          aria-label={t("name")}
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-amber-900"
          >
            <BookOpenIcon />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-base font-medium text-white">{t("name")}</span>
            <span
              dir="rtl"
              lang="ar"
              className="text-[10px] text-gray-500 mt-0.5"
            >
              {t("tagline")}
            </span>
          </span>
        </Link>

        <NavLinks />

        <div className="flex items-center gap-2">
          <SearchInput />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}

function BookOpenIcon() {
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
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
