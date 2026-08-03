import { getCurriculumCourse, type CurriculumExercise } from "@/domain/training/curriculum-catalog";
import type { ReadyTypingLayoutId, TypingLanguageCode } from "@/domain/typing/typing-profiles";

export type BackspacePolicy = "full" | "current-word" | "disabled";
export type ExamCategory = "general" | "ssc-style" | "railway-style" | "cpct-style" | "court-style" | "data-entry";

export interface ExamProfile {
  readonly id: string;
  readonly name: string;
  readonly category: ExamCategory;
  readonly language: TypingLanguageCode;
  readonly durationSeconds: number;
  readonly targetWpm: number;
  readonly minimumAccuracy: number;
  readonly backspacePolicy: BackspacePolicy;
  readonly passageOffset: number;
  readonly tier: "free" | "pro";
  readonly disclaimer: string;
}

const RULE_DISCLAIMER = "Practice simulation only. Verify duration, scoring, and backspace rules in the current official exam notice.";

export const EXAM_PROFILES: readonly ExamProfile[] = [
  { id: "general-english", name: "General English Speed Test", category: "general", language: "en", durationSeconds: 300, targetWpm: 30, minimumAccuracy: 90, backspacePolicy: "full", passageOffset: 0, tier: "free", disclaimer: RULE_DISCLAIMER },
  { id: "general-hindi", name: "General Hindi Speed Test", category: "general", language: "hi", durationSeconds: 300, targetWpm: 25, minimumAccuracy: 90, backspacePolicy: "full", passageOffset: 1, tier: "free", disclaimer: RULE_DISCLAIMER },
  { id: "ssc-english-style", name: "SSC-style English Simulation", category: "ssc-style", language: "en", durationSeconds: 600, targetWpm: 35, minimumAccuracy: 90, backspacePolicy: "full", passageOffset: 7, tier: "pro", disclaimer: RULE_DISCLAIMER },
  { id: "ssc-hindi-style", name: "SSC-style Hindi Simulation", category: "ssc-style", language: "hi", durationSeconds: 600, targetWpm: 30, minimumAccuracy: 90, backspacePolicy: "full", passageOffset: 9, tier: "pro", disclaimer: RULE_DISCLAIMER },
  { id: "railway-style", name: "Railway-style Typing Simulation", category: "railway-style", language: "en", durationSeconds: 600, targetWpm: 30, minimumAccuracy: 90, backspacePolicy: "current-word", passageOffset: 15, tier: "pro", disclaimer: RULE_DISCLAIMER },
  { id: "cpct-hindi-style", name: "CPCT-style Hindi Simulation", category: "cpct-style", language: "hi", durationSeconds: 900, targetWpm: 25, minimumAccuracy: 85, backspacePolicy: "full", passageOffset: 21, tier: "pro", disclaimer: RULE_DISCLAIMER },
  { id: "court-hindi-style", name: "Court-style Hindi Simulation", category: "court-style", language: "hi", durationSeconds: 600, targetWpm: 25, minimumAccuracy: 90, backspacePolicy: "disabled", passageOffset: 31, tier: "pro", disclaimer: RULE_DISCLAIMER },
  { id: "data-entry-english", name: "English Data-entry Accuracy", category: "data-entry", language: "en", durationSeconds: 900, targetWpm: 40, minimumAccuracy: 95, backspacePolicy: "current-word", passageOffset: 37, tier: "pro", disclaimer: RULE_DISCLAIMER },
] as const;

export function getExamProfilesForLayout(layoutId: ReadyTypingLayoutId) {
  const language: TypingLanguageCode = layoutId === "english-qwerty" ? "en" : "hi";
  return EXAM_PROFILES.filter((profile) => profile.language === language);
}

export function getExamPassage(profile: ExamProfile, layoutId: ReadyTypingLayoutId, attemptIndex = 0): CurriculumExercise {
  const course = getCurriculumCourse(layoutId);
  const paragraphs = course.stages.find((stage) => stage.id === "paragraphs")?.exercises ?? [];
  if (paragraphs.length === 0) throw new Error(`No paragraph exercises exist for ${layoutId}.`);
  const selected: CurriculumExercise[] = [];
  let wordCount = 0;
  let offset = 0;

  while (wordCount < 1200 && offset < paragraphs.length) {
    const paragraph = paragraphs[(profile.passageOffset + attemptIndex + offset) % paragraphs.length];
    selected.push(paragraph);
    wordCount += paragraph.target.trim().split(/\s+/u).length;
    offset += 1;
  }

  const seed = selected[0];
  return {
    ...seed,
    id: `${layoutId}-${profile.id}-mock-${String(attemptIndex + 1).padStart(3, "0")}`,
    sequence: attemptIndex + 1,
    title: `${profile.name} Mock ${attemptIndex + 1}`,
    keys: selected.map((paragraph) => paragraph.keys).join("\n\n"),
    target: selected.map((paragraph) => paragraph.target).join("\n\n"),
    focusKeys: Array.from(new Set(selected.flatMap((paragraph) => paragraph.focusKeys))).slice(0, 18),
    estimatedSeconds: profile.durationSeconds,
    tier: profile.tier,
    conversionWarnings: selected.reduce((total, paragraph) => total + paragraph.conversionWarnings, 0),
  };
}
