import { describe, expect, it } from "vitest";

import { createDirectTypingProfile } from "./direct-typing";

describe("direct typing profile", () => {
  it("ships the full Classic Hindi conversion profile to the native engine", () => {
    const profile = createDirectTypingProfile("classic-hindi", "unicode");

    expect(profile.legacyToUnicodePairs).toContainEqual(["d", "क"]);
    expect(profile.unicodeToLegacyPairs).toContainEqual(["क", "d"]);
    expect(profile.smartDictionary.mera).toBe("मेरा");
  });

  it("uses the selected direct keyboard map", () => {
    const inscript = createDirectTypingProfile("inscript", "unicode");
    const remington = createDirectTypingProfile("remington-cbi", "unicode");

    expect(inscript.keyMap.k).toBe("क");
    expect(remington.keyMap.d).toBe("क");
  });

  it("serializes custom mappings and expert shortcuts", () => {
    const profile = createDirectTypingProfile(
      "classic-hindi",
      "unicode",
      [{ id: "mapping", key: "x", output: "क्ष" }],
      [{ id: "shortcut", key: "t", character: "त्र", ctrl: true, alt: true, shift: false, builtIn: false }],
    );

    expect(profile.customSourceMappings.x).toBe("{k");
    expect(profile.shortcuts[0]).toEqual({ key: "t", ctrl: true, alt: true, shift: false, output: "त्र" });
  });
});
