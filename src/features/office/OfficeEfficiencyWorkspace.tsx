import { useMemo, useState } from "react";
import { AlignCenter, Bold, CheckCircle2, FileSpreadsheet, FileText, RotateCcw, Save, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { calculateTrainingScore, calculateWpm } from "@/domain/training/training-engine";
import { getDisplayFont, type UnicodeDisplayFontId } from "@/domain/typing/typing-profiles";

type OfficeMode = "word" | "excel";

const WORD_COPY = "Accurate office work requires careful reading, consistent formatting, and a final review before a document is submitted. Every heading should be clear, every date should follow the required format, and every table should be checked against the source record.";

const EXCEL_SOURCE = [
  ["Employee ID", "Name", "Department", "Amount"],
  ["BY-104", "Aarav Mehta", "Accounts", "18500"],
  ["BY-117", "Nisha Verma", "Registry", "22450"],
  ["BY-132", "Kabir Singh", "Dispatch", "19725"],
  ["BY-148", "Meera Joshi", "Records", "21300"],
] as const;

function emptySheet() {
  return EXCEL_SOURCE.map((row) => row.map(() => ""));
}

export function OfficeEfficiencyWorkspace({ displayFont }: { readonly displayFont: UnicodeDisplayFontId }) {
  const [mode, setMode] = useState<OfficeMode>("word");
  const [wordText, setWordText] = useState("");
  const [boldApplied, setBoldApplied] = useState(false);
  const [centerApplied, setCenterApplied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sheet, setSheet] = useState<string[][]>(emptySheet);
  const [startedAt, setStartedAt] = useState<number>();
  const [submitted, setSubmitted] = useState(false);
  const fontStack = getDisplayFont(displayFont).cssStack;

  const wordScore = useMemo(() => calculateTrainingScore(WORD_COPY, wordText, submitted ? "final" : "live"), [submitted, wordText]);
  const sheetScore = useMemo(() => {
    const expected = EXCEL_SOURCE.flat();
    const actual = sheet.flat();
    const correct = actual.filter((value, index) => value.trim() === expected[index]).length;
    const completed = actual.filter((value) => value.trim()).length;
    return { correct, completed, total: expected.length, accuracy: completed ? Math.round(correct / completed * 100) : 100 };
  }, [sheet]);
  const elapsed = Math.max(1, startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 1);
  const completedTasks = mode === "word"
    ? [wordText === WORD_COPY, boldApplied, centerApplied, saved].filter(Boolean).length
    : [sheetScore.completed === sheetScore.total, saved].filter(Boolean).length;

  function begin() {
    if (!startedAt) setStartedAt(Date.now());
    setSubmitted(false);
  }

  function updateCell(rowIndex: number, columnIndex: number, value: string) {
    begin();
    setSheet((current) => current.map((row, r) => row.map((cell, c) => r === rowIndex && c === columnIndex ? value : cell)));
  }

  function reset() {
    setWordText("");
    setBoldApplied(false);
    setCenterApplied(false);
    setSaved(false);
    setSheet(emptySheet());
    setStartedAt(undefined);
    setSubmitted(false);
  }

  return <section className="office-efficiency-page">
    <header className="office-efficiency-hero"><div><span>OFFICE SKILLS LAB</span><h1>Word & Excel Efficiency</h1><p>Timed document and data-entry tasks with accuracy, completion, and workflow checks.</p></div><div><Target /><strong>{completedTasks}/{mode === "word" ? 4 : 2}</strong><span>tasks complete</span></div></header>
    <div className="office-mode-switch" role="tablist"><button type="button" role="tab" aria-selected={mode === "word"} className={mode === "word" ? "active" : ""} onClick={() => { setMode("word"); setSubmitted(false); }}><FileText /><span><strong>Word Efficiency</strong><small>Copy, format, review, and save</small></span></button><button type="button" role="tab" aria-selected={mode === "excel"} className={mode === "excel" ? "active" : ""} onClick={() => { setMode("excel"); setSubmitted(false); }}><FileSpreadsheet /><span><strong>Excel Efficiency</strong><small>Structured data entry and validation</small></span></button></div>

    {mode === "word" ? <div className="office-task-layout">
      <aside className="office-task-brief"><span>WORD TASK 01</span><h2>Prepare an office note</h2><ol><li className={wordText === WORD_COPY ? "done" : ""}>Type the source copy exactly.</li><li className={boldApplied ? "done" : ""}>Apply bold to the heading.</li><li className={centerApplied ? "done" : ""}>Centre the heading.</li><li className={saved ? "done" : ""}>Save the completed document.</li></ol><p>Formatting buttons simulate the tested workflow; text accuracy is scored separately.</p></aside>
      <main className="office-word-workstation"><div className="office-ribbon"><button className={boldApplied ? "active" : ""} type="button" onClick={() => { begin(); setBoldApplied((value) => !value); }}><Bold /> Bold</button><button className={centerApplied ? "active" : ""} type="button" onClick={() => { begin(); setCenterApplied((value) => !value); }}><AlignCenter /> Centre</button><button className={saved ? "active" : ""} type="button" onClick={() => { begin(); setSaved(true); }}><Save /> Save</button></div><div className="office-source-copy" style={{ fontFamily: fontStack }}><span>SOURCE COPY</span><p>{WORD_COPY}</p></div><div className="office-document-page"><h3 className={`${boldApplied ? "bold" : ""} ${centerApplied ? "center" : ""}`}>Office Note</h3><textarea value={wordText} onChange={(event) => { begin(); setWordText(event.target.value); }} spellCheck={false} placeholder="Type the source copy here…" /></div></main>
    </div> : <div className="office-task-layout">
      <aside className="office-task-brief"><span>EXCEL TASK 01</span><h2>Enter the source register</h2><ol><li className={sheetScore.completed === sheetScore.total ? "done" : ""}>Enter all 20 cells exactly.</li><li className={saved ? "done" : ""}>Validate and save the sheet.</li></ol><p>Tab and arrow keys work naturally inside each field. Exact text and number matching determine accuracy.</p></aside>
      <main className="office-excel-workstation"><div className="excel-formula-bar"><span>fx</span><strong>Source register entry</strong><button type="button" onClick={() => { begin(); setSaved(true); }}><Save /> Validate & save</button></div><div className="excel-source-grid">{EXCEL_SOURCE.map((row, rowIndex) => row.map((cell, columnIndex) => <span key={`source-${rowIndex}-${columnIndex}`}>{cell}</span>))}</div><div className="excel-entry-grid">{sheet.map((row, rowIndex) => row.map((cell, columnIndex) => <label key={`entry-${rowIndex}-${columnIndex}`}><small>{String.fromCharCode(65 + columnIndex)}{rowIndex + 1}</small><input className={submitted ? cell.trim() === EXCEL_SOURCE[rowIndex][columnIndex] ? "correct" : "wrong" : ""} value={cell} onChange={(event) => updateCell(rowIndex, columnIndex, event.target.value)} aria-label={`Cell ${String.fromCharCode(65 + columnIndex)}${rowIndex + 1}`} /></label>))}</div></main>
    </div>}

    <footer className="office-result-bar"><div><span>Accuracy</span><strong>{mode === "word" ? wordScore.accuracy : sheetScore.accuracy}%</strong></div><div><span>{mode === "word" ? "Correct characters" : "Correct cells"}</span><strong>{mode === "word" ? wordScore.correctCharacters : sheetScore.correct}/{mode === "word" ? wordScore.expectedCharacters : sheetScore.total}</strong></div><div><span>Speed</span><strong>{mode === "word" ? `${calculateWpm(wordScore.correctCharacters, elapsed)} WPM` : `${Math.round(sheetScore.completed / elapsed * 60)} cells/min`}</strong></div><div><span>Workflow</span><strong>{completedTasks}/{mode === "word" ? 4 : 2}</strong></div><Button variant="outline" onClick={reset}><RotateCcw /> Reset</Button><Button onClick={() => setSubmitted(true)} disabled={mode === "word" ? !wordText.trim() : sheetScore.completed === 0}><CheckCircle2 /> Check result</Button></footer>
  </section>;
}
