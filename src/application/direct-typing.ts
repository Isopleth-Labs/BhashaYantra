import { invoke } from "@tauri-apps/api/core";

import {
  legacyToUnicodePairs,
  preferredUnicodeToLegacyPairs,
} from "@/domain/conversion/krutidev-map";
import {
  INSCRIPT_KEY_MAP,
  REMINGTON_GAIL_KEY_MAP,
} from "@/domain/typing/direct-layout-engine";
import { SMART_PHONETIC_DICTIONARY } from "@/domain/typing/smart-phonetic-engine";
import {
  unicodeToTypingSource,
  type CustomKeyMapping,
  type ReadyTypingLayoutId,
  type ShortcutDefinition,
  type TypingOutputMode,
} from "@/domain/typing/typing-engine";

interface DirectTypingShortcut {
  readonly key: string;
  readonly ctrl: boolean;
  readonly alt: boolean;
  readonly shift: boolean;
  readonly output: string;
}

export interface DirectTypingProfile {
  readonly layout: ReadyTypingLayoutId;
  readonly outputMode: TypingOutputMode;
  readonly smartDictionary: Readonly<Record<string, string>>;
  readonly legacyToUnicodePairs: readonly (readonly [string, string])[];
  readonly unicodeToLegacyPairs: readonly (readonly [string, string])[];
  readonly keyMap: Readonly<Record<string, string>>;
  readonly customSourceMappings: Readonly<Record<string, string>>;
  readonly shortcuts: readonly DirectTypingShortcut[];
}

export interface DirectTypingStatus {
  readonly available: boolean;
  readonly enabled: boolean;
  readonly layout: ReadyTypingLayoutId | null;
  readonly outputMode: TypingOutputMode | null;
  readonly lastError: string | null;
}

export function isDirectTypingDesktopAvailable() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function createDirectTypingProfile(
  layout: ReadyTypingLayoutId,
  outputMode: TypingOutputMode,
  customMappings: readonly CustomKeyMapping[] = [],
  shortcuts: readonly ShortcutDefinition[] = [],
): DirectTypingProfile {
  const keyMap = layout === "inscript"
    ? INSCRIPT_KEY_MAP
    : layout === "remington-gail" || layout === "remington-cbi"
      ? REMINGTON_GAIL_KEY_MAP
      : {};

  return {
    layout,
    outputMode,
    smartDictionary: SMART_PHONETIC_DICTIONARY,
    legacyToUnicodePairs,
    unicodeToLegacyPairs: preferredUnicodeToLegacyPairs,
    keyMap,
    customSourceMappings: Object.fromEntries(
      customMappings.map((mapping) => [
        mapping.key.toLocaleLowerCase(),
        unicodeToTypingSource(mapping.output, layout).output,
      ]),
    ),
    shortcuts: shortcuts.map((shortcut) => ({
      key: shortcut.key.toLocaleLowerCase(),
      ctrl: shortcut.ctrl,
      alt: shortcut.alt,
      shift: shortcut.shift,
      output: shortcut.character,
    })),
  };
}

export async function startDirectTyping(profile: DirectTypingProfile) {
  if (!isDirectTypingDesktopAvailable()) {
    throw new Error("Direct Typing is available in the Windows desktop app only.");
  }
  return invoke<DirectTypingStatus>("start_direct_typing", { profile });
}

export async function updateDirectTyping(profile: DirectTypingProfile) {
  if (!isDirectTypingDesktopAvailable()) return;
  await invoke<DirectTypingStatus>("update_direct_typing", { profile });
}

export async function stopDirectTyping() {
  if (!isDirectTypingDesktopAvailable()) return;
  await invoke<DirectTypingStatus>("stop_direct_typing");
}

export async function getDirectTypingStatus(): Promise<DirectTypingStatus> {
  if (!isDirectTypingDesktopAvailable()) {
    return {
      available: false,
      enabled: false,
      layout: null,
      outputMode: null,
      lastError: null,
    };
  }
  return invoke<DirectTypingStatus>("direct_typing_status");
}
