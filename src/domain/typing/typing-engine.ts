import { convertText } from "@/domain/conversion/convert-text";
import {
  directLayoutToUnicode,
  englishQwertyToUnicode,
  INSCRIPT_KEY_MAP,
  remingtonCbiToUnicode,
  unicodeToDirectLayout,
  unicodeToRemingtonCbi,
} from "@/domain/typing/direct-layout-engine";
import { smartPhoneticToUnicode } from "@/domain/typing/smart-phonetic-engine";
import type { ReadyTypingLayoutId } from "@/domain/typing/typing-profiles";

export type { ReadyTypingLayoutId, TypingLayoutId } from "@/domain/typing/typing-profiles";

export type TypingMode = "simple" | "advanced";
export type TypingOutputMode = "unicode" | "legacy";

export interface ShortcutDefinition {
  readonly id: string;
  readonly character: string;
  readonly key: string;
  readonly ctrl: boolean;
  readonly alt: boolean;
  readonly shift: boolean;
  readonly builtIn: boolean;
  readonly layoutId?: ReadyTypingLayoutId;
}

export interface CustomKeyMapping {
  readonly id: string;
  readonly key: string;
  readonly output: string;
  readonly layoutId?: ReadyTypingLayoutId;
}

export interface KeyboardKey {
  readonly key: string;
  readonly label: string;
  readonly shiftKey?: string;
  readonly shiftLabel?: string;
  readonly width?: "wide" | "space";
}

export const DEFAULT_SHORTCUTS: readonly ShortcutDefinition[] = [
  { id: "builtin-ksh", character: "क्ष", key: "k", ctrl: true, alt: true, shift: false, builtIn: true },
  { id: "builtin-tra", character: "त्र", key: "t", ctrl: true, alt: true, shift: false, builtIn: true },
  { id: "builtin-gya", character: "ज्ञ", key: "g", ctrl: true, alt: true, shift: false, builtIn: true },
  { id: "builtin-shra", character: "श्र", key: "s", ctrl: true, alt: true, shift: false, builtIn: true },
] as const;

export const CLASSIC_HINDI_KEYBOARD: readonly (readonly KeyboardKey[])[] = [
  [
    { key: "`", label: "ृ", shiftKey: "~", shiftLabel: "्" },
    { key: "1", label: "१", shiftKey: "!", shiftLabel: "!" },
    { key: "2", label: "२", shiftKey: "@", shiftLabel: "@" },
    { key: "3", label: "३", shiftKey: "#", shiftLabel: "#" },
    { key: "4", label: "४", shiftKey: "$", shiftLabel: "$" },
    { key: "5", label: "५", shiftKey: "%", shiftLabel: "ः" },
    { key: "6", label: "६", shiftKey: "^", shiftLabel: "^" },
    { key: "7", label: "७", shiftKey: "&", shiftLabel: "&" },
    { key: "8", label: "८", shiftKey: "*", shiftLabel: "*" },
    { key: "9", label: "९", shiftKey: "(", shiftLabel: "(" },
    { key: "0", label: "०", shiftKey: ")", shiftLabel: ")" },
    { key: "-", label: "-", shiftKey: "_", shiftLabel: "_" },
    { key: "=", label: "त्र", shiftKey: "+", shiftLabel: "+" },
  ],
  [
    { key: "q", label: "ु", shiftKey: "Q", shiftLabel: "फ" },
    { key: "w", label: "ू", shiftKey: "W", shiftLabel: "ॅ" },
    { key: "e", label: "म", shiftKey: "E", shiftLabel: "E" },
    { key: "r", label: "त", shiftKey: "R", shiftLabel: "R" },
    { key: "t", label: "ज", shiftKey: "T", shiftLabel: "झ्" },
    { key: "y", label: "ल", shiftKey: "Y", shiftLabel: "Y" },
    { key: "u", label: "न", shiftKey: "U", shiftLabel: "ं" },
    { key: "i", label: "प", shiftKey: "I", shiftLabel: "I" },
    { key: "o", label: "व", shiftKey: "O", shiftLabel: "O" },
    { key: "p", label: "च", shiftKey: "P", shiftLabel: "छ्" },
    { key: "[", label: "ख्", shiftKey: "{", shiftLabel: "क्ष्" },
    { key: "]", label: "]", shiftKey: "}", shiftLabel: "}" },
    { key: "\\", label: "?", shiftKey: "|", shiftLabel: "|" },
  ],
  [
    { key: "a", label: "ं", shiftKey: "A", shiftLabel: "।" },
    { key: "s", label: "े", shiftKey: "S", shiftLabel: "ै" },
    { key: "d", label: "क", shiftKey: "D", shiftLabel: "D" },
    { key: "f", label: "ि", shiftKey: "F", shiftLabel: "थ्" },
    { key: "g", label: "ह", shiftKey: "G", shiftLabel: "G" },
    { key: "h", label: "ी", shiftKey: "H", shiftLabel: "भ्" },
    { key: "j", label: "र", shiftKey: "J", shiftLabel: "श्र" },
    { key: "k", label: "ा", shiftKey: "K", shiftLabel: "ज्ञ" },
    { key: "l", label: "स", shiftKey: "L", shiftLabel: "L" },
    { key: ";", label: "य", shiftKey: ":", shiftLabel: ":" },
    { key: "'", label: "श्", shiftKey: "\"", shiftLabel: "ष्" },
  ],
  [
    { key: "z", label: "्र", shiftKey: "Z", shiftLabel: "रेफ" },
    { key: "x", label: "ग", shiftKey: "X", shiftLabel: "X" },
    { key: "c", label: "ब", shiftKey: "C", shiftLabel: "C" },
    { key: "v", label: "अ", shiftKey: "V", shiftLabel: "ट" },
    { key: "b", label: "इ", shiftKey: "B", shiftLabel: "ठ" },
    { key: "n", label: "द", shiftKey: "N", shiftLabel: "N" },
    { key: "m", label: "उ", shiftKey: "M", shiftLabel: "ड" },
    { key: ",", label: "ए", shiftKey: "<", shiftLabel: "ढ" },
    { key: ".", label: "ण्", shiftKey: ">", shiftLabel: "ञ" },
    { key: "/", label: "ध्", shiftKey: "?", shiftLabel: "घ्" },
  ],
  [{ key: " ", label: "स्पेस", width: "space" }],
] as const;

