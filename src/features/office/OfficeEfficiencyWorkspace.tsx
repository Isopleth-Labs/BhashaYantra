import { useMemo, useState } from "react";
import { AlignCenter, Bold, CheckCircle2, FileSpreadsheet, FileText, RotateCcw, Save, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { calculateTrainingScore, calculateWpm } from "@/domain/training/training-engine";
import { typingSourceToUnicode } from "@/domain/typing/typing-engine";
import { getDisplayFont, type ReadyTypingLayoutId, type UnicodeDisplayFontId } from "@/domain/typing/typing-profiles";

type OfficeMode = "word" | "excel";

interface WordTask {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly language: "en" | "hi";
  readonly durationMinutes: number;
  readonly copy: string;
  readonly heading: string;
  readonly requireBold: boolean;
  readonly requireCenter: boolean;
}

interface ExcelTask {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly durationMinutes: number;
  readonly source: readonly (readonly string[])[];
  readonly instruction: string;
}

const WORD_TASKS: readonly WordTask[] = [
  { id: "word-note-en", title: "Office Note", category: "Document preparation", language: "en", durationMinutes: 10, heading: "Office Note", requireBold: true, requireCenter: true, copy: "Accurate office work requires careful reading, consistent formatting, and a final review before a document is submitted. Every heading should be clear, every date should follow the required format, and every table should be checked against the source record." },
  { id: "word-letter-en", title: "Official Letter", category: "Correspondence", language: "en", durationMinutes: 12, heading: "Official Communication", requireBold: true, requireCenter: false, copy: "The regional office shall review every pending application and send a written status update to the concerned section. Any incomplete record must be returned with a clear list of missing documents and a reasonable date for compliance." },
  { id: "word-minutes-en", title: "Meeting Minutes", category: "Minutes and reports", language: "en", durationMinutes: 15, heading: "Minutes of Meeting", requireBold: true, requireCenter: true, copy: "The committee reviewed service delivery, record digitisation, and pending grievances. It decided that each branch would submit a verified progress statement by Friday and identify any matter requiring approval from the competent authority." },
  { id: "word-order-hi", title: "Hindi Office Order", category: "Hindi administration", language: "hi", durationMinutes: 15, heading: "कार्यालय आदेश", requireBold: true, requireCenter: true, copy: "सभी अनुभाग अधिकारी लंबित प्रकरणों की समीक्षा करके निर्धारित समय सीमा के भीतर अद्यतन स्थिति दर्ज करेंगे। अधूरी पत्रावली को स्पष्ट टिप्पणी के साथ संबंधित पटल पर वापस भेजा जाएगा।" },
  { id: "word-note-hi", title: "Hindi Office Note", category: "Hindi noting", language: "hi", durationMinutes: 15, heading: "कार्यालय टिप्पणी", requireBold: true, requireCenter: false, copy: "प्रस्तावित कार्य के संबंध में उपलब्ध अभिलेखों और संबंधित नियमों का परीक्षण किया गया है। सक्षम अधिकारी की स्वीकृति के बाद आवश्यक सूचना सभी शाखाओं को भेजी जा सकती है।" },
  { id: "word-exam-en", title: "Full Word Simulation", category: "Exam simulation", language: "en", durationMinutes: 20, heading: "Administrative Report", requireBold: true, requireCenter: true, copy: "The verification team compared the digital register with the signed source files and recorded every difference in the inspection sheet. The final report shall include the reference number, responsible section, corrective action, completion date, and name of the reviewing officer." },
] as const;

const EXCEL_TASKS: readonly ExcelTask[] = [
  { id: "excel-register", title: "Employee Register", category: "Structured data entry", durationMinutes: 10, instruction: "Enter all cells exactly, preserving identifiers and amounts.", source: [["Employee ID", "Name", "Department", "Amount"], ["BY-104", "Aarav Mehta", "Accounts", "18500"], ["BY-117", "Nisha Verma", "Registry", "22450"], ["BY-132", "Kabir Singh", "Dispatch", "19725"], ["BY-148", "Meera Joshi", "Records", "21300"]] },
  { id: "excel-attendance", title: "Attendance Sheet", category: "Daily records", durationMinutes: 10, instruction: "Copy employee codes, working days, leave, and present days.", source: [["Code", "Working Days", "Leave", "Present"], ["E-201", "26", "2", "24"], ["E-202", "26", "1", "25"], ["E-203", "26", "0", "26"], ["E-204", "26", "3", "23"]] },
  { id: "excel-budget", title: "Budget Statement", category: "Accounts", durationMinutes: 15, instruction: "Enter the figures and formula text exactly as displayed.", source: [["Head", "Approved", "Spent", "Balance"], ["Office", "50000", "31250", "=B2-C2"], ["Travel", "30000", "18400", "=B3-C3"], ["Training", "25000", "12000", "=B4-C4"], ["Total", "=SUM(B2:B4)", "=SUM(C2:C4)", "=SUM(D2:D4)"]] },
  { id: "excel-inventory", title: "Inventory Register", category: "Stores", durationMinutes: 12, instruction: "Copy item codes, quantities, rates, and total formulas.", source: [["Item", "Quantity", "Rate", "Total"], ["ST-14", "12", "450", "=B2*C2"], ["ST-22", "8", "725", "=B3*C3"], ["ST-31", "25", "180", "=B4*C4"], ["Grand Total", "", "", "=SUM(D2:D4)"]] },
  { id: "excel-results", title: "Candidate Result Sheet", category: "Exam records", durationMinutes: 15, instruction: "Enter candidate data and percentage formulas without changing cell order.", source: [["Roll No", "Marks", "Maximum", "Percent"], ["240101", "376", "500", "=B2/C2*100"], ["240102", "421", "500", "=B3/C3*100"], ["240103", "348", "500", "=B4/C4*100"], ["Average", "=AVERAGE(B2:B4)", "500", "=B5/C5*100"]] },
  { id: "excel-exam", title: "Full Excel Simulation", category: "Exam simulation", durationMinutes: 20, instruction: "Complete a mixed register with dates, numbers, and formulas.", source: [["Reference", "Date", "Amount", "Status"], ["F-1024", "01-08-2026", "1250.50", "Verified"], ["F-1025", "02-08-2026", "980.75", "Pending"], ["F-1026", "03-08-2026", "2400.00", "Verified"], ["Total", "", "=SUM(C2:C4)", "3 records"]] },
] as const;

function emptySheet(task: ExcelTask) {
  return task.source.map((row) => row.map(() => ""));
}

export function OfficeEfficiencyWorkspace({ displayFont, layout }: { readonly displayFont: UnicodeDisplayFontId; readonly layout: ReadyTypingLayoutId }) {
  const [mode, setMode] = useState<OfficeMode>("word");
  const [wordTaskId, setWordTaskId] = useState(WORD_TASKS[0].id);
  const [excelTaskId, setExcelTaskId] = useState(EXCEL_TASKS[0].id);
  const wordTask = WORD_TASKS.find((item) => item.id === wordTaskId) ?? WORD_TASKS[0];
  const excelTask = EXCEL_TASKS.find((item) => item.id === excelTaskId) ?? EXCEL_TASKS[0];
  const [wordText, setWordText] = useState("");
  const [boldApplied, setBoldApplied] = useState(false);
  const [centerApplied, setCenterApplied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sheet, setSheet] = useState<string[][]>(() => emptySheet(EXCEL_TASKS[0]));
  const [startedAt, setStartedAt] = useState<number>();
  const [submitted, setSubmitted] = useState(false);
  const fontStack = getDisplayFont(displayFont).cssStack;
  const effectiveLayout = wordTask.language === "en" ? "english-qwerty" : layout === "english-qwerty" ? "bhashayantra-smart" : layout;
  const wordOutput = useMemo(() => typingSourceToUnicode(wordText, effectiveLayout).output, [effectiveLayout, wordText]);
  const wordScore = useMemo(() => calculateTrainingScore(wordTask.copy, wordOutput, submitted ? "final" : "live"), [submitted, wordOutput, wordTask.copy]);
  const sheetScore = useMemo(() => {
    const expected = excelTask.source.flat();
    const actual = sheet.flat();
    const correct = actual.filter((value, index) => value.trim() === expected[index]).length;
    const completed = actual.filter((value) => value.trim()).length;
    return { correct, completed, total: expected.length, accuracy: completed ? Math.round(correct / completed * 100) : 100 };
  }, [excelTask.source, sheet]);
  const elapsed = Math.max(1, startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 1);
  const wordWorkflow = [wordOutput === wordTask.copy, !wordTask.requireBold || boldApplied, !wordTask.requireCenter || centerApplied, saved];
  const completedTasks = mode === "word" ? wordWorkflow.filter(Boolean).length : [sheetScore.completed === sheetScore.total, saved].filter(Boolean).length;
  const workflowTotal = mode === "word" ? 4 : 2;

  function begin() { if (!startedAt) setStartedAt(Date.now()); setSubmitted(false); }
  function reset() { setWordText(""); setBoldApplied(false); setCenterApplied(false); setSaved(false); setSheet(emptySheet(excelTask)); setStartedAt(undefined); setSubmitted(false); }
  function chooseWordTask(id: string) { setWordTaskId(id); setWordText(""); setBoldApplied(false); setCenterApplied(false); setSaved(false); setStartedAt(undefined); setSubmitted(false); }
  function chooseExcelTask(id: string) { const task = EXCEL_TASKS.find((item) => item.id === id) ?? EXCEL_TASKS[0]; setExcelTaskId(task.id); setSheet(emptySheet(task)); setSaved(false); setStartedAt(undefined); setSubmitted(false); }
  function updateCell(rowIndex: number, columnIndex: number, value: string) { begin(); setSheet((current) => current.map((row, r) => row.map((cell, c) => r === rowIndex && c === columnIndex ? value : cell))); }

  return <section className="office-efficiency-page">
    <header className="office-efficiency-hero"><div><span>OFFICE PROFICIENCY LAB</span><h1>Word & Excel Efficiency</h1><p>Original, task-based simulations for document preparation, data entry, formulas, and exam workflow.</p></div><div><Target /><strong>{completedTasks}/{workflowTotal}</strong><span>workflow checks</span></div></header>
    <div className="office-mode-switch" role="tablist"><button type="button" role="tab" aria-selected={mode === "word"} className={mode === "word" ? "active" : ""} onClick={() => { setMode("word"); setSubmitted(false); }}><FileText /><span><strong>Word Efficiency</strong><small>{WORD_TASKS.length} original modules</small></span></button><button type="button" role="tab" aria-selected={mode === "excel"} className={mode === "excel" ? "active" : ""} onClick={() => { setMode("excel"); setSubmitted(false); }}><FileSpreadsheet /><span><strong>Excel Efficiency</strong><small>{EXCEL_TASKS.length} original modules</small></span></button></div>

    <div className="office-professional-grid">
      <aside className="office-module-catalog"><header><span>COURSE CATALOG</span><strong>{mode === "word" ? "Document tasks" : "Spreadsheet tasks"}</strong></header>{(mode === "word" ? WORD_TASKS : EXCEL_TASKS).map((task, index) => <button type="button" key={task.id} className={(mode === "word" ? wordTaskId : excelTaskId) === task.id ? "active" : ""} onClick={() => mode === "word" ? chooseWordTask(task.id) : chooseExcelTask(task.id)}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{task.title}</strong><small>{task.category} · {task.durationMinutes} min</small></div></button>)}</aside>

      <div>
        {mode === "word" ? <div className="office-task-layout">
          <aside className="office-task-brief"><span>{wordTask.id.toUpperCase()}</span><h2>{wordTask.title}</h2><ol><li className={wordOutput === wordTask.copy ? "done" : ""}>Type the source copy exactly.</li><li className={!wordTask.requireBold || boldApplied ? "done" : ""}>{wordTask.requireBold ? "Apply bold to the heading." : "Bold is not required."}</li><li className={!wordTask.requireCenter || centerApplied ? "done" : ""}>{wordTask.requireCenter ? "Centre the heading." : "Keep the heading left aligned."}</li><li className={saved ? "done" : ""}>Save the completed document.</li></ol><p>{wordTask.language === "hi" ? `Input profile: ${effectiveLayout}. Type physical layout keys; the document preview shows Unicode.` : "Formatting and text accuracy are scored independently."}</p></aside>
          <main className="office-word-workstation"><div className="office-ribbon"><button className={boldApplied ? "active" : ""} type="button" onClick={() => { begin(); setBoldApplied((value) => !value); }}><Bold /> Bold</button><button className={centerApplied ? "active" : ""} type="button" onClick={() => { begin(); setCenterApplied((value) => !value); }}><AlignCenter /> Centre</button><button className={saved ? "active" : ""} type="button" onClick={() => { begin(); setSaved(true); }}><Save /> Save</button><span>{wordTask.durationMinutes}:00 task limit</span></div><div className="office-source-copy" style={{ fontFamily: fontStack }}><span>SOURCE COPY</span><p>{wordTask.copy}</p></div><div className="office-document-page"><h3 className={`${boldApplied ? "bold" : ""} ${centerApplied ? "center" : ""}`} style={{ fontFamily: fontStack }}>{wordTask.heading}</h3><textarea value={wordText} onChange={(event) => { begin(); setWordText(event.target.value); }} spellCheck={false} placeholder={wordTask.language === "hi" ? "Type with the selected Hindi keyboard layout…" : "Type the source copy here…"} />{wordTask.language === "hi" && <div className="office-unicode-preview" style={{ fontFamily: fontStack }}><span>DOCUMENT PREVIEW</span><p>{wordOutput || "Hindi Unicode output will appear here."}</p></div>}</div></main>
        </div> : <div className="office-task-layout">
          <aside className="office-task-brief"><span>{excelTask.id.toUpperCase()}</span><h2>{excelTask.title}</h2><ol><li className={sheetScore.completed === sheetScore.total ? "done" : ""}>Enter all {sheetScore.total} cells exactly.</li><li className={saved ? "done" : ""}>Validate and save the sheet.</li></ol><p>{excelTask.instruction}</p></aside>
          <main className="office-excel-workstation"><div className="excel-formula-bar"><span>fx</span><strong>{excelTask.title}</strong><button type="button" onClick={() => { begin(); setSaved(true); }}><Save /> Validate & save</button></div><div className="excel-source-grid" style={{ gridTemplateColumns: `repeat(${excelTask.source[0].length}, minmax(95px, 1fr))` }}>{excelTask.source.map((row, rowIndex) => row.map((cell, columnIndex) => <span key={`source-${rowIndex}-${columnIndex}`}>{cell || "—"}</span>))}</div><div className="excel-entry-grid" style={{ gridTemplateColumns: `repeat(${excelTask.source[0].length}, minmax(95px, 1fr))` }}>{sheet.map((row, rowIndex) => row.map((cell, columnIndex) => <label key={`entry-${rowIndex}-${columnIndex}`}><small>{String.fromCharCode(65 + columnIndex)}{rowIndex + 1}</small><input className={submitted ? cell.trim() === excelTask.source[rowIndex][columnIndex] ? "correct" : "wrong" : ""} value={cell} onChange={(event) => updateCell(rowIndex, columnIndex, event.target.value)} aria-label={`Cell ${String.fromCharCode(65 + columnIndex)}${rowIndex + 1}`} /></label>))}</div></main>
        </div>}
      </div>
    </div>

    <footer className="office-result-bar"><div><span>Accuracy</span><strong>{mode === "word" ? wordScore.accuracy : sheetScore.accuracy}%</strong></div><div><span>{mode === "word" ? "Correct characters" : "Correct cells"}</span><strong>{mode === "word" ? wordScore.correctCharacters : sheetScore.correct}/{mode === "word" ? wordScore.expectedCharacters : sheetScore.total}</strong></div><div><span>Speed</span><strong>{mode === "word" ? `${calculateWpm(wordScore.correctCharacters, elapsed)} WPM` : `${Math.round(sheetScore.completed / elapsed * 60)} cells/min`}</strong></div><div><span>Workflow</span><strong>{completedTasks}/{workflowTotal}</strong></div><Button variant="outline" onClick={reset}><RotateCcw /> Reset</Button><Button onClick={() => setSubmitted(true)} disabled={mode === "word" ? !wordText.trim() : sheetScore.completed === 0}><CheckCircle2 /> Check result</Button></footer>
  </section>;
}
