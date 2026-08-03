import { CheckCircle2, Clock3, Gauge, RotateCcw, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { calculateTrainingScore, calculateWpm, TRAINING_LESSONS } from "@/domain/training/training-engine";
import { typingSourceToUnicode } from "@/domain/typing/typing-engine";
import { getDisplayFont, TYPING_LAYOUT_PROFILES, type ReadyTypingLayoutId, type UnicodeDisplayFontId } from "@/domain/typing/typing-profiles";
import { useI18n } from "@/i18n/I18nProvider";

interface TypingTrainingProps {
  readonly kind: "practice" | "test";
  readonly layout: ReadyTypingLayoutId;
  readonly displayFont: UnicodeDisplayFontId;
}

const TEST_SECONDS = 60;

export function TypingTraining({ kind, layout, displayFont }: TypingTrainingProps) {
  const { t } = useI18n();
  const lessons = TRAINING_LESSONS[layout];
  const [lessonIndex, setLessonIndex] = useState(0);
  const [source, setSource] = useState("");
  const [startedAt, setStartedAt] = useState<number>();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const lesson = lessons[lessonIndex % lessons.length];
  const expected = useMemo(() => typingSourceToUnicode(lesson.keys, layout).output, [layout, lesson.keys]);
  const actual = useMemo(() => typingSourceToUnicode(source, layout).output, [layout, source]);
  const score = useMemo(() => calculateTrainingScore(expected, actual), [actual, expected]);
  const remainingSeconds = kind === "test" ? Math.max(0, TEST_SECONDS - elapsedSeconds) : 0;
  const finished = score.complete || (kind === "test" && remainingSeconds === 0 && Boolean(startedAt));
  const wpm = calculateWpm(Array.from(actual).length, elapsedSeconds);
  const layoutName = TYPING_LAYOUT_PROFILES.find((profile) => profile.id === layout)?.name ?? layout;
  const fontStack = getDisplayFont(displayFont).cssStack;

  useEffect(() => {
    setLessonIndex(0);
    setSource("");
    setStartedAt(undefined);
    setElapsedSeconds(0);
  }, [kind, layout]);

  useEffect(() => {
    if (!startedAt || finished) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);
    return () => window.clearInterval(timer);
  }, [finished, startedAt]);

  function reset() {
    setSource("");
    setStartedAt(undefined);
    setElapsedSeconds(0);
  }

  function nextLesson() {
    setLessonIndex((current) => (current + 1) % lessons.length);
    reset();
  }

  function updateSource(value: string) {
    if (!startedAt && value.length > 0) setStartedAt(Date.now());
    setSource(value);
  }

  return (
    <section className="training-card" aria-labelledby="training-title">
      <div className="training-heading">
        <div>
          <span className="training-kicker">{layoutName}</span>
          <h1 id="training-title">{kind === "practice" ? t("typingPractice") : t("typingTest")}</h1>
          <p>{kind === "practice" ? t("practiceIntro") : t("testIntro")}</p>
        </div>
        <div className="training-timer">
          {kind === "test" ? <><Clock3 aria-hidden="true" /><strong>{remainingSeconds}s</strong><span>{t("timeRemaining")}</span></> : <><Target aria-hidden="true" /><strong>{lessonIndex + 1}/{lessons.length}</strong><span>{t("lesson")}</span></>}
        </div>
      </div>

      <div className="training-target" style={{ fontFamily: fontStack }}>
        <span>{t("targetText")}</span>
        <strong>{expected}</strong>
      </div>

      <div className="training-guide">
        <span>{t("guideKeys")}</span>
        <code>{lesson.keys}</code>
      </div>

      <label className="training-input-label" htmlFor="training-input">{t("yourTyping")}</label>
      <textarea
        id="training-input"
        value={source}
        onChange={(event) => updateSource(event.target.value)}
        placeholder={t("trainingPlaceholder")}
        spellCheck={false}
        disabled={finished}
        autoFocus
      />

      <div className="training-preview" style={{ fontFamily: fontStack }}>
        <span>{t("resultPreview")}</span>
        <strong>{actual || "—"}</strong>
      </div>

      <div className="training-results" aria-live="polite">
        <TrainingMetric label={t("accuracy")} value={`${score.accuracy}%`} />
        <TrainingMetric label="WPM" value={String(wpm)} />
        <TrainingMetric label={t("characters")} value={`${score.correctCharacters}/${score.expectedCharacters}`} />
        <div className={score.complete ? "training-result-status complete" : "training-result-status"}>
          {score.complete ? <CheckCircle2 aria-hidden="true" /> : <Gauge aria-hidden="true" />}
          {score.complete ? t("lessonComplete") : finished ? t("testFinished") : t("trainingInProgress")}
        </div>
      </div>

      <div className="training-actions">
        <Button variant="outline" onClick={reset}><RotateCcw aria-hidden="true" /> {t("reset")}</Button>
        <Button onClick={nextLesson} disabled={!finished}>{t("nextLesson")}</Button>
      </div>
    </section>
  );
}

function TrainingMetric({ label, value }: { readonly label: string; readonly value: string }) {
  return <div className="training-metric"><span>{label}</span><strong>{value}</strong></div>;
}
