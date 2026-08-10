import { describe, expect, it } from "vitest";

import { narrationRate, splitNarrationText } from "@/application/stenography-audio";

describe("stenography audio helpers", () => {
  it("splits long narration without losing words", () => {
    const text = "one two three four five six seven eight nine ten";
    const chunks = splitNarrationText(text, 16);
    expect(chunks.every((chunk) => chunk.length <= 16)).toBe(true);
    expect(chunks.join(" ")).toBe(text);
  });

  it("keeps narration rate within a usable range", () => {
    expect(narrationRate(20)).toBe(0.65);
    expect(narrationRate(100)).toBe(1);
    expect(narrationRate(300)).toBe(1.65);
  });
});
