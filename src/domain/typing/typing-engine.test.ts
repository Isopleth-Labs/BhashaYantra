import { describe, expect, it } from "vitest";

import {
  DEFAULT_SHORTCUTS,
  findMatchingShortcut,
  getTypingMetrics,
  hasKeyMappingConflict,
  hasShortcutConflict,
  insertAtSelection,
  typingKeysToUnicode,
  unicodeToTypingKeys,
} from "./typing-engine";

describe("Start Typing engine", () => {
  it("produces live Unicode from familiar KrutiDev keys", () => {
    expect(typingKeysToUnicode('esjk uke Hkk"kk ;a= gS').output).toBe(
      "मेरा नाम भाषा यंत्र है",
    );
  });

  it("creates familiar key text for inserted Unicode characters", () => {
    expect(unicodeToTypingKeys("क्ष त्र ज्ञ श्र").output).toBe("{k = K J");
  });

  it("inserts text at and replaces a selection", () => {
    expect(insertAtSelection("abcd", "XY", 1, 3)).toEqual({
      value: "aXYd",
      caret: 3,
    });
  });

  it("matches exact modifier shortcuts", () => {
    expect(
      findMatchingShortcut(
        { key: "K", ctrlKey: true, altKey: true, shiftKey: false },
        DEFAULT_SHORTCUTS,
      )?.character,
    ).toBe("क्ष");
  });

  it("detects shortcut and custom mapping conflicts", () => {
    expect(
      hasShortcutConflict(
        { key: "k", ctrl: true, alt: true, shift: false },
        DEFAULT_SHORTCUTS,
      ),
    ).toBe(true);
    expect(
      hasKeyMappingConflict("q", [{ id: "one", key: "Q", output: "क" }]),
    ).toBe(true);
  });

  it("counts Unicode-aware typing metrics", () => {
    expect(getTypingMetrics("मेरा नाम\nहिंदी है")).toEqual({
      characters: 17,
      words: 4,
      lines: 2,
    });
  });
});