export const BHASHAYANTRA_SMART_KEYBOARD: readonly (readonly KeyboardKey[])[] = [
  [
    { key: "1", label: "1" }, { key: "2", label: "2" }, { key: "3", label: "3" },
    { key: "4", label: "4" }, { key: "5", label: "5" }, { key: "6", label: "6" },
    { key: "7", label: "7" }, { key: "8", label: "8" }, { key: "9", label: "9" },
    { key: "0", label: "0" },
  ],
  [
    { key: "q", label: "क़" }, { key: "w", label: "व" }, { key: "e", label: "ए" },
    { key: "r", label: "र" }, { key: "t", label: "त", shiftKey: "T", shiftLabel: "ट" },
    { key: "y", label: "य" }, { key: "u", label: "उ" }, { key: "i", label: "इ" },
    { key: "o", label: "ओ" }, { key: "p", label: "प" },
  ],
  [
    { key: "a", label: "अ/आ" }, { key: "s", label: "स/श" },
    { key: "d", label: "द", shiftKey: "D", shiftLabel: "ड" }, { key: "f", label: "फ" },
    { key: "g", label: "ग" }, { key: "h", label: "ह" }, { key: "j", label: "ज" },
    { key: "k", label: "क" }, { key: "l", label: "ल" },
  ],
  [
    { key: "z", label: "ज़" }, { key: "x", label: "क्ष" }, { key: "c", label: "च" },
    { key: "v", label: "व" }, { key: "b", label: "ब/भ" },
    { key: "n", label: "न", shiftKey: "N", shiftLabel: "ण" }, { key: "m", label: "म" },
  ],
  [{ key: " ", label: "स्पेस", width: "space" }],
] as const;

