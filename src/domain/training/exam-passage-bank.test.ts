import { describe, expect, it } from "vitest";

import { buildOfficialStylePassage, PASSAGE_PATTERN_LABELS } from "./exam-passage-bank";

describe("exam passage bank", () => {
  it("builds category-specific original practice papers", () => {
    const railway = buildOfficialStylePassage("en", 0, 300, "rrb");
    const court = buildOfficialStylePassage("en", 0, 300, "rajasthan-court");

    expect(railway).toContain("Railway offices");
    expect(court).toContain("Court administration");
    expect(railway).not.toBe(court);
  });

  it("keeps every pattern explicitly labelled", () => {
    expect(Object.keys(PASSAGE_PATTERN_LABELS)).toHaveLength(8);
    expect(PASSAGE_PATTERN_LABELS.ssc).toContain("SSC");
  });
});
