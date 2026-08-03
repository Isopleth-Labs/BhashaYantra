import { getCurriculumCourse, type CurriculumExercise } from "@/domain/training/curriculum-catalog";
import { buildOfficialStylePassage } from "@/domain/training/exam-passage-bank";
import { typingSourceToUnicode, unicodeToTypingSource } from "@/domain/typing/typing-engine";
import type { ReadyTypingLayoutId, TypingLanguageCode, UnicodeDisplayFontId } from "@/domain/typing/typing-profiles";

export type BackspacePolicy = "full" | "current-word" | "disabled";
export type ExamCategory = "general" | "ssc" | "rrb" | "dda" | "dsssb" | "cpct" | "rajasthan-court" | "allahabad-court";
export type ExamScoringModel = "correct-wpm" | "net-wpm" | "kdph" | "rrb-wpm";
export type ExamVerification = "practice" | "official-reference";

export interface ExamProfile {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly authority: string;
  readonly category: ExamCategory;
  readonly language: TypingLanguageCode;
  readonly durationSeconds: number;
  readonly targetWpm: number;
  readonly targetKdph?: number;
  readonly minimumAccuracy: number;
  readonly scoringModel: ExamScoringModel;
  readonly backspacePolicy: BackspacePolicy;
  readonly expectedWords: number;
  readonly passageOffset: number;
  readonly tier: "free" | "pro";
  readonly verification: ExamVerification;
  readonly verifiedOn: string;
  readonly officialSourceUrl?: string;
  readonly officialSourceLabel?: string;
  readonly requiredLayoutLabel?: string;
  readonly requiredLayoutId?: ReadyTypingLayoutId;
  readonly allowedLayoutIds?: readonly ReadyTypingLayoutId[];
  readonly requiredDisplayFontId?: UnicodeDisplayFontId;
  readonly rules: readonly string[];
  readonly disclaimer: string;
}

const RULE_DISCLAIMER = "Official notices can change. Compare this profile with the notice for your own recruitment cycle before the real test.";
const PRACTICE_DISCLAIMER = "Flexible practice profile. This is not tied to a specific recruitment notice.";

