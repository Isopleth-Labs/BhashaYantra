import { describe, expect, it } from "vitest";

import { getCurriculumCatalogSummary, getCurriculumCourse } from "@/domain/training/curriculum-catalog";
import { EXAM_PROFILES, getExamPassage, getExamProfilesForLayout } from "@/domain/training/exam-profiles";
import { typingSourceToUnicode, unicodeToTypingSource } from "@/domain/typing/typing-engine";
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
      const mismatched = exercises.filter((exercise) => typingSourceToUnicode(exercise.keys, layout).output !== exercise.target);
      expect(mismatched.slice(0, 5).map((exercise) => ({
        id: exercise.id,
        title: exercise.title,
        expected: exercise.target,
        actual: typingSourceToUnicode(exercise.keys, layout).output,
      }))).toEqual([]);
      const warned = exercises.filter((exercise) => exercise.conversionWarnings > 0);
      expect(warned.slice(0, 12).map((exercise) => ({
        id: exercise.id,
        unsupported: unicodeToTypingSource(exercise.target, layout).warnings.map((warning) => warning.input),
      }))).toEqual([]);
    }
  });

  it("provides professional lesson depth, metadata, and distinct word drills", () => {
    for (const layout of READY_LAYOUTS) {
      const course = getCurriculumCourse(layout);
      const exercises = course.stages.flatMap((stage) => stage.exercises);
      const keyLessons = course.stages.find((stage) => stage.id === "learn-keys")?.exercises ?? [];
      const wordLessons = course.stages.find((stage) => stage.id === "practice-words")?.exercises ?? [];
      const sentenceLessons = course.stages.find((stage) => stage.id === "sentences")?.exercises ?? [];
      const paragraphLessons = course.stages.find((stage) => stage.id === "paragraphs")?.exercises ?? [];

      expect(new Set(exercises.map((exercise) => exercise.title)).size).toBe(300);
      expect(exercises.every((exercise) => exercise.objective.length >= 40)).toBe(true);
      expect(exercises.every((exercise) => exercise.phaseTitle.length > 0 && exercise.competency.length > 0)).toBe(true);
      expect(exercises.every((exercise) => exercise.requiredPasses >= 1 && exercise.requiredPasses <= 3)).toBe(true);
      expect(exercises.every((exercise) => exercise.drillBlocks.length >= 2 && exercise.drillBlocks.every((block) => block.keys.length > 0 && block.target.length > 0))).toBe(true);
      expect(exercises.every((exercise) => exercise.minimumAccuracy >= 92 && exercise.minimumAccuracy <= 98)).toBe(true);
      expect(exercises.every((exercise) => exercise.targetWpm >= 10)).toBe(true);
      expect(keyLessons.every((exercise) => Array.from(exercise.target).length >= 120)).toBe(true);
      expect(wordLessons.filter((exercise) => exercise.wordCount < 28).map((exercise) => ({ id: exercise.id, words: exercise.wordCount }))).toEqual([]);
      expect(sentenceLessons.filter((exercise) => exercise.wordCount < 70).map((exercise) => ({ id: exercise.id, words: exercise.wordCount }))).toEqual([]);
      expect(paragraphLessons.filter((exercise) => exercise.wordCount < 180 || !exercise.keys.includes("\n\n")).map((exercise) => ({ id: exercise.id, words: exercise.wordCount }))).toEqual([]);

      for (const exercise of wordLessons) {
        const words = exercise.target.trim().split(/\s+/u);
        expect(new Set(words).size, exercise.id).toBe(words.length);
      }
    }
  });

  it("provides verified government-exam profiles and layout-compatible passages", () => {
    expect(EXAM_PROFILES).toHaveLength(12);
    expect(EXAM_PROFILES.filter((profile) => profile.verification === "official-reference")).toHaveLength(10);
    expect(EXAM_PROFILES.filter((profile) => profile.verification === "official-reference").every((profile) => profile.officialSourceUrl?.startsWith("https://"))).toBe(true);
    expect(EXAM_PROFILES.filter((profile) => profile.verification === "official-reference").every((profile) => profile.minimumAccuracy === 0)).toBe(true);
    expect(EXAM_PROFILES.some((profile) => profile.scoringModel === "net-wpm")).toBe(true);
    expect(EXAM_PROFILES.some((profile) => profile.scoringModel === "kdph")).toBe(true);
    expect(EXAM_PROFILES.find((profile) => profile.id === "ssc-chsl-english")).toMatchObject({ durationSeconds: 600, targetWpm: 35, targetKdph: 10500 });
    expect(EXAM_PROFILES.find((profile) => profile.id === "ssc-chsl-hindi")).toMatchObject({ durationSeconds: 600, targetWpm: 30, targetKdph: 9000 });
    expect(EXAM_PROFILES.find((profile) => profile.id === "cpct-english")).toMatchObject({ durationSeconds: 900, targetWpm: 30, scoringModel: "net-wpm" });
    expect(EXAM_PROFILES.find((profile) => profile.id === "cpct-hindi")).toMatchObject({ durationSeconds: 900, targetWpm: 20, scoringModel: "net-wpm" });
    expect(EXAM_PROFILES.find((profile) => profile.id === "allahabad-hc-hindi")).toMatchObject({ requiredLayoutId: "inscript", requiredDisplayFontId: "mangal" });
    expect(getExamProfilesForLayout("english-qwerty").every((profile) => profile.language === "en")).toBe(true);
    expect(getExamProfilesForLayout("inscript").every((profile) => profile.language === "hi")).toBe(true);
    const profile = getExamProfilesForLayout("inscript")[0];
    const passage = getExamPassage(profile, "inscript");
    expect(passage.layoutId).toBe("inscript");
    expect(passage.target.trim().split(/\s+/u).length).toBeGreaterThanOrEqual(500);
    expect(typingSourceToUnicode(passage.keys, "inscript").output).toBe(passage.target);
  });
});
