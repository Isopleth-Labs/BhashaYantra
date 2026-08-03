import { describe, expect, it } from "vitest";

import { smartPhoneticToUnicode } from "./smart-phonetic-engine";

describe("BhashaYantra Smart phonetic engine", () => {
  it("converts the product demo sentence", () => {
    expect(smartPhoneticToUnicode("mera naam bhasha yantra hai").output).toBe(
      "मेरा नाम भाषा यंत्र है",
    );
  });

  it("builds vowels, matras, and conjuncts without a dictionary match", () => {
    expect(smartPhoneticToUnicode("kaun prem shakti").output).toBe("कौन प्रेम शक्ति");
  });

  it("supports explicit retroflex keys and common aliases", () => {
    expect(smartPhoneticToUnicode("Taa Dhol N").output).toBe("टा ढोल ण");
  });

  it("preserves Hindi, punctuation, numbers, and line breaks", () => {
    expect(smartPhoneticToUnicode("namaste, भारत!\n2026").output).toBe(
      "नमस्ते, भारत!\n2026",
    );
  });

  it("reports Unicode-aware input and output counts", () => {
    const result = smartPhoneticToUnicode("nam");
    expect(result.inputCharacters).toBe(3);
    expect(result.outputCharacters).toBe(3);
    expect(result.warnings).toEqual([]);
  });
});
