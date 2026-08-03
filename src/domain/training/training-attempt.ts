import type { KeyMistake } from "@/domain/training/training-engine";
import type { ReadyTypingLayoutId } from "@/domain/typing/typing-profiles";

export type TrainingAttemptKind = "practice" | "test";

export interface TrainingAttempt {
  readonly id: string;
  readonly kind: TrainingAttemptKind;
  readonly layoutId: ReadyTypingLayoutId;
  readonly exerciseId: string;
  readonly examProfileId?: string;
  readonly completedAt: string;
  readonly elapsedSeconds: number;
  readonly accuracy: number;
  readonly wpm: number;
  readonly kdph: number;
  readonly correctCharacters: number;
  readonly expectedCharacters: number;
  readonly typedCharacters: number;
  readonly missingCharacters: number;
  readonly extraCharacters: number;
  readonly substitutedCharacters: number;
  readonly backspaceCount?: number;
  readonly weakKeys: readonly KeyMistake[];
}
export interface TrainingProgressSummary {
  readonly attemptCount: number;
  readonly completedExerciseCount: number;
  readonly bestWpm: number;
  readonly bestKdph: number;
  readonly averageAccuracy: number;
  readonly recentWpm: readonly number[];
}

export const EMPTY_TRAINING_SUMMARY: TrainingProgressSummary = {
  attemptCount: 0,
  completedExerciseCount: 0,
  bestWpm: 0,
  bestKdph: 0,
  averageAccuracy: 0,
  recentWpm: [],
};

export function summarizeTrainingAttempts(
  attempts: readonly TrainingAttempt[],
  layoutId?: ReadyTypingLayoutId,
): TrainingProgressSummary {
  const matching = layoutId ? attempts.filter((attempt) => attempt.layoutId === layoutId) : [...attempts];
  if (matching.length === 0) return EMPTY_TRAINING_SUMMARY;

  return {
    attemptCount: matching.length,
    completedExerciseCount: new Set(
      matching.filter((attempt) => attempt.kind === "practice").map((attempt) => attempt.exerciseId),
    ).size,
    bestWpm: Math.max(...matching.map((attempt) => attempt.wpm)),
    bestKdph: Math.max(...matching.map((attempt) => attempt.kdph)),
    averageAccuracy: Math.round(
      matching.reduce((total, attempt) => total + attempt.accuracy, 0) / matching.length,
    ),
    recentWpm: matching.slice(0, 10).map((attempt) => attempt.wpm).reverse(),
  };
}
