import type { TrainingAttempt, TrainingAttemptKind } from "@/domain/training/training-attempt";
import type { ReadyTypingLayoutId } from "@/domain/typing/typing-profiles";

export interface TrainingAttemptsRepository {
  list(): Promise<readonly TrainingAttempt[]>;
  save(attempt: TrainingAttempt): Promise<void>;
  clear(layoutId?: ReadyTypingLayoutId, kind?: TrainingAttemptKind): Promise<void>;
}
