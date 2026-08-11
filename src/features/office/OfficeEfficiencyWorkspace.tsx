import { Fragment, useEffect, useMemo, useState } from "react";
import {
  AlignCenter,
  AlignRight,
  Bold,
  CheckCircle2,
  ChevronLeft,
  FileSpreadsheet,
  FileText,
  Filter,
  Grid2X2,
  Highlighter,
  ListChecks,
  LockKeyhole,
  Pause,
  Play,
  RotateCcw,
  Save,
  Table2,
  Target,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  EXCEL_OFFICE_PAPERS,
  WORD_OFFICE_PAPERS,
  createEmptyExcelSheet,
  scoreExcelOfficePaper,
  scoreWordOfficePaper,
  type ExcelOfficeState,
  type OfficeExamScore,
  type OfficeTrack,
  type WordOfficeState,
} from "@/domain/office/office-exam";
import { typingSourceToUnicode } from "@/domain/typing/typing-engine";
import { getDisplayFont, type ReadyTypingLayoutId, type UnicodeDisplayFontId } from "@/domain/typing/typing-profiles";

type OfficePhase = "catalog" | "instructions" | "exam" | "result";
type WordEditorState = Omit<WordOfficeState, "outputText">;
type ExcelEditorState = Omit<ExcelOfficeState, "sheet">;

const DURATION_OPTIONS = [10, 15, 20, 30] as const;

function newWordState(): WordEditorState {
  return {
    rowAdded: false,
    fontSize: 14,
    fontColor: "black",
    highlight: "none",
    headingBold: false,
    headingCentered: false,
    bodyAlignment: "left",
    rightIndent: 0,
    lineSpacing: 1.15,
    orientation: "portrait",
    subscriptApplied: false,
    paragraphShade: "none",
    tableHeaderFill: "none",
    tableHeaderCentered: false,
    tableLastRowBold: false,
    replacementText: "",
    saved: false,
  };
}

