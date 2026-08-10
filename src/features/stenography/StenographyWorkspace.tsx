import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  AudioLines,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileAudio,
  Headphones,
  Pause,
  Play,
  RotateCcw,
  Square,
  Target,
  Volume2,
  VolumeX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  calculateTranscriptWpm,
  dictationIntervalMs,
  scoreTranscript,
  tokenizeStenographyText,
  type TranscriptScore,
} from "@/domain/stenography/stenography-engine";
import type { TypingLanguageCode } from "@/domain/typing/typing-profiles";

type SessionStatus = "ready" | "running" | "paused" | "finished";

interface DictationPassage {
  readonly id: string;
  readonly language: TypingLanguageCode;
  readonly title: string;
  readonly category: string;
  readonly text: string;
}

interface StenographyAttempt {
  readonly id: number;
  readonly title: string;
  readonly speed: number;
  readonly accuracy: number;
  readonly transcriptWpm: number;
  readonly createdAt: string;
}

const ATTEMPT_KEY = "bhashayantra:stenography-attempts-v1";

const passages: readonly DictationPassage[] = [
  {
    id: "office-order-hi",
    language: "hi",
    title: "कार्यालय आदेश",
    category: "Government office",
    text: "कार्यालय के सभी कर्मचारियों को सूचित किया जाता है कि मासिक प्रगति बैठक सोमवार को प्रातः दस बजे सम्मेलन कक्ष में आयोजित होगी। प्रत्येक अनुभाग अपना कार्य विवरण और लंबित मामलों की सूची बैठक से पहले प्रस्तुत करेगा।",
  },
  {
    id: "court-note-hi",
    language: "hi",
    title: "न्यायालय कार्यवाही",
    category: "Court practice",
    text: "माननीय न्यायालय के समक्ष प्रस्तुत अभिलेखों का सावधानीपूर्वक परीक्षण किया गया। संबंधित पक्षों को अगली सुनवाई की तिथि से पूर्व आवश्यक दस्तावेज जमा करने का निर्देश दिया जाता है।",
  },
  {
    id: "public-notice-hi",
    language: "hi",
    title: "लोक सूचना",
    category: "Administrative",
    text: "जनहित में जारी इस सूचना के अनुसार नागरिक अपनी शिकायत ऑनलाइन पोर्टल अथवा जिला सहायता केंद्र पर दर्ज कर सकते हैं। प्राप्त आवेदन का निस्तारण निर्धारित समय सीमा के भीतर किया जाएगा।",
  },
  {
    id: "official-record-en",
    language: "en",
    title: "Official record",
    category: "Government office",
    text: "All section officers shall submit the monthly progress report before the review meeting. The report must include completed work, pending cases, and the action proposed for the following week.",
  },
  {
    id: "court-proceeding-en",
    language: "en",
    title: "Court proceeding",
    category: "Court practice",
    text: "The documents placed on record have been examined carefully. Both parties are directed to file the required statements before the next date of hearing and provide a copy to the opposing counsel.",
  },
] as const;