export const EXAM_PROFILES: readonly ExamProfile[] = [
  {
    id: "general-english", name: "English Baseline", shortName: "Baseline EN", authority: "BhashaYantra",
    category: "general", language: "en", durationSeconds: 300, targetWpm: 30, minimumAccuracy: 90,
    scoringModel: "correct-wpm", backspacePolicy: "full", expectedWords: 300, passageOffset: 0, tier: "free",
    verification: "practice", verifiedOn: "2026-08-03", rules: ["Flexible five-minute diagnostic", "Full correction enabled"], disclaimer: PRACTICE_DISCLAIMER,
  },
  {
    id: "general-hindi", name: "Hindi Baseline", shortName: "Baseline HI", authority: "BhashaYantra",
    category: "general", language: "hi", durationSeconds: 300, targetWpm: 25, minimumAccuracy: 90,
    scoringModel: "correct-wpm", backspacePolicy: "full", expectedWords: 250, passageOffset: 1, tier: "free",
    verification: "practice", verifiedOn: "2026-08-03", rules: ["Flexible five-minute diagnostic", "Full correction enabled"], disclaimer: PRACTICE_DISCLAIMER,
  },
  {
    id: "ssc-chsl-english", name: "SSC CHSL LDC/JSA — English", shortName: "SSC CHSL EN", authority: "Staff Selection Commission",
    category: "ssc", language: "en", durationSeconds: 600, targetWpm: 35, targetKdph: 10500, minimumAccuracy: 0,
    scoringModel: "correct-wpm", backspacePolicy: "full", expectedWords: 350, passageOffset: 7, tier: "pro",
    verification: "official-reference", verifiedOn: "2026-08-03",
    officialSourceUrl: "https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_chsl_2025.pdf",
    officialSourceLabel: "SSC CHSL 2025 notice",
    rules: ["10-minute typing test", "35 WPM equals about 10,500 KDPH", "Corrections are allowed within the test time"], disclaimer: RULE_DISCLAIMER,
  },
  {
    id: "ssc-chsl-hindi", name: "SSC CHSL LDC/JSA — Hindi", shortName: "SSC CHSL HI", authority: "Staff Selection Commission",
    category: "ssc", language: "hi", durationSeconds: 600, targetWpm: 30, targetKdph: 9000, minimumAccuracy: 0,
    scoringModel: "correct-wpm", backspacePolicy: "full", expectedWords: 300, passageOffset: 9, tier: "pro",
    verification: "official-reference", verifiedOn: "2026-08-03", allowedLayoutIds: ["classic-hindi", "inscript", "remington-gail", "remington-cbi"],
    officialSourceUrl: "https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_chsl_2025.pdf",
    officialSourceLabel: "SSC CHSL 2025 notice",
    rules: ["10-minute typing test", "30 WPM equals about 9,000 KDPH", "Corrections are allowed within the test time"], disclaimer: RULE_DISCLAIMER,
  },
  {
    id: "rrb-ntpc-english", name: "RRB NTPC CBTST 2025 — English", shortName: "RRB NTPC EN", authority: "Railway Recruitment Boards",
    category: "rrb", language: "en", durationSeconds: 600, targetWpm: 30, minimumAccuracy: 0,
    scoringModel: "rrb-wpm", backspacePolicy: "disabled", expectedWords: 300, passageOffset: 11, tier: "pro",
    verification: "official-reference", verifiedOn: "2026-08-04", allowedLayoutIds: ["english-qwerty"],
    officialSourceUrl: "https://www.rrbcdg.gov.in/uploads/2024/05-NTPCG/052024-CBTST_Instructions.pdf",
    officialSourceLabel: "RRB NTPC CBTST instructions dated 22 December 2025",
    rules: ["One-minute warm-up, 30-second break, then a 10-minute evaluated test", "Type at least 300 English words; the passage may restart after completion", "Editing tools and spell-check are not permitted", "The practice score follows the published formula; official software controls full/half-mistake classification"], disclaimer: RULE_DISCLAIMER,
  },
  {
    id: "rrb-ntpc-hindi", name: "RRB NTPC CBTST 2025 — Hindi", shortName: "RRB NTPC HI", authority: "Railway Recruitment Boards",
    category: "rrb", language: "hi", durationSeconds: 600, targetWpm: 25, minimumAccuracy: 0,
    scoringModel: "rrb-wpm", backspacePolicy: "disabled", expectedWords: 250, passageOffset: 12, tier: "pro",
    verification: "official-reference", verifiedOn: "2026-08-04", allowedLayoutIds: ["classic-hindi", "inscript"],
    requiredLayoutLabel: "KrutiDev or Mangal, as listed in the RRB notice",
    officialSourceUrl: "https://www.rrbcdg.gov.in/uploads/2024/05-NTPCG/052024-CBTST_Instructions.pdf",
    officialSourceLabel: "RRB NTPC CBTST instructions dated 22 December 2025",
    rules: ["One-minute warm-up, 30-second break, then a 10-minute evaluated test", "Type at least 250 Hindi words; the passage may restart after completion", "Editing tools and spell-check are not permitted", "The practice score follows the published formula; official software controls full/half-mistake classification"], disclaimer: RULE_DISCLAIMER,
  },
  {
    id: "dda-stenographer-english", name: "DDA Stenographer Grade C/PA 2025 — English", shortName: "DDA EN", authority: "Delhi Development Authority",
    category: "dda", language: "en", durationSeconds: 600, targetWpm: 40, targetKdph: 12000, minimumAccuracy: 0,
    scoringModel: "correct-wpm", backspacePolicy: "full", expectedWords: 400, passageOffset: 15, tier: "pro",
    verification: "official-reference", verifiedOn: "2026-08-04", allowedLayoutIds: ["english-qwerty"],
    officialSourceUrl: "https://dda.gov.in/sites/default/files/Personnel/circular_no_2911062025.pdf",
    officialSourceLabel: "DDA Circular 29/2025",
    rules: ["10-minute typing speed test", "English qualifying speed is 40 WPM", "The circular specifies the SSC CGL/CHSL module in Soni Typing Tutor"], disclaimer: RULE_DISCLAIMER,
  },
  {
    id: "dda-stenographer-hindi", name: "DDA Stenographer Grade C/PA 2025 — Hindi", shortName: "DDA HI", authority: "Delhi Development Authority",
    category: "dda", language: "hi", durationSeconds: 600, targetWpm: 35, targetKdph: 10500, minimumAccuracy: 0,
    scoringModel: "correct-wpm", backspacePolicy: "full", expectedWords: 350, passageOffset: 16, tier: "pro",
    verification: "official-reference", verifiedOn: "2026-08-04", allowedLayoutIds: ["remington-gail", "inscript", "remington-cbi"],
    requiredLayoutLabel: "Remington GAIL, InScript, or Remington CBI",
    officialSourceUrl: "https://dda.gov.in/sites/default/files/Personnel/circular_no_2911062025.pdf",
    officialSourceLabel: "DDA Circular 29/2025",
    rules: ["10-minute typing speed test", "Hindi qualifying speed is 35 WPM", "The circular specifies the SSC CGL/CHSL Soni module and three Hindi keyboard layouts"], disclaimer: RULE_DISCLAIMER,
  },
  {
    id: "dsssb-802-23-english", name: "DSSSB Post Code 802/23 — English", shortName: "DSSSB EN", authority: "Delhi Subordinate Services Selection Board",
    category: "dsssb", language: "en", durationSeconds: 600, targetWpm: 35, targetKdph: 10500, minimumAccuracy: 0,
    scoringModel: "correct-wpm", backspacePolicy: "full", expectedWords: 350, passageOffset: 19, tier: "pro",
    verification: "official-reference", verifiedOn: "2026-08-04", allowedLayoutIds: ["english-qwerty"],
    officialSourceUrl: "https://dsssb.delhi.gov.in/dsssb/general-instructions-candidates-typing-skill-test-various-posts-grade-ivjunior-0",
    officialSourceLabel: "DSSSB 802/23 instructions dated 16 July 2026",
    rules: ["Screen-to-screen computer typing test", "10-minute duration at 35 WPM in English", "DSSSB provides the computer and keyboard; use its live mock to confirm the current interface"], disclaimer: RULE_DISCLAIMER,
  },
  {
    id: "dsssb-802-23-hindi", name: "DSSSB Post Code 802/23 — Hindi", shortName: "DSSSB HI", authority: "Delhi Subordinate Services Selection Board",
    category: "dsssb", language: "hi", durationSeconds: 600, targetWpm: 30, targetKdph: 9000, minimumAccuracy: 0,
    scoringModel: "correct-wpm", backspacePolicy: "full", expectedWords: 300, passageOffset: 20, tier: "pro",
    verification: "official-reference", verifiedOn: "2026-08-04", allowedLayoutIds: ["classic-hindi", "remington-gail", "inscript"],
    requiredLayoutLabel: "KrutiDev or Mangal using Remington GAIL or InScript",
    officialSourceUrl: "https://dsssb.delhi.gov.in/dsssb/general-instructions-candidates-typing-skill-test-various-posts-grade-ivjunior-0",
    officialSourceLabel: "DSSSB 802/23 instructions dated 16 July 2026",
    rules: ["Screen-to-screen computer typing test", "10-minute duration at 30 WPM in Hindi", "The instructions list KrutiDev/Mangal with Remington GAIL/InScript"], disclaimer: RULE_DISCLAIMER,
  },
  {
    id: "ssc-dest-8000", name: "SSC Data Entry — 8,000 KDPH", shortName: "SSC DEST 8K", authority: "Staff Selection Commission",
    category: "ssc", language: "en", durationSeconds: 900, targetWpm: 27, targetKdph: 8000, minimumAccuracy: 0,
    scoringModel: "kdph", backspacePolicy: "full", expectedWords: 440, passageOffset: 13, tier: "pro",
    verification: "official-reference", verifiedOn: "2026-08-03",
    officialSourceUrl: "https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_chsl_2025.pdf",
    officialSourceLabel: "SSC CHSL 2025 notice",
    rules: ["15-minute skill test", "Printed or on-screen matter contains about 2,000–2,200 key depressions", "Target is based on correct key depressions"], disclaimer: RULE_DISCLAIMER,
  },
  {
    id: "ssc-dest-15000", name: "SSC Data Entry — 15,000 KDPH", shortName: "SSC DEST 15K", authority: "Staff Selection Commission",
    category: "ssc", language: "en", durationSeconds: 900, targetWpm: 50, targetKdph: 15000, minimumAccuracy: 0,
    scoringModel: "kdph", backspacePolicy: "full", expectedWords: 800, passageOffset: 17, tier: "pro",
    verification: "official-reference", verifiedOn: "2026-08-03",
    officialSourceUrl: "https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_chsl_2025.pdf",
    officialSourceLabel: "SSC CHSL 2025 notice",
    rules: ["15-minute skill test", "Matter contains about 3,700–4,000 key depressions", "Target is based on correct key depressions"], disclaimer: RULE_DISCLAIMER,
  },
  {
    id: "cpct-english", name: "MP CPCT — English", shortName: "CPCT EN", authority: "MAP_IT / CPCT",
    category: "cpct", language: "en", durationSeconds: 900, targetWpm: 30, minimumAccuracy: 0,
    scoringModel: "net-wpm", backspacePolicy: "full", expectedWords: 450, passageOffset: 21, tier: "pro",
    verification: "official-reference", verifiedOn: "2026-08-03",
    officialSourceUrl: "https://www.cpct.mp.gov.in/per/g01/pub/1172/ASM/WebPortal/1/Hindi/PDF/CPCT_Rule_book-V1.4.pdf",
    officialSourceLabel: "CPCT Rule Book v1.4",
    rules: ["15-minute English typing module", "Minimum qualifying speed is 30 NWPM", "Unrestricted typing permits correction and deletion"], disclaimer: RULE_DISCLAIMER,
  },
  {
    id: "cpct-hindi", name: "MP CPCT — Hindi Unicode", shortName: "CPCT HI", authority: "MAP_IT / CPCT",
    category: "cpct", language: "hi", durationSeconds: 900, targetWpm: 20, minimumAccuracy: 0,
    scoringModel: "net-wpm", backspacePolicy: "full", expectedWords: 300, passageOffset: 25, tier: "pro",
    verification: "official-reference", verifiedOn: "2026-08-03", requiredLayoutLabel: "Unicode Hindi; practise the layout named in the current CPCT instructions",
    officialSourceUrl: "https://www.cpct.mp.gov.in/per/g01/pub/1172/ASM/WebPortal/1/Hindi/PDF/CPCT_Rule_book-V1.4.pdf",
    officialSourceLabel: "CPCT Rule Book v1.4",
    rules: ["15-minute Hindi typing module", "Minimum qualifying speed is 20 NWPM", "Unrestricted typing permits correction and deletion"], disclaimer: RULE_DISCLAIMER,
  },
  {
    id: "rajasthan-hc-english", name: "Rajasthan High Court LDC — English", shortName: "RHC LDC EN", authority: "Rajasthan High Court",
    category: "rajasthan-court", language: "en", durationSeconds: 600, targetWpm: 27, targetKdph: 8000, minimumAccuracy: 0,
    scoringModel: "kdph", backspacePolicy: "disabled", expectedWords: 270, passageOffset: 31, tier: "pro",
    verification: "official-reference", verifiedOn: "2026-08-03",
    officialSourceUrl: "https://hcraj.nic.in/hcraj/latestupdates/rulessubcourts08022017.pdf",
    officialSourceLabel: "Rajasthan subordinate-court rules",
    rules: ["10-minute speed paper", "Minimum speed is 8,000 KDPH", "Correction and navigation restrictions are simulated"], disclaimer: RULE_DISCLAIMER,
  },
  {
    id: "rajasthan-hc-hindi", name: "Rajasthan High Court LDC — Hindi", shortName: "RHC LDC HI", authority: "Rajasthan High Court",
    category: "rajasthan-court", language: "hi", durationSeconds: 600, targetWpm: 27, targetKdph: 8000, minimumAccuracy: 0,
    scoringModel: "kdph", backspacePolicy: "disabled", expectedWords: 270, passageOffset: 35, tier: "pro",
    verification: "official-reference", verifiedOn: "2026-08-03",
    officialSourceUrl: "https://hcraj.nic.in/hcraj/recruitment/Instructions-ldc-26102017.pdf",
    officialSourceLabel: "Rajasthan High Court speed-test instructions",
    rules: ["10-minute Hindi speed test; dual-language candidates receive five minutes per language", "Backspace and navigation keys are disabled", "The software stops automatically when time expires"], disclaimer: RULE_DISCLAIMER,
  },
  {
    id: "allahabad-hc-english", name: "Allahabad High Court Group C — English", shortName: "AHC Group C EN", authority: "Allahabad High Court",
    category: "allahabad-court", language: "en", durationSeconds: 600, targetWpm: 30, minimumAccuracy: 0,
    scoringModel: "correct-wpm", backspacePolicy: "full", expectedWords: 300, passageOffset: 41, tier: "pro",
    verification: "official-reference", verifiedOn: "2026-08-03",
    officialSourceUrl: "https://www.allahabadhighcourt.in/event/Admit_card_notice_Stenographer_GrIII.html",
    officialSourceLabel: "Allahabad High Court computer type-test scheme",
    rules: ["10-minute English computer type test", "Referenced paper contains 300 words", "Use the current recruitment notice as the final authority"], disclaimer: RULE_DISCLAIMER,
  },
  {
    id: "allahabad-hc-hindi", name: "Allahabad High Court Group C — Hindi", shortName: "AHC Group C HI", authority: "Allahabad High Court",
    category: "allahabad-court", language: "hi", durationSeconds: 600, targetWpm: 25, minimumAccuracy: 0,
    scoringModel: "correct-wpm", backspacePolicy: "full", expectedWords: 250, passageOffset: 45, tier: "pro",
    verification: "official-reference", verifiedOn: "2026-08-03", requiredLayoutLabel: "InScript keyboard with Mangal font in the referenced official instructions",
    requiredLayoutId: "inscript", requiredDisplayFontId: "mangal",
    officialSourceUrl: "https://www.allahabadhighcourt.in/event/event_5218_26-02-2019.html",
    officialSourceLabel: "Allahabad High Court Hindi type-test instruction",
    rules: ["10-minute Hindi computer type test", "Referenced paper contains 250 words", "InScript with Mangal is required by the referenced instruction"], disclaimer: RULE_DISCLAIMER,
  },
] as const;

