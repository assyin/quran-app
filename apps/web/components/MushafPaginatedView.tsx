import { Fragment } from "react";
import { useTranslations } from "next-intl";
import type { MushafPageMapping } from "@quran/core";
import {
  SURAHS_METADATA,
  getMushafVerseText,
  getSurahBySlug,
} from "@quran/data";
import type { Locale } from "@quran/i18n";
import { toArabicNumerals } from "../lib/arabic-numerals";
import type { MushafTheme } from "../lib/preferences";
import { renderQuranicTextWithWaqf } from "../lib/quran-text";
import { isSajdahVerse } from "../lib/sajdah";
import { AyahMarker } from "./AyahMarker";
import { SajdahMarker } from "./SajdahMarker";

type MushafPaginatedViewProps = {
  page: MushafPageMapping;
  locale: Locale;
  theme: MushafTheme;
};

// One Mushaf page rendered into a cream-paper frame, faithful to the
// printed Mushaf chrome but using our existing Unicode/KFGQPC pipeline
// underneath. Verses are joined to their text from hafs.json and grouped
// by surah so transition pages (51 of them across the 604) get the right
// surah header in the right place.
//
// Design choice: the cream background stays light even when the rest of
// the app is in dark mode — the printed Mushaf is always cream paper, and
// matching that is the whole point of "paginated" mode.
export function MushafPaginatedView({
  page,
  locale,
  theme,
}: MushafPaginatedViewProps) {
  const tMushaf = useTranslations("mushaf");

  const groups = groupVersesBySurah(page);

  // Pull the canonical Bismillah text from Al-Fatiha verse 1:1 (the same
  // single source of truth our other view uses) so injected Bismillah lines
  // are character-identical to the in-text ayah.
  const fatiha = getSurahBySlug("al-fatiha");
  const bismillahText = fatiha?.verses[0]?.textArabic.hafs ?? null;

  // The AyahMarker rosette ink follows the frame theme: amber-700 on cream
  // paper for legibility, amber-300 on the dark frame to match the rest of
  // the app's accents.
  const markerVariant = theme === "cream" ? "light" : "dark";

  return (
    <article
      className="mushaf-paginated-frame"
      data-theme={theme}
      dir="rtl"
    >
      <PageHeader page={page} firstSurah={groups[0]?.surahNumber} locale={locale} />

      <div className="mushaf-paginated-content">
        {groups.map((group, gi) => (
          <SurahGroup
            key={`${group.surahNumber}-${gi}`}
            group={group}
            // First-verse-on-page test marks where to insert the ornamental
            // surah-name banner (and the Bismillah for non-Fatiha, non-Tawba
            // surahs that begin on this page).
            startsHere={group.verses[0]?.verseNumber === 1}
            bismillahText={bismillahText}
            locale={locale}
            markerVariant={markerVariant}
          />
        ))}
      </div>

      <PageFooter pageNumber={page.pageNumber} locale={locale} tLabel={tMushaf("page")} />
    </article>
  );
}

// --- Grouping ---------------------------------------------------------

type SurahGroupData = {
  surahNumber: number;
  verses: NonNullable<ReturnType<typeof getMushafVerseText>>[];
};

function groupVersesBySurah(page: MushafPageMapping): SurahGroupData[] {
  const groups: SurahGroupData[] = [];
  for (const ref of page.verses) {
    const verse = getMushafVerseText(ref.surahNumber, ref.verseNumber);
    if (!verse) continue;
    const last = groups[groups.length - 1];
    if (last && last.surahNumber === verse.surahNumber) {
      last.verses.push(verse);
    } else {
      groups.push({ surahNumber: verse.surahNumber, verses: [verse] });
    }
  }
  return groups;
}

// --- Page chrome -----------------------------------------------------

const SURAH_BY_NUMBER = new Map(
  SURAHS_METADATA.map((s) => [s.number, s] as const),
);

function PageHeader({
  page,
  firstSurah,
  locale,
}: {
  page: MushafPageMapping;
  firstSurah: number | undefined;
  locale: Locale;
}) {
  const tMushaf = useTranslations("mushaf");
  const surah = firstSurah ? SURAH_BY_NUMBER.get(firstSurah) : null;
  const juzNumber =
    locale === "ar" ? toArabicNumerals(page.juzNumber) : String(page.juzNumber);
  const hizbNumber =
    locale === "ar"
      ? toArabicNumerals(page.hizbNumber)
      : String(page.hizbNumber);

  return (
    <header className="mushaf-paginated-header">
      {surah && (
        <span className="font-quran text-xl">سُورَةُ {surah.nameArabic}</span>
      )}
      <span className="text-xs italic">
        {tMushaf("juz")} {juzNumber} · {tMushaf("hizb")} {hizbNumber}
      </span>
    </header>
  );
}

function PageFooter({
  pageNumber,
  locale,
  tLabel,
}: {
  pageNumber: number;
  locale: Locale;
  tLabel: string;
}) {
  const display =
    locale === "ar" ? toArabicNumerals(pageNumber) : String(pageNumber);
  return (
    <footer className="mushaf-paginated-footer">
      <span className="mushaf-paginated-page-number">
        {tLabel} {display}
      </span>
    </footer>
  );
}

// --- Surah block (header + bismillah + verses) -----------------------

function SurahGroup({
  group,
  startsHere,
  bismillahText,
  locale,
  markerVariant,
}: {
  group: SurahGroupData;
  startsHere: boolean;
  bismillahText: string | null;
  locale: Locale;
  markerVariant: "dark" | "light";
}) {
  const surah = SURAH_BY_NUMBER.get(group.surahNumber);

  // Bismillah injection rules (mirror getSurahDisplay in @quran/data):
  //   - At-Tawba (9): never has a Bismillah
  //   - Al-Fatiha (1): the Bismillah IS verse 1:1 — render it as a normal verse,
  //     no separate Bismillah block
  //   - Any other surah opening on this page: inject a Bismillah block
  const showBismillah =
    startsHere &&
    group.surahNumber !== 9 &&
    group.surahNumber !== 1 &&
    bismillahText !== null;

  return (
    <>
      {startsHere && surah && (
        <div className="mushaf-paginated-surah-banner">
          <span className="font-quran text-3xl">سُورَةُ {surah.nameArabic}</span>
        </div>
      )}

      {showBismillah && bismillahText && (
        <div className="mushaf-paginated-bismillah" lang="ar" dir="rtl">
          <span className="font-quran">
            {renderQuranicTextWithWaqf(bismillahText)}
          </span>
        </div>
      )}

      <div className="mushaf-paginated-prose" lang="ar" dir="rtl">
        {group.verses.map((v) => {
          const sajdah = isSajdahVerse(v.surahNumber, v.verseNumber);
          return (
            <Fragment key={`${v.surahNumber}-${v.verseNumber}`}>
              <span className="mushaf-paginated-verse-text">
                {renderQuranicTextWithWaqf(v.text)}
              </span>{" "}
              <span className="mushaf-paginated-marker">
                <AyahMarker
                  number={v.verseNumber}
                  locale={locale}
                  variant={markerVariant}
                />
              </span>
              {sajdah && (
                <>
                  {" "}
                  <SajdahMarker />
                </>
              )}{" "}
            </Fragment>
          );
        })}
      </div>
    </>
  );
}
