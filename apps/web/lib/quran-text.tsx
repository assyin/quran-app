import { Fragment, type ReactNode } from "react";

// Quranic annotation marks that benefit from distinct styling — they are
// "small high marks" rendered in superscript above the baseline. Coloring
// them mirrors the printed Mushaf of Medina convention where waqf signs
// stand out from the main text.
//
// Codepoints covered:
// - U+06D6 ARABIC SMALL HIGH LIGATURE SAD WITH LAM WITH ALEF MAKSURA (صلى)
// - U+06D7 ARABIC SMALL HIGH LIGATURE QAF WITH LAM WITH ALEF MAKSURA (قلى)
// - U+06D8 ARABIC SMALL HIGH MEEM INITIAL FORM (لازم - obligatory pause)
// - U+06D9 ARABIC SMALL HIGH LAM ALEF (لا - prohibited pause)
// - U+06DA ARABIC SMALL HIGH JEEM (ج - permissible pause)
// - U+06DB ARABIC SMALL HIGH THREE DOTS (معانقة)
// - U+06DC ARABIC SMALL HIGH SEEN (س - silent pause)
// - U+06DE ARABIC START OF RUB EL HIZB (sectional marker)
// - U+06E2 ARABIC SMALL HIGH MEEM ISOLATED FORM (iqlab marker)
//
// Two regexes: a stateless test pattern (no /g flag, safe to reuse across
// calls without lastIndex pitfalls) and a /g split pattern with a capture
// group so the waqf chars are preserved as their own array entries.
const WAQF_PATTERN = /[ۖ-ۜ۞ۢ]/;
const WAQF_SPLIT_PATTERN = /([ۖ-ۜ۞ۢ])/g;

export function renderQuranicTextWithWaqf(text: string): ReactNode[] {
  if (!text) return [];
  const parts = text.split(WAQF_SPLIT_PATTERN);
  return parts.map((part, idx) => {
    if (WAQF_PATTERN.test(part)) {
      return (
        <span key={idx} className="waqf-mark">
          {part}
        </span>
      );
    }
    // Plain text segments are wrapped in a Fragment so React gets a stable
    // keyed child without introducing extra DOM nodes.
    return <Fragment key={idx}>{part}</Fragment>;
  });
}
