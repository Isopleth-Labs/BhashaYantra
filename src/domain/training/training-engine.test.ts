import { describe, expect, it } from "vitest";

import { analyzeWeakKeys, calculateKdph, calculateTrainingScore, calculateWordSpeed, calculateWpm, getFingerForKey, getNextExpectedKey, TRAINING_LESSONS } from "@/domain/training/training-engine";

describe("training engine", () => {
  it("provides lessons for every ready layout", () => {
    expect(Object.keys(TRAINING_LESSONS)).toEqual([
      "bhashayantra-smart",
      "classic-hindi",
      "inscript",
      "remington-gail",
      "remington-cbi",
      "english-qwerty",
    ]);
    expect(Object.values(TRAINING_LESSONS).every((lessons) => lessons.length >= 3)).toBe(true);
  });

  it("scores exact, partial, and extra input deterministically", () => {
    expect(calculateTrainingScore("भारत", "भारत")).toMatchObject({ accuracy: 100, complete: true });
    expect(calculateTrainingScore("भारत", "भार")).toMatchObject({ accuracy: 75, complete: false });
    expect(calculateTrainingScore("भारत", "भारतx")).toMatchObject({ accuracy: 80, complete: false });
  });

  it("does not treat untouched trailing copy as a live typing error", () => {
    expect(calculateTrainingScore("भारत", "भार", "live")).toMatchObject({ accuracy: 100, complete: false });
  });

  it("resynchronizes after a missing or extra character", () => {
    expect(calculateTrainingScore("abcd", "abxcd")).toMatchObject({
      correctCharacters: 4,
      extraCharacters: 1,
      substitutedCharacters: 0,
      accuracy: 80,
    });
    expect(calculateTrainingScore("abcd", "acd")).toMatchObject({
      correctCharacters: 3,
      missingCharacters: 1,
      substitutedCharacters: 0,
      accuracy: 75,
    });
  });

  it("calculates standard five-character words per minute", () => {
    expect(calculateWpm(50, 60)).toBe(10);
    expect(calculateWpm(0, 60)).toBe(0);
    expect(calculateKdph(300, 60)).toBe(18000);
  });

  it("calculates CPCT-style gross and net word speed", () => {
    expect(calculateWordSpeed("one two three four", "one too three", 60)).toEqual({
      correctWords: 2,
      incorrectWords: 1,
      grossWords: 3,
      grossWpm: 3,
      netWpm: 2,
      wordAccuracy: 67,
    });
  });

  it("reports weak keys and next-finger guidance", () => {
    expect(analyzeWeakKeys("asdf", "asxf")).toEqual([
      { key: "d", attempts: 1, errors: 1, accuracy: 0 },
    ]);
    expect(getFingerForKey("f")).toBe("left-index");
    expect(getNextExpectedKey("asdf", "as")).toEqual({ key: "d", index: 2, finger: "left-middle" });
  });
});
