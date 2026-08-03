export type TypingLanguageCode = "hi" | "en";
export type ProfileReadiness = "ready" | "validation";

export type ReadyTypingLayoutId =
  | "bhashayantra-smart"
  | "classic-hindi"
  | "inscript"
  | "english-qwerty";

export type TypingLayoutId =
  | ReadyTypingLayoutId
  | "remington-gail"
  | "remington-cbi";

export type LegacyEncodingId = "krutidev-010" | "devlys-010" | "shreelipi";
export type UnicodeDisplayFontId = "noto-devanagari" | "mangal" | "nirmala-ui" | "segoe-ui";

export interface TypingLayoutProfile {
  readonly id: TypingLayoutId;
  readonly language: TypingLanguageCode;
  readonly name: string;
  readonly readiness: ProfileReadiness;
  readonly version: number;
  readonly source: "bhashayantra" | "microsoft" | "validation-pending";
}

export interface LegacyEncodingProfile {
  readonly id: LegacyEncodingId;
  readonly name: string;
  readonly readiness: ProfileReadiness;
  readonly version: number;
}

export interface UnicodeDisplayFontProfile {
  readonly id: UnicodeDisplayFontId;
  readonly language: TypingLanguageCode;
  readonly name: string;
  readonly cssStack: string;
}

export const TYPING_LAYOUT_PROFILES: readonly TypingLayoutProfile[] = [
  { id: "bhashayantra-smart", language: "hi", name: "BhashaYantra Smart", readiness: "ready", version: 1, source: "bhashayantra" },
  { id: "classic-hindi", language: "hi", name: "Classic Hindi / KrutiDev", readiness: "ready", version: 1, source: "bhashayantra" },
  { id: "inscript", language: "hi", name: "Devanagari INSCRIPT", readiness: "ready", version: 1, source: "microsoft" },
  { id: "remington-gail", language: "hi", name: "Remington Gail", readiness: "validation", version: 1, source: "validation-pending" },
  { id: "remington-cbi", language: "hi", name: "Remington CBI", readiness: "validation", version: 1, source: "validation-pending" },
  { id: "english-qwerty", language: "en", name: "English QWERTY", readiness: "ready", version: 1, source: "bhashayantra" },
] as const;

export const LEGACY_ENCODING_PROFILES: readonly LegacyEncodingProfile[] = [
  { id: "krutidev-010", name: "Kruti Dev 010", readiness: "ready", version: 1 },
  { id: "devlys-010", name: "DevLys 010", readiness: "validation", version: 1 },
  { id: "shreelipi", name: "Shree-Lipi", readiness: "validation", version: 1 },
] as const;

export const UNICODE_DISPLAY_FONTS: readonly UnicodeDisplayFontProfile[] = [
  { id: "noto-devanagari", language: "hi", name: "Noto Sans Devanagari", cssStack: '"Noto Sans Devanagari", "Nirmala UI", Mangal, sans-serif' },
  { id: "mangal", language: "hi", name: "Mangal", cssStack: 'Mangal, "Nirmala UI", "Noto Sans Devanagari", sans-serif' },
  { id: "nirmala-ui", language: "hi", name: "Nirmala UI", cssStack: '"Nirmala UI", "Noto Sans Devanagari", Mangal, sans-serif' },
  { id: "segoe-ui", language: "en", name: "Segoe UI", cssStack: '"Segoe UI", Inter, system-ui, sans-serif' },
] as const;

export function layoutsForLanguage(language: TypingLanguageCode) {
  return TYPING_LAYOUT_PROFILES.filter((profile) => profile.language === language);
}

export function isReadyTypingLayout(id: TypingLayoutId): id is ReadyTypingLayoutId {
  return TYPING_LAYOUT_PROFILES.some((profile) => profile.id === id && profile.readiness === "ready");
}

export function displayFontsForLanguage(language: TypingLanguageCode) {
  return UNICODE_DISPLAY_FONTS.filter((profile) => profile.language === language);
}

export function getDisplayFont(id: UnicodeDisplayFontId) {
  return UNICODE_DISPLAY_FONTS.find((profile) => profile.id === id) ?? UNICODE_DISPLAY_FONTS[0];
}
