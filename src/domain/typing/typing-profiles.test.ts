import { describe, expect, it } from "vitest";

import { directLayoutToUnicode, englishQwertyToUnicode, INSCRIPT_KEY_MAP, unicodeToDirectLayout } from "./direct-layout-engine";
import {
  displayFontsForLanguage,
  isReadyTypingLayout,
  layoutsForLanguage,
  LEGACY_ENCODING_PROFILES,
} from "./typing-profiles";

describe("typing profile registry", () => {
  it("separates ready profiles from profiles awaiting validation", () => {
    expect(isReadyTypingLayout("inscript")).toBe(true);
    expect(isReadyTypingLayout("remington-gail")).toBe(false);
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

  it("keeps English QWERTY input unchanged", () => {
    expect(englishQwertyToUnicode("English 35 WPM").output).toBe("English 35 WPM");
  });
});
