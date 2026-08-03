import { describe, expect, it } from "vitest";

import {
  applyWordLimit,
  calculateRrbTypingScore,
  countWords,
  formatExamText,
  getHighlightSegments,
} from "@/domain/training/mock-exam-engine";

describe("mock exam engine", () => {
  it("formats paragraphs and applies an exact word limit", () => {
    const formatted = formatExamText("First\tline.\n\nSecond line here.", {
      allowParagraphs: false,
      allowTabs: false,
    });
    expect(formatted).toBe("First line. Second line here.");
    expect(applyWordLimit(formatted, true, 3)).toBe("First line. Second");
    expect(countWords(applyWordLimit(formatted, true, 3))).toBe(3);
  });

  it("marks the current letter and incorrect word", () => {
    expect(getHighlightSegments("abcd", "ab", "letter")).toEqual([
      { text: "a", state: "correct", current: false },
      { text: "b", state: "correct", current: false },
      { text: "c", state: "current", current: true },
      { text: "d", state: "pending", current: false },
    ]);
    expect(getHighlightSegments("one two", "one tx", "error-word").find((segment) => segment.text === "two"))
      .toEqual({ text: "two", state: "error", current: true });
  });

  it("applies the published RRB mistake allowance and ten-word penalty", () => {
    const exact = calculateRrbTypingScore("one two three four five six seven eight nine ten", "one two three four five six seven eight nine ten", 60);
    expect(exact).toMatchObject({ typedWords: 10, fullMistakes: 0, halfMistakes: 0, finalMistakes: 0, wpm: 10 });

    const oneSmallError = calculateRrbTypingScore("one two three four five six seven eight nine ten", "one two thre four five six seven eight nine ten", 60);
    expect(oneSmallError.halfMistakes).toBe(1);
    expect(oneSmallError.finalMistakes).toBe(0);
    expect(oneSmallError.wpm).toBe(10);

    const fullError = calculateRrbTypingScore("one two three four five six seven eight nine ten", "one two wrong four five six seven eight nine ten", 60);
    expect(fullError.fullMistakes).toBe(1);
    expect(fullError.finalMistakes).toBe(0.5);
    expect(fullError.wpm).toBe(5);
  });
});
