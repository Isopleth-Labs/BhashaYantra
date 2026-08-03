import { typingSourceToUnicode, unicodeToTypingSource } from "@/domain/typing/typing-engine";
import { TYPING_LAYOUT_PROFILES, type ReadyTypingLayoutId, type TypingLanguageCode } from "@/domain/typing/typing-profiles";
import { buildCanonicalLesson } from "@/domain/training/curriculum-content";

export type CurriculumStageId = "learn-keys" | "practice-words" | "sentences" | "paragraphs";
export type ExerciseTier = "free" | "pro";

export interface CurriculumExercise {
  readonly id: string;
  readonly layoutId: ReadyTypingLayoutId;
  readonly stageId: CurriculumStageId;
  readonly sequence: number;
  readonly title: string;
  readonly moduleTitle: string;
  readonly drillLabel: string;
  readonly objective: string;
  readonly keys: string;
  readonly target: string;
  readonly focusKeys: readonly string[];
  readonly difficulty: 1 | 2 | 3 | 4 | 5;
  readonly estimatedSeconds: number;
  readonly minimumAccuracy: number;
  readonly targetWpm: number;
  readonly wordCount: number;
  readonly characterCount: number;
  readonly tier: ExerciseTier;
  readonly conversionWarnings: number;
}

export interface CurriculumStage {
  readonly id: CurriculumStageId;
  readonly title: string;
  readonly description: string;
  readonly exercises: readonly CurriculumExercise[];
}

export interface CurriculumCourse {
  readonly id: string;
  readonly layoutId: ReadyTypingLayoutId;
  readonly language: TypingLanguageCode;
  readonly title: string;
  readonly description: string;
  readonly instructions: readonly string[];
  readonly stages: readonly CurriculumStage[];
  readonly exerciseCount: number;
}

const READY_LAYOUT_IDS: readonly ReadyTypingLayoutId[] = [
  "bhashayantra-smart",
  "classic-hindi",
  "inscript",
  "english-qwerty",
];

const STAGE_DEFINITIONS: readonly {
  readonly id: CurriculumStageId;
  readonly title: string;
  readonly description: string;
  readonly count: number;
  readonly difficulty: 1 | 2 | 3 | 4 | 5;
}[] = [
  { id: "learn-keys", title: "Learn Keys", description: "Build key and finger memory with focused repetitions.", count: 60, difficulty: 1 },
  { id: "practice-words", title: "Practice Words", description: "Combine learned keys into useful words and short groups.", count: 90, difficulty: 2 },
  { id: "sentences", title: "Type Sentences", description: "Develop rhythm, spacing, punctuation, and accuracy.", count: 90, difficulty: 3 },
  { id: "paragraphs", title: "Type Paragraphs", description: "Prepare for sustained office and exam passages.", count: 60, difficulty: 4 },
] as const;

function focusKeysFor(value: string) {
  return Array.from(new Set(Array.from(value.toLocaleLowerCase()).filter((key) => /[^\s]/u.test(key)))).slice(0, 12);
}

function buildExercise(
  layoutId: ReadyTypingLayoutId,
  stage: (typeof STAGE_DEFINITIONS)[number],
  index: number,
): CurriculumExercise {
  const isEnglish = layoutId === "english-qwerty";
  const lesson = buildCanonicalLesson(stage.id, index, isEnglish);
  const canonicalKeys = lesson.content;
  const canonicalTarget = typingSourceToUnicode(canonicalKeys, isEnglish ? "english-qwerty" : "bhashayantra-smart").output;
  const sourceResult = layoutId === "bhashayantra-smart" || isEnglish
    ? { output: canonicalKeys, warnings: [] as const }
    : unicodeToTypingSource(canonicalTarget, layoutId);
  const roundTrip = typingSourceToUnicode(sourceResult.output, layoutId);
  const keys = sourceResult.output;
  const sequence = index + 1;
  const characterCount = Array.from(keys).length;
  const wordCount = keys.trim() ? keys.trim().split(/\s+/u).length : 0;
  const difficulty = Math.min(5, stage.difficulty + Math.floor(index / Math.max(1, stage.count / 3))) as 1 | 2 | 3 | 4 | 5;

  return {
    id: `${layoutId}-${stage.id}-${String(sequence).padStart(3, "0")}`,
    layoutId,
    stageId: stage.id,
    sequence,
    title: lesson.title,
    moduleTitle: lesson.moduleTitle,
    drillLabel: lesson.drillLabel,
    objective: lesson.objective,
    keys,
    target: canonicalTarget,
    focusKeys: focusKeysFor(keys),
    difficulty,
    estimatedSeconds: Math.max(45, Math.ceil(characterCount / Math.max(1, lesson.targetWpm * 5) * 60)),
    minimumAccuracy: lesson.minimumAccuracy,
    targetWpm: lesson.targetWpm,
    wordCount,
    characterCount,
    tier: sequence <= 10 ? "free" : "pro",
    conversionWarnings: sourceResult.warnings.length + roundTrip.warnings.length + (roundTrip.output === canonicalTarget ? 0 : 1),
  };
}

const courseCache = new Map<ReadyTypingLayoutId, CurriculumCourse>();

export function getCurriculumCourse(layoutId: ReadyTypingLayoutId): CurriculumCourse {
  const cached = courseCache.get(layoutId);
  if (cached) return cached;

  const profile = TYPING_LAYOUT_PROFILES.find((item) => item.id === layoutId);
  const language: TypingLanguageCode = layoutId === "english-qwerty" ? "en" : "hi";
  const stages = STAGE_DEFINITIONS.map((stage) => ({
    id: stage.id,
    title: stage.title,
    description: stage.description,
    exercises: Array.from({ length: stage.count }, (_, index) => buildExercise(layoutId, stage, index)),
  }));
  const exerciseCount = stages.reduce((total, stage) => total + stage.exercises.length, 0);
  const course: CurriculumCourse = {
    id: `${layoutId}-complete-course-v1`,
    layoutId,
    language,
    title: `${profile?.name ?? layoutId} Complete Course`,
    description: "A structured original curriculum from key memory to sustained exam-style paragraphs.",
    instructions: [
      "Use the selected keyboard layout for the entire lesson.",
      "Prioritize accuracy before speed and review weak keys after every attempt.",
      "Complete key drills, then words, sentences, and paragraphs in order.",
      "Exam notices can change; verify current official rules before a real test.",
    ],
    stages,
    exerciseCount,
  };
  courseCache.set(layoutId, course);
  return course;
}

export function getCurriculumExercise(layoutId: ReadyTypingLayoutId, exerciseId: string) {
  const course = getCurriculumCourse(layoutId);
  return course.stages.flatMap((stage) => stage.exercises).find((exercise) => exercise.id === exerciseId);
}

export function getCurriculumCatalogSummary() {
  const courses = READY_LAYOUT_IDS.map(getCurriculumCourse);
  return {
    courseCount: courses.length,
    exerciseCount: courses.reduce((total, course) => total + course.exerciseCount, 0),
    freeExerciseCount: courses.reduce(
      (total, course) => total + course.stages.flatMap((stage) => stage.exercises).filter((exercise) => exercise.tier === "free").length,
      0,
    ),
  };
}