export const INSCRIPT_KEYBOARD: readonly (readonly KeyboardKey[])[] = [
  [
    { key: "1", label: "1" }, { key: "2", label: "2" }, { key: "3", label: "3" },
    { key: "4", label: "4" }, { key: "5", label: "5" }, { key: "6", label: "6" },
    { key: "7", label: "7" }, { key: "8", label: "8" }, { key: "9", label: "9" },
    { key: "0", label: "0" }, { key: "-", label: "-" }, { key: "=", label: "ृ", shiftKey: "+", shiftLabel: "ऋ" },
  ],
  [
    { key: "q", label: "ौ", shiftKey: "Q", shiftLabel: "औ" }, { key: "w", label: "ै", shiftKey: "W", shiftLabel: "ऐ" },
    { key: "e", label: "ा", shiftKey: "E", shiftLabel: "आ" }, { key: "r", label: "ी", shiftKey: "R", shiftLabel: "ई" },
    { key: "t", label: "ू", shiftKey: "T", shiftLabel: "ऊ" }, { key: "y", label: "ब", shiftKey: "Y", shiftLabel: "भ" },
    { key: "u", label: "ह", shiftKey: "U", shiftLabel: "ङ" }, { key: "i", label: "ग", shiftKey: "I", shiftLabel: "घ" },
    { key: "o", label: "द", shiftKey: "O", shiftLabel: "ध" }, { key: "p", label: "ज", shiftKey: "P", shiftLabel: "झ" },
    { key: "[", label: "ड", shiftKey: "{", shiftLabel: "ढ" }, { key: "]", label: "़", shiftKey: "}", shiftLabel: "ञ" },
  ],
  [
    { key: "a", label: "ो", shiftKey: "A", shiftLabel: "ओ" }, { key: "s", label: "े", shiftKey: "S", shiftLabel: "ए" },
    { key: "d", label: "्", shiftKey: "D", shiftLabel: "अ" }, { key: "f", label: "ि", shiftKey: "F", shiftLabel: "इ" },
    { key: "g", label: "ु", shiftKey: "G", shiftLabel: "उ" }, { key: "h", label: "प", shiftKey: "H", shiftLabel: "फ" },
    { key: "j", label: "र", shiftKey: "J", shiftLabel: "ऱ" }, { key: "k", label: "क", shiftKey: "K", shiftLabel: "ख" },
    { key: "l", label: "त", shiftKey: "L", shiftLabel: "थ" }, { key: ";", label: "च", shiftKey: ":", shiftLabel: "छ" },
    { key: "'", label: "ट", shiftKey: "\"", shiftLabel: "ठ" },
  ],
  [
    { key: "x", label: "ं", shiftKey: "X", shiftLabel: "ँ" }, { key: "c", label: "म", shiftKey: "C", shiftLabel: "ण" },
    { key: "v", label: "न" }, { key: "b", label: "व" },
    { key: "n", label: "ल", shiftKey: "N", shiftLabel: "ळ" }, { key: "m", label: "स", shiftKey: "M", shiftLabel: "श" },
    { key: ",", label: ",", shiftKey: "<", shiftLabel: "ष" }, { key: ".", label: ".", shiftKey: ">", shiftLabel: "।" },
    { key: "/", label: "य", shiftKey: "?", shiftLabel: "य़" },
  ],
  [{ key: " ", label: "स्पेस", width: "space" }],
] as const;

