import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { type Locale } from "@quran/i18n";
import { routing } from "../../../i18n/routing";

const GITHUB_URL = "https://github.com/assyin/quran-app";
const QURAN_5_32_PARTIAL = "وَمَنْ أَحْيَاهَا فَكَأَنَّمَا أَحْيَا النَّاسَ جَمِيعًا";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AboutView locale={locale as Locale} />;
}

function AboutView({ locale }: { locale: Locale }) {
  const t = useTranslations("about");
  const quoteTranslation = t("quote.translation");

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-3">
        {t("eyebrow")}
      </p>
      <h1 className="text-3xl md:text-4xl text-amber-300 mb-12 leading-tight">
        {t("title")}
      </h1>

      <Section
        title={t("sections.mission.title")}
        body={t("sections.mission.body")}
      />
      <Section
        title={t("sections.authenticity.title")}
        body={t("sections.authenticity.body")}
      />
      <Section
        title={t("sections.translations.title")}
        body={t("sections.translations.body")}
      />
      <Section
        title={t("sections.openSource.title")}
        body={t("sections.openSource.body")}
      >
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-amber-300 hover:underline mt-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 rounded-sm"
        >
          <span>{t("sections.openSource.link")}</span>
          <ExternalLinkIcon />
        </a>
      </Section>

      <blockquote className="mt-16 pt-8 border-t border-white/5 text-center">
        <p
          dir="rtl"
          lang="ar"
          className="font-quran text-2xl md:text-3xl text-amber-300 leading-loose mb-3"
        >
          {QURAN_5_32_PARTIAL}
        </p>
        {quoteTranslation && (
          <p className="text-sm text-gray-400 italic">{quoteTranslation}</p>
        )}
        <p className="text-xs text-gray-500 mt-3">— {locale === "ar" ? "المائدة ٥:٣٢" : "Al-Maida 5:32"}</p>
      </blockquote>
    </main>
  );
}

type SectionProps = {
  title: string;
  body: string;
  children?: React.ReactNode;
};

function Section({ title, body, children }: SectionProps) {
  return (
    <section className="mb-10">
      <h2 className="text-xl text-white mb-3">{title}</h2>
      <p className="text-gray-400 leading-relaxed">{body}</p>
      {children}
    </section>
  );
}

function ExternalLinkIcon() {
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
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
