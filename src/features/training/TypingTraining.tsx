import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Gauge,
  History,
  Layers3,
  RotateCcw,
  Settings2,
  Target,
  Trash2,
  Volume2,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import { Button } from "@/components/ui/button";
import { playTypingFeedback } from "@/application/typing-feedback";
import {
  getCurriculumCourse,
  type CurriculumStageId,
} from "@/domain/training/curriculum-catalog";
import {
  getExamPassage,
  getExamProfilesForLayout,
  type BackspacePolicy,
} from "@/domain/training/exam-profiles";
import type { TrainingAttempt } from "@/domain/training/training-attempt";
import {
  analyzeWeakKeys,
  calculateKdph,
  calculateTrainingScore,
  calculateWpm,
  getNextExpectedKey,
} from "@/domain/training/training-engine";
import { keyboardForLayout, typingSourceToUnicode } from "@/domain/typing/typing-engine";
import {
  getDisplayFont,
  TYPING_LAYOUT_PROFILES,
  type ReadyTypingLayoutId,
  type UnicodeDisplayFontId,
} from "@/domain/typing/typing-profiles";
import {
  LocalTrainingAttemptsRepository,
  TRAINING_ATTEMPTS_UPDATED_EVENT,
} from "@/data/repositories/local-training-attempts-repository";
import { useI18n } from "@/i18n/I18nProvider";

interface TypingTrainingProps {
  readonly kind: "practice" | "test";
  readonly layout: ReadyTypingLayoutId;
  readonly displayFont: UnicodeDisplayFontId;
}

const attemptsRepository = new LocalTrainingAttemptsRepository();
const TEST_DURATIONS = [60, 300, 600, 900] as const;

function loadBoolean(key: string, fallback: boolean) {
  const value = localStorage.getItem(key);
  return value === null ? fallback : value === "true";
}

