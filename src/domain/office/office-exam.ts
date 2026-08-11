export type OfficeTrack = "word" | "excel";

export interface WordOfficePaper {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly category: string;
  readonly language: "en" | "hi";
  readonly sourceCopy: string;
  readonly heading: string;
  readonly requiredReplacement: string;
}

export interface ExcelOfficePaper {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly category: string;
  readonly grid: readonly (readonly string[])[];
}

export interface WordOfficeState {
  readonly outputText: string;
  readonly rowAdded: boolean;
  readonly fontSize: number;
  readonly fontColor: "black" | "blue" | "red";
  readonly highlight: "none" | "yellow";
  readonly headingBold: boolean;
  readonly headingCentered: boolean;
  readonly bodyAlignment: "left" | "center" | "right";
  readonly rightIndent: number;
  readonly lineSpacing: number;
  readonly orientation: "portrait" | "landscape";
  readonly subscriptApplied: boolean;
  readonly paragraphShade: "none" | "blue";
  readonly tableHeaderFill: "none" | "green";
  readonly tableHeaderCentered: boolean;
  readonly tableLastRowBold: boolean;
  readonly replacementText: string;
  readonly saved: boolean;
}

export interface ExcelOfficeState {
  readonly sheet: readonly (readonly string[])[];
  readonly headerBold: boolean;
  readonly headerCentered: boolean;
  readonly headerFill: "none" | "green";
  readonly allBorders: boolean;
  readonly currencyFormat: boolean;
  readonly dateFormat: boolean;
  readonly percentageFormat: boolean;
  readonly sorted: boolean;
  readonly filterEnabled: boolean;
  readonly frozenHeader: boolean;
  readonly autoFit: boolean;
  readonly sheetName: string;
  readonly totalsRowAdded: boolean;
  readonly saved: boolean;
}

export interface OfficeRequirementResult {
  readonly id: string;
  readonly instruction: string;
  readonly marks: number;
  readonly passed: boolean;
  readonly obtained: number;
}

export interface OfficeExamScore {
  readonly maximumMarks: number;
  readonly obtainedMarks: number;
  readonly percentage: number;
  readonly completed: number;
  readonly requirements: readonly OfficeRequirementResult[];
}

const HINDI_TOPICS = [
  "कार्यालय निरीक्षण प्रतिवेदन",
  "अभिलेख सत्यापन टिप्पणी",
  "प्रशिक्षण प्रगति विवरण",
  "जनसेवा समीक्षा पत्र",
  "लेखा परीक्षण टिप्पणी",
  "डिजिटल अभिलेख आदेश",
  "शाखा समन्वय प्रतिवेदन",
  "अनुपालन स्थिति विवरण",
  "बैठक कार्यवृत्त",
] as const;

const ENGLISH_TOPICS = [
  "Administrative Inspection Report",
  "Record Verification Note",
  "Training Progress Statement",
  "Public Service Review",
  "Accounts Scrutiny Note",
  "Digital Records Order",
  "Branch Coordination Report",
  "Compliance Status Statement",
  "Minutes of Review Meeting",
] as const;

export const WORD_OFFICE_PAPERS: readonly WordOfficePaper[] = Array.from({ length: 18 }, (_, index) => {
  const number = index + 1;
  const language = index % 2 === 0 ? "hi" : "en";
  const topicIndex = Math.floor(index / 2) % HINDI_TOPICS.length;
  const reference = `BY-WP-${String(number).padStart(2, "0")}`;
  return language === "hi"
    ? {
        id: `word-paper-${number}`,
        number,
        title: HINDI_TOPICS[topicIndex],
        category: number > 12 ? "Advanced office simulation" : "Word processing skill test",
        language,
        heading: HINDI_TOPICS[topicIndex],
        requiredReplacement: `भारतीय कार्यालय प्रक्रिया ${number}`,
        sourceCopy: `संबंधित शाखा के अभिलेखों की समीक्षा की गई। परीक्षण में पाया गया कि सभी प्रविष्टियों का क्रम, दिनांक और संदर्भ संख्या मूल पत्रावली से मिलान करना आवश्यक है। अनुभाग अधिकारी सत्यापन के बाद अद्यतन प्रतिवेदन प्रस्तुत करेंगे और लंबित बिंदुओं पर स्पष्ट कार्रवाई दर्ज करेंगे।`,
      }
    : {
        id: `word-paper-${number}`,
        number,
        title: ENGLISH_TOPICS[topicIndex],
        category: number > 12 ? "Advanced office simulation" : "Word processing skill test",
        language,
        heading: ENGLISH_TOPICS[topicIndex],
        requiredReplacement: `Indian Office Procedure ${number}`,
        sourceCopy: `${reference} records were reviewed against the signed source register. Every date, reference number, and pending action must be verified before the section submits its final statement. The reviewing officer shall record a clear decision for each discrepancy and preserve the completed note with the supporting documents.`,
      };
});

