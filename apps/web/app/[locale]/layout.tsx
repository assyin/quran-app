import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Naskh_Arabic } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { isRtlLocale, type Locale } from "@quran/i18n";
import { routing } from "../../i18n/routing";
import { Footer } from "../../components/Footer";
import { Header } from "../../components/Header";
import { quranFont } from "../fonts/quran-font";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  variable: "--font-naskh-arabic",
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: "Quran App",
  description:
    "Free, open-source platform for the Holy Quran and the Prophetic Sunnah",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const isRtl = isRtlLocale(locale as Locale);
  const bodyFontClass = isRtl
    ? "font-[family-name:var(--font-naskh-arabic)]"
    : "font-[family-name:var(--font-geist-sans)]";

  return (
    <html
      lang={locale}
      dir={isRtl ? "rtl" : "ltr"}
      className={`dark ${geistSans.variable} ${geistMono.variable} ${notoNaskhArabic.variable} ${quranFont.variable} h-full antialiased`}
    >
      <body className={`min-h-full flex flex-col ${bodyFontClass}`}>
        <NextIntlClientProvider>
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
