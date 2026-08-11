import { describe, expect, it } from "vitest";

import {
  EXCEL_OFFICE_PAPERS,
  WORD_OFFICE_PAPERS,
  createEmptyExcelSheet,
  scoreExcelOfficePaper,
  scoreWordOfficePaper,
  type ExcelOfficeState,
  type WordOfficeState,
} from "@/domain/office/office-exam";

describe("office efficiency exam", () => {
  it("provides 18 unique original papers for both office tracks", () => {
    expect(WORD_OFFICE_PAPERS).toHaveLength(18);
    expect(EXCEL_OFFICE_PAPERS).toHaveLength(18);
    expect(new Set(WORD_OFFICE_PAPERS.map((paper) => paper.id)).size).toBe(18);
    expect(new Set(EXCEL_OFFICE_PAPERS.map((paper) => paper.id)).size).toBe(18);
    expect(WORD_OFFICE_PAPERS.some((paper) => paper.language === "hi")).toBe(true);
    expect(WORD_OFFICE_PAPERS.some((paper) => paper.language === "en")).toBe(true);
  });

  it("awards all 50 marks only when every Word requirement is complete", () => {
    const paper = WORD_OFFICE_PAPERS[0];
    const perfect: WordOfficeState = {
      outputText: paper.sourceCopy,
      rowAdded: true,
      fontSize: 24,
      fontColor: "blue",
      highlight: "yellow",
      headingBold: true,
      headingCentered: true,
      bodyAlignment: "right",
      rightIndent: 1.25,
      lineSpacing: 1.5,
      orientation: "landscape",
      subscriptApplied: true,
      paragraphShade: "blue",
      tableHeaderFill: "green",
      tableHeaderCentered: true,
      tableLastRowBold: true,
      replacementText: paper.requiredReplacement,
      saved: true,
    };

    expect(scoreWordOfficePaper(paper, perfect)).toMatchObject({
      maximumMarks: 50,
      obtainedMarks: 50,
      percentage: 100,
      completed: 18,
    });
    expect(scoreWordOfficePaper(paper, { ...perfect, outputText: "", saved: false })).toMatchObject({
      obtainedMarks: 42.5,
      completed: 16,
    });
  });

  it("awards all 50 marks only when every Excel requirement is complete", () => {
    const paper = EXCEL_OFFICE_PAPERS[0];
    const perfect: ExcelOfficeState = {
      sheet: paper.grid.map((row) => [...row]),
      headerBold: true,
      headerCentered: true,
      headerFill: "green",
      allBorders: true,
      currencyFormat: true,
      dateFormat: true,
      percentageFormat: true,
      sorted: true,
      filterEnabled: true,
      frozenHeader: true,
      autoFit: true,
      sheetName: "Efficiency Report",
      totalsRowAdded: true,
      saved: true,
    };

    expect(scoreExcelOfficePaper(paper, perfect)).toMatchObject({
      maximumMarks: 50,
      obtainedMarks: 50,
      percentage: 100,
      completed: 18,
    });
    expect(createEmptyExcelSheet(paper).every((row) => row.every((cell) => cell === ""))).toBe(true);
    expect(scoreExcelOfficePaper(paper, { ...perfect, sheet: createEmptyExcelSheet(paper) }).obtainedMarks).toBeLessThan(50);
  });
});
