import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  History,
  Landmark,
  Minus,
  Pause,
  Play,
  Plus,
  Printer,
  RotateCcw,
  Settings2,
  Square,
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
import { getCurriculumCourse } from "@/domain/training/curriculum-catalog";
import { getExamPassage, getExamProfilesForLayout, type BackspacePolicy, type ExamProfile } from "@/domain/training/exam-profiles";
import {
  applyKeystrokeLimit,
  applyWordLimit,
  calculateRrbTypingScore,
  countWords,
  formatExamText,
  getHighlightSegments,
  type MockExamStatus,
  type PassageHighlightMode,
} from "@/domain/training/mock-exam-engine";
import type { TrainingAttempt } from "@/domain/training/training-attempt";
import { analyzeWeakKeys, calculateKdph, calculateTrainingScore, calculateWordSpeed, calculateWpm } from "@/domain/training/training-engine";
import { typingSourceToUnicode, unicodeToTypingSource } from "@/domain/typing/typing-engine";
import { getDisplayFont, TYPING_LAYOUT_PROFILES, type ReadyTypingLayoutId, type UnicodeDisplayFontId } from "@/domain/typing/typing-profiles";
import { LocalTrainingAttemptsRepository, TRAINING_ATTEMPTS_UPDATED_EVENT } from "@/data/repositories/local-training-attempts-repository";
import { useI18n } from "@/i18n/I18nProvider";
import { ExamResultReport } from "@/features/training/ExamResultReport";

interface TypingMockExamProps {
  readonly layout: ReadyTypingLayoutId;
  readonly displayFont: UnicodeDisplayFontId;
}

const attemptsRepository = new LocalTrainingAttemptsRepository();
const TEST_DURATIONS = [60, 300, 600, 900] as const;
const PAPER_COUNT = 60;

const EXAM_CATEGORY_LABELS = {
  general: "Practice diagnostics",
  ssc: "Staff Selection Commission",
  rrb: "Railway Recruitment Boards",
  dda: "Delhi Development Authority",
  dsssb: "Delhi Subordinate Services Selection Board",
  cpct: "MP CPCT",
  "rajasthan-court": "Rajasthan High Court",
  "allahabad-court": "Allahabad High Court",
} as const;

