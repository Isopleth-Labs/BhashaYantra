import { describe, expect, it } from "vitest";

import { buildOriginalStenographyScript, countStenographyWords, STENOGRAPHY_PROFILES } from "./stenography-profiles";

describe("stenography profiles", () => {
  it("builds the exact dictation word count for every profile", () => {
    for (const profile of STENOGRAPHY_PROFILES) {
      expect(countStenographyWords(buildOriginalStenographyScript(profile))).toBe(profile.dictationWpm * profile.dictationSeconds / 60);
    }
  });

  it("keeps official profiles linked to primary references", () => {
    for (const profile of STENOGRAPHY_PROFILES.filter((item) => item.verification === "official-reference")) {
      expect(profile.sourceUrl).toMatch(/^https:\/\//u);
      expect(profile.rules.length).toBeGreaterThanOrEqual(3);
    }
  });
});