function excelGrid(number: number): readonly (readonly string[])[] {
  const base = 12000 + number * 175;
  const spent = 7600 + number * 95;
  return [
    ["Date", "Section", "Budget", "Spent", "Balance"],
    [`01-08-2026`, `Registry ${number}`, `${base}`, `${spent}`, "=C2-D2"],
    [`02-08-2026`, `Accounts ${number}`, `${base + 2800}`, `${spent + 1650}`, "=C3-D3"],
    [`03-08-2026`, `Dispatch ${number}`, `${base - 1200}`, `${spent - 800}`, "=C4-D4"],
    [`04-08-2026`, `Records ${number}`, `${base + 900}`, `${spent + 450}`, "=C5-D5"],
    ["", "Total", "=SUM(C2:C5)", "=SUM(D2:D5)", "=SUM(E2:E5)"],
    ["", "Average", "=AVERAGE(C2:C5)", "=AVERAGE(D2:D5)", "=AVERAGE(E2:E5)"],
  ];
}

const EXCEL_CATEGORIES = ["Budget register", "Attendance statement", "Inventory control", "Result compilation", "Dispatch register", "Accounts worksheet"] as const;

export const EXCEL_OFFICE_PAPERS: readonly ExcelOfficePaper[] = Array.from({ length: 18 }, (_, index) => ({
  id: `excel-paper-${index + 1}`,
  number: index + 1,
  title: `${EXCEL_CATEGORIES[index % EXCEL_CATEGORIES.length]} ${String(index + 1).padStart(2, "0")}`,
  category: index > 11 ? "Advanced spreadsheet simulation" : "Excel efficiency test",
  grid: excelGrid(index + 1),
}));

export function createEmptyExcelSheet(paper: ExcelOfficePaper) {
  return paper.grid.map((row) => row.map(() => ""));
}

