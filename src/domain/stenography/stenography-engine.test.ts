import { describe, expect, it } from "vitest";

import { calculateTranscriptWpm, dictationIntervalMs, scoreTranscript, tokenizeStenographyText } from "./stenography-engine";

describe("stenography engine", () => {
  it("normalizes punctuation and Unicode text before scoring", () => {
    expect(tokenizeStenographyText("भारत, एक देश है।")).toEqual(["भारत", "एक", "देश", "है"]);
  });

  it("reports exact transcripts at full accuracy", () => {
    expect(scoreTranscript("A clear record is useful.", "A clear record is useful")).toMatchObject({
      correct: 5,
      substitutions: 0,
      missing: 0,
      extra: 0,
      accuracy: 100,
    });
  });

  it("separates substitutions, missing words, and extra words", () => {
    expect(scoreTranscript("one two three four", "one too four extra")).toMatchObject({
      correct: 2,
      substitutions: 1,
      missing: 1,
      extra: 1,
      accuracy: 50,
    });
  });

  it("calculates safe pacing and transcript speed", () => {
    expect(dictationIntervalMs(120)).toBe(500);
    expect(dictationIntervalMs(0)).toBe(3000);
    expect(calculateTranscriptWpm(40, 120)).toBe(20);
  });
});
