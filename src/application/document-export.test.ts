import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import {
  createBrowserDocument,
  createExcelWorkbook,
  createWordDocument,
} from "./document-export";

describe("productivity document exports", () => {
  it("creates a safe UTF-8 browser document", () => {
    const html = createBrowserDocument("मेरा नाम <भाषायंत्र> है", "Noto Sans Devanagari");

    expect(html).toContain('<meta charset="utf-8">');
    expect(html).toContain("मेरा नाम &lt;भाषायंत्र&gt; है");
    expect(html).toContain("Noto Sans Devanagari");
    expect(html).not.toContain("<भाषायंत्र>");
  });

  it("creates a real XLSX package with line statistics", async () => {
    const blob = await createExcelWorkbook("पहली पंक्ति\nsecond line");
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const sheet = await zip.file("xl/worksheets/sheet1.xml")?.async("string");

    expect(blob.type).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    expect(zip.file("[Content_Types].xml")).not.toBeNull();
    expect(sheet).toContain("पहली पंक्ति");
    expect(sheet).toContain("second line");
    expect(sheet).toContain("Characters");
  });

  it("creates a real DOCX package with the selected font and text", async () => {
    const blob = await createWordDocument("मेरा नाम भाषा यंत्र है", "Mangal");
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const documentXml = await zip.file("word/document.xml")?.async("string");

    expect(blob.type).toBe("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    expect(documentXml).toContain("मेरा नाम भाषा यंत्र है");
    expect(documentXml).toContain("Mangal");
  });
});
