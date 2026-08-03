import { convertText } from "@/domain/conversion/convert-text";
import { smartPhoneticToUnicode } from "@/domain/typing/smart-phonetic-engine";

export type TypingMode = "simple" | "advanced";
export type TypingOutputMode = "unicode" | "legacy";
export type TypingLayoutId = "bhashayantra-smart" | "classic-hindi";

export interface ShortcutDefinition {
  readonly id: string;
  readonly character: string;
  readonly key: string;
  readonly ctrl: boolean;
  readonly alt: boolean;
  readonly shift: boolean;
  readonly builtIn: boolean;
}

export interface CustomKeyMapping {
  readonly id: string;
  readonly key: string;
  readonly output: string;
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

export const TYPING_LAYOUTS = [
  { id: "bhashayantra-smart", mode: "simple", name: "BhashaYantra Smart" },
  { id: "classic-hindi", mode: "advanced", name: "Classic Hindi" },
] as const satisfies readonly { readonly id: TypingLayoutId; readonly mode: TypingMode; readonly name: string }[];

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

export function typingSourceToUnicode(source: string, layout: TypingLayoutId) {
  return layout === "bhashayantra-smart"
    ? smartPhoneticToUnicode(source)
    : typingKeysToUnicode(source);
}

export function unicodeToTypingSource(unicode: string, layout: TypingLayoutId) {
  return layout === "bhashayantra-smart"
    ? { output: unicode, warnings: [] as const }
    : unicodeToTypingKeys(unicode);
}

export function keyboardForLayout(layout: TypingLayoutId) {
  return layout === "bhashayantra-smart"
    ? BHASHAYANTRA_SMART_KEYBOARD
    : CLASSIC_HINDI_KEYBOARD;
}

export function getTypingMetrics(value: string) {
  const normalized = value.normalize("NFC");
  const characters = Array.from(normalized).length;
  const words = normalized.trim() ? normalized.trim().split(/\s+/u).length : 0;
  const lines = normalized ? normalized.split("\n").length : 1;
  return { characters, words, lines };
}
