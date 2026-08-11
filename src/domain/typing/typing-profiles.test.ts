import { describe, expect, it } from "vitest";

import { directLayoutToUnicode, englishQwertyToUnicode, INSCRIPT_KEY_MAP, remingtonCbiToUnicode, remingtonGailToUnicode, unicodeToDirectLayout, unicodeToRemingtonCbi, unicodeToRemingtonGail } from "./direct-layout-engine";
import { typingSourceToUnicode, unicodeToTypingSource } from "./typing-engine";
import {
  displayFontsForLanguage,
  isReadyTypingLayout,
  layoutsForLanguage,
  LEGACY_ENCODING_PROFILES,
} from "./typing-profiles";

describe("typing profile registry", () => {
  it("registers validated typing layouts separately from pending legacy encodings", () => {
    expect(isReadyTypingLayout("inscript")).toBe(true);
    expect(isReadyTypingLayout("remington-gail")).toBe(true);
    expect(isReadyTypingLayout("remington-cbi")).toBe(true);
    expect(LEGACY_ENCODING_PROFILES.find((profile) => profile.id === "devlys-010")?.readiness).toBe("validation");
  });

  it("filters layouts and fonts by typing language", () => {
    expect(layoutsForLanguage("en").map((profile) => profile.id)).toEqual(["english-qwerty"]);
    expect(displayFontsForLanguage("en").map((profile) => profile.id)).toEqual(["segoe-ui"]);
  });

  it("matches the documented Hindi keyboard acceptance example", () => {
    expect(directLayoutToUnicode("yir;e", INSCRIPT_KEY_MAP).output).toBe("बगीचा");
    expect(unicodeToDirectLayout("बगीचा", INSCRIPT_KEY_MAP).output).toBe("yir;e");
  });

  it("uses phonetic consonant-then-short-i order for the SIL GAIL reference", () => {
    expect(remingtonGailToUnicode("df").output).toBe("कि");
    expect(unicodeToRemingtonGail("कि").output).toBe("df");
    expect(typingSourceToUnicode("df", "remington-gail").output).toBe("कि");
    expect(unicodeToTypingSource("कि", "remington-gail").output).toBe("df");
  });

  it("keeps the current CBI compatibility map round-trippable", () => {
    expect(remingtonCbiToUnicode("df").output).toBe("कि");
    expect(unicodeToRemingtonCbi("कि").output).toBe("df");
  });

  it("keeps English QWERTY input unchanged", () => {
    expect(englishQwertyToUnicode("English 35 WPM").output).toBe("English 35 WPM");
  });
});
