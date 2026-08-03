import { typingSourceToUnicode, unicodeToTypingSource } from "@/domain/typing/typing-engine";
import { TYPING_LAYOUT_PROFILES, type ReadyTypingLayoutId, type TypingLanguageCode } from "@/domain/typing/typing-profiles";

export type CurriculumStageId = "learn-keys" | "practice-words" | "sentences" | "paragraphs";
export type ExerciseTier = "free" | "pro";

export interface CurriculumExercise {
  readonly id: string;
  readonly layoutId: ReadyTypingLayoutId;
  readonly stageId: CurriculumStageId;
  readonly sequence: number;
  readonly title: string;
  readonly keys: string;
  readonly target: string;
  readonly focusKeys: readonly string[];
  readonly difficulty: 1 | 2 | 3 | 4 | 5;
  readonly estimatedSeconds: number;
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

const HINDI_SYLLABLES = [
  "ka", "ki", "ku", "ke", "kai", "ko", "kau", "kha", "ga", "gi", "gu", "ge",
  "cha", "chha", "ja", "jha", "ta", "ti", "tu", "te", "tha", "da", "di", "du",
  "na", "ni", "nu", "ne", "pa", "pi", "pu", "pe", "pha", "ba", "bi", "bu",
  "bha", "ma", "mi", "mu", "ya", "ra", "la", "va", "sha", "sa", "ha", "ksh",
] as const;

const HINDI_WORDS = [
  "aaj", "aap", "abhyas", "adhikar", "apna", "aur", "avsar", "bharat", "bhasha", "bhashayantra",
  "desh", "dhanyavad", "dhyan", "din", "galti", "gati", "ghar", "gyan", "hai", "hain",
  "ham", "har", "hindi", "jeevan", "ka", "kaam", "kare", "karen", "kary", "ke",
  "ki", "ko", "koshish", "lakshya", "main", "mehnat", "mera", "milta", "naam", "namaste",
  "naya", "nahi", "naukari", "niyam", "nyay", "pariksha", "parinam", "pahle", "pragati", "pratidin",
  "prayas", "pura", "rakhen", "roz", "safal", "safalta", "sahi", "samay", "se", "shabd",
  "shiksha", "shuddh", "shuddhata", "sikhen", "sudhar", "taiyari", "tez", "typing", "unicode", "upyog",
  "vidya", "vishvas", "yantra", "yah", "zaruri",
] as const;

const HINDI_SENTENCES = [
  "mera naam bhasha yantra hai.",
  "hindi hamari bhasha hai.",
  "bharat mera desh hai.",
  "ham roz abhyas karen.",
  "aap samay ka sahi upyog karen.",
  "pariksha ki taiyari pratidin karen.",
  "sahi gati ke sath shuddh typing karen.",
  "lakshya par vishvas rakhen.",
  "har din naya avsar hai.",
  "shiksha se gyan milta hai.",
  "niyam aur samay safalta ke aadhar hain.",
  "kaam ko dhyan se pura karen.",
  "galti se sikhen aur sudhar karen.",
  "parinam se pahle prayas zaruri hai.",
  "apna kary samay par pura karen.",
  "har shabd ko dhyan se dekhen.",
  "chhote kadam pragati late hain.",
  "gati ke sath shuddhata bhi zaruri hai.",
  "abhyas se vishvas milta hai.",
  "hindi typing ka abhyas karen.",
  "unicode text har jagah upyog karen.",
  "mehnat aur niyam se lakshya pura hota hai.",
  "aaj ka abhyas kal ki safalta hai.",
  "tez gati se pahle shuddhata par dhyan den.",
  "naukari ki pariksha ke liye taiyari karen.",
  "nyay aur adhikar ka gyan zaruri hai.",
  "bhashayantra me hindi typing saral hai.",
  "har galti sudhar ka naya avsar hai.",
  "samay aur prayas se pragati milti hai.",
  "namaste bharat, hindi ka abhyas karen.",
] as const;

const ENGLISH_KEY_GROUPS = [
  "asdf jkl;", "fj fj dk dk", "as as df df", "jk jk l; l;", "qwer uiop", "ty ty gh gh",
  "zxcv nm,.", "er er ui ui", "cv cv nm nm", "1234 5678 90", "shift key", "home row",
] as const;

const ENGLISH_WORDS = [
  "accuracy", "advance", "answer", "browser", "career", "careful", "complete", "computer", "correct", "course",
  "daily", "document", "efficient", "english", "exercise", "focus", "future", "goal", "government", "improve",
  "keyboard", "knowledge", "language", "learn", "lesson", "office", "paragraph", "practice", "progress", "result",
  "review", "rhythm", "sentence", "skill", "speed", "student", "success", "target", "test", "training",
  "typing", "unicode", "verify", "window", "word", "work", "write", "number", "symbol", "report",
  "attempt", "timer", "history", "mistake", "finger", "layout", "custom", "offline", "secure", "quality",
] as const;

const ENGLISH_SENTENCES = [
  "Accuracy grows with calm and regular practice.",
  "Keep your fingers close to the home row.",
  "Read the complete passage before the test starts.",
  "Use a steady rhythm and avoid unnecessary corrections.",
  "Daily practice improves both speed and confidence.",
  "Focus on correct keys before increasing your speed.",
  "The quick brown fox jumps over the lazy dog.",
  "A clear goal makes every practice session useful.",
  "Review weak keys after each completed exercise.",
  "Typing tests reward accuracy as well as speed.",
  "Keep your eyes on the passage and not the keyboard.",
  "Small improvements create strong long term results.",
  "A focused learner corrects each repeated mistake.",
  "Practice numbers and symbols with the same care.",
  "Use the selected layout throughout the full test.",
  "Read instructions and verify every exam setting.",
  "Office work needs accurate words and clean formatting.",
  "Good posture keeps both hands relaxed while typing.",
  "Measure progress with consistent and fair exercises.",
  "Complete one lesson before moving to the next stage.",
  "BhashaYantra keeps core typing available offline.",
  "A useful report explains speed accuracy and mistakes.",
  "Custom layouts should never damage protected defaults.",
  "Careful practice builds reliable muscle memory.",
  "Start slowly and let correct movement become natural.",
  "The timer begins only after the first key is entered.",
  "Every result should record the scoring rules used.",
  "A secure desktop app protects private source documents.",
  "Practice difficult combinations until they feel easy.",
  "Finish the paragraph with accuracy and confidence.",
] as const;

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

function rotate<T>(items: readonly T[], start: number, length: number) {
  return Array.from({ length }, (_, offset) => items[(start + offset) % items.length]);
}

function buildRomanSeed(stageId: CurriculumStageId, index: number) {
  if (stageId === "learn-keys") {
    return rotate(HINDI_SYLLABLES, index % HINDI_SYLLABLES.length, 8 + Math.floor(index / HINDI_SYLLABLES.length)).join(" ");
  }
  if (stageId === "practice-words") {
    return rotate(HINDI_WORDS, index % HINDI_WORDS.length, 7 + Math.floor(index / HINDI_WORDS.length)).join(" ");
  }
  if (stageId === "sentences") {
    return rotate(HINDI_SENTENCES, index % HINDI_SENTENCES.length, 1 + Math.floor(index / HINDI_SENTENCES.length)).join(" ").replace(/[.,]/gu, "");
  }
  return rotate(HINDI_SENTENCES, index % HINDI_SENTENCES.length, 4 + Math.floor(index / HINDI_SENTENCES.length)).join(" ").replace(/[.,]/gu, "");
}

function buildEnglishSeed(stageId: CurriculumStageId, index: number) {
  if (stageId === "learn-keys") {
    return rotate(ENGLISH_KEY_GROUPS, index % ENGLISH_KEY_GROUPS.length, 3 + Math.floor(index / ENGLISH_KEY_GROUPS.length)).join("   ");
  }
  if (stageId === "practice-words") {
    return rotate(ENGLISH_WORDS, index % ENGLISH_WORDS.length, 8 + Math.floor(index / ENGLISH_WORDS.length)).join(" ");
  }
  if (stageId === "sentences") {
    return rotate(ENGLISH_SENTENCES, index % ENGLISH_SENTENCES.length, 1 + Math.floor(index / ENGLISH_SENTENCES.length)).join(" ");
  }
  return rotate(ENGLISH_SENTENCES, index % ENGLISH_SENTENCES.length, 4 + Math.floor(index / ENGLISH_SENTENCES.length)).join(" ");
}

function focusKeysFor(value: string) {
  return Array.from(new Set(Array.from(value.toLocaleLowerCase()).filter((key) => /[^\s]/u.test(key)))).slice(0, 12);
}

function buildExercise(
  layoutId: ReadyTypingLayoutId,
  stage: (typeof STAGE_DEFINITIONS)[number],
  index: number,
): CurriculumExercise {
  const isEnglish = layoutId === "english-qwerty";
  const canonicalKeys = isEnglish ? buildEnglishSeed(stage.id, index) : buildRomanSeed(stage.id, index);
  const canonicalTarget = typingSourceToUnicode(canonicalKeys, isEnglish ? "english-qwerty" : "bhashayantra-smart").output;
  const sourceResult = layoutId === "bhashayantra-smart" || isEnglish
    ? { output: canonicalKeys, warnings: [] as const }
    : unicodeToTypingSource(canonicalTarget, layoutId);
  const roundTrip = typingSourceToUnicode(sourceResult.output, layoutId);
  const keys = sourceResult.output;
  const sequence = index + 1;

  return {
    id: `${layoutId}-${stage.id}-${String(sequence).padStart(3, "0")}`,
    layoutId,
    stageId: stage.id,
    sequence,
    title: `${stage.title} ${sequence}`,
    keys,
    target: canonicalTarget,
    focusKeys: focusKeysFor(keys),
    difficulty: stage.difficulty,
    estimatedSeconds: Math.max(30, Math.ceil(Array.from(keys).length / 2)),
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
