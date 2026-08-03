import type { ReadyTypingLayoutId } from "@/domain/typing/typing-profiles";

export interface TrainingLesson {
  readonly id: string;
  readonly keys: string;
}

export interface TrainingScore {
  readonly accuracy: number;
  readonly correctCharacters: number;
  readonly expectedCharacters: number;
  readonly complete: boolean;
}

export const TRAINING_LESSONS: Readonly<Record<ReadyTypingLayoutId, readonly TrainingLesson[]>> = {
  "bhashayantra-smart": [
    { id: "smart-1", keys: "namaste bharat" },
    { id: "smart-2", keys: "mera naam bhasha yantra hai" },
    { id: "smart-3", keys: "hindi hamari bhasha hai" },
  ],
  "classic-hindi": [
    { id: "classic-1", keys: "esjk uke Hkk\"kk ;a= gS" },
    { id: "classic-2", keys: "Hkkjr" },
    { id: "classic-3", keys: "fgUnh" },
  ],
  inscript: [
    { id: "inscript-1", keys: "yir;e" },
    { id: "inscript-2", keys: "Yejl" },
    { id: "inscript-3", keys: "ufvdor" },
  ],
  "english-qwerty": [
    { id: "english-1", keys: "The quick brown fox" },
    { id: "english-2", keys: "Practice builds speed and accuracy." },
    { id: "english-3", keys: "BhashaYantra works offline." },
  ],
} as const;

export function calculateTrainingScore(expected: string, actual: string): TrainingScore {
  const expectedCharacters = Array.from(expected);
  const actualCharacters = Array.from(actual);
  const comparedLength = Math.max(expectedCharacters.length, actualCharacters.length);
  let correctCharacters = 0;

  for (let index = 0; index < comparedLength; index += 1) {
    if (expectedCharacters[index] !== undefined && expectedCharacters[index] === actualCharacters[index]) {
      correctCharacters += 1;
    }
  }

  return {
    accuracy: comparedLength === 0 ? 100 : Math.round((correctCharacters / comparedLength) * 100),
    correctCharacters,
    expectedCharacters: expectedCharacters.length,
    complete: expected.length > 0 && actual === expected,
  };
}

export function calculateWpm(characterCount: number, elapsedSeconds: number) {
  if (characterCount === 0 || elapsedSeconds < 1) return 0;
  return Math.max(0, Math.round((characterCount / 5 / elapsedSeconds) * 60));
}
