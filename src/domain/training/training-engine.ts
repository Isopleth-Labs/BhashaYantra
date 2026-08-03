import type { ReadyTypingLayoutId } from "@/domain/typing/typing-profiles";

export interface TrainingLesson {
  readonly id: string;
  readonly keys: string;
}

export interface TrainingScore {
  readonly accuracy: number;
  readonly correctCharacters: number;
  readonly expectedCharacters: number;
  readonly typedCharacters: number;
  readonly missingCharacters: number;
  readonly extraCharacters: number;
  readonly substitutedCharacters: number;
  readonly complete: boolean;
}

export type FingerId =
  | "left-pinky"
  | "left-ring"
  | "left-middle"
  | "left-index"
  | "thumb"
  | "right-index"
  | "right-middle"
  | "right-ring"
  | "right-pinky";

export interface KeyMistake {
  readonly key: string;
  readonly attempts: number;
  readonly errors: number;
  readonly accuracy: number;
}

export interface WordSpeedScore {
  readonly correctWords: number;
  readonly incorrectWords: number;
  readonly grossWords: number;
  readonly grossWpm: number;
  readonly netWpm: number;
  readonly wordAccuracy: number;
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
  let substitutedCharacters = 0;

  for (let index = 0; index < comparedLength; index += 1) {
    if (expectedCharacters[index] !== undefined && expectedCharacters[index] === actualCharacters[index]) {
      correctCharacters += 1;
    } else if (expectedCharacters[index] !== undefined && actualCharacters[index] !== undefined) {
      substitutedCharacters += 1;
    }
  }

  return {
    accuracy: comparedLength === 0 ? 100 : Math.round((correctCharacters / comparedLength) * 100),
    correctCharacters,
    expectedCharacters: expectedCharacters.length,
    typedCharacters: actualCharacters.length,
    missingCharacters: Math.max(0, expectedCharacters.length - actualCharacters.length),
    extraCharacters: Math.max(0, actualCharacters.length - expectedCharacters.length),
    substitutedCharacters,
    complete: expected.length > 0 && actual === expected,
  };
}

export function calculateWpm(characterCount: number, elapsedSeconds: number) {
  if (characterCount === 0 || elapsedSeconds < 1) return 0;
  return Math.max(0, Math.round((characterCount / 5 / elapsedSeconds) * 60));
}

export function calculateKdph(keyCount: number, elapsedSeconds: number) {
  if (keyCount === 0 || elapsedSeconds < 1) return 0;
  return Math.max(0, Math.round((keyCount / elapsedSeconds) * 3600));
}

export function calculateWordSpeed(expected: string, actual: string, elapsedSeconds: number): WordSpeedScore {
  const expectedWords = expected.trim().split(/\s+/u).filter(Boolean);
  const actualWords = actual.trim().split(/\s+/u).filter(Boolean);
  const correctWords = actualWords.reduce(
    (total, word, index) => total + (word === expectedWords[index] ? 1 : 0),
    0,
  );
  const grossWords = actualWords.length;
  const incorrectWords = Math.max(0, grossWords - correctWords);
  const minutes = Math.max(1, elapsedSeconds) / 60;
  const grossWpm = Math.round(grossWords / minutes);
  const netWpm = Math.round(correctWords / minutes);
  return {
    correctWords,
    incorrectWords,
    grossWords,
    grossWpm,
    netWpm,
    wordAccuracy: grossWords === 0 ? 100 : Math.round((correctWords / grossWords) * 100),
  };
}

export function analyzeWeakKeys(expected: string, actual: string): readonly KeyMistake[] {
  const expectedKeys = Array.from(expected);
  const actualKeys = Array.from(actual);
  const stats = new Map<string, { attempts: number; errors: number }>();

  expectedKeys.forEach((key, index) => {
    if (/\s/u.test(key)) return;
    const normalized = key.toLocaleLowerCase();
    const current = stats.get(normalized) ?? { attempts: 0, errors: 0 };
    current.attempts += 1;
    if (actualKeys[index] !== key) current.errors += 1;
    stats.set(normalized, current);
  });

  return [...stats.entries()]
    .filter(([, value]) => value.errors > 0)
    .map(([key, value]) => ({
      key,
      attempts: value.attempts,
      errors: value.errors,
      accuracy: Math.round(((value.attempts - value.errors) / value.attempts) * 100),
    }))
    .sort((left, right) => right.errors - left.errors || left.accuracy - right.accuracy || left.key.localeCompare(right.key));
}

const FINGER_KEYS: Readonly<Record<FingerId, string>> = {
  "left-pinky": "`1qaz",
  "left-ring": "2wsx",
  "left-middle": "3edc",
  "left-index": "45rftgvb",
  thumb: " ",
  "right-index": "67yuhjnm",
  "right-middle": "8ik,",
  "right-ring": "9ol.",
  "right-pinky": "0p;/'-=[]\\",
};

export function getFingerForKey(key: string): FingerId | undefined {
  const normalized = key.toLocaleLowerCase();
  return (Object.entries(FINGER_KEYS) as readonly [FingerId, string][])
    .find(([, keys]) => keys.includes(normalized))?.[0];
}

export function getNextExpectedKey(expected: string, actual: string) {
  const expectedKeys = Array.from(expected);
  const actualKeys = Array.from(actual);
  const mismatchIndex = expectedKeys.findIndex((key, index) => actualKeys[index] !== undefined && actualKeys[index] !== key);
  const nextIndex = mismatchIndex >= 0 ? mismatchIndex : actualKeys.length;
  const key = expectedKeys[nextIndex];
  return key === undefined ? undefined : { key, index: nextIndex, finger: getFingerForKey(key) };
}
