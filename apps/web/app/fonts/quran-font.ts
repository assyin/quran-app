import localFont from "next/font/local";

// KFGQPC Uthmanic Hafs — used to render Quranic text in its authentic Uthmani
// rasm. The file is shipped unmodified in apps/web/public/fonts/quran/.
// See apps/web/public/fonts/quran/README.md for source and license.
export const quranFont = localFont({
  src: "../../public/fonts/quran/UthmanicHafs1-Ver09.woff2",
  display: "swap",
  variable: "--font-quran",
  weight: "400",
  style: "normal",
});
