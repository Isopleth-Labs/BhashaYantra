import { alignText } from "@/domain/training/text-alignment";

export type MockExamStatus = "ready" | "running" | "paused" | "submitted" | "expired";
export type PassageHighlightMode = "word" | "error-word" | "letter" | "none";
export type HighlightSegmentState = "correct" | "current" | "error" | "pending";

export interface HighlightSegment {
  readonly text: string;
  readonly state: HighlightSegmentState;
  readonly current: boolean;
}

export interface ExamTextOptions {
  readonly allowParagraphs: boolean;
  readonly allowTabs: boolean;
}

export interface RrbTypingScore {
  readonly typedWords: number;
  readonly fullMistakes: number;
  readonly halfMistakes: number;
  readonly ignoredMistakes: number;
  readonly finalMistakes: number;
  readonly wpm: number;
}

export function countWords(text: string) {
  return text.trim().length === 0 ? 0 : text.trim().split(/\s+/u).length;
}

export function formatExamText(text: string, options: ExamTextOptions) {
  let output = text.replace(/\r\n?/gu, "\n");
  if (!options.allowTabs) output = output.replace(/\t/gu, " ");
  if (!options.allowParagraphs) output = output.replace(/\s*\n+\s*/gu, " ");
  return output.replace(/[ ]{2,}/gu, " ").trim();
}

export function applyWordLimit(text: string, enabled: boolean, requestedLimit: number) {
  if (!enabled) return text;
  const limit = Math.max(1, Math.floor(requestedLimit));
  const tokens = text.match(/\S+|\s+/gu) ?? [];
  let wordCount = 0;
  let output = "";

  for (const token of tokens) {
    if (/^\s+$/u.test(token)) {
      if (wordCount < limit) output += token;
      continue;
    }
    if (wordCount >= limit) break;
    output += token;
    wordCount += 1;
  }

  return output.trimEnd();
}

export function applyKeystrokeLimit(text: string, enabled: boolean, requestedLimit: number) {
  if (!enabled) return text;
  const limit = Math.max(1, Math.floor(requestedLimit));
  return Array.from(text).slice(0, limit).join("").trimEnd();
}

function characterDistance(left: string, right: string) {
  const a = Array.from(left.toLocaleLowerCase());
  const b = Array.from(right.toLocaleLowerCase());
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= a.length; leftIndex += 1) {
    let diagonal = row[0];
    row[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= b.length; rightIndex += 1) {
      const previous = row[rightIndex];
      row[rightIndex] = Math.min(
        row[rightIndex] + 1,
        row[rightIndex - 1] + 1,
        diagonal + (a[leftIndex - 1] === b[rightIndex - 1] ? 0 : 1),
      );
      diagonal = previous;
    }
  }
  return row[b.length];
}

export function calculateRrbTypingScore(expectedText: string, actualText: string, elapsedSeconds: number): RrbTypingScore {
  const expected = expectedText.trim().split(/\s+/u).filter(Boolean);
  const actual = actualText.trim().split(/\s+/u).filter(Boolean);
  const rows = expected.length + 1;
  const columns = actual.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(columns).fill(0));
  for (let row = 0; row < rows; row += 1) matrix[row][0] = row;
  for (let column = 0; column < columns; column += 1) matrix[0][column] = column;
  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + (expected[row - 1] === actual[column - 1] ? 0 : 1),
      );
    }
  }

  let row = expected.length;
  let column = actual.length;
  let fullMistakes = 0;
  let halfMistakes = 0;
  while (row > 0 || column > 0) {
    if (row > 0 && column > 0 && expected[row - 1] === actual[column - 1]) {
      row -= 1;
      column -= 1;
      continue;
    }
    if (row > 0 && column > 0 && matrix[row][column] === matrix[row - 1][column - 1] + 1) {
      if (characterDistance(expected[row - 1], actual[column - 1]) <= 1) halfMistakes += 1;
      else fullMistakes += 1;
      row -= 1;
      column -= 1;
      continue;
    }
    fullMistakes += 1;
    if (column > 0 && matrix[row][column] === matrix[row][column - 1] + 1) column -= 1;
    else row -= 1;
  }

  const typedWords = actual.length;
  const ignoredMistakes = typedWords * 0.05;
  const finalMistakes = Math.max(0, fullMistakes + halfMistakes / 2 - ignoredMistakes);
  const minutes = Math.max(1 / 60, elapsedSeconds / 60);
  const wpm = Math.max(0, Math.round((typedWords - finalMistakes * 10) / minutes));
  return { typedWords, fullMistakes, halfMistakes, ignoredMistakes, finalMistakes, wpm };
}

export function getHighlightSegments(
  expectedText: string,
  actualText: string,
  mode: PassageHighlightMode,
): readonly HighlightSegment[] {
  if (mode === "none") return [{ text: expectedText, state: "pending", current: false }];

  const expected = Array.from(expectedText);
  const alignment = alignText(expectedText, actualText);
  const states = Array<HighlightSegmentState>(expected.length).fill("pending");
  for (const operation of alignment) {
    if (operation.expectedIndex === undefined || operation.expectedIndex >= expected.length) continue;
    if (operation.kind === "correct") states[operation.expectedIndex] = "correct";
    else if (operation.kind === "substitution" || (operation.kind === "missing" && operation.actualIndex !== undefined)) states[operation.expectedIndex] = "error";
    else if (operation.kind === "extra") states[operation.expectedIndex] = "error";
  }
  const progressIndex = alignment.find(
    (operation) => operation.expectedIndex !== undefined && operation.kind === "missing" && operation.actualIndex === undefined,
  )?.expectedIndex ?? Math.min(expected.length, Array.from(actualText).length);

  if (mode === "letter") {
    return expected.map((text, index) => {
      const current = index === progressIndex;
      const state: HighlightSegmentState = current ? "current" : states[index];
      return { text, state, current };
    });
  }

  const tokens = expectedText.match(/\S+|\s+/gu) ?? [];
  let offset = 0;
  return tokens.map((text) => {
    const characters = Array.from(text);
    const start = offset;
    const end = start + characters.length;
    offset = end;
    if (/^\s+$/u.test(text)) return { text, state: "pending" as const, current: false };

    const current = progressIndex >= start && progressIndex < end;
    const hasError = mode === "error-word" && states.slice(start, end).includes("error");
    const state: HighlightSegmentState = hasError
      ? "error"
      : current
        ? "current"
        : states.slice(start, end).every((value) => value === "correct")
          ? "correct"
          : "pending";
    return { text, state, current };
  });
}