export const REMINGTON_KEYBOARD: readonly (readonly KeyboardKey[])[] = [
  [
    { key: "`", label: "़", shiftKey: "~", shiftLabel: "द्य" },
    { key: "1", label: "1", shiftKey: "!", shiftLabel: "।" },
    { key: "2", label: "2", shiftKey: "@", shiftLabel: "/" },
    { key: "3", label: "3", shiftKey: "#", shiftLabel: "ः" },
    { key: "4", label: "4", shiftKey: "$", shiftLabel: "*" },
    { key: "5", label: "5", shiftKey: "%", shiftLabel: "-" },
    { key: "6", label: "6", shiftKey: "^", shiftLabel: "‘" },
    { key: "7", label: "7", shiftKey: "&", shiftLabel: "’" },
    { key: "8", label: "8", shiftKey: "*", shiftLabel: "द्ध" },
    { key: "9", label: "9", shiftKey: "(", shiftLabel: "त्र" },
    { key: "0", label: "0", shiftKey: ")", shiftLabel: "ऋ" },
    { key: "-", label: ";", shiftKey: "_", shiftLabel: "." },
    { key: "=", label: "ृ", shiftKey: "+", shiftLabel: "्" },
  ],
  [
    { key: "q", label: "ु", shiftKey: "Q", shiftLabel: "फ" },
    { key: "w", label: "ू", shiftKey: "W", shiftLabel: "ॅ" },
    { key: "e", label: "म", shiftKey: "E", shiftLabel: "म्" },
    { key: "r", label: "त", shiftKey: "R", shiftLabel: "त्" },
    { key: "t", label: "ज", shiftKey: "T", shiftLabel: "ज्" },
    { key: "y", label: "ल", shiftKey: "Y", shiftLabel: "ल्" },
    { key: "u", label: "न", shiftKey: "U", shiftLabel: "न्" },
    { key: "i", label: "प", shiftKey: "I", shiftLabel: "प्" },
    { key: "o", label: "व", shiftKey: "O", shiftLabel: "व्" },
    { key: "p", label: "च", shiftKey: "P", shiftLabel: "च्" },
    { key: "[", label: "ख्", shiftKey: "{", shiftLabel: "क्ष्" },
    { key: "]", label: ",", shiftKey: "}", shiftLabel: "द्व" },
    { key: "\\", label: "(", shiftKey: "|", shiftLabel: ")" },
  ],
  [
    { key: "a", label: "ं", shiftKey: "A", shiftLabel: "ा" },
    { key: "s", label: "े", shiftKey: "S", shiftLabel: "ै" },
    { key: "d", label: "क", shiftKey: "D", shiftLabel: "क्" },
    { key: "f", label: "ि", shiftKey: "F", shiftLabel: "थ्" },
    { key: "g", label: "ह", shiftKey: "G", shiftLabel: "ळ" },
    { key: "h", label: "ी", shiftKey: "H", shiftLabel: "भ्" },
    { key: "j", label: "र", shiftKey: "J", shiftLabel: "श्र" },
    { key: "k", label: "ा", shiftKey: "K", shiftLabel: "ज्ञ" },
    { key: "l", label: "स", shiftKey: "L", shiftLabel: "स्" },
    { key: ";", label: "य", shiftKey: ":", shiftLabel: "रू" },
    { key: "'", label: "श्", shiftKey: "\"", shiftLabel: "ष्" },
  ],
  [
    { key: "z", label: "्र", shiftKey: "Z", shiftLabel: "र्" },
    { key: "x", label: "ग", shiftKey: "X", shiftLabel: "ग्" },
    { key: "c", label: "ब", shiftKey: "C", shiftLabel: "ब्" },
    { key: "v", label: "अ", shiftKey: "V", shiftLabel: "ट" },
    { key: "b", label: "इ", shiftKey: "B", shiftLabel: "ठ" },
    { key: "n", label: "द", shiftKey: "N", shiftLabel: "छ" },
    { key: "m", label: "उ", shiftKey: "M", shiftLabel: "ड" },
    { key: ",", label: "ए", shiftKey: "<", shiftLabel: "ढ" },
    { key: ".", label: "ण्", shiftKey: ">", shiftLabel: "झ" },
    { key: "/", label: "ध्", shiftKey: "?", shiftLabel: "घ्" },
  ],
  [{ key: " ", label: "स्पेस", width: "space" }],
] as const;

export const ENGLISH_QWERTY_KEYBOARD: readonly (readonly KeyboardKey[])[] = [
  [
    { key: "1", label: "1", shiftKey: "!", shiftLabel: "!" }, { key: "2", label: "2", shiftKey: "@", shiftLabel: "@" },
    { key: "3", label: "3", shiftKey: "#", shiftLabel: "#" }, { key: "4", label: "4", shiftKey: "$", shiftLabel: "$" },
    { key: "5", label: "5", shiftKey: "%", shiftLabel: "%" }, { key: "6", label: "6", shiftKey: "^", shiftLabel: "^" },
    { key: "7", label: "7", shiftKey: "&", shiftLabel: "&" }, { key: "8", label: "8", shiftKey: "*", shiftLabel: "*" },
    { key: "9", label: "9", shiftKey: "(", shiftLabel: "(" }, { key: "0", label: "0", shiftKey: ")", shiftLabel: ")" },
  ],
  "qwertyuiop".split("").map((key) => ({ key, label: key.toLocaleUpperCase(), shiftKey: key.toLocaleUpperCase(), shiftLabel: key.toLocaleUpperCase() })),
  "asdfghjkl".split("").map((key) => ({ key, label: key.toLocaleUpperCase(), shiftKey: key.toLocaleUpperCase(), shiftLabel: key.toLocaleUpperCase() })),
  "zxcvbnm".split("").map((key) => ({ key, label: key.toLocaleUpperCase(), shiftKey: key.toLocaleUpperCase(), shiftLabel: key.toLocaleUpperCase() })),
  [{ key: " ", label: "Space", width: "space" }],
] as const;

