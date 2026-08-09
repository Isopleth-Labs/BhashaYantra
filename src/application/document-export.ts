export type ProductivityExportFormat = "txt" | "docx" | "xlsx" | "html";

export interface ProductivityExportRequest {
  readonly text: string;
  readonly format: ProductivityExportFormat;
  readonly displayFont: string;
  readonly basename?: string;
}

const EXPORT_METADATA: Readonly<Record<ProductivityExportFormat, {
  readonly extension: ProductivityExportFormat;
  readonly label: string;
  readonly mimeType: string;
}>> = {
  txt: { extension: "txt", label: "Text", mimeType: "text/plain;charset=utf-8" },
  docx: { extension: "docx", label: "Word document", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  xlsx: { extension: "xlsx", label: "Excel workbook", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  html: { extension: "html", label: "Web page", mimeType: "text/html;charset=utf-8" },
};

function escapeXml(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/gu, "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function escapeHtml(value: string) {
  return escapeXml(value);
}

function normalizeLines(text: string) {
  return text.replace(/\r\n?/gu, "\n").split("\n");
}

function countWords(text: string) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/u).length : 0;
}

function safeBasename(value: string) {
  const sanitized = value.trim().replace(/[<>:"/\\|?*\u0000-\u001F]/gu, "-");
  return sanitized || "bhashayantra-document";
}

export function createBrowserDocument(text: string, displayFont: string) {
  const font = escapeHtml(displayFont);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>BhashaYantra document</title>
  <style>
    body { max-width: 900px; margin: 48px auto; padding: 0 24px; color: #0f172a; background: #fff; font-family: ${font}, "Nirmala UI", Mangal, sans-serif; }
    article { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 18px; line-height: 1.75; }
    @media print { body { max-width: none; margin: 0; } }
  </style>
</head>
<body>
  <article>${escapeHtml(text)}</article>
</body>
</html>`;
}

export async function createWordDocument(text: string, displayFont: string) {
  const { Document, Packer, Paragraph, TextRun } = await import("docx");
  const paragraphs = normalizeLines(text).map((line) => new Paragraph({
    spacing: { after: 120, line: 360 },
    children: [new TextRun({ text: line || " ", font: displayFont, size: 24 })],
  }));
  const document = new Document({
    creator: "BhashaYantra",
    title: "BhashaYantra typing document",
    description: "Offline document exported from BhashaYantra",
    sections: [{
      properties: {
        page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } },
      },
      children: paragraphs,
    }],
  });
  return Packer.toBlob(document);
}

function inlineCell(reference: string, value: string, style = 0) {
  return `<c r="${reference}" t="inlineStr"${style ? ` s="${style}"` : ""}><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}

function numberCell(reference: string, value: number) {
  return `<c r="${reference}" t="n"><v>${value}</v></c>`;
}

export async function createExcelWorkbook(text: string) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const rows = normalizeLines(text).flatMap((line) => line.match(/[\s\S]{1,32000}/gu) ?? [""]);
  const sheetRows = [
    `<row r="1">${inlineCell("A1", "Line", 1)}${inlineCell("B1", "Text", 1)}${inlineCell("C1", "Words", 1)}${inlineCell("D1", "Characters", 1)}</row>`,
    ...rows.map((line, index) => {
      const row = index + 2;
      return `<row r="${row}">${numberCell(`A${row}`, index + 1)}${inlineCell(`B${row}`, line)}${numberCell(`C${row}`, countWords(line))}${numberCell(`D${row}`, Array.from(line).length)}</row>`;
    }),
  ].join("");

  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`);
  zip.folder("_rels")?.file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);
  zip.folder("xl")?.file("workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Typing" sheetId="1" r:id="rId1"/></sheets>
</workbook>`);
  zip.folder("xl")?.folder("_rels")?.file("workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);
  zip.folder("xl")?.folder("worksheets")?.file("sheet1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols><col min="1" max="1" width="8" customWidth="1"/><col min="2" max="2" width="100" customWidth="1"/><col min="3" max="4" width="14" customWidth="1"/></cols>
  <sheetData>${sheetRows}</sheetData>
</worksheet>`);
  zip.folder("xl")?.file("styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="11"/><name val="Nirmala UI"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Segoe UI"/></font></fonts>
  <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1463E5"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs>
</styleSheet>`);

  return zip.generateAsync({
    type: "blob",
    mimeType: EXPORT_METADATA.xlsx.mimeType,
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

export async function createProductivityExport(request: ProductivityExportRequest) {
  if (request.format === "docx") return createWordDocument(request.text, request.displayFont);
  if (request.format === "xlsx") return createExcelWorkbook(request.text);
  if (request.format === "html") {
    return new Blob([createBrowserDocument(request.text, request.displayFont)], { type: EXPORT_METADATA.html.mimeType });
  }
  return new Blob([request.text], { type: EXPORT_METADATA.txt.mimeType });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function saveProductivityExport(request: ProductivityExportRequest) {
  const metadata = EXPORT_METADATA[request.format];
  const filename = `${safeBasename(request.basename ?? "bhashayantra-document")}.${metadata.extension}`;
  const blob = await createProductivityExport(request);

  if ("__TAURI_INTERNALS__" in window) {
    try {
      const [{ save }, { writeFile }] = await Promise.all([
        import("@tauri-apps/plugin-dialog"),
        import("@tauri-apps/plugin-fs"),
      ]);
      const selected = await save({
        defaultPath: filename,
        filters: [{ name: metadata.label, extensions: [metadata.extension] }],
      });
      if (!selected) return "cancelled" as const;
      await writeFile(selected, new Uint8Array(await blob.arrayBuffer()));
      return "saved" as const;
    } catch {
      downloadBlob(blob, filename);
      return "downloaded" as const;
    }
  }

  downloadBlob(blob, filename);
  return "downloaded" as const;
}