function normalized(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function score(
  requirements: readonly { readonly id: string; readonly instruction: string; readonly marks: number }[],
  passed: readonly boolean[],
): OfficeExamScore {
  const rows = requirements.map((item, index) => ({ ...item, passed: passed[index], obtained: passed[index] ? item.marks : 0 }));
  const maximumMarks = rows.reduce((sum, item) => sum + item.marks, 0);
  const obtainedMarks = rows.reduce((sum, item) => sum + item.obtained, 0);
  return {
    maximumMarks,
    obtainedMarks,
    percentage: maximumMarks ? Math.round((obtainedMarks / maximumMarks) * 100) : 0,
    completed: rows.filter((item) => item.passed).length,
    requirements: rows,
  };
}

const WORD_REQUIREMENTS = [
  ["word-copy", "Type the complete source copy accurately.", 5],
  ["word-row", "Add one new record row to the table.", 2.5],
  ["word-size", "Set body text size to 24 pt.", 2.5],
  ["word-color", "Change the body font colour to blue.", 2.5],
  ["word-highlight", "Apply yellow text highlighting.", 2.5],
  ["word-heading-bold", "Make the document heading bold.", 2.5],
  ["word-heading-center", "Centre the document heading.", 2.5],
  ["word-body-right", "Align the body paragraph to the right.", 2.5],
  ["word-indent", "Set the paragraph right indent to 1.25 inches.", 2.5],
  ["word-spacing", "Set paragraph line spacing to 1.5.", 2.5],
  ["word-landscape", "Change page orientation to landscape.", 2.5],
  ["word-subscript", "Apply subscript formatting to the reference marker.", 2.5],
  ["word-shade", "Apply blue paragraph shading.", 2.5],
  ["word-header-fill", "Apply green fill to the table header.", 2.5],
  ["word-header-center", "Centre the table header labels.", 2.5],
  ["word-last-row", "Make the final table row bold.", 2.5],
  ["word-list", "Replace the final list item with the supplied text.", 5],
  ["word-save", "Save the completed document.", 2.5],
] as const;

export function scoreWordOfficePaper(paper: WordOfficePaper, state: WordOfficeState): OfficeExamScore {
  const requirements = WORD_REQUIREMENTS.map(([id, instruction, marks]) => ({ id, instruction, marks }));
  return score(requirements, [
    normalized(state.outputText) === normalized(paper.sourceCopy),
    state.rowAdded,
    state.fontSize === 24,
    state.fontColor === "blue",
    state.highlight === "yellow",
    state.headingBold,
    state.headingCentered,
    state.bodyAlignment === "right",
    state.rightIndent === 1.25,
    state.lineSpacing === 1.5,
    state.orientation === "landscape",
    state.subscriptApplied,
    state.paragraphShade === "blue",
    state.tableHeaderFill === "green",
    state.tableHeaderCentered,
    state.tableLastRowBold,
    normalized(state.replacementText) === normalized(paper.requiredReplacement),
    state.saved,
  ]);
}

const EXCEL_REQUIREMENTS = [
  ["excel-data", "Enter every supplied label, date, and numeric value.", 5],
  ["excel-balance", "Enter the four row balance formulas.", 5],
  ["excel-total", "Enter the SUM formulas in the total row.", 2.5],
  ["excel-average", "Enter the AVERAGE formulas in the average row.", 2.5],
  ["excel-header-bold", "Make the header row bold.", 2.5],
  ["excel-header-center", "Centre all header labels.", 2.5],
  ["excel-header-fill", "Apply green fill to the header row.", 2.5],
  ["excel-borders", "Apply all borders to the data range.", 2.5],
  ["excel-currency", "Apply currency format to Budget and Spent.", 2.5],
  ["excel-date", "Apply date format to the Date column.", 2.5],
  ["excel-percent", "Apply percentage format to the summary.", 2.5],
  ["excel-sort", "Sort the records by Section in ascending order.", 2.5],
  ["excel-filter", "Enable filters on the header row.", 2.5],
  ["excel-freeze", "Freeze the header row.", 2.5],
  ["excel-autofit", "Auto-fit all used columns.", 2.5],
  ["excel-name", "Rename the sheet to Efficiency Report.", 2.5],
  ["excel-row", "Add the totals and average summary rows.", 2.5],
  ["excel-save", "Save the completed workbook.", 2.5],
] as const;

function cellsMatch(paper: ExcelOfficePaper, state: ExcelOfficeState, predicate: (value: string, row: number, column: number) => boolean) {
  return paper.grid.every((row, rowIndex) => row.every((value, columnIndex) => !predicate(value, rowIndex, columnIndex) || normalized(state.sheet[rowIndex]?.[columnIndex] ?? "") === normalized(value)));
}

export function scoreExcelOfficePaper(paper: ExcelOfficePaper, state: ExcelOfficeState): OfficeExamScore {
  const requirements = EXCEL_REQUIREMENTS.map(([id, instruction, marks]) => ({ id, instruction, marks }));
  return score(requirements, [
    cellsMatch(paper, state, (value) => Boolean(value) && !value.startsWith("=")),
    cellsMatch(paper, state, (value, row, column) => row >= 1 && row <= 4 && column === 4 && value.startsWith("=")),
    cellsMatch(paper, state, (value, row) => row === 5 && value.startsWith("=")),
    cellsMatch(paper, state, (value, row) => row === 6 && value.startsWith("=")),
    state.headerBold,
    state.headerCentered,
    state.headerFill === "green",
    state.allBorders,
    state.currencyFormat,
    state.dateFormat,
    state.percentageFormat,
    state.sorted,
    state.filterEnabled,
    state.frozenHeader,
    state.autoFit,
    normalized(state.sheetName).toLocaleLowerCase() === "efficiency report",
    state.totalsRowAdded,
    state.saved,
  ]);
}