export function formatShortcut(shortcut: ShortcutDefinition) {
  return [
    shortcut.ctrl ? "Ctrl" : "",
    shortcut.alt ? "Alt" : "",
    shortcut.shift ? "Shift" : "",
    shortcut.key.toLocaleUpperCase(),
  ]
    .filter(Boolean)
    .join(" + ");
}

export function shortcutSignature(shortcut: Pick<ShortcutDefinition, "key" | "ctrl" | "alt" | "shift">) {
  return `${shortcut.ctrl ? "1" : "0"}:${shortcut.alt ? "1" : "0"}:${shortcut.shift ? "1" : "0"}:${shortcut.key.toLocaleLowerCase()}`;
}

export function findMatchingShortcut(
  event: Pick<KeyboardEvent, "key" | "ctrlKey" | "altKey" | "shiftKey">,
  shortcuts: readonly ShortcutDefinition[],
) {
  return shortcuts.find(
    (shortcut) =>
      shortcut.key.toLocaleLowerCase() === event.key.toLocaleLowerCase() &&
      shortcut.ctrl === event.ctrlKey &&
      shortcut.alt === event.altKey &&
      shortcut.shift === event.shiftKey,
  );
}

export function hasShortcutConflict(
  candidate: Pick<ShortcutDefinition, "key" | "ctrl" | "alt" | "shift">,
  shortcuts: readonly ShortcutDefinition[],
  ignoredId?: string,
) {
  const signature = shortcutSignature(candidate);
  return shortcuts.some(
    (shortcut) => shortcut.id !== ignoredId && shortcutSignature(shortcut) === signature,
  );
}

export function hasKeyMappingConflict(
  key: string,
  mappings: readonly CustomKeyMapping[],
  ignoredId?: string,
) {
  const normalizedKey = key.toLocaleLowerCase();
  return mappings.some(
    (mapping) => mapping.id !== ignoredId && mapping.key.toLocaleLowerCase() === normalizedKey,
  );
}

export function insertAtSelection(
  value: string,
  insertion: string,
  selectionStart: number,
  selectionEnd: number,
) {
  const nextValue = `${value.slice(0, selectionStart)}${insertion}${value.slice(selectionEnd)}`;
  return { value: nextValue, caret: selectionStart + insertion.length };
}

export function unicodeToTypingKeys(unicode: string) {
  return convertText(unicode, "unicode-to-legacy");
}

export function typingKeysToUnicode(legacy: string) {
  return convertText(legacy, "legacy-to-unicode");
}

export function typingSourceToUnicode(source: string, layout: ReadyTypingLayoutId) {
  if (layout === "bhashayantra-smart") return smartPhoneticToUnicode(source);
  if (layout === "classic-hindi" || layout === "remington-gail") return typingKeysToUnicode(source);
  if (layout === "remington-cbi") return remingtonCbiToUnicode(source);
  if (layout === "inscript") return directLayoutToUnicode(source, INSCRIPT_KEY_MAP);
  return englishQwertyToUnicode(source);
}

export function unicodeToTypingSource(unicode: string, layout: ReadyTypingLayoutId) {
  if (layout === "classic-hindi" || layout === "remington-gail") return unicodeToTypingKeys(unicode);
  if (layout === "remington-cbi") return unicodeToRemingtonCbi(unicode);
  if (layout === "inscript") return unicodeToDirectLayout(unicode, INSCRIPT_KEY_MAP);
  return englishQwertyToUnicode(unicode);
}

export function keyboardForLayout(layout: ReadyTypingLayoutId) {
  if (layout === "bhashayantra-smart") return BHASHAYANTRA_SMART_KEYBOARD;
  if (layout === "classic-hindi") return CLASSIC_HINDI_KEYBOARD;
  if (layout === "remington-gail" || layout === "remington-cbi") return REMINGTON_KEYBOARD;
  if (layout === "inscript") return INSCRIPT_KEYBOARD;
  return ENGLISH_QWERTY_KEYBOARD;
}

export function getTypingMetrics(value: string) {
  const normalized = value.normalize("NFC");
  const characters = Array.from(normalized).length;
  const words = normalized.trim() ? normalized.trim().split(/\s+/u).length : 0;
  const lines = normalized ? normalized.split("\n").length : 1;
  return { characters, words, lines };
}
