// Metadata describing a translator whose work is displayed next to the Arabic text.
export interface Translator {
  id: string;
  nameEn: string;
  nameNative?: string;
  language: "fr" | "en" | "ar";
  year?: number;
  source?: string;
}
