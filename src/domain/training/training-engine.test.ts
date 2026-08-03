import { describe, expect, it } from "vitest";

import { calculateTrainingScore, calculateWpm, TRAINING_LESSONS } from "@/domain/training/training-engine";

describe("training engine", () => {
  it("provides lessons for every ready layout", () => {
    expect(Object.keys(TRAINING_LESSONS)).toEqual([
      "bhashayantra-smart",
      "classic-hindi",
      "inscript",
      "english-qwerty",
    ]);
    expect(Object.values(TRAINING_LESSONS).every((lessons) => lessons.length >= 3)).toBe(true);
  });

  it("scores exact, partial, and extra input deterministically", () => {
    expect(calculateTrainingScore("भारत", "भारत")).toMatchObject({ accuracy: 100, complete: true });
    expect(calculateTrainingScore("भारत", "भार")).toMatchObject({ accuracy: 75, complete: false });
    expect(calculateTrainingScore("भारत", "भारतx")).toMatchObject({ accuracy: 80, complete: false });
  });

  it("calculates standard five-character words per minute", () => {
    expect(calculateWpm(50, 60)).toBe(10);
    expect(calculateWpm(0, 60)).toBe(0);
  });
});
