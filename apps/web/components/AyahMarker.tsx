import { useTranslations } from "next-intl";
import type { Locale } from "@quran/i18n";
import { toArabicNumerals } from "../lib/arabic-numerals";

// "dark" — amber-300 ink for use on a dark background (verses pages, etc).
// "light" — amber-700 ink for use on the cream Mushaf paper background.
type AyahMarkerVariant = "dark" | "light";

type AyahMarkerProps = {
  number: number;
  locale: Locale;
  variant?: AyahMarkerVariant;
};

// Eight-pointed star path inscribed in a 40x40 viewBox. The marker frame
// (viewBox + container size) grows from 36 to 40 px when verse numbers
// reach three digits so the inner glyph stays readable without overflowing
// the star.
const STAR_PATH =
  "M20 4 L24 9 L31 6 L29 13 L36 16 L31 20 L36 24 L29 27 L31 34 L24 31 L20 36 L16 31 L9 34 L11 27 L4 24 L9 20 L4 16 L11 13 L9 6 L16 9 Z";

const COLORS: Record<AyahMarkerVariant, string> = {
  dark: "#FCD34D", // amber-300 — for dark site background
  light: "#B45309", // amber-700 — for cream Mushaf paper background
};

export function AyahMarker({
  number,
  locale,
  variant = "dark",
}: AyahMarkerProps) {
  const t = useTranslations("surah");
  const isThreeDigit = number >= 100;
  const size = isThreeDigit ? 40 : 36;
  const fontSize = isThreeDigit ? 12 : 13;
  const label = locale === "ar" ? toArabicNumerals(number) : String(number);
  const ink = COLORS[variant];

  return (
    <span
      className="inline-block align-middle"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${t("verse")} ${number}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="20"
          cy="20"
          r="11"
          stroke={ink}
          strokeWidth="0.6"
          opacity="0.5"
          fill="none"
        />
        <path d={STAR_PATH} stroke={ink} strokeWidth="0.8" fill="none" />
        <text
          x="20"
          y="20"
          textAnchor="middle"
          dominantBaseline="central"
          fill={ink}
          fontSize={fontSize}
          fontWeight="500"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {label}
        </text>
      </svg>
    </span>
  );
}
