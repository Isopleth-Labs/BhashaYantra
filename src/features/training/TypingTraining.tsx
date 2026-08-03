import {
  AlertTriangle,
  Award,
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Gauge,
  History,
  Keyboard,
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

function playErrorTone() {
  const BrowserAudioContext = window.AudioContext;
  if (!BrowserAudioContext) return;
  const context = new BrowserAudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 220;
  gain.gain.value = 0.035;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.08);
  oscillator.addEventListener("ended", () => void context.close());
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
  const [showInstructions, setShowInstructions] = useState(true);
  const [showKeyboard, setShowKeyboard] = useState(() => loadBoolean("bhashayantra:training:keyboard", true));
  const [soundOnError, setSoundOnError] = useState(() => loadBoolean("bhashayantra:training:sound", false));
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
  const score = useMemo(() => calculateTrainingScore(expected, actual), [actual, expected]);
  const remainingSeconds = kind === "test" ? Math.max(0, testDuration - elapsedSeconds) : 0;
  const finished = kind === "practice"
    ? score.complete
    : score.complete || (remainingSeconds === 0 && Boolean(startedAt));
  const measuredSeconds = Math.max(1, elapsedSeconds);
  const wpm = calculateWpm(Array.from(actual).length, measuredSeconds);
  const kdph = calculateKdph(Array.from(source).length, measuredSeconds);
  const weakKeys = useMemo(() => analyzeWeakKeys(exercise.keys, source), [exercise.keys, source]);
  const nextExpected = useMemo(() => getNextExpectedKey(exercise.keys, source), [exercise.keys, source]);
  const keyboard = keyboardForLayout(layout);
  const courseExercises = useMemo(() => course.stages.flatMap((stage) => stage.exercises), [course]);
  const exerciseById = useMemo(() => new Map(courseExercises.map((item) => [item.id, item])), [courseExercises]);
  const completedExerciseIds = useMemo(
    () => new Set(
      attempts
        .filter((attempt) => attempt.kind === "practice" && attempt.layoutId === layout)
        .filter((attempt) => attempt.accuracy >= (exerciseById.get(attempt.exerciseId)?.minimumAccuracy ?? 100))
        .map((attempt) => attempt.exerciseId),
    ),
    [attempts, exerciseById, layout],
  );
  const layoutAttempts = attempts.filter((attempt) => attempt.layoutId === layout && attempt.kind === "practice");
  const layoutName = TYPING_LAYOUT_PROFILES.find((profile) => profile.id === layout)?.name ?? layout;
  const fontStack = getDisplayFont(displayFont).cssStack;
  const passed = kind === "test" && finished && wpm >= selectedProfile.targetWpm && score.accuracy >= selectedProfile.minimumAccuracy;
  const lessonPassed = kind === "practice" && finished && score.accuracy >= exercise.minimumAccuracy;

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
    setStageId("learn-keys");
    setExerciseIndex(0);
    setExamProfileId(profile?.id ?? "");
    setTestDuration(profile?.durationSeconds ?? 300);
    setBackspacePolicy(kind === "practice" ? "full" : profile?.backspacePolicy ?? "full");
    resetSession();
  }, [course.id, examProfiles, kind]);

  useEffect(() => {
    localStorage.setItem("bhashayantra:training:keyboard", String(showKeyboard));
    localStorage.setItem("bhashayantra:training:sound", String(soundOnError));
    localStorage.setItem("bhashayantra:training:font-size", String(fontSize));
  }, [fontSize, showKeyboard, soundOnError]);

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
      accuracy: score.accuracy,
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
  }, [attemptSaved, exercise.id, finished, kdph, kind, layout, measuredSeconds, score, selectedProfile.id, startedAt, weakKeys, wpm]);

  function resetSession() {
    setSource("");
    setStartedAt(undefined);
    setElapsedSeconds(0);
    setAttemptSaved(false);
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function chooseStage(nextStageId: CurriculumStageId) {
    setStageId(nextStageId);
    setExerciseIndex(0);
    resetSession();
  }

  function chooseExercise(nextIndex: number) {
    setExerciseIndex(nextIndex);
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
    if (soundOnError && value.length > source.length) {
      const enteredKey = Array.from(value).at(-1);
      const expectedKey = Array.from(exercise.keys)[Array.from(value).length - 1];
      if (enteredKey !== expectedKey) playErrorTone();
    }
    setSource(value);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Backspace" || backspacePolicy === "full") return;
    if (backspacePolicy === "disabled") {
      event.preventDefault();
      return;
    }
    const caret = event.currentTarget.selectionStart;
    const selectionEnd = event.currentTarget.selectionEnd;
    const currentWordStart = source.lastIndexOf(" ", Math.max(0, caret - 1)) + 1;
    if (caret <= currentWordStart || selectionEnd > caret) event.preventDefault();
  }

  function insertVirtualKey(key: string) {
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
    <section className="training-card" aria-labelledby="training-title">
      <div className="training-heading">
        <div>
          <span className="training-kicker">{layoutName} · {course.exerciseCount} {t("exerciseCatalog")}</span>
          <h1 id="training-title">{kind === "practice" ? t("typingPractice") : t("typingTest")}</h1>
          <p>{kind === "practice" ? t("practiceIntro") : t("testIntro")}</p>
        </div>
        <div className="training-timer">
          {kind === "test" ? <><Clock3 aria-hidden="true" /><strong>{remainingSeconds}s</strong><span>{t("timeRemaining")}</span></> : <><Target aria-hidden="true" /><strong>{completedExerciseIds.size}/{course.exerciseCount}</strong><span>{t("courseProgress")}</span></>}
        </div>
      </div>

      {kind === "practice" ? (
        <>
          <div className="curriculum-steps" role="tablist" aria-label={t("exerciseCatalog")}>
            <button type="button" className={showInstructions ? "active" : ""} onClick={() => setShowInstructions((current) => !current)}><BookOpenCheck aria-hidden="true" /> {t("readInstructions")}</button>
            {course.stages.map((stage) => (
              <button type="button" role="tab" aria-selected={selectedStage.id === stage.id} className={selectedStage.id === stage.id && !showInstructions ? "active" : ""} key={stage.id} onClick={() => { setShowInstructions(false); chooseStage(stage.id); }}>
                {stageLabels[stage.id]} <span>{completedExerciseIds.size ? stage.exercises.filter((item) => completedExerciseIds.has(item.id)).length : 0}/{stage.exercises.length}</span>
              </button>
            ))}
          </div>
          {showInstructions && (
            <div className="training-instructions">
              <strong>{t("readInstructions")}</strong>
              <ol>
                <li>{t("instructionKeepLayout")}</li>
                <li>{t("instructionAccuracyFirst")}</li>
                <li>{t("instructionStageOrder")}</li>
                <li>{t("instructionVerifyExam")}</li>
              </ol>
            </div>
          )}
          <div className="exercise-picker">
            <label>{t("selectExercise")}<select value={exerciseIndex} onChange={(event) => chooseExercise(Number(event.target.value))}>{selectedStage.exercises.map((item, index) => <option key={item.id} value={index}>{completedExerciseIds.has(item.id) ? "✓ " : ""}{String(item.sequence).padStart(2, "0")} · {item.title} · {item.tier === "free" ? t("free") : t("pro")}</option>)}</select></label>
            <span className={`tier-badge ${exercise.tier}`}>{exercise.tier === "free" ? t("free") : t("pro")}</span>
            <span>{t("difficulty")}: {"●".repeat(exercise.difficulty)}{"○".repeat(5 - exercise.difficulty)}</span>
            <span>{t("estimatedTime")}: {exercise.estimatedSeconds}s</span>
          </div>
          <section className="lesson-overview" aria-labelledby="lesson-overview-title">
            <div>
              <span>{exercise.moduleTitle} · {t("lesson")} {exercise.sequence}/{selectedStage.exercises.length}</span>
              <h2 id="lesson-overview-title">{exercise.title}</h2>
              <p>{exercise.objective}</p>
            </div>
            <dl>
              <div><dt>{t("minimumAccuracy")}</dt><dd>{exercise.minimumAccuracy}%</dd></div>
              <div><dt>{t("recommendedSpeed")}</dt><dd>{exercise.targetWpm} WPM</dd></div>
              <div><dt>{t("words")}</dt><dd>{exercise.wordCount}</dd></div>
              <div><dt>{t("characters")}</dt><dd>{exercise.characterCount}</dd></div>
            </dl>
          </section>
        </>
      ) : (
        <div className="exam-profile-panel">
          <label>{t("examProfile")}<select value={selectedProfile.id} onChange={(event) => selectExamProfile(event.target.value)}>{examProfiles.map((profile) => <option key={profile.id} value={profile.id}>{examProfileName(profile.id)} · {profile.tier === "free" ? t("free") : t("pro")}</option>)}</select></label>
          <label>{t("duration")}<select value={testDuration} onChange={(event) => { setTestDuration(Number(event.target.value)); resetSession(); }}>{TEST_DURATIONS.map((seconds) => <option key={seconds} value={seconds}>{seconds / 60} {t("minutes")}</option>)}</select></label>
          <div><span>{t("targetWpm")}</span><strong>{selectedProfile.targetWpm}</strong></div>
          <div><span>{t("minimumAccuracy")}</span><strong>{selectedProfile.minimumAccuracy}%</strong></div>
          <p><AlertTriangle aria-hidden="true" /><span><strong>{t("simulationNotice")}:</strong> {t("examDisclaimer")}</span></p>
        </div>
      )}

      <details className="training-settings">
        <summary><Settings2 aria-hidden="true" /> {t("trainingSettings")}</summary>
        <div>
          <label>{t("backspacePolicy")}<select value={backspacePolicy} onChange={(event) => setBackspacePolicy(event.target.value as BackspacePolicy)}><option value="full">{t("fullBackspace")}</option><option value="current-word">{t("currentWordOnly")}</option><option value="disabled">{t("disableBackspace")}</option></select></label>
          <label className="training-checkbox"><input type="checkbox" checked={showKeyboard} onChange={(event) => setShowKeyboard(event.target.checked)} /> <Keyboard aria-hidden="true" /> {t("showCourseKeyboard")}</label>
          <label className="training-checkbox"><input type="checkbox" checked={soundOnError} onChange={(event) => setSoundOnError(event.target.checked)} /> <Volume2 aria-hidden="true" /> {t("soundOnError")}</label>
          <label>{t("fontSize")}<input type="range" min="18" max="36" step="2" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} /><output>{fontSize}px</output></label>
        </div>
      </details>

      <div className="training-target" style={{ fontFamily: fontStack, fontSize }}>
        <span>{t("targetText")}</span>
        <strong>{expected}</strong>
      </div>

      <div className="training-guide">
        <span>{t("guideKeys")}</span>
        <code>{exercise.keys}</code>
      </div>

      <div className="next-key-guide">
        <span><Keyboard aria-hidden="true" /> {t("nextKey")}: <kbd>{nextExpected?.key === " " ? t("space") : nextExpected?.key ?? "—"}</kbd></span>
        <span>{t("useFinger")}: <strong>{nextExpected?.finger ? t(nextExpected.finger) : "—"}</strong></span>
      </div>

      {showKeyboard && (
        <div className="training-keyboard" aria-label={t("showCourseKeyboard")}>
          {keyboard.map((row, rowIndex) => <div className="training-keyboard-row" key={rowIndex}>{row.map((keyDefinition) => {
            const insertion = nextExpected?.key === keyDefinition.shiftKey ? keyDefinition.shiftKey : keyDefinition.key;
            const highlighted = nextExpected?.key === keyDefinition.key || nextExpected?.key === keyDefinition.shiftKey;
            return <button type="button" key={keyDefinition.key} className={`${keyDefinition.width ?? ""} ${highlighted ? "next" : ""}`} onClick={() => insertVirtualKey(insertion ?? keyDefinition.key)}><small>{keyDefinition.shiftLabel}</small><strong>{keyDefinition.label}</strong><span>{keyDefinition.key === " " ? t("space") : keyDefinition.key.toLocaleUpperCase()}</span></button>;
          })}</div>)}
        </div>
      )}

      <label className="training-input-label" htmlFor="training-input">{t("yourTyping")}</label>
      <textarea
        ref={textareaRef}
        id="training-input"
        value={source}
        onChange={(event) => updateSource(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("trainingPlaceholder")}
        spellCheck={false}
        disabled={finished}
        autoFocus
      />

      <div className="training-preview" style={{ fontFamily: fontStack, fontSize }}>
        <span>{t("resultPreview")}</span>
        <strong>{actual || "—"}</strong>
      </div>

      <div className="training-results" aria-live="polite">
        <TrainingMetric label={t("accuracy")} value={`${score.accuracy}%`} />
        <TrainingMetric label="WPM" value={String(wpm)} />
        <TrainingMetric label="KDPH" value={String(kdph)} />
        <TrainingMetric label={t("characters")} value={`${score.correctCharacters}/${score.expectedCharacters}`} />
        <TrainingMetric label={t("missing")} value={String(score.missingCharacters)} />
        <TrainingMetric label={t("extra")} value={String(score.extraCharacters)} />
        <TrainingMetric label={t("substitutions")} value={String(score.substitutedCharacters)} />
        <div className={finished ? "training-result-status complete" : "training-result-status"}>
          {finished ? <CheckCircle2 aria-hidden="true" /> : <Gauge aria-hidden="true" />}
          {finished ? kind === "test" ? passed ? t("testPassed") : t("testNeedsPractice") : lessonPassed ? t("lessonComplete") : t("lessonNeedsAccuracy") : t("trainingInProgress")}
        </div>
      </div>

      {source.length > 0 && weakKeys.length > 0 && <div className="weak-key-list"><strong>{t("weakKeys")}</strong>{weakKeys.slice(0, 8).map((item) => <span key={item.key}><kbd>{item.key}</kbd> {item.errors}/{item.attempts}</span>)}</div>}
      {attemptSaved && <p className="training-saved"><CheckCircle2 aria-hidden="true" /> {t("trainingSaved")}</p>}

      <div className="training-actions">
        {kind === "practice" && <Button variant="outline" onClick={previousExercise} disabled={exerciseIndex === 0}><ChevronLeft aria-hidden="true" /> {t("previousExercise")}</Button>}
        <Button variant="outline" onClick={resetSession}><RotateCcw aria-hidden="true" /> {t("reset")}</Button>
        {kind === "practice" ? <Button onClick={nextExercise} disabled={!lessonPassed}>{t("nextLesson")} <ChevronRight aria-hidden="true" /></Button> : <Button onClick={startNewTest} disabled={!finished}><RotateCcw aria-hidden="true" /> {t("startNewAttempt")}</Button>}
      </div>

      <section className="attempt-history" aria-labelledby="attempt-history-title">
        <div><h2 id="attempt-history-title"><History aria-hidden="true" /> {t("attemptHistory")}</h2>{layoutAttempts.length > 0 && <Button size="sm" variant="danger" onClick={() => void clearHistory()}><Trash2 aria-hidden="true" /> {t("clearHistory")}</Button>}</div>
        {layoutAttempts.length === 0 ? <p>{t("noAttempts")}</p> : <div className="attempt-table"><div className="attempt-row heading"><span>{t("exercise")}</span><span>{t("accuracy")}</span><span>WPM</span><span>KDPH</span><span>{t("duration")}</span></div>{layoutAttempts.slice(0, 8).map((attempt) => <div className="attempt-row" key={attempt.id}><span><Award aria-hidden="true" /> {attempt.kind === "test" ? t("typingTest") : t("typingPractice")}<small>{new Date(attempt.completedAt).toLocaleString(language === "hi" ? "hi-IN" : "en-IN")}</small></span><strong>{attempt.accuracy}%</strong><strong>{attempt.wpm}</strong><strong>{attempt.kdph}</strong><strong>{attempt.elapsedSeconds}s</strong></div>)}</div>}
      </section>
    </section>
  );
}

function TrainingMetric({ label, value }: { readonly label: string; readonly value: string }) {
  return <div className="training-metric"><span>{label}</span><strong>{value}</strong></div>;
}