function newExcelState(): ExcelEditorState {
  return {
    headerBold: false,
    headerCentered: false,
    headerFill: "none",
    allBorders: false,
    currencyFormat: false,
    dateFormat: false,
    percentageFormat: false,
    sorted: false,
    filterEnabled: false,
    frozenHeader: false,
    autoFit: false,
    sheetName: "Sheet1",
    totalsRowAdded: false,
    saved: false,
  };
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function OfficeEfficiencyWorkspace({ displayFont, layout }: { readonly displayFont: UnicodeDisplayFontId; readonly layout: ReadyTypingLayoutId }) {
  const [track, setTrack] = useState<OfficeTrack>("word");
  const [phase, setPhase] = useState<OfficePhase>("catalog");
  const [wordPaperId, setWordPaperId] = useState(WORD_OFFICE_PAPERS[0].id);
  const [excelPaperId, setExcelPaperId] = useState(EXCEL_OFFICE_PAPERS[0].id);
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [remainingSeconds, setRemainingSeconds] = useState(600);
  const [paused, setPaused] = useState(false);
  const [wordSource, setWordSource] = useState("");
  const [wordState, setWordState] = useState<WordEditorState>(newWordState);
  const [excelSheet, setExcelSheet] = useState<string[][]>(() => createEmptyExcelSheet(EXCEL_OFFICE_PAPERS[0]));
  const [excelState, setExcelState] = useState<ExcelEditorState>(newExcelState);
  const [activeCell, setActiveCell] = useState({ row: 0, column: 0 });

  const wordPaper = WORD_OFFICE_PAPERS.find((paper) => paper.id === wordPaperId) ?? WORD_OFFICE_PAPERS[0];
  const excelPaper = EXCEL_OFFICE_PAPERS.find((paper) => paper.id === excelPaperId) ?? EXCEL_OFFICE_PAPERS[0];
  const selectedPaper = track === "word" ? wordPaper : excelPaper;
  const selectedPapers = track === "word" ? WORD_OFFICE_PAPERS : EXCEL_OFFICE_PAPERS;
  const fontStack = getDisplayFont(displayFont).cssStack;
  const effectiveLayout = wordPaper.language === "en" ? "english-qwerty" : layout === "english-qwerty" ? "bhashayantra-smart" : layout;
  const wordOutput = useMemo(() => typingSourceToUnicode(wordSource, effectiveLayout).output, [effectiveLayout, wordSource]);
  const wordScore = useMemo(() => scoreWordOfficePaper(wordPaper, { ...wordState, outputText: wordOutput }), [wordOutput, wordPaper, wordState]);
  const excelScore = useMemo(() => scoreExcelOfficePaper(excelPaper, { ...excelState, sheet: excelSheet }), [excelPaper, excelSheet, excelState]);
  const score = track === "word" ? wordScore : excelScore;
  const elapsedSeconds = durationMinutes * 60 - remainingSeconds;

  useEffect(() => {
    if (phase !== "exam" || paused || remainingSeconds <= 0) return;
    const timer = window.setInterval(() => setRemainingSeconds((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [paused, phase, remainingSeconds]);

  useEffect(() => {
    if (phase === "exam" && remainingSeconds === 0) setPhase("result");
  }, [phase, remainingSeconds]);

  function resetEditors() {
    setWordSource("");
    setWordState(newWordState());
    setExcelSheet(createEmptyExcelSheet(excelPaper));
    setExcelState(newExcelState());
    setActiveCell({ row: 0, column: 0 });
    setPaused(false);
  }

  function selectTrack(nextTrack: OfficeTrack) {
    setTrack(nextTrack);
    setPhase("catalog");
    setPaused(false);
  }

  function selectPaper(id: string) {
    if (track === "word") setWordPaperId(id);
    else {
      setExcelPaperId(id);
      const paper = EXCEL_OFFICE_PAPERS.find((item) => item.id === id) ?? EXCEL_OFFICE_PAPERS[0];
      setExcelSheet(createEmptyExcelSheet(paper));
    }
    setPhase("catalog");
  }

  function startExam() {
    resetEditors();
    setRemainingSeconds(durationMinutes * 60);
    setPhase("exam");
  }

  function closeExam() {
    resetEditors();
    setPhase("catalog");
  }

  function updateWordState<K extends keyof WordEditorState>(key: K, value: WordEditorState[K]) {
    setWordState((current) => ({ ...current, [key]: value }));
  }

  function updateExcelState<K extends keyof ExcelEditorState>(key: K, value: ExcelEditorState[K]) {
    setExcelState((current) => ({ ...current, [key]: value }));
  }

  function updateCell(row: number, column: number, value: string) {
    setExcelSheet((current) => current.map((cells, rowIndex) => cells.map((cell, columnIndex) => rowIndex === row && columnIndex === column ? value : cell)));
  }

  return <section className={`office-efficiency-page office-phase-${phase}`}>
    <header className="office-efficiency-hero">
      <div><span>OFFICE SKILL EXAM LAB</span><h1>Word & Excel Efficiency</h1><p>Timed, question-based office simulations with 18 original papers per track and detailed marks.</p></div>
      <div><Target aria-hidden="true" /><strong>{phase === "result" ? `${score.obtainedMarks}/${score.maximumMarks}` : "18"}</strong><span>{phase === "result" ? "marks obtained" : "mandatory questions"}</span></div>
    </header>

    <div className="office-mode-switch" role="tablist" aria-label="Office skill track">
      <button type="button" role="tab" aria-selected={track === "word"} className={track === "word" ? "active" : ""} disabled={phase === "exam"} onClick={() => selectTrack("word")}><FileText aria-hidden="true" /><span><strong>Word Efficiency</strong><small>18 bilingual skill papers · 50 marks</small></span></button>
      <button type="button" role="tab" aria-selected={track === "excel"} className={track === "excel" ? "active" : ""} disabled={phase === "exam"} onClick={() => selectTrack("excel")}><FileSpreadsheet aria-hidden="true" /><span><strong>Excel Efficiency</strong><small>18 spreadsheet skill papers · 50 marks</small></span></button>
    </div>

    {phase === "catalog" && <OfficeCatalog track={track} selectedPaperId={selectedPaper.id} papers={selectedPapers} durationMinutes={durationMinutes} onDurationChange={setDurationMinutes} onSelect={selectPaper} onContinue={() => setPhase("instructions")} />}
    {phase === "instructions" && <OfficeInstructions track={track} paperTitle={selectedPaper.title} requirements={score.requirements} durationMinutes={durationMinutes} onBack={() => setPhase("catalog")} onStart={startExam} />}
    {phase === "exam" && <>
      <OfficeExamHeader track={track} paperNumber={selectedPaper.number} paperTitle={selectedPaper.title} remainingSeconds={remainingSeconds} paused={paused} onPause={() => setPaused((current) => !current)} onExit={closeExam} />
      <div className="office-exam-grid">
        <OfficeQuestionRail requirements={score.requirements} />
        {track === "word"
          ? <WordWorkstation paper={wordPaper} fontStack={fontStack} effectiveLayout={effectiveLayout} source={wordSource} state={wordState} paused={paused} onSourceChange={setWordSource} onStateChange={updateWordState} />
          : <ExcelWorkstation paper={excelPaper} sheet={excelSheet} state={excelState} activeCell={activeCell} paused={paused} onCellFocus={(row, column) => setActiveCell({ row, column })} onCellChange={updateCell} onStateChange={updateExcelState} />}
      </div>
      <footer className="office-exam-footer"><div><span>Elapsed</span><strong>{formatTime(Math.max(0, elapsedSeconds))}</strong></div><div><span>Questions</span><strong>18 mandatory</strong></div><p>Marks remain hidden until submission. Closing this test returns to Office Skills.</p><Button variant="outline" onClick={closeExam}>Exit paper</Button><Button onClick={() => setPhase("result")} disabled={paused}><CheckCircle2 aria-hidden="true" /> Submit paper</Button></footer>
    </>}
    {phase === "result" && <OfficeResult track={track} paperTitle={selectedPaper.title} paperNumber={selectedPaper.number} score={score} durationSeconds={Math.max(1, elapsedSeconds)} timedOut={remainingSeconds === 0} onClose={closeExam} onRetake={startExam} />}
  </section>;
}

function OfficeCatalog({ track, papers, selectedPaperId, durationMinutes, onDurationChange, onSelect, onContinue }: {
  readonly track: OfficeTrack;
  readonly papers: readonly { readonly id: string; readonly number: number; readonly title: string; readonly category: string }[];
  readonly selectedPaperId: string;
  readonly durationMinutes: number;
  readonly onDurationChange: (value: number) => void;
  readonly onSelect: (id: string) => void;
  readonly onContinue: () => void;
}) {
  const paper = papers.find((item) => item.id === selectedPaperId) ?? papers[0];
  return <div className="office-paper-browser">
    <aside><header><span>EXAM CATALOG</span><strong>{track === "word" ? "Word processing papers" : "Spreadsheet papers"}</strong></header><div>{papers.map((item) => <button type="button" key={item.id} className={item.id === selectedPaperId ? "active" : ""} onClick={() => onSelect(item.id)}><span>{String(item.number).padStart(2, "0")}</span><div><strong>{item.title}</strong><small>{item.category}</small></div></button>)}</div></aside>
    <main className="office-paper-summary"><div className="office-paper-icon">{track === "word" ? <FileText aria-hidden="true" /> : <FileSpreadsheet aria-hidden="true" />}</div><span>PAPER {String(paper.number).padStart(2, "0")} · ORIGINAL BHASHAYANTRA CONTENT</span><h2>{paper.title}</h2><p>{track === "word" ? "Complete document entry, paragraph, page, list, and table-formatting operations in one controlled paper." : "Complete data entry, formulas, number formats, sorting, filtering, worksheet layout, and save operations."}</p><dl><div><dt>Questions</dt><dd>18 mandatory</dd></div><div><dt>Maximum marks</dt><dd>50</dd></div><div><dt>Result</dt><dd>Per-question</dd></div></dl><label>Test duration<select value={durationMinutes} onChange={(event) => onDurationChange(Number(event.target.value))}>{DURATION_OPTIONS.map((duration) => <option key={duration} value={duration}>{duration} minutes</option>)}</select></label><Button onClick={onContinue}>Review instructions <Play aria-hidden="true" /></Button><small>Practice simulation only. Check the latest official notice for the recruitment authority's exact rules.</small></main>
  </div>;
}

function OfficeInstructions({ track, paperTitle, requirements, durationMinutes, onBack, onStart }: { readonly track: OfficeTrack; readonly paperTitle: string; readonly requirements: OfficeExamScore["requirements"]; readonly durationMinutes: number; readonly onBack: () => void; readonly onStart: () => void }) {
  return <section className="office-instruction-sheet">
    <header><span>{track === "word" ? "WORD" : "EXCEL"} EFFICIENCY · {durationMinutes} MINUTES</span><h2>{paperTitle}</h2><p>Read every instruction before starting. The timer begins when the workstation opens.</p></header>
    <div className="office-bilingual-rules"><article><h3>निर्देश</h3><ol><li>इस प्रश्न पत्र में कुल 18 अनिवार्य प्रश्न हैं।</li><li>अधिकतम अंक 50 हैं और प्रत्येक प्रश्न के अंक अलग दिए गए हैं।</li><li>कीबोर्ड, माउस, कॉपी और पेस्ट का उपयोग किया जा सकता है।</li><li>समय समाप्त होने पर उत्तर स्वतः जमा हो जाएगा।</li></ol></article><article><h3>Instructions</h3><ol><li>This paper contains 18 mandatory questions.</li><li>The maximum score is 50; marks are assigned per question.</li><li>Keyboard, mouse, copy, and paste are available inside the sandbox.</li><li>The paper is submitted automatically when time expires.</li></ol></article></div>
    <div className="office-instruction-questions"><header><strong>Question blueprint</strong><span>{requirements.length} checks · {requirements.reduce((sum, item) => sum + item.marks, 0)} marks</span></header>{requirements.map((item, index) => <div key={item.id}><span>{index + 1}</span><p>{item.instruction}</p><strong>{item.marks} marks</strong></div>)}</div>
    <p className="office-disclaimer">BhashaYantra does not claim affiliation with any recruitment board. This is an original practice simulation; official question count, duration, interface, and scoring may differ.</p>
    <footer><Button variant="outline" onClick={onBack}><ChevronLeft aria-hidden="true" /> Back to papers</Button><Button onClick={onStart}><Play aria-hidden="true" /> Start paper</Button></footer>
  </section>;
}

function OfficeExamHeader({ track, paperNumber, paperTitle, remainingSeconds, paused, onPause, onExit }: { readonly track: OfficeTrack; readonly paperNumber: number; readonly paperTitle: string; readonly remainingSeconds: number; readonly paused: boolean; readonly onPause: () => void; readonly onExit: () => void }) {
  return <header className="office-running-header"><div><span>{track.toUpperCase()} EFFICIENCY · PAPER {String(paperNumber).padStart(2, "0")}</span><h2>{paperTitle}</h2></div><div><span>{paused ? "PAUSED" : "TIME REMAINING"}</span><strong>{formatTime(remainingSeconds)}</strong><Button variant="outline" onClick={onPause}>{paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />} {paused ? "Resume" : "Pause"}</Button><Button variant="outline" onClick={onExit}>Exit</Button></div></header>;
}

function OfficeQuestionRail({ requirements }: { readonly requirements: OfficeExamScore["requirements"] }) {
  return <aside className="office-question-rail"><header><ListChecks aria-hidden="true" /><div><span>QUESTION PAPER</span><strong>18 mandatory tasks</strong></div></header><div>{requirements.map((item, index) => <article key={item.id}><span>{String(index + 1).padStart(2, "0")}</span><p>{item.instruction}</p><strong>{item.marks}</strong></article>)}</div><footer><LockKeyhole aria-hidden="true" /><p>Live marks are hidden during the paper.</p></footer></aside>;
}

function WordWorkstation({ paper, source, state, paused, fontStack, effectiveLayout, onSourceChange, onStateChange }: {
  readonly paper: (typeof WORD_OFFICE_PAPERS)[number];
  readonly source: string;
  readonly state: WordEditorState;
  readonly paused: boolean;
  readonly fontStack: string;
  readonly effectiveLayout: ReadyTypingLayoutId;
  readonly onSourceChange: (value: string) => void;
  readonly onStateChange: <K extends keyof WordEditorState>(key: K, value: WordEditorState[K]) => void;
}) {
  const output = typingSourceToUnicode(source, effectiveLayout).output;
  const documentRows = state.rowAdded ? ["BY-01", "BY-02", "BY-03", "BY-04"] : ["BY-01", "BY-02", "BY-03"];
  return <main className="office-word-simulator" aria-disabled={paused}>
    <div className="office-simulator-title"><FileText aria-hidden="true" /><strong>Document1 — Word simulation</strong><span>{paper.language === "hi" ? `Hindi input: ${effectiveLayout}` : "English QWERTY"}</span></div>
    <div className="office-word-ribbon">
      <div><span>Font</span><select aria-label="Font size" value={state.fontSize} onChange={(event) => onStateChange("fontSize", Number(event.target.value))}><option value="14">14 pt</option><option value="18">18 pt</option><option value="24">24 pt</option></select><select aria-label="Font colour" value={state.fontColor} onChange={(event) => onStateChange("fontColor", event.target.value as WordEditorState["fontColor"])}><option value="black">Black</option><option value="blue">Blue</option><option value="red">Red</option></select><button type="button" className={state.highlight === "yellow" ? "active" : ""} onClick={() => onStateChange("highlight", state.highlight === "yellow" ? "none" : "yellow")}><Highlighter aria-hidden="true" /> Highlight</button><button type="button" className={state.subscriptApplied ? "active" : ""} onClick={() => onStateChange("subscriptApplied", !state.subscriptApplied)}>X<sub>2</sub></button></div>
      <div><span>Paragraph</span><button type="button" className={state.bodyAlignment === "right" ? "active" : ""} onClick={() => onStateChange("bodyAlignment", "right")}><AlignRight aria-hidden="true" /> Right</button><select aria-label="Line spacing" value={state.lineSpacing} onChange={(event) => onStateChange("lineSpacing", Number(event.target.value))}><option value="1.15">1.15 spacing</option><option value="1.5">1.5 spacing</option><option value="2">2.0 spacing</option></select><select aria-label="Right indent" value={state.rightIndent} onChange={(event) => onStateChange("rightIndent", Number(event.target.value))}><option value="0">No indent</option><option value="1.25">1.25 in right</option></select><button type="button" className={state.paragraphShade === "blue" ? "active" : ""} onClick={() => onStateChange("paragraphShade", state.paragraphShade === "blue" ? "none" : "blue")}>Blue shading</button></div>
      <div><span>Page & table</span><button type="button" className={state.orientation === "landscape" ? "active" : ""} onClick={() => onStateChange("orientation", state.orientation === "portrait" ? "landscape" : "portrait")}>Landscape</button><button type="button" onClick={() => onStateChange("rowAdded", true)}><Table2 aria-hidden="true" /> Add row</button><button type="button" className={state.tableHeaderFill === "green" ? "active" : ""} onClick={() => onStateChange("tableHeaderFill", "green")}>Header fill</button><button type="button" className={state.tableHeaderCentered ? "active" : ""} onClick={() => onStateChange("tableHeaderCentered", !state.tableHeaderCentered)}>Header centre</button><button type="button" className={state.tableLastRowBold ? "active" : ""} onClick={() => onStateChange("tableLastRowBold", !state.tableLastRowBold)}>Last row bold</button></div>
      <div><span>Document</span><button type="button" className={state.headingBold ? "active" : ""} onClick={() => onStateChange("headingBold", !state.headingBold)}><Bold aria-hidden="true" /> Heading</button><button type="button" className={state.headingCentered ? "active" : ""} onClick={() => onStateChange("headingCentered", !state.headingCentered)}><AlignCenter aria-hidden="true" /> Heading</button><button type="button" className={state.saved ? "active" : ""} onClick={() => onStateChange("saved", true)}><Save aria-hidden="true" /> Save</button></div>
    </div>
    <section className="office-source-panel"><span>SOURCE COPY</span><p style={{ fontFamily: fontStack }}>{paper.sourceCopy}</p></section>
    <div className="office-document-stage">
      <article className={`office-document-canvas ${state.orientation}`}>
        <h3 className={`${state.headingBold ? "bold" : ""} ${state.headingCentered ? "center" : ""}`} style={{ fontFamily: fontStack }}>{paper.heading}</h3>
        <textarea disabled={paused} value={source} onChange={(event) => onSourceChange(event.target.value)} placeholder={paper.language === "hi" ? "Type the displayed physical Hindi-layout keys here…" : "Type the source copy here…"} spellCheck={false} />
        {paper.language === "hi" && <p className="office-word-output" style={{ fontFamily: fontStack, fontSize: state.fontSize, color: state.fontColor, textAlign: state.bodyAlignment, lineHeight: state.lineSpacing, paddingRight: `${state.rightIndent * 34}px`, background: state.paragraphShade === "blue" ? "#dbeafe" : state.highlight === "yellow" ? "#fef08a" : "transparent" }}>{output || "Unicode document preview"}{state.subscriptApplied && <sub> BY</sub>}</p>}
        {paper.language === "en" && <p className="office-word-output" style={{ fontSize: state.fontSize, color: state.fontColor, textAlign: state.bodyAlignment, lineHeight: state.lineSpacing, paddingRight: `${state.rightIndent * 34}px`, background: state.paragraphShade === "blue" ? "#dbeafe" : state.highlight === "yellow" ? "#fef08a" : "transparent" }}>{source || "Document preview"}{state.subscriptApplied && <sub> BY</sub>}</p>}
        <table><thead className={state.tableHeaderFill === "green" ? "green" : ""}><tr className={state.tableHeaderCentered ? "center" : ""}><th>Reference</th><th>Section</th><th>Status</th></tr></thead><tbody>{documentRows.map((reference, index) => <tr key={reference} className={state.tableLastRowBold && index === documentRows.length - 1 ? "bold" : ""}><td>{reference}</td><td>{["Registry", "Accounts", "Dispatch", "Records"][index]}</td><td>{index % 2 ? "Pending" : "Verified"}</td></tr>)}</tbody></table>
        <label>Final list item<input disabled={paused} value={state.replacementText} onChange={(event) => onStateChange("replacementText", event.target.value)} placeholder={paper.requiredReplacement} /></label>
      </article>
    </div>
  </main>;
}

function ExcelWorkstation({ paper, sheet, state, activeCell, paused, onCellFocus, onCellChange, onStateChange }: {
  readonly paper: (typeof EXCEL_OFFICE_PAPERS)[number];
  readonly sheet: readonly (readonly string[])[];
  readonly state: ExcelEditorState;
  readonly activeCell: { readonly row: number; readonly column: number };
  readonly paused: boolean;
  readonly onCellFocus: (row: number, column: number) => void;
  readonly onCellChange: (row: number, column: number, value: string) => void;
  readonly onStateChange: <K extends keyof ExcelEditorState>(key: K, value: ExcelEditorState[K]) => void;
}) {
  const activeName = `${String.fromCharCode(65 + activeCell.column)}${activeCell.row + 1}`;
  return <main className="office-excel-simulator" aria-disabled={paused}>
    <div className="office-simulator-title"><FileSpreadsheet aria-hidden="true" /><strong>Book1 — Excel simulation</strong><label>Sheet name<input value={state.sheetName} onChange={(event) => onStateChange("sheetName", event.target.value)} /></label></div>
    <div className="office-excel-ribbon">
      <button type="button" className={state.headerBold ? "active" : ""} onClick={() => onStateChange("headerBold", !state.headerBold)}><Bold aria-hidden="true" /> Header bold</button><button type="button" className={state.headerCentered ? "active" : ""} onClick={() => onStateChange("headerCentered", !state.headerCentered)}><AlignCenter aria-hidden="true" /> Centre</button><button type="button" className={state.headerFill === "green" ? "active" : ""} onClick={() => onStateChange("headerFill", "green")}>Green fill</button><button type="button" className={state.allBorders ? "active" : ""} onClick={() => onStateChange("allBorders", !state.allBorders)}><Grid2X2 aria-hidden="true" /> All borders</button><button type="button" className={state.currencyFormat ? "active" : ""} onClick={() => onStateChange("currencyFormat", !state.currencyFormat)}>₹ Currency</button><button type="button" className={state.dateFormat ? "active" : ""} onClick={() => onStateChange("dateFormat", !state.dateFormat)}>Date</button><button type="button" className={state.percentageFormat ? "active" : ""} onClick={() => onStateChange("percentageFormat", !state.percentageFormat)}>% Percent</button><button type="button" className={state.sorted ? "active" : ""} onClick={() => onStateChange("sorted", !state.sorted)}>A–Z Sort</button><button type="button" className={state.filterEnabled ? "active" : ""} onClick={() => onStateChange("filterEnabled", !state.filterEnabled)}><Filter aria-hidden="true" /> Filter</button><button type="button" className={state.frozenHeader ? "active" : ""} onClick={() => onStateChange("frozenHeader", !state.frozenHeader)}>Freeze top</button><button type="button" className={state.autoFit ? "active" : ""} onClick={() => onStateChange("autoFit", !state.autoFit)}>Auto-fit</button><button type="button" className={state.totalsRowAdded ? "active" : ""} onClick={() => onStateChange("totalsRowAdded", true)}>Summary rows</button><button type="button" className={state.saved ? "active" : ""} onClick={() => onStateChange("saved", true)}><Save aria-hidden="true" /> Save</button>
    </div>
    <div className="office-formula-bar"><span>{activeName}</span><b>fx</b><input value={sheet[activeCell.row]?.[activeCell.column] ?? ""} onChange={(event) => onCellChange(activeCell.row, activeCell.column, event.target.value)} disabled={paused} /></div>
    <div className="office-excel-panes">
      <section><header><span>SOURCE WORKSHEET</span><strong>Copy values and formulas exactly</strong></header><ExcelGrid paper={paper} values={paper.grid} readOnly styles={state} onFocus={() => undefined} onChange={() => undefined} /></section>
      <section><header><span>YOUR WORKBOOK</span><strong>{state.filterEnabled ? "Filters on" : "Data entry range"}</strong></header><ExcelGrid paper={paper} values={sheet} styles={state} disabled={paused} onFocus={onCellFocus} onChange={onCellChange} /></section>
    </div>
  </main>;
}

function ExcelGrid({ paper, values, styles, readOnly = false, disabled = false, onFocus, onChange }: { readonly paper: (typeof EXCEL_OFFICE_PAPERS)[number]; readonly values: readonly (readonly string[])[]; readonly styles: ExcelEditorState; readonly readOnly?: boolean; readonly disabled?: boolean; readonly onFocus: (row: number, column: number) => void; readonly onChange: (row: number, column: number, value: string) => void }) {
  return <div className={`office-sheet-grid ${styles.allBorders ? "all-borders" : ""} ${styles.autoFit ? "auto-fit" : ""}`} style={{ gridTemplateColumns: `38px repeat(${paper.grid[0].length}, minmax(86px, 1fr))` }}><span className="corner" />{paper.grid[0].map((_, column) => <span className="column-label" key={`column-${column}`}>{String.fromCharCode(65 + column)}</span>)}{values.map((row, rowIndex) => <Fragment key={`row-${rowIndex}`}><span className="row-label">{rowIndex + 1}</span>{row.map((value, columnIndex) => readOnly ? <span key={`source-${rowIndex}-${columnIndex}`} className={rowIndex === 0 ? "source header" : "source"}>{value || "—"}</span> : <input key={`entry-${rowIndex}-${columnIndex}`} className={`${rowIndex === 0 && styles.headerBold ? "bold" : ""} ${rowIndex === 0 && styles.headerCentered ? "center" : ""} ${rowIndex === 0 && styles.headerFill === "green" ? "green" : ""}`} value={value} disabled={disabled} onFocus={() => onFocus(rowIndex, columnIndex)} onChange={(event) => onChange(rowIndex, columnIndex, event.target.value)} aria-label={`Cell ${String.fromCharCode(65 + columnIndex)}${rowIndex + 1}`} />)}</Fragment>)}</div>;
}

function OfficeResult({ track, paperTitle, paperNumber, score, durationSeconds, timedOut, onClose, onRetake }: { readonly track: OfficeTrack; readonly paperTitle: string; readonly paperNumber: number; readonly score: OfficeExamScore; readonly durationSeconds: number; readonly timedOut: boolean; readonly onClose: () => void; readonly onRetake: () => void }) {
  return <section className="office-result-report">
    <header><div><span>{track.toUpperCase()} EFFICIENCY RESULT</span><h2>{paperTitle}</h2><p>Paper {String(paperNumber).padStart(2, "0")} · {timedOut ? "Submitted when time expired" : "Submitted by candidate"}</p></div><strong className={score.percentage >= 60 ? "pass" : "fail"}>{score.percentage}%<small>{score.percentage >= 60 ? "Practice pass" : "Needs practice"}</small></strong></header>
    <div className="office-result-summary"><article><span>Maximum marks</span><strong>{score.maximumMarks}</strong></article><article><span>Marks obtained</span><strong>{score.obtainedMarks}</strong></article><article><span>Completed questions</span><strong>{score.completed}/18</strong></article><article><span>Time used</span><strong>{formatTime(durationSeconds)}</strong></article></div>
    <div className="office-result-table"><header><span>S No.</span><span>Question</span><span>Maximum</span><span>Obtained</span><span>Status</span></header>{score.requirements.map((item, index) => <div key={item.id}><span>{index + 1}</span><p>{item.instruction}</p><strong>{item.marks}</strong><strong>{item.obtained}</strong><em className={item.passed ? "pass" : "fail"}>{item.passed ? "Completed" : "Not completed"}</em></div>)}<footer><span /><strong>Grand total</strong><b>{score.maximumMarks}</b><b>{score.obtainedMarks}</b><span /></footer></div>
    <p className="office-disclaimer">This result is generated by the BhashaYantra practice sandbox and is not an official recruitment score.</p>
    <footer><Button variant="outline" onClick={onClose}><ChevronLeft aria-hidden="true" /> Close result</Button><Button onClick={onRetake}><RotateCcw aria-hidden="true" /> Retake paper</Button></footer>
  </section>;
}