function createAttemptId() {
  return globalThis.crypto?.randomUUID?.() ?? `attempt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function practicePositionKey(courseId: string) {
  return `bhashayantra:training:position-v1:${courseId}`;
}

export function TypingTraining({ kind, layout, displayFont }: TypingTrainingProps) {
  const { language, t } = useI18n();
  const course = useMemo(() => getCurriculumCourse(layout), [layout]);
  const examProfiles = useMemo(() => getExamProfilesForLayout(layout), [layout]);
  const [stageId, setStageId] = useState<CurriculumStageId>("learn-keys");
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [examProfileId, setExamProfileId] = useState(examProfiles[0]?.id ?? "");
  const [examAttemptIndex, setExamAttemptIndex] = useState(0);
  const [testDuration, setTestDuration] = useState(examProfiles[0]?.durationSeconds ?? 300);
  const [source, setSource] = useState("");
  const [startedAt, setStartedAt] = useState<number>();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [attemptSaved, setAttemptSaved] = useState(false);
  const [attempts, setAttempts] = useState<readonly TrainingAttempt[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(() => loadBoolean("bhashayantra:training:keyboard-v2", false));
  const [soundOnError, setSoundOnError] = useState(() => loadBoolean("bhashayantra:training:sound-v2", true));
  const [moveOnError, setMoveOnError] = useState(() => loadBoolean("bhashayantra:training:move-on-error-v2", false));
  const [preventedErrors, setPreventedErrors] = useState(0);
  const [errorPulse, setErrorPulse] = useState(false);
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem("bhashayantra:training:font-size")) || 24);
  const [backspacePolicy, setBackspacePolicy] = useState<BackspacePolicy>(kind === "practice" ? "full" : examProfiles[0]?.backspacePolicy ?? "full");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedStage = course.stages.find((stage) => stage.id === stageId) ?? course.stages[0];
  const selectedProfile = examProfiles.find((profile) => profile.id === examProfileId) ?? examProfiles[0];
  const exercise = kind === "practice"
    ? selectedStage.exercises[exerciseIndex % selectedStage.exercises.length]
    : getExamPassage(selectedProfile, layout, examAttemptIndex);
  const expected = exercise.target;
  const actual = useMemo(() => typingSourceToUnicode(source, layout).output, [layout, source]);
  const exactComplete = expected.length > 0 && actual === expected;
  const score = useMemo(() => calculateTrainingScore(expected, actual, exactComplete ? "final" : "live"), [actual, exactComplete, expected]);
  const remainingSeconds = kind === "test" ? Math.max(0, testDuration - elapsedSeconds) : 0;
  const finished = kind === "practice"
    ? score.complete
    : score.complete || (remainingSeconds === 0 && Boolean(startedAt));
  const measuredSeconds = Math.max(1, elapsedSeconds);
  const wpm = calculateWpm(score.correctCharacters, measuredSeconds);
  const kdph = calculateKdph(Array.from(source).length, measuredSeconds);
  const weakKeys = useMemo(() => analyzeWeakKeys(exercise.keys, source), [exercise.keys, source]);
  const nextExpected = useMemo(() => getNextExpectedKey(exercise.keys, source), [exercise.keys, source]);
  const keyboard = keyboardForLayout(layout);
  const courseExercises = useMemo(() => course.stages.flatMap((stage) => stage.exercises), [course]);
  const exerciseById = useMemo(() => new Map(courseExercises.map((item) => [item.id, item])), [courseExercises]);
  const masteryPasses = useMemo(() => {
    const counts = new Map<string, number>();
    attempts
      .filter((attempt) => attempt.kind === "practice" && attempt.layoutId === layout)
      .forEach((attempt) => {
        const lesson = exerciseById.get(attempt.exerciseId);
        if (!lesson || attempt.accuracy < lesson.minimumAccuracy) return;
        counts.set(attempt.exerciseId, (counts.get(attempt.exerciseId) ?? 0) + 1);
      });
    return counts;
  }, [attempts, exerciseById, layout]);
  const completedExerciseIds = useMemo(
    () => new Set(
      courseExercises
        .filter((lesson) => (masteryPasses.get(lesson.id) ?? 0) >= lesson.requiredPasses)
        .map((lesson) => lesson.id),
    ),
    [courseExercises, masteryPasses],
  );
  const layoutAttempts = attempts.filter((attempt) => attempt.layoutId === layout && attempt.kind === "practice");
  const layoutName = TYPING_LAYOUT_PROFILES.find((profile) => profile.id === layout)?.name ?? layout;
  const fontStack = getDisplayFont(displayFont).cssStack;
  const countedErrors = score.substitutedCharacters + score.extraCharacters + preventedErrors;
  const effectiveAccuracy = score.correctCharacters + countedErrors === 0
    ? 100
    : Math.round((score.correctCharacters / (score.correctCharacters + countedErrors)) * 100);
  const passed = kind === "test" && finished && wpm >= selectedProfile.targetWpm && effectiveAccuracy >= selectedProfile.minimumAccuracy;
  const lessonPassed = kind === "practice" && finished && effectiveAccuracy >= exercise.minimumAccuracy;
  const currentMasteryPasses = masteryPasses.get(exercise.id) ?? 0;
  const projectedMasteryPasses = currentMasteryPasses + (lessonPassed && !attemptSaved ? 1 : 0);
  const lessonMastered = projectedMasteryPasses >= exercise.requiredPasses;
  const moduleExercises = selectedStage.exercises.filter((item) => item.moduleTitle === exercise.moduleTitle);
  const activeBlockIndex = exercise.drillBlocks.findIndex((_, blockIndex) => {
    const previousLength = exercise.drillBlocks.slice(0, blockIndex).reduce((total, block) => total + Array.from(block.keys).length + 1, 0);
    const blockEnd = previousLength + Array.from(exercise.drillBlocks[blockIndex].keys).length;
    return Array.from(source).length <= blockEnd;
  });

  function loadAttempts() {
    void attemptsRepository.list().then(setAttempts);
  }

  useEffect(() => {
    loadAttempts();
    window.addEventListener(TRAINING_ATTEMPTS_UPDATED_EVENT, loadAttempts);
    return () => window.removeEventListener(TRAINING_ATTEMPTS_UPDATED_EVENT, loadAttempts);
  }, []);

  useEffect(() => {
    const profile = examProfiles[0];
    let nextStageId: CurriculumStageId = "learn-keys";
    let nextExerciseIndex = 0;
    if (kind === "practice") {
      try {
        const saved = JSON.parse(localStorage.getItem(practicePositionKey(course.id)) ?? "null") as { stageId?: CurriculumStageId; exerciseIndex?: number } | null;
        const savedStage = course.stages.find((stage) => stage.id === saved?.stageId);
        if (savedStage) {
          nextStageId = savedStage.id;
          nextExerciseIndex = Math.min(savedStage.exercises.length - 1, Math.max(0, Math.floor(saved?.exerciseIndex ?? 0)));
        }
      } catch {
        localStorage.removeItem(practicePositionKey(course.id));
      }
    }
    setStageId(nextStageId);
    setExerciseIndex(nextExerciseIndex);
    setExamProfileId(profile?.id ?? "");
    setTestDuration(profile?.durationSeconds ?? 300);
    setBackspacePolicy(kind === "practice" ? "full" : profile?.backspacePolicy ?? "full");
    resetSession();
  }, [course.id, examProfiles, kind]);

  useEffect(() => {
    localStorage.setItem("bhashayantra:training:keyboard-v2", String(showKeyboard));
    localStorage.setItem("bhashayantra:training:sound-v2", String(soundOnError));
    localStorage.setItem("bhashayantra:training:move-on-error-v2", String(moveOnError));
    localStorage.setItem("bhashayantra:training:font-size", String(fontSize));
  }, [fontSize, moveOnError, showKeyboard, soundOnError]);

  useEffect(() => {
    if (!startedAt || finished) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);
    return () => window.clearInterval(timer);
  }, [finished, startedAt]);

  useEffect(() => {
    if (!finished || !startedAt || attemptSaved) return;
    const attempt: TrainingAttempt = {
      id: createAttemptId(),
      kind,
      layoutId: layout,
      exerciseId: exercise.id,
      examProfileId: kind === "test" ? selectedProfile.id : undefined,
      completedAt: new Date().toISOString(),
      elapsedSeconds: measuredSeconds,
      accuracy: effectiveAccuracy,
      wpm,
      kdph,
      correctCharacters: score.correctCharacters,
      expectedCharacters: score.expectedCharacters,
      typedCharacters: score.typedCharacters,
      missingCharacters: score.missingCharacters,
      extraCharacters: score.extraCharacters,
      substitutedCharacters: score.substitutedCharacters,
      weakKeys,
    };
    setAttemptSaved(true);
    void attemptsRepository.save(attempt);
  }, [attemptSaved, effectiveAccuracy, exercise.id, finished, kdph, kind, layout, measuredSeconds, score, selectedProfile.id, startedAt, weakKeys, wpm]);

  function resetSession() {
    setSource("");
    setStartedAt(undefined);
    setElapsedSeconds(0);
    setAttemptSaved(false);
    setPreventedErrors(0);
    setErrorPulse(false);
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function chooseStage(nextStageId: CurriculumStageId) {
    setStageId(nextStageId);
    setExerciseIndex(0);
    if (kind === "practice") localStorage.setItem(practicePositionKey(course.id), JSON.stringify({ stageId: nextStageId, exerciseIndex: 0 }));
    resetSession();
  }

  function chooseExercise(nextIndex: number) {
    setExerciseIndex(nextIndex);
    if (kind === "practice") localStorage.setItem(practicePositionKey(course.id), JSON.stringify({ stageId: selectedStage.id, exerciseIndex: nextIndex }));
    resetSession();
  }

  function nextExercise() {
    if (exerciseIndex + 1 < selectedStage.exercises.length) {
      chooseExercise(exerciseIndex + 1);
      return;
    }
    const stageIndex = course.stages.findIndex((stage) => stage.id === selectedStage.id);
    const nextStage = course.stages[stageIndex + 1];
    if (nextStage) chooseStage(nextStage.id);
  }

  function previousExercise() {
    if (exerciseIndex > 0) chooseExercise(exerciseIndex - 1);
  }

  function updateSource(value: string) {
    if (finished) return;
    if (!startedAt && value.length > 0) setStartedAt(Date.now());
    setSource(value);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Backspace") {
      if (backspacePolicy === "full") return;
      if (backspacePolicy === "disabled") {
        event.preventDefault();
        return;
      }
      const caret = event.currentTarget.selectionStart;
      const selectionEnd = event.currentTarget.selectionEnd;
      const currentWordStart = source.lastIndexOf(" ", Math.max(0, caret - 1)) + 1;
      if (caret <= currentWordStart || selectionEnd > caret) event.preventDefault();
      return;
    }
    if (event.ctrlKey || event.altKey || event.metaKey || finished) return;
    const enteredKey = event.key === "Enter" ? "\n" : event.key === "Tab" ? "\t" : event.key.length === 1 ? event.key : undefined;
    if (!enteredKey) return;
    const caret = event.currentTarget.selectionStart;
    const expectedKey = Array.from(exercise.keys)[caret];
    if (enteredKey === expectedKey) return;
    if (soundOnError) playTypingFeedback("error");
    setErrorPulse(true);
    window.setTimeout(() => setErrorPulse(false), 180);
    if (!moveOnError) {
      event.preventDefault();
      setPreventedErrors((current) => current + 1);
    }
  }

  function insertVirtualKey(key: string) {
    const expectedKey = Array.from(exercise.keys)[Array.from(source).length];
    if (key !== expectedKey) {
      if (soundOnError) playTypingFeedback("error");
      setErrorPulse(true);
      window.setTimeout(() => setErrorPulse(false), 180);
      if (!moveOnError) {
        setPreventedErrors((current) => current + 1);
        window.requestAnimationFrame(() => textareaRef.current?.focus());
        return;
      }
    }
    updateSource(`${source}${key}`);
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function selectExamProfile(profileId: string) {
    const profile = examProfiles.find((item) => item.id === profileId) ?? examProfiles[0];
    setExamProfileId(profile.id);
    setTestDuration(profile.durationSeconds);
    setBackspacePolicy(profile.backspacePolicy);
    resetSession();
  }

  function startNewTest() {
    setExamAttemptIndex((current) => current + 1);
    resetSession();
  }

  async function clearHistory() {
    await attemptsRepository.clear(layout, "practice");
    loadAttempts();
  }

  const stageLabels: Record<CurriculumStageId, string> = {
    "learn-keys": t("learnKeys"),
    "practice-words": t("practiceWords"),
    sentences: t("typeSentences"),
    paragraphs: t("typeParagraphs"),
    "numeric-entry": t("numberDataEntry"),
  };

  function examProfileName(profileId: string) {
    switch (profileId) {
      case "general-english": return t("generalEnglishExam");
      case "general-hindi": return t("generalHindiExam");
      case "ssc-english-style": return t("sscEnglishExam");
      case "ssc-hindi-style": return t("sscHindiExam");
      case "railway-style": return t("railwayExam");
      case "cpct-hindi-style": return t("cpctHindiExam");
      case "court-hindi-style": return t("courtHindiExam");
      case "data-entry-english": return t("dataEntryExam");
      default: return profileId;
    }
  }

  return (
    <section className="academy" aria-labelledby="training-title">
      <header className="academy-header">
        <div>
          <span>{layoutName} / {exercise.phaseTitle}</span>
          <h1 id="training-title">{t("typingPractice")}</h1>
          <p>Structured key training, professional copy work, and exam readiness.</p>
        </div>
        <div className="academy-progress"><strong>{completedExerciseIds.size}</strong><span>of {course.exerciseCount} mastered</span><progress value={completedExerciseIds.size} max={course.exerciseCount} /></div>
      </header>

      <div className="academy-grid">
        <aside className="academy-course" aria-label="Course map">
          <div className="academy-panel-title"><Layers3 aria-hidden="true" /><span>Course map</span></div>
          <div className="academy-stage-list" role="tablist" aria-label={t("exerciseCatalog")}>
            {course.stages.map((stage, stageIndex) => {
              const mastered = stage.exercises.filter((item) => completedExerciseIds.has(item.id)).length;
              return <button type="button" role="tab" aria-selected={selectedStage.id === stage.id} className={selectedStage.id === stage.id ? "active" : ""} key={stage.id} onClick={() => { setShowInstructions(false); chooseStage(stage.id); }}><span>{String(stageIndex + 1).padStart(2, "0")}</span><div><strong>{stageLabels[stage.id]}</strong><small>{mastered}/{stage.exercises.length} mastered</small></div><em>{Math.round((mastered / stage.exercises.length) * 100)}%</em></button>;
            })}
          </div>
          <button type="button" className="academy-instruction-link" onClick={() => setShowInstructions((current) => !current)}><BookOpenCheck aria-hidden="true" /> {showInstructions ? "Hide course method" : "View course method"}</button>
          <div className="academy-module">
            <span>Current module</span><strong>{exercise.moduleTitle}</strong><small>{exercise.phaseTitle}</small>
            {moduleExercises.map((item) => {
              const itemIndex = selectedStage.exercises.findIndex((lesson) => lesson.id === item.id);
              return <button type="button" key={item.id} className={item.id === exercise.id ? "active" : ""} onClick={() => chooseExercise(itemIndex)}>{completedExerciseIds.has(item.id) ? <CheckCircle2 aria-hidden="true" /> : <Target aria-hidden="true" />}<span>{item.drillLabel}<small>{item.minimumAccuracy}% · {item.requiredPasses} clean {item.requiredPasses === 1 ? "run" : "runs"}</small></span></button>;
            })}
          </div>
        </aside>

        <main className={`academy-workbench ${showInstructions ? "method-open" : ""}`}>
          <div className="academy-lessonbar">
            <label><span>Lesson</span><select value={exerciseIndex} onChange={(event) => chooseExercise(Number(event.target.value))}>{selectedStage.exercises.map((item, index) => <option key={item.id} value={index}>{completedExerciseIds.has(item.id) ? "✓" : "○"} {String(item.sequence).padStart(2, "0")} · {item.title}</option>)}</select></label>
            <span className={`tier-badge ${exercise.tier}`}>{exercise.tier === "free" ? t("free") : t("pro")}</span>
            <span>{exercise.practiceMode.toUpperCase()}</span>
            <span>{exercise.estimatedSeconds}s</span>
          </div>

          {showInstructions ? <CourseOrientation stageLabels={stageLabels} stageIds={course.stages.map((stage) => stage.id)} /> : <>
          <section className="academy-brief" aria-labelledby="lesson-overview-title"><div><span>{exercise.phaseTitle} · Module {exercise.moduleLesson}/{exercise.moduleLessonCount}</span><h2 id="lesson-overview-title">{exercise.title}</h2><p>{exercise.objective}</p></div><dl><div><dt>Accuracy gate</dt><dd>{exercise.minimumAccuracy}%</dd></div><div><dt>Target pace</dt><dd>{exercise.targetWpm} WPM</dd></div><div><dt>Clean runs</dt><dd>{currentMasteryPasses}/{exercise.requiredPasses}</dd></div></dl></section>

          <div className="drill-track" aria-label="Lesson drill sequence">{exercise.drillBlocks.map((block, index) => <div key={block.label} className={index < activeBlockIndex || activeBlockIndex < 0 ? "done" : index === activeBlockIndex ? "active" : ""}><span>{index + 1}</span><strong>{block.label}</strong><small>{block.purpose}</small></div>)}</div>

          <div className="academy-keyline"><div><span>Layout keystrokes</span><code>{exercise.keys}</code></div><div><span>Next</span><kbd>{nextExpected?.key === " " ? t("space") : nextExpected?.key ?? "—"}</kbd><small>{nextExpected?.finger ? t(nextExpected.finger) : "Ready"}</small></div></div>

          <div className="academy-training-panes">
            <section className="academy-copyboard" style={{ fontFamily: fontStack, fontSize }}>
              <div className="academy-copyboard-title"><span>Source copy</span><small>{exercise.wordCount} {exercise.stageId === "learn-keys" ? "drill units" : "words"} · {exercise.characterCount} characters</small></div>
              {exercise.drillBlocks.map((block, index) => <div key={block.label} className={index === activeBlockIndex ? "copy-block active" : "copy-block"}><span>{block.label}</span><strong>{block.target}</strong></div>)}
            </section>
            <section className="academy-answer-pane">
              <label className="academy-input-label" htmlFor="training-input"><span>{t("yourTyping")}</span><small>Timer starts with your first key</small></label>
              <div className={layout === "english-qwerty" ? "academy-editor-grid direct" : "academy-editor-grid"}>
                <textarea ref={textareaRef} id="training-input" className={errorPulse ? "error-pulse" : undefined} value={source} onChange={(event) => updateSource(event.target.value)} onKeyDown={handleKeyDown} placeholder={t("trainingPlaceholder")} spellCheck={false} disabled={finished} autoFocus />
                {layout !== "english-qwerty" && <div className="academy-unicode-preview" style={{ fontFamily: fontStack, fontSize }}><span>Unicode preview</span><strong>{actual || "—"}</strong></div>}
              </div>
            </section>
          </div>

          {showKeyboard && <div className="training-keyboard academy-keyboard" aria-label={t("showCourseKeyboard")}>{keyboard.map((row, rowIndex) => <div className="training-keyboard-row" key={rowIndex}>{row.map((keyDefinition) => { const insertion = nextExpected?.key === keyDefinition.shiftKey ? keyDefinition.shiftKey : keyDefinition.key; const highlighted = nextExpected?.key === keyDefinition.key || nextExpected?.key === keyDefinition.shiftKey; return <button type="button" key={keyDefinition.key} className={`${keyDefinition.width ?? ""} ${highlighted ? "next" : ""}`} onClick={() => insertVirtualKey(insertion ?? keyDefinition.key)}><small>{keyDefinition.shiftLabel}</small><strong>{keyDefinition.label}</strong><span>{keyDefinition.key === " " ? t("space") : keyDefinition.key.toLocaleUpperCase()}</span></button>; })}</div>)}</div>}
          </>}
        </main>

        <aside className="academy-coach" aria-label="Live coach">
          <div className="academy-panel-title"><Gauge aria-hidden="true" /><span>Live coach</span></div>
          <div className="coach-score"><strong>{effectiveAccuracy}%</strong><span>accuracy</span><progress value={effectiveAccuracy} max="100" /></div>
          <div className="coach-metrics"><TrainingMetric label="WPM" value={String(wpm)} /><TrainingMetric label="KDPH" value={String(kdph)} /><TrainingMetric label="Correct" value={`${score.correctCharacters}/${score.expectedCharacters}`} /><TrainingMetric label={t("errors")} value={String(countedErrors)} /></div>
          <div className="coach-mastery"><span>Mastery contract</span><strong>{projectedMasteryPasses}/{exercise.requiredPasses} clean runs</strong><small>Each run needs {exercise.minimumAccuracy}% accuracy at {exercise.targetWpm} WPM recommended pace.</small></div>
          <details className="coach-settings"><summary><Settings2 aria-hidden="true" /> Session controls</summary><label>{t("backspacePolicy")}<select value={backspacePolicy} onChange={(event) => setBackspacePolicy(event.target.value as BackspacePolicy)}><option value="full">{t("fullBackspace")}</option><option value="current-word">{t("currentWordOnly")}</option><option value="disabled">{t("disableBackspace")}</option></select></label><label><input type="checkbox" checked={showKeyboard} onChange={(event) => setShowKeyboard(event.target.checked)} /> {t("showKeyboard")}</label><label><input type="checkbox" checked={soundOnError} onChange={(event) => setSoundOnError(event.target.checked)} /> {t("soundOnError")}</label><label><input type="checkbox" checked={moveOnError} onChange={(event) => setMoveOnError(event.target.checked)} /> {t("moveOnError")}</label><Button size="sm" variant="outline" onClick={() => playTypingFeedback("preview")}><Volume2 aria-hidden="true" /> {t("testSound")}</Button><label>{t("fontSize")}<input type="range" min="18" max="36" step="2" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} /></label></details>
          {source.length > 0 && weakKeys.length > 0 && <div className="coach-weak"><strong>{t("weakKeys")}</strong>{weakKeys.slice(0, 6).map((item) => <span key={item.key}><kbd>{item.key}</kbd><small>{item.errors}/{item.attempts} errors</small></span>)}</div>}
          <div className={finished ? lessonMastered ? "coach-status mastered" : "coach-status repeat" : "coach-status"}>{finished ? lessonMastered ? <><CheckCircle2 aria-hidden="true" /><strong>Lesson mastered</strong><span>All lessons remain available.</span></> : lessonPassed ? <><RotateCcw aria-hidden="true" /><strong>Clean run recorded</strong><span>Repeat once more for mastery.</span></> : <><AlertTriangle aria-hidden="true" /><strong>Accuracy gate missed</strong><span>Review errors and repeat.</span></> : <><Target aria-hidden="true" /><strong>Ready to train</strong><span>Start anywhere; mastery tracking stays active.</span></>}</div>
          <div className="academy-actions"><Button variant="outline" onClick={previousExercise} disabled={exerciseIndex === 0}><ChevronLeft aria-hidden="true" /> Previous</Button><Button variant="outline" onClick={resetSession}><RotateCcw aria-hidden="true" /> Reset</Button><Button onClick={nextExercise}>Next <ChevronRight aria-hidden="true" /></Button></div>
          {attemptSaved && <p className="training-saved"><CheckCircle2 aria-hidden="true" /> {t("trainingSaved")}</p>}
          <details className="academy-history-drawer">
            <summary><History aria-hidden="true" /> {t("attemptHistory")} <span>{layoutAttempts.length}</span></summary>
            {layoutAttempts.length === 0 ? <p>{t("noAttempts")}</p> : <><div className="academy-history-list">{layoutAttempts.slice(0, 6).map((attempt) => <div key={attempt.id}><span>{new Date(attempt.completedAt).toLocaleDateString(language === "hi" ? "hi-IN" : "en-IN")}</span><strong>{attempt.accuracy}% · {attempt.wpm} WPM</strong></div>)}</div><Button size="sm" variant="danger" onClick={() => void clearHistory()}><Trash2 aria-hidden="true" /> {t("clearHistory")}</Button></>}
          </details>
        </aside>
      </div>
    </section>
  );
}

function CourseOrientation({ stageLabels, stageIds }: { readonly stageLabels: Record<CurriculumStageId, string>; readonly stageIds: readonly CurriculumStageId[] }) {
  const fingerZones = [
    ["Left little", "1 Q A Z"], ["Left ring", "2 W S X"], ["Left middle", "3 E D C"], ["Left index", "4 5 R T F G V B"],
    ["Right index", "6 7 Y U H J N M"], ["Right middle", "8 I K ,"], ["Right ring", "9 O L ."], ["Right little", "0 P [ ] ; ' / - = \\"],
  ] as const;
  return <section className="academy-orientation" aria-labelledby="course-method-title">
    <header><span>Course method</span><h2 id="course-method-title">Professional touch-typing orientation</h2><p>Learn one controlled movement at a time, return every finger to the home row, and progress only after an accurate clean run.</p></header>
    <div className="orientation-foundation">
      <article><strong>1. Posture and sight line</strong><p>Sit upright with relaxed shoulders, wrists neutral and feet supported. Keep your eyes on the source copy; do not chase the on-screen keyboard.</p></article>
      <article><strong>2. Home-row anchors</strong><p>Find the raised marks on F and J without looking. Rest both thumbs lightly over Space and return each finger after every keystroke.</p></article>
      <article><strong>3. Accuracy before speed</strong><p>Use the required finger even when another feels faster. Error sound, move-on-error and backspace policy can simulate your target exam.</p></article>
      <article><strong>4. Measured progression</strong><p>Complete the warm-up, control, application and checkpoint blocks. Accuracy gates record mastery but never lock lessons.</p></article>
    </div>
    <div className="orientation-fingers"><div><span>Left hand</span><strong>F is the left anchor</strong></div>{fingerZones.slice(0, 4).map(([finger, keys]) => <article key={finger}><span>{finger}</span><kbd>{keys}</kbd></article>)}<div><span>Right hand</span><strong>J is the right anchor</strong></div>{fingerZones.slice(4).map(([finger, keys]) => <article key={finger}><span>{finger}</span><kbd>{keys}</kbd></article>)}</div>
    <div className="orientation-route" style={{ gridTemplateColumns: `1.35fr repeat(${stageIds.length}, minmax(0, 1fr))` }}><strong>Recommended course route</strong>{stageIds.map((stageId, index) => <span key={stageId}><em>{index + 1}</em>{stageLabels[stageId]}</span>)}</div>
    <footer><strong>Exam habit:</strong> read the rules before every attempt. Recruitment duration, correction, font, layout and scoring rules can change; use the verified profile and confirm the current notice.</footer>
  </section>;
}

function TrainingMetric({ label, value }: { readonly label: string; readonly value: string }) {
  return <div className="training-metric"><span>{label}</span><strong>{value}</strong></div>;
}
