import type { TrainingAttempt } from "@/domain/training/training-attempt";
import type { ReadyTypingLayoutId } from "@/domain/typing/typing-profiles";

export interface TrainingAttemptsRepository {
  list(): Promise<readonly TrainingAttempt[]>;
  save(attempt: TrainingAttempt): Promise<void>;
  clear(layoutId?: ReadyTypingLayoutId): Promise<void>;
}
