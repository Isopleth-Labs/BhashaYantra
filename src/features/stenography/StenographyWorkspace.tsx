import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  AudioLines,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileAudio,
  Gavel,
  Headphones,
  LockKeyhole,
  Pause,
  Play,
  Radio,
  RotateCcw,
  ShieldCheck,
  SkipForward,
  Square,
  Target,
  Volume2,
  VolumeX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  startStenographyNarration,
  stopStenographyNarration,
  testStenographyNarration,
  type NarrationStatus,
} from "@/application/stenography-audio";
import {
  buildOriginalStenographyScript,
  STENOGRAPHY_PROFILES,
  type StenographyEnvironment,
  type StenographyProfile,
} from "@/domain/stenography/stenography-profiles";
import {
  calculateTranscriptWpm,
  scoreTranscript,
  tokenizeStenographyText,
  type TranscriptScore,
} from "@/domain/stenography/stenography-engine";
import type { TypingLanguageCode } from "@/domain/typing/typing-profiles";

type SessionPhase = "setup" | "countdown" | "dictation" | "paused" | "transcription" | "result";
type SessionMode = "exam-simulation" | "listen-type";

interface StenographyAttempt {
  readonly id: number;
  readonly profileId: string;
  readonly title: string;
  readonly environment: StenographyEnvironment;
  readonly speed: number;
  readonly accuracy: number;
  readonly transcriptWpm: number;
  readonly createdAt: string;
}

const ATTEMPT_KEY = "bhashayantra:stenography-attempts-v2";

function loadAttempts(): readonly StenographyAttempt[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(ATTEMPT_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is StenographyAttempt => Boolean(item && typeof item === "object" && "profileId" in item)) : [];
  } catch {
    return [];
  }
}

