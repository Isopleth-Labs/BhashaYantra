export type TypingLanguageCode = "hi" | "en";
export type ProfileReadiness = "ready" | "validation";
export type LayoutVerification = "product" | "standard" | "open-source-reference" | "compatibility" | "mapping-validation" | "convention";
export type FontDelivery = "windows-system" | "optional-local";

export type ReadyTypingLayoutId =
  | "bhashayantra-smart"
  | "classic-hindi"
  | "inscript"
  | "remington-gail"
  | "remington-cbi"
  | "english-qwerty";

export type TypingLayoutId = ReadyTypingLayoutId;

export type LegacyEncodingId = "krutidev-010" | "devlys-010" | "shreelipi";
export type UnicodeDisplayFontId = "noto-devanagari" | "mangal" | "nirmala-ui" | "segoe-ui";

export interface TypingLayoutProfile {
  readonly id: TypingLayoutId;
  readonly language: TypingLanguageCode;
  readonly name: string;
  readonly readiness: ProfileReadiness;
  readonly version: number;
  readonly source: "bhashayantra" | "microsoft" | "sil";
  readonly verification: LayoutVerification;
  readonly verificationLabel: string;
  readonly referenceUrl?: string;
  readonly coverageNote: string;
}

export interface LegacyEncodingProfile {
  readonly id: LegacyEncodingId;
  readonly name: string;
  readonly readiness: ProfileReadiness;
  readonly version: number;
  readonly language: "hi";
  readonly coverage: "bidirectional" | "mapping-validation" | "variant-required";
}

export interface UnicodeDisplayFontProfile {
  readonly id: UnicodeDisplayFontId;
  readonly language: TypingLanguageCode;
  readonly name: string;
  readonly cssStack: string;
  readonly delivery: FontDelivery;
  readonly deliveryLabel: string;
  readonly referenceUrl: string;
}

export const TYPING_LAYOUT_PROFILES: readonly TypingLayoutProfile[] = [
  { id: "bhashayantra-smart", language: "hi", name: "BhashaYantra Smart", readiness: "ready", version: 1, source: "bhashayantra", verification: "product", verificationLabel: "BhashaYantra original", coverageNote: "Product-owned phonetic composition rules; not an examination keyboard standard." },
  { id: "classic-hindi", language: "hi", name: "KrutiDev 010 Keyboard (Classic)", readiness: "ready", version: 1, source: "bhashayantra", verification: "compatibility", verificationLabel: "KrutiDev compatibility", coverageNote: "Common Kruti Dev 010 key sequences with tested Unicode round trips; KrutiDev is a legacy encoding, not a Unicode keyboard standard." },
  { id: "inscript", language: "hi", name: "Devanagari INSCRIPT", readiness: "ready", version: 1, source: "microsoft", verification: "standard", verificationLabel: "BIS-standard layout", referenceUrl: "https://www.tdil-dc.in/index.php?option=com_vertical&parentid=12", coverageNote: "Base and Shift Devanagari INSCRIPT layers implemented and tested against the published standard layout." },
  { id: "remington-gail", language: "hi", name: "Remington GAIL (Unicode)", readiness: "ready", version: 2, source: "sil", verification: "open-source-reference", verificationLabel: "SIL Keyman reference", referenceUrl: "https://keyman.com/keyboards/remington_gail", coverageNote: "Unicode base and Shift behavior follows the MIT-licensed SIL Keyman reference; extended AltGr coverage is not yet complete." },
  { id: "remington-cbi", language: "hi", name: "Remington CBI (Compatibility)", readiness: "ready", version: 1, source: "microsoft", verification: "mapping-validation", verificationLabel: "Mapping validation required", coverageNote: "Core base/Shift typing works, but an authoritative public bit-for-bit CBI mapping corpus has not been located. Do not treat it as certified." },
  { id: "english-qwerty", language: "en", name: "English QWERTY", readiness: "ready", version: 1, source: "bhashayantra", verification: "convention", verificationLabel: "Standard QWERTY convention", coverageNote: "Direct English Unicode input using the host keyboard." },
] as const;

export const LEGACY_ENCODING_PROFILES: readonly LegacyEncodingProfile[] = [
  { id: "krutidev-010", name: "Kruti Dev 010", readiness: "ready", version: 1, language: "hi", coverage: "bidirectional" },
  { id: "devlys-010", name: "DevLys 010", readiness: "validation", version: 1, language: "hi", coverage: "mapping-validation" },
  { id: "shreelipi", name: "Shree-Lipi", readiness: "validation", version: 1, language: "hi", coverage: "variant-required" },
] as const;

export const READY_LEGACY_ENCODING_PROFILES = LEGACY_ENCODING_PROFILES.filter(
  (profile) => profile.readiness === "ready",
);

export const UNICODE_DISPLAY_FONTS: readonly UnicodeDisplayFontProfile[] = [
  { id: "noto-devanagari", language: "hi", name: "Noto Sans Devanagari", cssStack: '"Noto Sans Devanagari", "Nirmala UI", Mangal, sans-serif', delivery: "optional-local", deliveryLabel: "Uses local font; otherwise Nirmala/Mangal fallback", referenceUrl: "https://fonts.google.com/noto/specimen/Noto+Sans+Devanagari" },
  { id: "mangal", language: "hi", name: "Mangal", cssStack: 'Mangal, "Nirmala UI", "Noto Sans Devanagari", sans-serif', delivery: "windows-system", deliveryLabel: "Microsoft Windows/Office font when installed", referenceUrl: "https://learn.microsoft.com/en-in/typography/font-list/mangal" },
  { id: "nirmala-ui", language: "hi", name: "Nirmala UI", cssStack: '"Nirmala UI", "Noto Sans Devanagari", Mangal, sans-serif', delivery: "windows-system", deliveryLabel: "Microsoft Windows system font", referenceUrl: "https://learn.microsoft.com/en-us/typography/font-list/nirmala-ui" },
  { id: "segoe-ui", language: "en", name: "Segoe UI", cssStack: '"Segoe UI", Inter, system-ui, sans-serif', delivery: "windows-system", deliveryLabel: "Microsoft Windows system font", referenceUrl: "https://learn.microsoft.com/en-us/typography/font-list/segoe-ui" },
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

export function getTypingLayoutProfile(id: TypingLayoutId) {
  return TYPING_LAYOUT_PROFILES.find((profile) => profile.id === id) ?? TYPING_LAYOUT_PROFILES[0];
}
