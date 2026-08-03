import { describe, expect, it } from "vitest";

import { summarizeTrainingAttempts, type TrainingAttempt } from "@/domain/training/training-attempt";

const baseAttempt: TrainingAttempt = {
  id: "attempt-1",
  kind: "practice",
  layoutId: "bhashayantra-smart",
  exerciseId: "smart-lesson-1",
  completedAt: "2026-08-03T10:00:00.000Z",
  elapsedSeconds: 60,
  accuracy: 90,
  wpm: 30,
  kdph: 9000,
  correctCharacters: 30,
  expectedCharacters: 32,
  typedCharacters: 32,
  missingCharacters: 0,
  extraCharacters: 0,
  substitutedCharacters: 2,
  weakKeys: [],
};

describe("training progress summary", () => {
  it("returns real best, average, recent, and unique completion metrics", () => {
    const summary = summarizeTrainingAttempts([
      baseAttempt,
      { ...baseAttempt, id: "attempt-2", accuracy: 100, wpm: 42, kdph: 12600 },
      { ...baseAttempt, id: "attempt-3", kind: "test", exerciseId: "exam-1", accuracy: 95, wpm: 36, kdph: 10800 },
    ]);

    expect(summary).toMatchObject({
      attemptCount: 3,
      completedExerciseCount: 1,
      bestWpm: 42,
      bestKdph: 12600,
      averageAccuracy: 95,
    });
    expect(summary.recentWpm).toEqual([36, 42, 30]);
  });

  it("can summarize one layout without mixing another layout", () => {
    const summary = summarizeTrainingAttempts([
      baseAttempt,
      { ...baseAttempt, id: "attempt-english", layoutId: "english-qwerty", wpm: 70 },
    ], "bhashayantra-smart");

    expect(summary.attemptCount).toBe(1);
    expect(summary.bestWpm).toBe(30);
  });
});
