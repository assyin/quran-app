import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation";

const GITHUB_URL = "https://github.com/assyin/quran-app";

export function Footer() {
  const tBrand = useTranslations("brand");
  const t = useTranslations("footer");

  const doaTranslation = t("doaTranslation");

  return (
    <footer className="bg-gray-950 border-t border-white/5 px-4 md:px-6 py-8 md:py-10">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 self-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 rounded-sm"
              aria-label={tBrand("name")}
            >
              <span
                aria-hidden="true"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-amber-900"
              >
                <BookOpenIcon />
              </span>
              <span className="text-sm font-medium text-white">
                {tBrand("name")}
              </span>
            </Link>
            <p className="text-xs text-gray-500 leading-relaxed">
              {t("mission")}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-xs uppercase tracking-wider text-gray-400">
              {t("sources")}
            </h2>
            <ul className="flex flex-col gap-1.5 text-xs text-gray-500">
              <li>{t("sourceArabic")}</li>
              <li>{t("sourceFr")}</li>
              <li>{t("sourceEn")}</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-xs uppercase tracking-wider text-gray-400">
              {t("project")}
            </h2>
            <ul className="flex flex-col gap-1.5 text-xs text-gray-500">
              <li>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-300 transition-colors"
                >
                  {t("githubLabel")}
                </a>
              </li>
              <li>
                <a
                  href={`${GITHUB_URL}/blob/main/LICENSE`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-300 transition-colors"
                >
                  {t("licenseLabel")}
                </a>
              </li>
              <li className="text-gray-500">{t("fontLabel")}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-8 pt-6 text-center text-xs text-gray-600">
          <span dir="rtl" lang="ar" className="font-quran text-sm">
            {t("doaArabic")}
          </span>
          {doaTranslation && (
            <>
              <span aria-hidden="true" className="mx-2">
                ·
              </span>
              <span>{doaTranslation}</span>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}

function BookOpenIcon() {
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
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