function loadBoolean(key: string, fallback: boolean) {
  const value = localStorage.getItem(key);
  return value === null ? fallback : value === "true";
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(Math.max(0, totalSeconds) / 60).toString().padStart(2, "0");
  const seconds = (Math.max(0, totalSeconds) % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function phaseLabel(phase: SessionPhase) {
  if (phase === "countdown") return "Preparing";
  if (phase === "dictation") return "Dictation live";
  if (phase === "paused") return "Practice paused";
  if (phase === "transcription") return "Transcription live";
  if (phase === "result") return "Session scored";
  return "Ready to begin";
}

export function StenographyWorkspace({ defaultLanguage }: { readonly defaultLanguage: TypingLanguageCode }) {
  const defaultProfile = STENOGRAPHY_PROFILES.find((item) => item.language === defaultLanguage && item.verification === "practice") ?? STENOGRAPHY_PROFILES[0];
  const [profileId, setProfileId] = useState(defaultProfile.id);
  const profile: StenographyProfile = STENOGRAPHY_PROFILES.find((item) => item.id === profileId) ?? defaultProfile;
  const script = useMemo(() => buildOriginalStenographyScript(profile), [profile]);
  const [phase, setPhase] = useState<SessionPhase>("setup");
  const [countdown, setCountdown] = useState(3);
  const [dictationRemaining, setDictationRemaining] = useState(profile.dictationSeconds);
  const [transcriptionRemaining, setTranscriptionRemaining] = useState(profile.transcriptionSeconds);
  const [transcript, setTranscript] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(() => loadBoolean("bhashayantra:steno:voice-v1", true));
  const [sessionMode, setSessionMode] = useState<SessionMode>(() => localStorage.getItem("bhashayantra:steno:mode-v1") === "listen-type" ? "listen-type" : "exam-simulation");
  const [narrationStatus, setNarrationStatus] = useState<NarrationStatus>({ engine: "unavailable", label: "Run voice test before the session" });
  const [audioMessage, setAudioMessage] = useState("Audio is ready to test");
  const [score, setScore] = useState<TranscriptScore | null>(null);
  const [attempts, setAttempts] = useState<readonly StenographyAttempt[]>(loadAttempts);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioName, setAudioName] = useState("");
  const audioInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const transcriptRef = useRef<HTMLTextAreaElement>(null);

  const strictExamMode = sessionMode === "exam-simulation";
  const officialProfile = profile.verification === "official-reference";
  const officialMode = officialProfile && strictExamMode;
  const transcriptEnabled = phase === "transcription" || (sessionMode === "listen-type" && (phase === "dictation" || phase === "paused"));
  const dictationProgress = Math.round((1 - dictationRemaining / profile.dictationSeconds) * 100);
  const transcriptionElapsed = Math.max(1, profile.transcriptionSeconds - transcriptionRemaining);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("dictation");
      void startPlayback();
      return;
    }
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [audioUrl, countdown, phase, profile, script, voiceEnabled]);

  useEffect(() => {
    if (phase !== "dictation") return;
    if (dictationRemaining <= 0) {
      beginTranscription();
      return;
    }
    const timer = window.setTimeout(() => setDictationRemaining((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [dictationRemaining, phase]);

  useEffect(() => {
    if (phase !== "transcription") return;
    if (transcriptionRemaining <= 0) {
      finishTranscript();
      return;
    }
    const timer = window.setTimeout(() => setTranscriptionRemaining((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, transcriptionRemaining]);

  useEffect(() => {
    if (sessionMode === "listen-type" && phase === "dictation") {
      window.requestAnimationFrame(() => transcriptRef.current?.focus());
    }
  }, [phase, sessionMode]);

  useEffect(() => () => {
    void stopStenographyNarration();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  async function startPlayback() {
    if (audioUrl) {
      try {
        await audioRef.current?.play();
        setAudioMessage(`Playing imported audio: ${audioName}`);
      } catch {
        setAudioMessage("Imported audio could not start. Use the player controls and try again.");
      }
      return;
    }
    if (!voiceEnabled) {
      setAudioMessage("Narration is off. Turn on Local voice or import an audio file.");
      return;
    }
    setAudioMessage("Starting narration…");
    const status = await startStenographyNarration(script, profile.language, profile.dictationWpm);
    setNarrationStatus(status);
    setAudioMessage(status.engine === "unavailable" ? status.label : `Playing through ${status.label}`);
  }

  function resetSession(nextProfile = profile) {
    setPhase("setup");
    setCountdown(3);
    setDictationRemaining(nextProfile.dictationSeconds);
    setTranscriptionRemaining(nextProfile.transcriptionSeconds);
    setTranscript("");
    setScore(null);
    void stopStenographyNarration();
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
  }

  function chooseProfile(nextId: string) {
    const nextProfile = STENOGRAPHY_PROFILES.find((item) => item.id === nextId) ?? profile;
    setProfileId(nextProfile.id);
    resetSession(nextProfile);
  }

  function chooseEnvironment(environment: StenographyEnvironment) {
    const nextProfile = STENOGRAPHY_PROFILES.find((item) => item.environment === environment && item.language === profile.language)
      ?? STENOGRAPHY_PROFILES.find((item) => item.environment === environment)
      ?? profile;
    chooseProfile(nextProfile.id);
  }

  function startSession() {
    resetSession(profile);
    const useCountdown = loadBoolean("bhashayantra:steno:countdown-v1", true);
    setPhase(useCountdown ? "countdown" : "dictation");
    if (!useCountdown) {
      void startPlayback();
    }
  }

  function pauseSession() {
    if (officialMode || phase !== "dictation") return;
    setPhase("paused");
    void stopStenographyNarration();
    audioRef.current?.pause();
    setAudioMessage("Audio paused. Resume restarts local narration from the beginning.");
  }

  function resumeSession() {
    setPhase("dictation");
    void startPlayback();
  }

  function beginTranscription() {
    void stopStenographyNarration();
    audioRef.current?.pause();
    setPhase("transcription");
    window.requestAnimationFrame(() => transcriptRef.current?.focus());
  }

  function finishTranscript() {
    const nextScore = scoreTranscript(script, transcript);
    const attempt: StenographyAttempt = {
      id: Date.now(), profileId: profile.id, title: profile.name, environment: profile.environment,
      speed: profile.dictationWpm, accuracy: nextScore.accuracy,
      transcriptWpm: calculateTranscriptWpm(nextScore.typedWords, transcriptionElapsed), createdAt: new Date().toISOString(),
    };
    const nextAttempts = [attempt, ...attempts].slice(0, 12);
    setScore(nextScore);
    setAttempts(nextAttempts);
    setPhase("result");
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify(nextAttempts));
    void stopStenographyNarration();
  }

  function chooseAudio(file: File | undefined) {
    if (!file) return;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
    setAudioName(file.name);
    setVoiceEnabled(false);
    resetSession(profile);
  }

  function chooseSessionMode(nextMode: SessionMode) {
    setSessionMode(nextMode);
    localStorage.setItem("bhashayantra:steno:mode-v1", nextMode);
    resetSession(profile);
  }

  async function testVoice() {
    setAudioMessage("Testing the installed voice…");
    const status = await testStenographyNarration(profile.language);
    setNarrationStatus(status);
    setAudioMessage(status.engine === "unavailable" ? status.label : `Voice test started through ${status.label}`);
  }

  return (
    <section className="steno-studio steno-exam-studio">
      <header className="steno-hero">
        <div><span className="page-eyebrow"><AudioLines /> DICTATION & TRANSCRIPTION LAB</span><h1>Stenography Studio</h1><p>Original courtroom and government-office scripts with separate exam-timed dictation and transcription phases.</p></div>
        <div className={`steno-session-status ${phase}`}><span />{phaseLabel(phase)}</div>
      </header>

      <div className="steno-environment-grid">
        <button type="button" className={profile.environment === "courtroom" ? "active" : ""} onClick={() => chooseEnvironment("courtroom")} disabled={phase !== "setup" && phase !== "result"}><Gavel /><span><small>ENVIRONMENT 01</small><strong>Courtroom</strong><em>Orders, evidence, registry, and hearing vocabulary</em></span></button>
        <button type="button" className={profile.environment === "office" ? "active" : ""} onClick={() => chooseEnvironment("office")} disabled={phase !== "setup" && phase !== "result"}><Building2 /><span><small>ENVIRONMENT 02</small><strong>Government office</strong><em>Noting, dispatch, review, and public-service vocabulary</em></span></button>
      </div>

      <div className="steno-session-mode" role="radiogroup" aria-label="Stenography session mode">
        <button type="button" role="radio" aria-checked={sessionMode === "exam-simulation"} className={sessionMode === "exam-simulation" ? "active" : ""} onClick={() => chooseSessionMode("exam-simulation")} disabled={phase !== "setup" && phase !== "result"}><LockKeyhole /><span><strong>Exam simulation</strong><small>Shorthand first; transcript unlocks after dictation exactly like the selected exam rule.</small></span></button>
        <button type="button" role="radio" aria-checked={sessionMode === "listen-type"} className={sessionMode === "listen-type" ? "active" : ""} onClick={() => chooseSessionMode("listen-type")} disabled={phase !== "setup" && phase !== "result"}><Headphones /><span><strong>Listen & Type practice</strong><small>Audio and transcript stay open together for office transcription training.</small></span></button>
      </div>

      <div className="steno-profile-console">
        <label><span>Audio / exam profile ({STENOGRAPHY_PROFILES.length} tracks)</span><select value={profile.id} disabled={phase !== "setup" && phase !== "result"} onChange={(event) => chooseProfile(event.target.value)}><optgroup label="Courtroom practice audio">{STENOGRAPHY_PROFILES.filter((item) => item.environment === "courtroom" && item.verification === "practice").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup><optgroup label="Government office practice audio">{STENOGRAPHY_PROFILES.filter((item) => item.environment === "office" && item.verification === "practice").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup><optgroup label="Official-rule exam simulations">{STENOGRAPHY_PROFILES.filter((item) => item.verification === "official-reference").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup></select></label>
        <div><span>Dictation</span><strong>{profile.dictationWpm} WPM · {profile.dictationSeconds / 60} min</strong></div>
        <div><span>Transcription</span><strong>{profile.transcriptionSeconds / 60} min</strong></div>
        <div className={`steno-verification ${officialProfile ? "official" : "practice"}`}><ShieldCheck /><span>{officialProfile ? strictExamMode ? "Official-reference rules" : "Official timing · training entry" : "Guided practice"}</span></div>
      </div>

      <section className="steno-rule-strip">
        <div><b>{profile.authority}</b><span>{profile.description}</span></div>
        <ul>{profile.rules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
        {profile.sourceUrl ? <a href={profile.sourceUrl} target="_blank" rel="noreferrer">{profile.sourceLabel} <ExternalLink /></a> : <span className="original-script-label"><FileAudio /> Original BhashaYantra script</span>}
      </section>

      <div className="steno-phase-rail" aria-label="Session phases">
        {(["setup", "dictation", "transcription", "result"] as const).map((item, index) => <div className={(phase === item || (phase === "countdown" && item === "dictation") || (phase === "paused" && item === "dictation")) ? "active" : ""} key={item}><span>{index + 1}</span><b>{item === "setup" ? "Briefing" : item[0].toUpperCase() + item.slice(1)}</b></div>)}
      </div>

      <div className="steno-workbench exam-phases">
        <article className="dictation-console">
          <div className="panel-kicker"><Headphones /><span>DICTATION CONSOLE</span><strong>{formatTime(dictationRemaining)}</strong></div>
          <div className="dictation-stage official-audio-stage">
            <div className="waveform" aria-hidden="true">{Array.from({ length: 34 }, (_, index) => <i key={index} style={{ height: `${18 + ((index * 17) % 58)}%` }} />)}</div>
            {phase === "countdown" ? <><span className="dictation-label">GET READY</span><strong className="countdown-number">{Math.max(1, countdown)}</strong><p>{sessionMode === "listen-type" ? "The typing pad will focus when audio begins." : "Keep your shorthand notebook ready. Transcript entry stays locked."}</p></> : <><span className="dictation-label">{phase === "dictation" ? "AUDIO IN PROGRESS" : phase === "transcription" ? "DICTATION COMPLETE" : "SELECTED SESSION"}</span><strong>{profile.shortName}</strong><p>{audioUrl ? `Imported recording · ${audioName}` : `Original ${profile.language === "hi" ? "Hindi" : "English"} ${profile.environment} narration · ${narrationStatus.label}`}</p></>}
          </div>
          <div className="steno-audio-status" role="status"><Volume2 /><span><strong>{audioMessage}</strong><small>Use Voice test before a long session. A matching Windows language voice gives the clearest pronunciation.</small></span><Button variant="outline" size="sm" onClick={() => void testVoice()} disabled={phase !== "setup" && phase !== "result"}>Voice test</Button></div>
          <div className="dictation-progress"><span style={{ width: `${dictationProgress}%` }} /></div>
          {audioUrl && <audio ref={audioRef} className="steno-audio" controls={!officialMode} src={audioUrl} />}
          <div className="dictation-actions">
            {(phase === "setup" || phase === "result") && <Button onClick={startSession}><Play /> Start session</Button>}
            {phase === "dictation" && !officialMode && <Button variant="outline" onClick={pauseSession}><Pause /> Pause</Button>}
            {phase === "paused" && <Button onClick={resumeSession}><Play /> Resume</Button>}
            {phase === "dictation" && !officialMode && <Button variant="outline" onClick={beginTranscription}><SkipForward /> Begin transcription</Button>}
            <Button variant="outline" onClick={() => resetSession(profile)}><RotateCcw /> Reset</Button>
            <Button variant="outline" onClick={() => audioInputRef.current?.click()} disabled={phase !== "setup"}><FileAudio /> Import audio</Button>
            <input ref={audioInputRef} className="sr-only" type="file" accept="audio/*" onChange={(event) => chooseAudio(event.target.files?.[0])} />
            <button type="button" className={voiceEnabled ? "steno-inline-voice active" : "steno-inline-voice"} onClick={() => { const next = !voiceEnabled; setVoiceEnabled(next); localStorage.setItem("bhashayantra:steno:voice-v1", String(next)); }} disabled={Boolean(audioUrl) || phase !== "setup"}>{voiceEnabled ? <Volume2 /> : <VolumeX />} Local voice</button>
          </div>
        </article>

        <article className={`transcript-console ${!transcriptEnabled && phase !== "result" ? "locked" : ""}`}>
          <div className="panel-kicker"><Square /><span>{sessionMode === "listen-type" ? "LIVE TYPING WORKSTATION" : "TRANSCRIPTION WORKSTATION"}</span><strong>{phase === "transcription" ? formatTime(transcriptionRemaining) : `${tokenizeStenographyText(transcript).length} words`}</strong></div>
          {!transcriptEnabled && phase !== "result" && <div className="transcript-lock"><LockKeyhole /><strong>Locked in exam simulation</strong><span>Select Listen & Type practice before starting if you want to type while hearing the audio.</span></div>}
          <textarea ref={transcriptRef} value={transcript} disabled={!transcriptEnabled} onChange={(event) => setTranscript(event.target.value)} placeholder={sessionMode === "listen-type" ? "Type here while the dictation plays…" : "Transcription phase will open here…"} aria-label="Stenography transcript" spellCheck={false} />
          <div className="transcript-footer"><span>{transcriptEnabled ? "Draft stays on this device · submit when ready" : "Exam phases are enforced locally."}</span><Button onClick={finishTranscript} disabled={!transcriptEnabled || !transcript.trim()}><CheckCircle2 /> Submit transcript</Button></div>
        </article>
      </div>

      <div className="steno-insights">
        <article className="steno-score-card"><div className="panel-kicker"><Target /><span>SESSION RESULT</span></div>{score ? <div className="score-summary"><div className="score-ring" style={{ "--score": `${score.accuracy * 3.6}deg` } as CSSProperties}><strong>{score.accuracy}%</strong><span>accuracy</span></div><div className="score-metrics"><span><small>Correct</small><strong>{score.correct}</strong></span><span><small>Missing</small><strong>{score.missing}</strong></span><span><small>Extra</small><strong>{score.extra}</strong></span><span><small>Changed</small><strong>{score.substitutions}</strong></span></div></div> : <div className="empty-score"><Radio /><strong>No result yet</strong><span>Complete both phases to receive an error breakdown.</span></div>}</article>
        <article className="steno-history-card"><div className="panel-kicker"><BarChart3 /><span>RECENT ATTEMPTS</span><button type="button" onClick={() => { setAttempts([]); localStorage.removeItem(ATTEMPT_KEY); }} disabled={!attempts.length}>Clear</button></div>{attempts.length ? <div className="steno-attempt-list">{attempts.slice(0, 5).map((attempt) => <div key={attempt.id}><span><strong>{attempt.title}</strong><small>{new Date(attempt.createdAt).toLocaleDateString()} · {attempt.environment}</small></span><b>{attempt.accuracy}%</b><em>{attempt.transcriptWpm} WPM</em></div>)}</div> : <div className="empty-score compact"><Clock3 /><span>No saved stenography attempts yet.</span></div>}</article>
      </div>
    </section>
  );
}
