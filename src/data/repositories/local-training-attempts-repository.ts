import type { TrainingAttemptsRepository } from "@/application/ports/training-attempts-repository";
import type { TrainingAttempt, TrainingAttemptKind } from "@/domain/training/training-attempt";
import type { ReadyTypingLayoutId } from "@/domain/typing/typing-profiles";

export const TRAINING_ATTEMPTS_STORAGE_KEY = "bhashayantra:training-attempts:v1";
export const TRAINING_ATTEMPTS_UPDATED_EVENT = "bhashayantra-training-attempts-updated";
const MAX_LOCAL_ATTEMPTS = 500;

const LAYOUT_IDS: readonly ReadyTypingLayoutId[] = [
  "bhashayantra-smart",
  "classic-hindi",
  "inscript",
  "remington-gail",
  "remington-cbi",
  "english-qwerty",
];

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isTrainingAttempt(value: unknown): value is TrainingAttempt {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<TrainingAttempt>;
  return (
    typeof item.id === "string" &&
    (item.kind === "practice" || item.kind === "test") &&
    LAYOUT_IDS.includes(item.layoutId as ReadyTypingLayoutId) &&
    typeof item.exerciseId === "string" &&
    (item.examProfileId === undefined || typeof item.examProfileId === "string") &&
    typeof item.completedAt === "string" && !Number.isNaN(Date.parse(item.completedAt)) &&
    isFiniteNonNegative(item.elapsedSeconds) &&
    isFiniteNonNegative(item.accuracy) && item.accuracy <= 100 &&
    isFiniteNonNegative(item.wpm) &&
    isFiniteNonNegative(item.kdph) &&
    isFiniteNonNegative(item.correctCharacters) &&
    isFiniteNonNegative(item.expectedCharacters) &&
    isFiniteNonNegative(item.typedCharacters) &&
    isFiniteNonNegative(item.missingCharacters) &&
    isFiniteNonNegative(item.extraCharacters) &&
    isFiniteNonNegative(item.substitutedCharacters) &&
    (item.backspaceCount === undefined || isFiniteNonNegative(item.backspaceCount)) &&
    Array.isArray(item.weakKeys)
  );
}

export class LocalTrainingAttemptsRepository implements TrainingAttemptsRepository {
  constructor(private readonly storage: Storage = localStorage) {}

  async list(): Promise<readonly TrainingAttempt[]> {
    try {
      const parsed: unknown = JSON.parse(this.storage.getItem(TRAINING_ATTEMPTS_STORAGE_KEY) ?? "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(isTrainingAttempt)
        .sort((left, right) => right.completedAt.localeCompare(left.completedAt));
    } catch {
      return [];
    }
  }

  async save(attempt: TrainingAttempt): Promise<void> {
    const current = await this.list();
    const next = [attempt, ...current.filter((item) => item.id !== attempt.id)].slice(0, MAX_LOCAL_ATTEMPTS);
    this.storage.setItem(TRAINING_ATTEMPTS_STORAGE_KEY, JSON.stringify(next));
    if (typeof window !== "undefined") window.dispatchEvent(new Event(TRAINING_ATTEMPTS_UPDATED_EVENT));
  }

  async clear(layoutId?: ReadyTypingLayoutId, kind?: TrainingAttemptKind): Promise<void> {
    if (!layoutId && !kind) {
      this.storage.removeItem(TRAINING_ATTEMPTS_STORAGE_KEY);
    } else {
      const remaining = (await this.list()).filter((attempt) => {
        const matchesLayout = layoutId ? attempt.layoutId === layoutId : true;
        const matchesKind = kind ? attempt.kind === kind : true;
        return !(matchesLayout && matchesKind);
      });
      if (remaining.length > 0) this.storage.setItem(TRAINING_ATTEMPTS_STORAGE_KEY, JSON.stringify(remaining));
      else this.storage.removeItem(TRAINING_ATTEMPTS_STORAGE_KEY);
    }
    if (typeof window !== "undefined") window.dispatchEvent(new Event(TRAINING_ATTEMPTS_UPDATED_EVENT));
  }
}
