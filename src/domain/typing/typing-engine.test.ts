import { describe, expect, it } from "vitest";

import {
  DEFAULT_SHORTCUTS,
  findMatchingShortcut,
  getTypingMetrics,
  hasKeyMappingConflict,
  hasShortcutConflict,
  insertAtSelection,
  typingKeysToUnicode,
  typingSourceToUnicode,
  unicodeToTypingKeys,
  unicodeToTypingSource,
} from "./typing-engine";

describe("Start Typing engine", () => {
  it("produces live Unicode from familiar KrutiDev keys", () => {
    expect(typingKeysToUnicode('esjk uke Hkk"kk ;a= gS').output).toBe(
      "मेरा नाम भाषा यंत्र है",
    );
  });

  it("routes Smart and Classic layouts through separate engines", () => {
    expect(typingSourceToUnicode("mera naam", "bhashayantra-smart").output).toBe("मेरा नाम");
    expect(typingSourceToUnicode("esjk uke", "classic-hindi").output).toBe("मेरा नाम");
    expect(unicodeToTypingSource("क्ष", "bhashayantra-smart").output).toBe("क्ष");
    expect(unicodeToTypingSource("क्ष", "classic-hindi").output).toBe("{k");
  });

  it("creates familiar key text for inserted Unicode characters", () => {
    expect(unicodeToTypingKeys("क्ष त्र ज्ञ श्र").output).toBe("{k = K J");
  });

  it("round-trips the INSCRIPT vocalic-r keys", () => {
    expect(typingSourceToUnicode("=+", "inscript").output).toBe("ृऋ");
    expect(unicodeToTypingSource("ृऋ", "inscript").output).toBe("=+");
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
