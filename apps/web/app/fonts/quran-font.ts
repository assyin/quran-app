import localFont from "next/font/local";

// KFGQPC Quranic font used to render the Arabic Uthmani rasm. See
// apps/web/public/fonts/quran/README.md for sources and license details.
//
// Active font: UthmanicHafs-V20.woff2 (UthmanicHafs v20, KFGQPC)
//   - Closest to the Mushaf of Medina house style. TTF upstream converted to
//     WOFF2 locally (lossless sfnt repackage).
//
// Rollback paths (one-line swap):
//   - To UthmanTN1 Ver10:   src: "../../public/fonts/quran/UthmanTN1-Ver10.woff2"
//   - To UthmanicHafs Ver09: src: "../../public/fonts/quran/UthmanicHafs1-Ver09.woff2"
// All three files are kept on disk.
export const quranFont = localFont({
  src: "../../public/fonts/quran/UthmanicHafs-V20.woff2",
  display: "swap",
  variable: "--font-quran",
  weight: "400",
  style: "normal",
});