export function getExamProfilesForLayout(layoutId: ReadyTypingLayoutId) {
  const language: TypingLanguageCode = layoutId === "english-qwerty" ? "en" : "hi";
  return EXAM_PROFILES.filter((profile) => (
    profile.language === language
    && (layoutId !== "bhashayantra-smart" || profile.verification === "practice")
    && (!profile.allowedLayoutIds || profile.allowedLayoutIds.includes(layoutId))
    && (!profile.requiredLayoutId || profile.requiredLayoutId === layoutId)
  )).sort((left, right) => {
    if (left.verification !== right.verification) return left.verification === "official-reference" ? -1 : 1;
    return EXAM_PROFILES.indexOf(left) - EXAM_PROFILES.indexOf(right);
  });
}

export function getExamPassage(profile: ExamProfile, layoutId: ReadyTypingLayoutId, attemptIndex = 0): CurriculumExercise {
  const course = getCurriculumCourse(layoutId);
  const paragraphs = course.stages.find((stage) => stage.id === "paragraphs")?.exercises ?? [];
  if (paragraphs.length === 0) throw new Error(`No paragraph exercises exist for ${layoutId}.`);
  const requiredWords = Math.max(profile.expectedWords + 80, 500);
  const seed = paragraphs[(profile.passageOffset + attemptIndex) % paragraphs.length];

  if (layoutId !== "bhashayantra-smart") {
    const rawTarget = buildOfficialStylePassage(profile.language, profile.passageOffset + attemptIndex, requiredWords);
    // KrutiDev-derived key maps use the physical comma key for ए. Keep official
    // practice copy limited to punctuation the selected layout can reproduce.
    const target = layoutId === "classic-hindi" || layoutId === "remington-gail"
      ? rawTarget.replaceAll(",", "")
      : rawTarget;
    const sourceResult = unicodeToTypingSource(target, layoutId);
    const roundTrip = typingSourceToUnicode(sourceResult.output, layoutId);
    const keys = sourceResult.output;
    return {
      ...seed,
      id: `${layoutId}-${profile.id}-mock-${String(attemptIndex + 1).padStart(3, "0")}`,
      sequence: attemptIndex + 1,
      title: `${profile.name} · Paper ${attemptIndex + 1}`,
      keys,
      target,
      drillBlocks: [{
        label: "Official-style screen copy",
        purpose: "Practise an original administrative passage using the selected public exam rule profile.",
        keys,
        target,
      }],
      focusKeys: Array.from(new Set(Array.from(keys.toLocaleLowerCase()).filter((key) => /[^\s]/u.test(key)))).slice(0, 18),
      estimatedSeconds: profile.durationSeconds,
      wordCount: target.trim().split(/\s+/u).length,
      characterCount: Array.from(keys).length,
      tier: profile.tier,
      conversionWarnings: sourceResult.warnings.length + roundTrip.warnings.length + (roundTrip.output === target ? 0 : 1),
    };
  }

  const selected: CurriculumExercise[] = [];
  let wordCount = 0;
  let offset = 0;

  while (wordCount < requiredWords && offset < paragraphs.length) {
    const paragraph = paragraphs[(profile.passageOffset + attemptIndex + offset) % paragraphs.length];
    selected.push(paragraph);
    wordCount += paragraph.target.trim().split(/\s+/u).length;
    offset += 1;
  }

  const smartSeed = selected[0];
  return {
    ...smartSeed,
    id: `${layoutId}-${profile.id}-mock-${String(attemptIndex + 1).padStart(3, "0")}`,
    sequence: attemptIndex + 1,
    title: `${profile.name} · Paper ${attemptIndex + 1}`,
    keys: selected.map((paragraph) => paragraph.keys).join("\n\n"),
    target: selected.map((paragraph) => paragraph.target).join("\n\n"),
    focusKeys: Array.from(new Set(selected.flatMap((paragraph) => paragraph.focusKeys))).slice(0, 18),
    estimatedSeconds: profile.durationSeconds,
    tier: profile.tier,
    conversionWarnings: selected.reduce((total, paragraph) => total + paragraph.conversionWarnings, 0),
  };
}
