"use client";

import { useLocale, useTranslations } from "next-intl";
import { LOCALES, type Locale } from "@quran/i18n";
import { usePathname, useRouter } from "../i18n/navigation";

export function LanguageSwitcher() {
  const activeLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("language");

  const switchTo = (next: Locale) => {
    if (next === activeLocale) return;
    router.replace(pathname, { locale: next });
  };

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="flex gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800"
    >
      {LOCALES.map((loc) => {
        const isActive = loc === activeLocale;
        return (
          <button
            key={loc}
            type="button"
            onClick={() => switchTo(loc)}
            aria-label={t(loc)}
            aria-current={isActive ? "true" : undefined}
            className={[
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500",
              isActive
                ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
            ].join(" ")}
          >
            {loc.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
