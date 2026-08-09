import { describe, expect, it } from "vitest";

import { convertText } from "./convert-text";

describe("conversion profile boundary", () => {
  it("runs the verified KrutiDev profile", () => {
    expect(convertText({
      input: 'esjk uke Hkk"kk ;a= gS',
      direction: "legacy-to-unicode",
      profile: "krutidev-010",
    }).output).toBe("मेरा नाम भाषा यंत्र है");
  });

  it("rejects unverified profiles instead of silently using KrutiDev rules", () => {
    expect(() => convertText({
      input: "sample",
      direction: "legacy-to-unicode",
      profile: "devlys-010",
    })).toThrow("not verified");
  });
});
