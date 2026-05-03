// Subpath export of the offline-built surface→root map. Imported by
// apps/web/lib/search.ts as `@quran/data/qac-surface-roots` so the ~400 KB
// JSON only enters bundles that actually use root-mode search, not the
// surah reading pages.
//
// Source: packages/data/quran/search/qac-surface-to-root.json, generated
// by build-search-fields.mjs from QAC v0.4 (academic dataset) plus the
// 6 manual overrides for proper nouns. Each key is a normalized Arabic
// surface form (post normalizeArabicForSearch); each value is the
// canonical Arabic root (e.g. "حمد", "رحم").
//
// Regenerate with:
//   node packages/data/scripts/import-qac.mjs
//   node packages/data/scripts/build-search-fields.mjs

import data from "../quran/search/qac-surface-to-root.json";

interface QacSurfaceFile {
  _meta: {
    generatedAt: string;
    totalEntries: number;
    surfaceCollisions: number;
    source: string;
    purpose: string;
  };
  map: Record<string, string>;
}

const file = data as QacSurfaceFile;

const SURFACE_TO_ROOT_MAP = new Map<string, string>(Object.entries(file.map));

// Look up the QAC-derived Arabic root for an already-normalized surface
// form. Returns null when the form is absent from the corpus mapping —
// callers should fall back to the heuristic extractRoot in that case.
//
// The input MUST already have gone through normalizeArabicForSearch
// (harakat stripped, ya/alef-maksura unified, etc.) — the map keys are
// stored in that same normalized shape.
export function getQacRoot(normalizedSurface: string): string | null {
  if (!normalizedSurface) return null;
  return SURFACE_TO_ROOT_MAP.get(normalizedSurface) ?? null;
}

export const QAC_VOCABULARY_SIZE = SURFACE_TO_ROOT_MAP.size;
