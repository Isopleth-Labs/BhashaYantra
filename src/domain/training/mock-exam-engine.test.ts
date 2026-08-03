import { describe, expect, it } from "vitest";

import {
  applyWordLimit,
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
});
