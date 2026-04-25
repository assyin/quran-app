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
      className="flex gap-0.5 rounded-md bg-white/5 p-1"
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
              "px-2 py-0.5 rounded text-xs font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300",
              isActive
                ? "bg-amber-300/15 text-amber-300"
                : "text-gray-500 hover:text-gray-200",
            ].join(" ")}
          >
            {loc.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
