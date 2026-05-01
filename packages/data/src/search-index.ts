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
