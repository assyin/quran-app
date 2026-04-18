// Convert a Western-Arabic numeral (0-9) to its Eastern Arabic-Indic equivalent.
// 1 -> "١", 12 -> "١٢", 27 -> "٢٧".
const DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"] as const;

export function toArabicNumerals(n: number): string {
  return String(n)
    .split("")
    .map((char) => {
      const digit = Number(char);
      if (Number.isNaN(digit)) return char;
      return DIGITS[digit] ?? char;
    })
    .join("");
}
