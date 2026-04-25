import { useTranslations } from "next-intl";
import { Link } from "../../i18n/navigation";

export default function Home() {
  const t = useTranslations("home");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-20 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="w-full max-w-2xl flex flex-col items-center text-center gap-8">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
          {t("title")}
        </h1>

        <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed">
          {t("subtitle")}
        </p>

        <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed">
          {t("description")}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Link
            href="/quran"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-medium transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            {t("cta.start")}
          </Link>

          <a
            href="#"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            {t("cta.discover")}
          </a>
        </div>
      </div>
    </main>
  );
}
