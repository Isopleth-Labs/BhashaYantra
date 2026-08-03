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

function firstProgressIndex(expected: readonly string[], actual: readonly string[]) {
  const mismatch = expected.findIndex((character, index) => actual[index] !== undefined && actual[index] !== character);
  return mismatch >= 0 ? mismatch : Math.min(actual.length, expected.length);
}

export function getHighlightSegments(
  expectedText: string,
  actualText: string,
  mode: PassageHighlightMode,
): readonly HighlightSegment[] {
  if (mode === "none") return [{ text: expectedText, state: "pending", current: false }];

  const expected = Array.from(expectedText);
  const actual = Array.from(actualText);
  const progressIndex = firstProgressIndex(expected, actual);

  if (mode === "letter") {
    return expected.map((text, index) => {
      const current = index === progressIndex;
      const state: HighlightSegmentState = current
        ? "current"
        : actual[index] === undefined
          ? "pending"
          : actual[index] === text
            ? "correct"
            : "error";
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
    const comparedEnd = Math.min(actual.length, end);
    const hasError = mode === "error-word" && Array.from({ length: Math.max(0, comparedEnd - start) })
      .some((_, index) => actual[start + index] !== expected[start + index]);
    const state: HighlightSegmentState = hasError
      ? "error"
      : current
        ? "current"
        : end <= actual.length
          ? "correct"
          : "pending";
    return { text, state, current };
  });
}
