// Subpath export of the offline-built search index. Imported by
// apps/web/lib/search.ts as `@quran/data/search-index` so that the
// 6 MB JSON payload only enters bundles that actually search, never
// the surah reading pages that already load enough.
//
// Regenerate with: node packages/data/scripts/build-search-fields.mjs

import data from "../quran/search-index.json";

export interface SearchIndexVerse {
  id: string;
  surahNumber: number;
  verseNumber: number;
  textArabic: string;
  textArabicSimple: string;
  // Same as textArabicSimple but augmented with prefix-stripped variants
  // for clitic-prefixed words (وَمُوسَىٰ → also moves through "موسى"). Phrase
  // mode searches this; exact mode keeps using the strict bare form.
  textArabicExpanded: string;
  textRoot: string;
  textFr: string;
  textFrNormalized: string;
  textEn: string;
  textEnNormalized: string;
}

export interface SearchIndexFile {
  _meta: {
    generatedAt: string;
    totalVerses: number;
    normalizationVersion: string;
    rootHeuristicVersion?: string;
    normalizationMirror: string;
  };
  verses: SearchIndexVerse[];
}

export default data as SearchIndexFile;