function createAttemptId() {
  return globalThis.crypto?.randomUUID?.() ?? `attempt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadBoolean(key: string, fallback: boolean) {
  const value = localStorage.getItem(key);
  return value === null ? fallback : value === "true";
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function profileKeystrokeLimit(profile?: ExamProfile) {
  if (!profile?.targetKdph) return 1250;
  return Math.max(200, Math.round((profile.targetKdph * profile.durationSeconds) / 3600));
}

export function TypingMockExam({ layout, displayFont }: TypingMockExamProps) {
  const { language, t } = useI18n();
  const course = useMemo(() => getCurriculumCourse(layout), [layout]);
  const examProfiles = useMemo(() => getExamProfilesForLayout(layout), [layout]);
  const [examProfileId, setExamProfileId] = useState(examProfiles[0]?.id ?? "");
  const [paperIndex, setPaperIndex] = useState(0);
  const [testDuration, setTestDuration] = useState(examProfiles[0]?.durationSeconds ?? 300);
  const [status, setStatus] = useState<MockExamStatus>("ready");
  const [source, setSource] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [runStartedAt, setRunStartedAt] = useState<number>();
  const elapsedBeforeRun = useRef(0);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [attemptSaved, setAttemptSaved] = useState(false);
  const [attemptId, setAttemptId] = useState(createAttemptId);
  const [attemptCompletedAt, setAttemptCompletedAt] = useState(() => new Date());
  const [attempts, setAttempts] = useState<readonly TrainingAttempt[]>([]);
  const [backspacePolicy, setBackspacePolicy] = useState<BackspacePolicy>(examProfiles[0]?.backspacePolicy ?? "full");
  const [highlightMode, setHighlightMode] = useState<PassageHighlightMode>("error-word");
  const [showScrollbar, setShowScrollbar] = useState(true);
  const [autoScroll, setAutoScroll] = useState(() => loadBoolean("bhashayantra:exam:auto-scroll-v1", true));
  const [applyLimit, setApplyLimit] = useState(true);
  const [wordLimit, setWordLimit] = useState(600);
  const [applyKeyLimit, setApplyKeyLimit] = useState(() => Boolean(examProfiles[0]?.targetKdph));
  const [keystrokeLimit, setKeystrokeLimit] = useState(() => profileKeystrokeLimit(examProfiles[0]));
  const [allowParagraphs, setAllowParagraphs] = useState(true);
  const [allowTabs, setAllowTabs] = useState(false);
  const [allowCorrection, setAllowCorrection] = useState(true);
  const [fontSize, setFontSize] = useState(24);
  const [useCustomPassage, setUseCustomPassage] = useState(false);
  const [customPassage, setCustomPassage] = useState("");
  const [soundOnError, setSoundOnError] = useState(() => loadBoolean("bhashayantra:exam:sound-v2", true));
  const [errorPulse, setErrorPulse] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const passageRef = useRef<HTMLDivElement>(null);

  const selectedProfile = examProfiles.find((profile) => profile.id === examProfileId) ?? examProfiles[0];
  const builtInPassage = useMemo(
    () => getExamPassage(selectedProfile, layout, paperIndex),
    [layout, paperIndex, selectedProfile],
  );
  const customTarget = useCustomPassage && customPassage.trim() ? customPassage.trim() : undefined;
  const customKeys = useMemo(
    () => customTarget ? unicodeToTypingSource(customTarget, layout).output : undefined,
    [customTarget, layout],
  );
  const textOptions = useMemo(() => ({ allowParagraphs, allowTabs }), [allowParagraphs, allowTabs]);
  const expectedKeys = useMemo(
    () => applyKeystrokeLimit(
      applyWordLimit(formatExamText(customKeys ?? builtInPassage.keys, textOptions), applyLimit, wordLimit),
      applyKeyLimit,
      keystrokeLimit,
    ),
    [applyKeyLimit, applyLimit, builtInPassage.keys, customKeys, keystrokeLimit, textOptions, wordLimit],
  );
  const expected = useMemo(() => typingSourceToUnicode(expectedKeys, layout).output, [expectedKeys, layout]);
  const actual = useMemo(() => typingSourceToUnicode(source, layout).output, [layout, source]);
  const finished = status === "submitted" || status === "expired";
  const score = useMemo(() => calculateTrainingScore(expected, actual, finished ? "final" : "live"), [actual, expected, finished]);
  const segments = useMemo(() => getHighlightSegments(expected, actual, highlightMode), [actual, expected, highlightMode]);
  const remainingSeconds = Math.max(0, testDuration - elapsedSeconds);
  const measuredSeconds = Math.max(1, elapsedSeconds);
  const grossWpm = calculateWpm(Array.from(source).length, measuredSeconds);
  const wpm = calculateWpm(score.correctCharacters, measuredSeconds);
  const kdph = calculateKdph(score.correctCharacters, measuredSeconds);
  const wordSpeed = useMemo(() => calculateWordSpeed(expected, actual, measuredSeconds), [actual, expected, measuredSeconds]);
  const rrbScore = useMemo(() => calculateRrbTypingScore(expected, actual, measuredSeconds), [actual, expected, measuredSeconds]);
  const weakKeys = useMemo(() => analyzeWeakKeys(expectedKeys, source), [expectedKeys, source]);
  const measuredProfileSpeed = selectedProfile.scoringModel === "net-wpm"
    ? wordSpeed.netWpm
    : selectedProfile.scoringModel === "kdph"
      ? kdph
      : selectedProfile.scoringModel === "rrb-wpm"
        ? rrbScore.wpm
        : wpm;
  const requiredProfileSpeed = selectedProfile.scoringModel === "kdph" ? selectedProfile.targetKdph ?? 0 : selectedProfile.targetWpm;
  const passed = finished && measuredProfileSpeed >= requiredProfileSpeed && (selectedProfile.minimumAccuracy === 0 || score.accuracy >= selectedProfile.minimumAccuracy);
  const layoutAttempts = attempts.filter((attempt) => attempt.layoutId === layout && attempt.kind === "test");
  const canConfigure = status === "ready";
  const fontStack = getDisplayFont(displayFont).cssStack;
  const layoutName = TYPING_LAYOUT_PROFILES.find((profile) => profile.id === layout)?.name ?? layout;
  const requiredLayoutName = selectedProfile.requiredLayoutId
    ? TYPING_LAYOUT_PROFILES.find((profile) => profile.id === selectedProfile.requiredLayoutId)?.name ?? selectedProfile.requiredLayoutId
    : undefined;
  const requiredFontName = selectedProfile.requiredDisplayFontId
    ? getDisplayFont(selectedProfile.requiredDisplayFontId).name
    : undefined;
  const profileEnvironmentReady = (!selectedProfile.requiredLayoutId || selectedProfile.requiredLayoutId === layout)
    && (!selectedProfile.allowedLayoutIds || selectedProfile.allowedLayoutIds.includes(layout))
    && (!selectedProfile.requiredDisplayFontId || selectedProfile.requiredDisplayFontId === displayFont);
  const profileGroups = useMemo(() => {
    const groups = new Map<string, typeof examProfiles>();
    for (const profile of examProfiles) {
      const label = EXAM_CATEGORY_LABELS[profile.category];
      groups.set(label, [...(groups.get(label) ?? []), profile]);
    }
    return [...groups.entries()];
  }, [examProfiles]);
  const sessionActive = status === "running" || status === "paused";

  function loadAttempts() {
    void attemptsRepository.list().then(setAttempts);
  }

  function resetPassagePosition() {
    window.requestAnimationFrame(() => passageRef.current?.scrollTo({ top: 0, behavior: "auto" }));
  }

  function resetToReady() {
    setStatus("ready");
    setSource("");
    setElapsedSeconds(0);
    elapsedBeforeRun.current = 0;
    setRunStartedAt(undefined);
    setBackspaceCount(0);
    setAttemptSaved(false);
    setAttemptId(createAttemptId());
    resetPassagePosition();
  }

  function currentElapsedSeconds() {
    const runningSeconds = runStartedAt ? Math.floor((Date.now() - runStartedAt) / 1000) : 0;
    return Math.min(testDuration, elapsedBeforeRun.current + runningSeconds);
  }

  useEffect(() => {
    loadAttempts();
    window.addEventListener(TRAINING_ATTEMPTS_UPDATED_EVENT, loadAttempts);
    return () => window.removeEventListener(TRAINING_ATTEMPTS_UPDATED_EVENT, loadAttempts);
  }, []);

  useEffect(() => {
    const profile = examProfiles[0];
    setExamProfileId(profile?.id ?? "");
    setTestDuration(profile?.durationSeconds ?? 300);
    setBackspacePolicy(profile?.backspacePolicy ?? "full");
    setApplyLimit(true);
    setWordLimit(profile?.expectedWords ?? 600);
    setApplyKeyLimit(Boolean(profile?.targetKdph));
    setKeystrokeLimit(profileKeystrokeLimit(profile));
    setAllowCorrection(profile?.backspacePolicy !== "disabled");
    setPaperIndex(0);
    resetToReady();
  }, [course.id, examProfiles]);

  useEffect(() => {
    localStorage.setItem("bhashayantra:exam:sound-v2", String(soundOnError));
  }, [soundOnError]);

  useEffect(() => {
    if (status !== "running" || !runStartedAt) return;
    const timer = window.setInterval(() => {
      const nextElapsed = currentElapsedSeconds();
      setElapsedSeconds(nextElapsed);
      if (nextElapsed >= testDuration) {
        elapsedBeforeRun.current = testDuration;
        setRunStartedAt(undefined);
        setAttemptCompletedAt(new Date());
        setStatus("expired");
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [runStartedAt, status, testDuration]);

  useEffect(() => {
    if (!autoScroll || status !== "running") return;
    const container = passageRef.current;
    const current = container?.querySelector<HTMLElement>("[data-current='true']");
    if (!container || !current) return;
    const containerRect = container.getBoundingClientRect();
    const currentRect = current.getBoundingClientRect();
    const currentTop = currentRect.top - containerRect.top + container.scrollTop;
    const currentBottom = currentRect.bottom - containerRect.top + container.scrollTop;
    const safeTop = container.scrollTop + container.clientHeight * 0.18;
    const safeBottom = container.scrollTop + container.clientHeight * 0.82;
    if (currentTop >= safeTop && currentBottom <= safeBottom) return;
    container.scrollTo({
      top: Math.max(0, currentTop - container.clientHeight * 0.18),
      behavior: "auto",
    });
  }, [autoScroll, segments, status]);

  useEffect(() => {
    if (!finished || attemptSaved) return;
    const attempt: TrainingAttempt = {
      id: attemptId,
      kind: "test",
      layoutId: layout,
      exerciseId: builtInPassage.id,
      examProfileId: selectedProfile.id,
      completedAt: attemptCompletedAt.toISOString(),
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
      backspaceCount,
      weakKeys,
    };
    setAttemptSaved(true);
    void attemptsRepository.save(attempt);
  }, [attemptCompletedAt, attemptId, attemptSaved, backspaceCount, builtInPassage.id, finished, kdph, layout, measuredSeconds, score, selectedProfile.id, weakKeys, wpm]);

  function chooseProfile(profileId: string) {
    const profile = examProfiles.find((item) => item.id === profileId) ?? examProfiles[0];
    setExamProfileId(profile.id);
    setTestDuration(profile.durationSeconds);
    setBackspacePolicy(profile.backspacePolicy);
    setApplyLimit(true);
    setWordLimit(profile.expectedWords);
    setApplyKeyLimit(Boolean(profile.targetKdph));
    setKeystrokeLimit(profileKeystrokeLimit(profile));
    setAllowCorrection(profile.backspacePolicy !== "disabled");
    resetToReady();
  }

  function choosePaper(nextIndex: number) {
    setPaperIndex((nextIndex + PAPER_COUNT) % PAPER_COUNT);
    resetToReady();
  }

  function startExam() {
    setSource("");
    setElapsedSeconds(0);
    elapsedBeforeRun.current = 0;
    setBackspaceCount(0);
    setAttemptSaved(false);
    setAttemptId(createAttemptId());
    setAttemptCompletedAt(new Date());
    setStatus("running");
    setRunStartedAt(Date.now());
    window.requestAnimationFrame(() => {
      passageRef.current?.scrollTo({ top: 0, behavior: "auto" });
      textareaRef.current?.focus();
    });
  }

  function pauseExam() {
    const nextElapsed = currentElapsedSeconds();
    elapsedBeforeRun.current = nextElapsed;
    setElapsedSeconds(nextElapsed);
    setRunStartedAt(undefined);
    setStatus("paused");
  }

  function resumeExam() {
    setRunStartedAt(Date.now());
    setStatus("running");
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function submitExam() {
    if (loadBoolean("bhashayantra:exam:confirm-submit-v1", true) && !window.confirm("Submit this test now? The result will be final for this local attempt.")) return;
    const nextElapsed = currentElapsedSeconds();
    elapsedBeforeRun.current = nextElapsed;
    setElapsedSeconds(nextElapsed);
    setRunStartedAt(undefined);
    setAttemptCompletedAt(new Date());
    setStatus("submitted");
  }

  function updateSource(value: string) {
    if (status !== "running") return;
    setSource(value);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (status !== "running") {
      event.preventDefault();
      return;
    }
    if (!event.ctrlKey && !event.altKey && !event.metaKey && event.key !== "Backspace") {
      const enteredKey = event.key === "Enter" ? "\n" : event.key === "Tab" ? "\t" : event.key.length === 1 ? event.key : undefined;
      const expectedKey = Array.from(expectedKeys)[event.currentTarget.selectionStart];
      if (enteredKey && enteredKey !== expectedKey) {
        if (soundOnError) playTypingFeedback("error");
        setErrorPulse(true);
        window.setTimeout(() => setErrorPulse(false), 180);
      }
    }
    if (event.key === "Tab") {
      event.preventDefault();
      if (!allowTabs) return;
      const start = event.currentTarget.selectionStart;
      const end = event.currentTarget.selectionEnd;
      setSource(`${source.slice(0, start)}\t${source.slice(end)}`);
      window.requestAnimationFrame(() => {
        if (!textareaRef.current) return;
        textareaRef.current.selectionStart = start + 1;
        textareaRef.current.selectionEnd = start + 1;
      });
      return;
    }
    if (event.key === "Enter" && !allowParagraphs) {
      event.preventDefault();
      return;
    }
    if (event.key !== "Backspace") return;
    if (!allowCorrection || backspacePolicy === "disabled") {
      event.preventDefault();
      return;
    }
    const caret = event.currentTarget.selectionStart;
    const selectionEnd = event.currentTarget.selectionEnd;
    const currentWordStart = source.lastIndexOf(" ", Math.max(0, caret - 1)) + 1;
    if (backspacePolicy === "current-word" && (caret <= currentWordStart || selectionEnd > caret)) {
      event.preventDefault();
      return;
    }
    setBackspaceCount((count) => count + 1);
  }

  async function clearHistory() {
    await attemptsRepository.clear(layout, "test");
    loadAttempts();
  }

  const statusLabel = status === "ready"
    ? t("examReady")
    : status === "running"
      ? t("examRunning")
      : status === "paused"
        ? t("examPaused")
        : status === "expired"
          ? t("timeExpired")
          : t("examSubmitted");

  return (
    <section className={`mock-exam-page ${sessionActive ? "session-active" : "configuration-active"}`} aria-labelledby="mock-exam-title">
      <header className="mock-exam-heading">
        <div>
          <span>{layoutName} · {t("mockExam")}</span>
          <h1 id="mock-exam-title">{t("typingTest")}</h1>
          <p>{t("mockExamIntro")}</p>
        </div>
        <div className={`mock-status ${status}`}><span>{statusLabel}</span><strong><Clock3 aria-hidden="true" /> {formatTime(remainingSeconds)}</strong></div>
      </header>

      <div className="mock-exam-grid">
        <main className="mock-exam-workstation">
          <section className="mock-exam-profilebar verified-profilebar">
            <label>{t("examProfile")}<select disabled={!canConfigure} value={selectedProfile.id} onChange={(event) => chooseProfile(event.target.value)}>{profileGroups.map(([label, profiles]) => <optgroup key={label} label={label}>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name} · {profile.tier === "free" ? t("free") : t("pro")}</option>)}</optgroup>)}</select></label>
            <div><span>Time</span><strong>{selectedProfile.durationSeconds / 60} min</strong></div>
            <div><span>Qualifying speed</span><strong>{selectedProfile.scoringModel === "kdph" ? `${selectedProfile.targetKdph} KDPH` : `${selectedProfile.targetWpm} ${selectedProfile.scoringModel === "net-wpm" ? "NWPM" : "WPM"}`}</strong></div>
            <Button variant="outline" size="sm" disabled={!canConfigure} onClick={() => window.print()}><Printer aria-hidden="true" /> {t("printPassage")}</Button>
            <p><AlertTriangle aria-hidden="true" /> {selectedProfile.disclaimer}</p>
          </section>

          <section className="official-rule-strip" aria-label="Exam rule reference">
            <div><Landmark aria-hidden="true" /><span>{selectedProfile.verification === "official-reference" ? "Official-reference profile" : "Practice profile"}</span><strong>{selectedProfile.authority}</strong><small>Checked {selectedProfile.verifiedOn}</small></div>
            <ul>{selectedProfile.rules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
            {selectedProfile.requiredLayoutLabel && <p><strong>Layout:</strong> {selectedProfile.requiredLayoutLabel}</p>}
            {selectedProfile.officialSourceUrl && <a href={selectedProfile.officialSourceUrl} target="_blank" rel="noreferrer">{selectedProfile.officialSourceLabel ?? "Open official notice"} <ExternalLink aria-hidden="true" /></a>}
          </section>

          {!profileEnvironmentReady && (
            <div className="exam-environment-warning" role="alert">
              <AlertTriangle aria-hidden="true" />
              <div>
                <strong>Exam environment mismatch</strong>
                <span>Select {requiredLayoutName}{requiredFontName ? ` with ${requiredFontName}` : ""} from the top bar before starting this official simulation.</span>
              </div>
            </div>
          )}

          <section className="mock-passage-card">
            <div className="mock-card-header">
              <div><FileText aria-hidden="true" /><span>{t("passage")}</span><small>{countWords(expected)} {t("words")}</small></div>
              <div className="mock-font-controls"><button type="button" aria-label={t("fontSmaller")} onClick={() => setFontSize((size) => Math.max(18, size - 2))}><Minus aria-hidden="true" /></button><strong>{fontSize}</strong><button type="button" aria-label={t("fontLarger")} onClick={() => setFontSize((size) => Math.min(36, size + 2))}><Plus aria-hidden="true" /></button></div>
            </div>
            <div ref={passageRef} className={`mock-passage ${showScrollbar ? "" : "hide-scrollbar"}`} style={{ fontFamily: fontStack, fontSize }}>
              {segments.map((segment, index) => <span key={`${index}-${segment.text.slice(0, 4)}`} className={`highlight-${segment.state}`} data-current={segment.current ? "true" : undefined}>{segment.text}</span>)}
            </div>
          </section>

          <div className="mock-control-strip">
            <label>{t("duration")}<select disabled={!canConfigure || selectedProfile.verification === "official-reference"} value={testDuration} onChange={(event) => { setTestDuration(Number(event.target.value)); resetToReady(); }}>{TEST_DURATIONS.map((seconds) => <option key={seconds} value={seconds}>{seconds / 60} {t("minutes")}</option>)}</select></label>
            <div className="paper-picker"><button type="button" disabled={!canConfigure} aria-label={t("previousPaper")} onClick={() => choosePaper(paperIndex - 1)}><ChevronLeft aria-hidden="true" /></button><label>{t("questionPaper")}<select disabled={!canConfigure} value={paperIndex} onChange={(event) => choosePaper(Number(event.target.value))}>{Array.from({ length: PAPER_COUNT }, (_, index) => <option key={index} value={index}>{t("testPaper")} {index + 1}/{PAPER_COUNT}</option>)}</select></label><button type="button" disabled={!canConfigure} aria-label={t("nextPaper")} onClick={() => choosePaper(paperIndex + 1)}><ChevronRight aria-hidden="true" /></button></div>
            {sessionActive && <div className="mock-session-summary"><strong>{selectedProfile.shortName}</strong><span>{requiredProfileSpeed} {selectedProfile.scoringModel === "kdph" ? "KDPH" : "WPM"}</span><span>{countWords(expected)} {t("words")}</span></div>}
            <div className="mock-primary-actions">
              {status === "ready" && <Button disabled={!profileEnvironmentReady} onClick={startExam}><Play aria-hidden="true" /> {t("startExam")}</Button>}
              {status === "running" && selectedProfile.verification === "practice" && <Button variant="outline" onClick={pauseExam}><Pause aria-hidden="true" /> {t("pauseExam")}</Button>}
              {status === "paused" && <Button variant="outline" onClick={resumeExam}><Play aria-hidden="true" /> {t("resumeExam")}</Button>}
              {(status === "running" || status === "paused") && <Button variant="danger" onClick={submitExam}><Square aria-hidden="true" /> {t("submitExam")}</Button>}
              {finished && <Button onClick={resetToReady}><RotateCcw aria-hidden="true" /> {t("newMockTest")}</Button>}
            </div>
          </div>

          <section className={`mock-typing-card ${status} ${errorPulse ? "error-pulse" : ""}`}>
            <div className="mock-card-header"><div><span>{t("yourTyping")}</span><small>{status === "ready" ? t("examNotStarted") : statusLabel}</small></div><div className="mock-typing-counts"><span>{countWords(source)} {t("typedWords")}</span><span>{score.correctCharacters} {t("correctCharacters")}</span><span>{score.substitutedCharacters + score.extraCharacters} {t("errors")}</span><span>{backspaceCount} {t("corrections")}</span></div></div>
            <div className={layout === "english-qwerty" ? "mock-answer-editor direct" : "mock-answer-editor converted"}>
              <textarea
                ref={textareaRef}
                value={source}
                onChange={(event) => updateSource(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={status === "ready" ? t("beginToType") : status === "paused" ? t("examPaused") : t("trainingPlaceholder")}
                disabled={status !== "running"}
                spellCheck={false}
                style={{ fontSize }}
                aria-label={t("yourTyping")}
              />
              {layout !== "english-qwerty" && <div className={actual ? "mock-unicode-answer" : "mock-unicode-answer placeholder"} aria-hidden="true" style={{ fontFamily: fontStack, fontSize }}>{actual || (status === "ready" ? t("beginToType") : status === "paused" ? t("examPaused") : t("trainingPlaceholder"))}</div>}
            </div>
          </section>

          {finished && <ExamResultReport passed={passed} attemptId={attemptId} completedAt={attemptCompletedAt} profile={selectedProfile} paperNumber={paperIndex + 1} layoutName={layoutName} durationSeconds={measuredSeconds} measuredSpeed={measuredProfileSpeed} requiredSpeed={requiredProfileSpeed} wpm={wpm} grossWpm={grossWpm} netWpm={wordSpeed.netWpm} rrbWpm={selectedProfile.scoringModel === "rrb-wpm" ? rrbScore.wpm : undefined} kdph={kdph} accuracy={score.accuracy} expectedCharacters={score.expectedCharacters} typedCharacters={score.typedCharacters} correctCharacters={score.correctCharacters} missingCharacters={score.missingCharacters} extraCharacters={score.extraCharacters} substitutedCharacters={score.substitutedCharacters} corrections={backspaceCount} weakKeys={weakKeys} endedByTimer={status === "expired"} onNewTest={resetToReady} />}
          {attemptSaved && <p className="training-saved"><CheckCircle2 aria-hidden="true" /> {t("trainingSaved")}</p>}

          <section className="attempt-history compact" aria-labelledby="mock-history-title">
            <div><h2 id="mock-history-title"><History aria-hidden="true" /> {t("attemptHistory")}</h2>{layoutAttempts.length > 0 && <Button size="sm" variant="danger" onClick={() => void clearHistory()}><Trash2 aria-hidden="true" /> {t("clearHistory")}</Button>}</div>
            {layoutAttempts.length === 0 ? <p>{t("noAttempts")}</p> : <div className="attempt-table"><div className="attempt-row heading"><span>{t("exercise")}</span><span>{t("accuracy")}</span><span>WPM</span><span>KDPH</span><span>{t("duration")}</span></div>{layoutAttempts.slice(0, 6).map((attempt) => <div className="attempt-row" key={attempt.id}><span><Award aria-hidden="true" /> {examProfiles.find((profile) => profile.id === attempt.examProfileId)?.shortName ?? attempt.examProfileId}<small>{new Date(attempt.completedAt).toLocaleString(language === "hi" ? "hi-IN" : "en-IN")}</small></span><strong>{attempt.accuracy}%</strong><strong>{attempt.wpm}</strong><strong>{attempt.kdph}</strong><strong>{formatTime(attempt.elapsedSeconds)}</strong></div>)}</div>}
          </section>
        </main>

        <aside className="mock-settings" aria-label={t("mockSettings") }>
          <div className="mock-settings-title"><Settings2 aria-hidden="true" /><div><strong>{t("mockSettings")}</strong><small>{canConfigure ? t("configureBeforeStart") : t("lockedAfterStart")}</small></div></div>
          <fieldset disabled={!canConfigure || selectedProfile.verification === "official-reference"}>
            <legend>{t("backspaceOptions")}</legend>
            <RadioOption checked={backspacePolicy === "full"} onChange={() => setBackspacePolicy("full")} label={t("fullBackspace")} />
            <RadioOption checked={backspacePolicy === "current-word"} onChange={() => setBackspacePolicy("current-word")} label={t("currentWordOnly")} />
            <RadioOption checked={backspacePolicy === "disabled"} onChange={() => setBackspacePolicy("disabled")} label={t("disableBackspace")} />
          </fieldset>
          <fieldset disabled={!canConfigure}>
            <legend>{t("highlightOptions")}</legend>
            <RadioOption checked={highlightMode === "word"} onChange={() => setHighlightMode("word")} label={t("wordHighlight")} />
            <RadioOption checked={highlightMode === "error-word"} onChange={() => setHighlightMode("error-word")} label={t("errorWordHighlight")} />
            <RadioOption checked={highlightMode === "letter"} onChange={() => setHighlightMode("letter")} label={t("letterHighlight")} />
            <RadioOption checked={highlightMode === "none"} onChange={() => setHighlightMode("none")} label={t("noHighlight")} />
          </fieldset>
          <fieldset disabled={!canConfigure}>
            <legend>{t("scrollOptions")}</legend>
            <CheckOption checked={showScrollbar} onChange={setShowScrollbar} label={t("showScrollbar")} />
            <CheckOption checked={autoScroll} onChange={setAutoScroll} label={t("autoScroll")} />
          </fieldset>
          <fieldset>
            <legend>{t("soundOnError")}</legend>
            <CheckOption checked={soundOnError} onChange={setSoundOnError} label={t("soundOnError")} />
            <Button size="sm" variant="outline" onClick={() => playTypingFeedback("preview")}><Volume2 aria-hidden="true" /> {t("testSound")}</Button>
          </fieldset>
          <fieldset disabled={!canConfigure}>
            <legend>{t("paragraphSettings")}</legend>
            <CheckOption checked={applyLimit} onChange={setApplyLimit} label={t("applyWordLimit")} />
            <label className="mock-number-field">{t("wordLimit")}<input type="number" min="150" max="1200" step="50" disabled={!applyLimit} value={wordLimit} onChange={(event) => setWordLimit(Math.min(1200, Math.max(150, Number(event.target.value))))} /><small>150–1200</small></label>
            <CheckOption checked={applyKeyLimit} onChange={setApplyKeyLimit} label={t("applyKeystrokeLimit")} />
            <label className="mock-number-field">{t("keystrokeLimit")}<input type="number" min="200" max="50000" step="50" disabled={!applyKeyLimit} value={keystrokeLimit} onChange={(event) => setKeystrokeLimit(Math.min(50000, Math.max(200, Number(event.target.value))))} /><small>200–50000</small></label>
          </fieldset>
          <fieldset disabled={!canConfigure}>
            <legend>{t("wordProcessorMode")}</legend>
            <CheckOption checked={allowParagraphs} onChange={setAllowParagraphs} label={t("allowParagraphs")} />
            <CheckOption checked={allowTabs} onChange={setAllowTabs} label={t("allowTabs")} />
            <CheckOption checked={allowCorrection} onChange={setAllowCorrection} label={t("allowCorrection")} />
          </fieldset>
          <fieldset disabled={!canConfigure}>
            <legend>{t("ownPassage")}</legend>
            <CheckOption checked={useCustomPassage} onChange={setUseCustomPassage} label={t("useOwnPassage")} />
            {useCustomPassage && <textarea value={customPassage} onChange={(event) => setCustomPassage(event.target.value)} placeholder={t("ownPassagePlaceholder")} />}
          </fieldset>
        </aside>
      </div>
    </section>
  );
}

function RadioOption({ checked, onChange, label }: { readonly checked: boolean; readonly onChange: () => void; readonly label: string }) {
  return <label className="mock-option"><input type="radio" checked={checked} onChange={onChange} /><span>{label}</span></label>;
}

function CheckOption({ checked, onChange, label }: { readonly checked: boolean; readonly onChange: (value: boolean) => void; readonly label: string }) {
  return <label className="mock-option"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>;
}
