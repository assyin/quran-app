# Quran Font — KFGQPC lineage

## Files in this directory

| File | Status | Size | Format | Family |
|---|---|---:|---|---|
| `UthmanicHafs-V20.woff2` | **Active (2026-04-18)** | 105 184 bytes | WOFF2 (TTF→WOFF2 repackage) | UthmanicHafs v20 |
| `UthmanTN1-Ver10.woff2` | Kept for A/B test | 68 528 bytes | WOFF2 (native upstream) | Uthman Taha Naskh |
| `UthmanicHafs1-Ver09.woff2` | Rollback | 91 792 bytes | WOFF2 (native upstream) | UthmanicHafs Ver09 |

## Active font: UthmanTN1 Ver10

- **Designer:** Uthman Taha, master calligrapher of the modern Mushaf of Medina.
- **Upstream source:** [nuqayah/qpc-fonts — various-woff2/UthmanTN1 Ver10.woff2](https://github.com/nuqayah/qpc-fonts/blob/master/various-woff2/UthmanTN1%20Ver10.woff2)
- **Downloaded via jsDelivr on 2026-04-18:**
  `https://cdn.jsdelivr.net/gh/nuqayah/qpc-fonts@master/various-woff2/UthmanTN1%20Ver10.woff2`
- **Why this font:** ships natively as WOFF2 (no TTF repackage), Ver10 (newer than Ver09), same KFGQPC authoring authority. Tried because UthmanicHafs V20 did not fully resolve the visual gap between U+08F0 (Open Fathatan) and the following silent letter on some words in Al-Baqara.
- **Style note:** UthmanTN is in the **Naskh** style, not the strict Mushaf-of-Medina hand; both are authentic Uthmani script from the same calligrapher. If this font renders the Quranic marks correctly but feels typographically different from the Mushaf, the rollback paths below let us reverse.

## Rollback instructions

Edit `apps/web/app/fonts/quran-font.ts` and replace the active `src` line with one of:

```ts
// Back to UthmanicHafs V20 (closer to Mushaf Medina style, TTF→WOFF2 repackage):
src: "../../public/fonts/quran/UthmanicHafs-V20.woff2",

// Back to UthmanicHafs Ver09 (original integration, pre-U+08F0 glyph support):
src: "../../public/fonts/quran/UthmanicHafs1-Ver09.woff2",
```

All three files stay on disk; no redownload.

## Previous rollback files (kept on disk)

### UthmanicHafs V20

- **Upstream source:** [nuqayah/qpc-fonts — mushaf-v4-hafs/uthmanic_hafs_v20.ttf](https://github.com/nuqayah/qpc-fonts/blob/master/mushaf-v4-hafs/uthmanic_hafs_v20.ttf)
- **Downloaded 2026-04-18** then converted TTF → WOFF2 locally using `ttf2woff2` (lossless sfnt repackage, no glyph/table alteration).

### UthmanicHafs Ver09

- **Upstream source:** [nuqayah/qpc-fonts — various-woff2/UthmanicHafs1 Ver09.woff2](https://github.com/nuqayah/qpc-fonts/blob/master/various-woff2/UthmanicHafs1%20Ver09.woff2)
- **Downloaded 2026-04-18.** Integrated originally but does not ship glyphs for the Unicode 9.0+ Open Tanwin code points (U+08F0 / U+08F1 / U+08F2).

## License (applies to all three files)

Copyrighted by the **King Fahd Glorious Quran Printing Complex (KFGQPC)**,
Al-Madinah Munawarrah, Kingdom of Saudi Arabia.

Official license page: <http://dm.qurancomplex.gov.sa/copyright-2/>

Summary:

- Permission is granted free of cost to **use, copy and distribute** the fonts.
- The fonts **cannot be sold, modified, altered, translated, reverse engineered,
  decompiled, disassembled or reproduced**.
- WOFF2 repackaging of a TTF is a format-level conversion (lossless repackage
  of the sfnt container), not a modification of the font data.
- The fonts remain under KFGQPC terms; the surrounding project code stays
  under AGPL-3.0.

## Usage in this project

Used exclusively to render the Quranic text in its authentic Uthmani rasm.
The files are shipped unmodified other than the TTF → WOFF2 repackage noted
above for the V20 rollback file.

See `apps/web/app/fonts/quran-font.ts` for the `next/font/local` binding and
`.font-quran` in `apps/web/app/globals.css` for the CSS utility.
