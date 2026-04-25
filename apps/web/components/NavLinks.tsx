"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "../i18n/navigation";

type NavItem = {
  href: "/" | "/quran" | "/about";
  labelKey: "home" | "surahs" | "about";
};

const ITEMS: NavItem[] = [
  { href: "/", labelKey: "home" },
  { href: "/quran", labelKey: "surahs" },
  { href: "/about", labelKey: "about" },
];

export function NavLinks() {
  const t = useTranslations("nav");
  // usePathname from next-intl strips the locale prefix, so "/" / "/quran" /
  // "/about" / "/surahs/al-fatiha" all map cleanly. We mark the Surahs link
  // active on any /surahs/* page too, since they're conceptually the same
  // section of the app.
  const pathname = usePathname();

  return (
    <nav className="hidden sm:flex items-center gap-6" aria-label="Main">
      {ITEMS.map(({ href, labelKey }) => {
        const isActive =
          href === "/"
            ? pathname === "/"
            : pathname === href || pathname.startsWith(`${href}/`) ||
              (href === "/quran" && pathname.startsWith("/surahs"));
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`text-sm transition-colors pb-0.5 ${
              isActive
                ? "text-amber-300 border-b border-amber-300"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
