import { describe, expect, it } from "vitest";

import { convertText } from "./convert-text";

describe("KrutiDev text conversion", () => {
  it("converts the product acceptance sentence to Unicode", () => {
    const result = convertText('esjk uke Hkk"kk ;a= gS', "legacy-to-unicode");

    expect(result.output).toBe("मेरा नाम भाषा यंत्र है");
    expect(result.warnings).toEqual([]);
  });

  it("converts the product acceptance sentence back to legacy text", () => {
    const result = convertText("मेरा नाम भाषा यंत्र है", "unicode-to-legacy");

    expect(result.output).toBe('esjk uke Hkk"kk ;a= gS');
    expect(result.warnings).toEqual([]);
  });

  it("moves the legacy short-i marker after the next consonant", () => {
    const result = convertText("fgUnh", "legacy-to-unicode");

    expect(result.output).toBe("हिंदी");
  });

  it("preserves line breaks and ordinary punctuation", () => {
    const result = convertText("uke!\nesjk", "legacy-to-unicode");

    expect(result.output).toBe("नाम!\nमेरा");
  });

  it("reports unmapped input instead of silently removing it", () => {
    const result = convertText("🙂", "legacy-to-unicode");

    expect(result.output).toBe("🙂");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]?.code).toBe("unsupported-character");
  });
});
