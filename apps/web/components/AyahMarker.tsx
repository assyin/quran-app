import { useTranslations } from "next-intl";
import type { Locale } from "@quran/i18n";
import { toArabicNumerals } from "../lib/arabic-numerals";

type AyahMarkerProps = {
  number: number;
  locale: Locale;
};

// Eight-pointed star path inscribed in a 40x40 viewBox. The marker frame
// (viewBox + container size) grows from 36 to 40 px when verse numbers
// reach three digits so the inner glyph stays readable without overflowing
// the star.
const STAR_PATH =
  "M20 4 L24 9 L31 6 L29 13 L36 16 L31 20 L36 24 L29 27 L31 34 L24 31 L20 36 L16 31 L9 34 L11 27 L4 24 L9 20 L4 16 L11 13 L9 6 L16 9 Z";

export function AyahMarker({ number, locale }: AyahMarkerProps) {
  const t = useTranslations("surah");
  const isThreeDigit = number >= 100;
  const size = isThreeDigit ? 40 : 36;
  const fontSize = isThreeDigit ? 12 : 13;
  const label = locale === "ar" ? toArabicNumerals(number) : String(number);

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
        {/* Subtle inner circle for depth */}
        <circle
          cx="20"
          cy="20"
          r="11"
          stroke="#FCD34D"
          strokeWidth="0.6"
          opacity="0.5"
          fill="none"
        />
        {/* Eight-pointed star outline */}
        <path
          d={STAR_PATH}
          stroke="#FCD34D"
          strokeWidth="0.8"
          fill="none"
        />
        <text
          x="20"
          y="20"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#FCD34D"
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
