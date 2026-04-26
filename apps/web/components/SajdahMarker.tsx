import { useTranslations } from "next-intl";

// U+06E9 ARABIC PLACE OF SAJDAH — the canonical Unicode glyph for prostration
// places in printed Mushafs. Rendered in amber to match the rest of the
// scriptural ornamentation.
const SAJDAH_GLYPH = "۩";

export function SajdahMarker() {
  const t = useTranslations("surah");
  const label = t("sajdah.label");
  const tooltip = t("sajdah.tooltip");

  return (
    <span
      title={tooltip}
      aria-label={tooltip}
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 align-middle text-[11px] font-medium"
      style={{
        backgroundColor: "rgba(252, 211, 77, 0.15)",
        borderColor: "rgba(252, 211, 77, 0.4)",
        color: "#FCD34D",
      }}
    >
      <span aria-hidden="true" className="font-quran text-base leading-none">
        {SAJDAH_GLYPH}
      </span>
      <span>{label}</span>
    </span>
  );
}
