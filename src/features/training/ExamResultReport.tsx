import { Award, CheckCircle2, ExternalLink, FileCheck2, Gauge, Printer, RotateCcw, ShieldAlert, Target } from "lucide-react";
import type { CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import { DEFAULT_STUDENT_WORKSPACE, readStoredObject, STUDENT_WORKSPACE_KEY } from "@/domain/accounts/account-workspaces";
import type { ExamProfile } from "@/domain/training/exam-profiles";
import type { KeyMistake } from "@/domain/training/training-engine";

interface ExamResultReportProps {
  readonly passed: boolean;
  readonly attemptId: string;
  readonly completedAt: Date;
  readonly profile: ExamProfile;
  readonly paperNumber: number;
  readonly layoutName: string;
  readonly durationSeconds: number;
  readonly measuredSpeed: number;
  readonly requiredSpeed: number;
  readonly wpm: number;
  readonly grossWpm: number;
  readonly netWpm: number;
  readonly rrbWpm?: number;
  readonly kdph: number;
  readonly accuracy: number;
  readonly expectedCharacters: number;
  readonly typedCharacters: number;
  readonly correctCharacters: number;
  readonly missingCharacters: number;
  readonly extraCharacters: number;
  readonly substitutedCharacters: number;
  readonly corrections: number;
  readonly weakKeys: readonly KeyMistake[];
  readonly endedByTimer: boolean;
  readonly onNewTest: () => void;
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}m ${String(rest).padStart(2, "0")}s`;
}

function ResultMetric({ label, value, note }: { readonly label: string; readonly value: string; readonly note?: string }) {
  return <div className="exam-report-metric"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}

export function ExamResultReport(props: ExamResultReportProps) {
  const student = readStoredObject(STUDENT_WORKSPACE_KEY, DEFAULT_STUDENT_WORKSPACE);
  const scoreLabel = props.profile.scoringModel === "kdph" ? "KDPH" : props.profile.scoringModel === "net-wpm" ? "NWPM" : props.profile.scoringModel === "rrb-wpm" ? "RRB WPM" : "WPM";
  const resultName = student.displayName.trim() || "Local candidate";
  const shortId = props.attemptId.length > 18 ? `${props.attemptId.slice(0, 8)}…${props.attemptId.slice(-6)}` : props.attemptId;

  return (
    <section className={`exam-result-report ${props.passed ? "passed" : "needs-work"}`} aria-live="polite" aria-labelledby="exam-result-heading">
      <header className="exam-report-header">
        <div className="exam-report-outcome-icon">{props.passed ? <Award /> : <Target />}</div>
        <div><span>PRACTICE RESULT REPORT</span><h2 id="exam-result-heading">{props.passed ? "Qualifying target achieved" : "Target needs more practice"}</h2><p>{props.profile.name} · Paper {props.paperNumber}</p></div>
        <div className="exam-report-actions"><Button variant="outline" onClick={() => window.print()}><Printer /> Print result</Button><Button onClick={props.onNewTest}><RotateCcw /> New test</Button></div>
      </header>

      <div className="exam-report-disclaimer"><ShieldAlert /><span><strong>This is a BhashaYantra practice report, not an official certificate.</strong><small>Recruiting authority software and the current notice determine the official result.</small></span></div>

      <div className="exam-report-identity">
        <span><small>Candidate</small><strong>{resultName}</strong><em>{student.candidateId || "No candidate ID saved"}</em></span>
        <span><small>Authority / profile</small><strong>{props.profile.authority}</strong><em>{props.profile.verification === "official-reference" ? "Official-reference rules" : "Flexible practice rules"}</em></span>
        <span><small>Attempt</small><strong title={props.attemptId}>{shortId}</strong><em>{props.completedAt.toLocaleString()}</em></span>
        <span><small>Environment</small><strong>{props.layoutName}</strong><em>{props.endedByTimer ? "Time expired" : "Submitted by candidate"}</em></span>
      </div>

      <div className="exam-report-scoreboard">
        <div className="exam-report-gauge" style={{ "--report-score": `${Math.min(100, props.accuracy) * 3.6}deg` } as CSSProperties}><div><strong>{props.accuracy}%</strong><span>Accuracy</span></div></div>
        <div className="exam-report-primary-score"><span><Gauge /> QUALIFYING MEASURE</span><strong>{props.measuredSpeed}</strong><b>{scoreLabel}</b><small>Target {props.requiredSpeed} {scoreLabel}</small><i className={props.passed ? "met" : "short"}>{props.passed ? <CheckCircle2 /> : <Target />}{props.passed ? "Target met" : `${Math.max(0, props.requiredSpeed - props.measuredSpeed)} ${scoreLabel} below target`}</i></div>
        <div className="exam-report-target-bars"><div><span>Speed target</span><b><i style={{ width: `${Math.min(100, props.requiredSpeed ? props.measuredSpeed / props.requiredSpeed * 100 : 100)}%` }} /></b><strong>{props.measuredSpeed} / {props.requiredSpeed}</strong></div><div><span>Accuracy requirement</span><b><i style={{ width: `${Math.min(100, props.accuracy)}%` }} /></b><strong>{props.accuracy}% / {props.profile.minimumAccuracy || "Not specified"}{props.profile.minimumAccuracy ? "%" : ""}</strong></div></div>
      </div>

      <div className="exam-report-section-title"><span><FileCheck2 /> Performance breakdown</span><small>Calculated from this local attempt</small></div>
      <div className="exam-report-metrics">
        <ResultMetric label="Correct WPM" value={String(props.wpm)} />
        <ResultMetric label="Gross WPM" value={String(props.grossWpm)} />
        <ResultMetric label="Net WPM" value={String(props.netWpm)} />
        {typeof props.rrbWpm === "number" && <ResultMetric label="RRB practice WPM" value={String(props.rrbWpm)} />}
        <ResultMetric label="KDPH" value={String(props.kdph)} />
        <ResultMetric label="Time used" value={formatDuration(props.durationSeconds)} />
        <ResultMetric label="Expected characters" value={String(props.expectedCharacters)} />
        <ResultMetric label="Typed characters" value={String(props.typedCharacters)} />
        <ResultMetric label="Correct" value={String(props.correctCharacters)} />
        <ResultMetric label="Missing" value={String(props.missingCharacters)} />
        <ResultMetric label="Extra" value={String(props.extraCharacters)} />
        <ResultMetric label="Substituted" value={String(props.substitutedCharacters)} />
        <ResultMetric label="Corrections" value={String(props.corrections)} />
      </div>

      <div className="exam-report-footer-grid">
        <div><span className="exam-report-section-title"><span><Target /> Weak-key review</span></span>{props.weakKeys.length ? <div className="exam-report-weak-keys">{props.weakKeys.slice(0, 10).map((item) => <span key={item.key}><kbd>{item.key}</kbd><b>{item.errors}</b><small>errors / {item.attempts} presses</small></span>)}</div> : <p className="exam-report-empty">No repeated weak key was detected in this attempt.</p>}</div>
        <div className="exam-report-reference"><ShieldAlert /><span><strong>{props.profile.verification === "official-reference" ? "Reference checked" : "Practice configuration"}</strong><small>{props.profile.disclaimer}</small>{props.profile.officialSourceUrl && <a href={props.profile.officialSourceUrl} target="_blank" rel="noreferrer">{props.profile.officialSourceLabel ?? "Open official reference"} <ExternalLink /></a>}</span></div>
      </div>
    </section>
  );
}
