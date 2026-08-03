import { describe, expect, it } from "vitest";

import { getCurriculumCatalogSummary, getCurriculumCourse } from "@/domain/training/curriculum-catalog";
import { EXAM_PROFILES, getExamPassage, getExamProfilesForLayout } from "@/domain/training/exam-profiles";
import { typingSourceToUnicode } from "@/domain/typing/typing-engine";
import type { ReadyTypingLayoutId } from "@/domain/typing/typing-profiles";

const READY_LAYOUTS: readonly ReadyTypingLayoutId[] = [
  "bhashayantra-smart",
  "classic-hindi",
  "inscript",
  "english-qwerty",
];

describe("curriculum catalog", () => {
  it("provides 1,200 structured original exercises", () => {
    expect(getCurriculumCatalogSummary()).toEqual({
      courseCount: 4,
      exerciseCount: 1200,
      freeExerciseCount: 160,
    });
  });

  it("builds 300 unique and executable exercises for every ready layout", () => {
    for (const layout of READY_LAYOUTS) {
      const course = getCurriculumCourse(layout);
      const exercises = course.stages.flatMap((stage) => stage.exercises);
      expect(exercises).toHaveLength(300);
      expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(300);
      expect(new Set(exercises.map((exercise) => exercise.keys)).size).toBe(300);
      expect(exercises.every((exercise) => exercise.keys.length > 0 && exercise.target.length > 0)).toBe(true);
      expect(exercises.every((exercise) => typingSourceToUnicode(exercise.keys, layout).output === exercise.target)).toBe(true);
      const warned = exercises.filter((exercise) => exercise.conversionWarnings > 0);
      expect(warned.map((exercise) => ({ id: exercise.id, keys: exercise.keys, target: exercise.target, warnings: exercise.conversionWarnings }))).toEqual([]);
    }
  });

  it("provides simulated exam profiles and layout-compatible passages", () => {
    expect(EXAM_PROFILES).toHaveLength(8);
    expect(getExamProfilesForLayout("english-qwerty").every((profile) => profile.language === "en")).toBe(true);
    expect(getExamProfilesForLayout("inscript").every((profile) => profile.language === "hi")).toBe(true);
    const profile = getExamProfilesForLayout("inscript")[0];
    const passage = getExamPassage(profile, "inscript");
    expect(passage.layoutId).toBe("inscript");
    expect(passage.target.trim().split(/\s+/u).length).toBeGreaterThanOrEqual(1200);
    expect(typingSourceToUnicode(passage.keys, "inscript").output).toBe(passage.target);
  });
});
