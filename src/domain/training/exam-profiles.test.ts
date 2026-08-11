import { describe, expect, it } from "vitest";

import {
  getExamProfilesForLanguage,
  getExamProfilesForLayout,
  isExamProfileCompatibleWithLayout,
} from "./exam-profiles";

describe("exam profile catalog", () => {
  it("shows the complete Hindi catalog before the candidate chooses a layout", () => {
    const profiles = getExamProfilesForLanguage("hi");
    expect(profiles.map((profile) => profile.id)).toContain("ssc-chsl-hindi");
    expect(profiles.map((profile) => profile.id)).toContain("allahabad-hc-hindi");
  });

  it("keeps the layout-filtered helper strict for compatible simulations", () => {
    expect(getExamProfilesForLayout("remington-gail").map((profile) => profile.id)).not.toContain("allahabad-hc-hindi");
    expect(getExamProfilesForLayout("inscript").map((profile) => profile.id)).toContain("allahabad-hc-hindi");
  });

  it("rejects an official profile when its required layout is not selected", () => {
    const profile = getExamProfilesForLanguage("hi").find((item) => item.id === "allahabad-hc-hindi");
    expect(profile).toBeDefined();
    expect(isExamProfileCompatibleWithLayout(profile!, "remington-gail")).toBe(false);
    expect(isExamProfileCompatibleWithLayout(profile!, "inscript")).toBe(true);
  });
});
