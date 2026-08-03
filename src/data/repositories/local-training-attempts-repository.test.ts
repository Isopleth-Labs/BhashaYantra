import { describe, expect, it } from "vitest";

import {
  LocalTrainingAttemptsRepository,
  TRAINING_ATTEMPTS_STORAGE_KEY,
} from "@/data/repositories/local-training-attempts-repository";
import type { TrainingAttempt } from "@/domain/training/training-attempt";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

function attempt(id: string, layoutId: TrainingAttempt["layoutId"]): TrainingAttempt {
  return {
    id,
    kind: "practice",
    layoutId,
    exerciseId: `exercise-${id}`,
    completedAt: `2026-08-03T10:00:0${id}.000Z`,
    elapsedSeconds: 60,
    accuracy: 95,
    wpm: 30,
    kdph: 9000,
    correctCharacters: 20,
    expectedCharacters: 21,
    typedCharacters: 21,
    missingCharacters: 0,
    extraCharacters: 0,
    substitutedCharacters: 1,
    weakKeys: [],
  };
}

describe("local training attempts repository", () => {
  it("saves newest first and clears only the requested layout", async () => {
    const storage = new MemoryStorage();
    const repository = new LocalTrainingAttemptsRepository(storage);
    await repository.save(attempt("1", "bhashayantra-smart"));
    await repository.save(attempt("2", "english-qwerty"));

    expect((await repository.list()).map((item) => item.id)).toEqual(["2", "1"]);
    await repository.clear("bhashayantra-smart");
    expect((await repository.list()).map((item) => item.id)).toEqual(["2"]);
  });

  it("ignores malformed stored values", async () => {
    const storage = new MemoryStorage();
    storage.setItem(TRAINING_ATTEMPTS_STORAGE_KEY, JSON.stringify([{ id: "bad" }]));
    const repository = new LocalTrainingAttemptsRepository(storage);
    expect(await repository.list()).toEqual([]);
  });
});