function loadAttempts(): readonly StenographyAttempt[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(ATTEMPT_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is StenographyAttempt => Boolean(item && typeof item === "object" && "accuracy" in item)) : [];
  } catch {
    return [];
  }
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function StenographyWorkspace({ defaultLanguage }: { readonly defaultLanguage: TypingLanguageCode }) {
  const [language, setLanguage] = useState<TypingLanguageCode>(defaultLanguage);
  const availablePassages = useMemo(() => passages.filter((passage) => passage.language === language), [language]);
  const [passageId, setPassageId] = useState(() => passages.find((passage) => passage.language === defaultLanguage)?.id ?? passages[0].id);
  const passage = passages.find((item) => item.id === passageId) ?? availablePassages[0];
  const words = useMemo(() => tokenizeStenographyText(passage.text), [passage.text]);
  const [speed, setSpeed] = useState(80);
  const [status, setStatus] = useState<SessionStatus>("ready");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [revealedWords, setRevealedWords] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [score, setScore] = useState<TranscriptScore | null>(null);
  const [attempts, setAttempts] = useState<readonly StenographyAttempt[]>(loadAttempts);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioName, setAudioName] = useState("");
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!availablePassages.some((item) => item.id === passageId)) {
      setPassageId(availablePassages[0].id);
    }
  }, [availablePassages, passageId]);

  useEffect(() => {
    if (status !== "running") return;
    const timer = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status !== "running") return;
    const timer = window.setInterval(() => {
      setRevealedWords((value) => {
        const next = Math.min(value + 1, words.length);
        if (next >= words.length) window.setTimeout(() => setStatus("finished"), 0);
        return next;
      });
    }, dictationIntervalMs(speed));
    return () => window.clearInterval(timer);
  }, [speed, status, words.length]);

  useEffect(() => () => {
    window.speechSynthesis?.cancel();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  function speakPassage() {
    if (!voiceEnabled || audioUrl || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(passage.text);
    utterance.lang = language === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = Math.min(1.8, Math.max(0.55, speed / 105));
    window.speechSynthesis.speak(utterance);
  }

  function startSession() {
    if (status === "finished" || status === "ready") {
      setElapsedSeconds(0);
      setRevealedWords(0);
      setTranscript("");
      setScore(null);
    }
    setStatus("running");
    if (status === "paused") window.speechSynthesis?.resume();
    else speakPassage();
  }

  function pauseSession() {
    setStatus("paused");
    window.speechSynthesis?.pause();
  }

  function resetSession() {
    setStatus("ready");
    setElapsedSeconds(0);
    setRevealedWords(0);
    setTranscript("");
    setScore(null);
    window.speechSynthesis?.cancel();
  }

  function submitTranscript() {
    const nextScore = scoreTranscript(passage.text, transcript);
    const attempt: StenographyAttempt = {
      id: Date.now(),
      title: passage.title,
      speed,
      accuracy: nextScore.accuracy,
      transcriptWpm: calculateTranscriptWpm(nextScore.typedWords, Math.max(elapsedSeconds, 1)),
      createdAt: new Date().toISOString(),
    };
    const nextAttempts = [attempt, ...attempts].slice(0, 8);
    setScore(nextScore);
    setAttempts(nextAttempts);
    setStatus("finished");
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify(nextAttempts));
    window.speechSynthesis?.cancel();
  }

  function chooseAudio(file: File | undefined) {
    if (!file) return;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
    setAudioName(file.name);
    setVoiceEnabled(false);
    resetSession();
  }

  const progress = words.length ? Math.round((revealedWords / words.length) * 100) : 0;
  const activeWord = words[Math.min(revealedWords, words.length - 1)] ?? "—";

  return (
    <section className="steno-studio">
      <header className="steno-hero">
        <div>
          <span className="page-eyebrow"><AudioLines aria-hidden="true" /> PROFESSIONAL DICTATION WORKSPACE</span>
          <h1>Stenography Studio</h1>
          <p>Train listening, shorthand capture, and accurate transcription in one distraction-free session.</p>
        </div>
        <div className={`steno-session-status ${status}`}><span />{status === "running" ? "Dictation live" : status === "paused" ? "Session paused" : status === "finished" ? "Ready to review" : "Ready to begin"}</div>
      </header>

      <div className="steno-toolbar">
        <label><span>Language</span><select value={language} onChange={(event) => { setLanguage(event.target.value as TypingLanguageCode); resetSession(); }}><option value="hi">Hindi</option><option value="en">English</option></select></label>
        <label className="steno-passage-select"><span>Dictation set</span><select value={passage.id} onChange={(event) => { setPassageId(event.target.value); resetSession(); }}>{availablePassages.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.category}</option>)}</select></label>
        <label><span>Target speed</span><select value={speed} onChange={(event) => { setSpeed(Number(event.target.value)); resetSession(); }}>{[60, 80, 100, 120, 140].map((value) => <option key={value} value={value}>{value} WPM</option>)}</select></label>
        <button type="button" className={voiceEnabled ? "steno-voice active" : "steno-voice"} onClick={() => setVoiceEnabled((value) => !value)} disabled={Boolean(audioUrl)}>{voiceEnabled ? <Volume2 /> : <VolumeX />}<span>Voice cue</span><strong>{voiceEnabled ? "On" : "Off"}</strong></button>
      </div>

      <div className="steno-workbench">
        <article className="dictation-console">
          <div className="panel-kicker"><Headphones aria-hidden="true" /><span>DICTATION CONSOLE</span><strong>{formatTime(elapsedSeconds)}</strong></div>
          <div className="dictation-stage">
            <div className="waveform" aria-hidden="true">{Array.from({ length: 28 }, (_, index) => <i key={index} style={{ height: `${18 + ((index * 17) % 45)}%` }} />)}</div>
            <span className="dictation-label">{status === "running" ? "Current cue" : "Selected exercise"}</span>
            <strong className={language === "hi" ? "devanagari" : ""}>{status === "running" ? activeWord : passage.title}</strong>
            <p>{audioUrl ? `Using imported audio: ${audioName}` : `${words.length} words · synthetic ${language === "hi" ? "Hindi" : "English"} voice available`}</p>
          </div>
          <div className="dictation-progress"><span style={{ width: `${progress}%` }} /></div>
          {audioUrl && <audio className="steno-audio" controls src={audioUrl} />}
          <div className="dictation-actions">
            {status === "running" ? <Button onClick={pauseSession}><Pause /> Pause</Button> : <Button onClick={startSession}><Play /> {status === "paused" ? "Resume" : "Start dictation"}</Button>}
            <Button variant="outline" onClick={resetSession}><RotateCcw /> Reset</Button>
            <Button variant="outline" onClick={() => audioInputRef.current?.click()}><FileAudio /> Import audio</Button>
            <input ref={audioInputRef} className="sr-only" type="file" accept="audio/*" onChange={(event) => chooseAudio(event.target.files?.[0])} />
          </div>
        </article>

        <article className="transcript-console">
          <div className="panel-kicker"><Square aria-hidden="true" /><span>TRANSCRIPTION PAD</span><strong>{tokenizeStenographyText(transcript).length} words</strong></div>
          <textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder="Type the complete transcript here while listening…" aria-label="Stenography transcript" spellCheck={false} />
          <div className="transcript-footer"><span>Your draft stays on this device.</span><Button onClick={submitTranscript} disabled={!transcript.trim()}><CheckCircle2 /> Score transcript</Button></div>
        </article>
      </div>

      <div className="steno-insights">
        <article className="steno-score-card">
          <div className="panel-kicker"><Target /><span>SESSION SCORE</span></div>
          {score ? (
            <div className="score-summary">
              <div className="score-ring" style={{ "--score": `${score.accuracy * 3.6}deg` } as CSSProperties}><strong>{score.accuracy}%</strong><span>accuracy</span></div>
              <div className="score-metrics"><span><small>Correct</small><strong>{score.correct}</strong></span><span><small>Missing</small><strong>{score.missing}</strong></span><span><small>Extra</small><strong>{score.extra}</strong></span><span><small>Changed</small><strong>{score.substitutions}</strong></span></div>
            </div>
          ) : <div className="empty-score"><Target /><strong>Complete a transcript</strong><span>Accuracy and word-level errors will appear here.</span></div>}
        </article>

        <article className="steno-history-card">
          <div className="panel-kicker"><BarChart3 /><span>RECENT ATTEMPTS</span><button type="button" onClick={() => { setAttempts([]); localStorage.removeItem(ATTEMPT_KEY); }} disabled={!attempts.length}>Clear</button></div>
          {attempts.length ? <div className="steno-attempt-list">{attempts.slice(0, 4).map((attempt) => <div key={attempt.id}><span><strong>{attempt.title}</strong><small>{new Date(attempt.createdAt).toLocaleDateString()} · {attempt.speed} WPM cue</small></span><b>{attempt.accuracy}%</b><em>{attempt.transcriptWpm} WPM</em></div>)}</div> : <div className="empty-score compact"><Clock3 /><span>No saved stenography attempts yet.</span></div>}
        </article>
      </div>
    </section>
  );
}
