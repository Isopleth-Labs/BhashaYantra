import { useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  CheckCircle2,
  Clipboard,
  Copy,
  Download,
  FileText,
  FolderOpen,
  Trash2,
} from "lucide-react";

import { convertText } from "@/application/use-cases/convert-text";
import { Button } from "@/components/ui/button";
import type { ConversionDirection } from "@/domain/conversion/types";

const INITIAL_LEGACY = 'esjk uke Hkk"kk ;a= gS';
const INITIAL_UNICODE = "मेरा नाम भाषा यंत्र है";

function isTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

function downloadInBrowser(contents: string, filename: string) {
  const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ExchangeConverter() {
  const [legacyText, setLegacyText] = useState(INITIAL_LEGACY);
  const [unicodeText, setUnicodeText] = useState(INITIAL_UNICODE);
  const [direction, setDirection] =
    useState<ConversionDirection>("legacy-to-unicode");
  const [warnings, setWarnings] = useState<readonly string[]>([]);
  const [status, setStatus] = useState("Ready for local conversion");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sourceText =
    direction === "legacy-to-unicode" ? legacyText : unicodeText;

  const characterCounts = useMemo(
    () => ({
      legacy: Array.from(legacyText).length,
      unicode: Array.from(unicodeText).length,
    }),
    [legacyText, unicodeText],
  );

  function runConversion() {
    const result = convertText({ input: sourceText, direction });

    if (direction === "legacy-to-unicode") {
      setUnicodeText(result.output);
    } else {
      setLegacyText(result.output);
    }

    setWarnings(result.warnings.map((warning) => warning.message));
    setStatus(
      result.warnings.length > 0
        ? `Converted with ${result.warnings.length} warning${result.warnings.length === 1 ? "" : "s"}`
        : "Conversion completed",
    );
  }

  function swapDirection() {
    setDirection((current) =>
      current === "legacy-to-unicode"
        ? "unicode-to-legacy"
        : "legacy-to-unicode",
    );
    setWarnings([]);
    setStatus("Conversion direction changed");
  }

  async function pasteSource() {
    try {
      const text = await navigator.clipboard.readText();
      if (direction === "legacy-to-unicode") {
        setLegacyText(text);
      } else {
        setUnicodeText(text);
      }
      setStatus("Clipboard text pasted");
    } catch {
      setStatus("Clipboard permission was not available");
    }
  }

  async function copyOutput() {
    const output =
      direction === "legacy-to-unicode" ? unicodeText : legacyText;
    try {
      await navigator.clipboard.writeText(output);
      setStatus("Output copied to clipboard");
    } catch {
      setStatus("Could not copy output");
    }
  }

  function clearSource() {
    if (direction === "legacy-to-unicode") {
      setLegacyText("");
    } else {
      setUnicodeText("");
    }
    setWarnings([]);
    setStatus("Source cleared");
  }

  async function openTextFile() {
    if (isTauriRuntime()) {
      try {
        const [{ open }, { readTextFile }] = await Promise.all([
          import("@tauri-apps/plugin-dialog"),
          import("@tauri-apps/plugin-fs"),
        ]);
        const selected = await open({
          multiple: false,
          directory: false,
          filters: [{ name: "Text", extensions: ["txt"] }],
        });
        if (typeof selected === "string") {
          const contents = await readTextFile(selected);
          if (direction === "legacy-to-unicode") {
            setLegacyText(contents);
          } else {
            setUnicodeText(contents);
          }
          setStatus("Text file opened");
        }
        return;
      } catch {
        setStatus("Native file dialog failed; use the browser picker");
      }
    }

    fileInputRef.current?.click();
  }

  async function saveOutput() {
    const output =
      direction === "legacy-to-unicode" ? unicodeText : legacyText;
    const defaultName =
      direction === "legacy-to-unicode" ? "unicode-output.txt" : "legacy-output.txt";

    if (isTauriRuntime()) {
      try {
        const [{ save }, { writeTextFile }] = await Promise.all([
          import("@tauri-apps/plugin-dialog"),
          import("@tauri-apps/plugin-fs"),
        ]);
        const selected = await save({
          defaultPath: defaultName,
          filters: [{ name: "Text", extensions: ["txt"] }],
        });
        if (selected) {
          await writeTextFile(selected, output);
          setStatus("Output file saved");
        }
        return;
      } catch {
        setStatus("Native save failed; browser download started");
      }
    }

    downloadInBrowser(output, defaultName);
  }

  function handleBrowserFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      if (direction === "legacy-to-unicode") {
        setLegacyText(value);
      } else {
        setUnicodeText(value);
      }
      setStatus(`${file.name} opened`);
    };
    reader.onerror = () => setStatus("Could not read the selected file");
    reader.readAsText(file);
  }

  return (
    <section className="converter-card" aria-labelledby="converter-title">
      <div className="converter-heading">
        <div>
          <h1 id="converter-title">Exchange Converter</h1>
          <p>KrutiDev and Unicode conversion</p>
        </div>
        <div className="converter-status-chip">
          <CheckCircle2 aria-hidden="true" />
          KrutiDev <ArrowLeftRight aria-hidden="true" /> Unicode
        </div>
      </div>

      <div className="converter-grid">
        <EditorPanel
          id="legacy-editor"
          tone="legacy"
          title="KrutiDev / Legacy"
          fontLabel="Kruti Dev 010"
          value={legacyText}
          count={characterCounts.legacy}
          isSource={direction === "legacy-to-unicode"}
          onChange={setLegacyText}
        />

        <div className="converter-middle">
          <button
            type="button"
            className="swap-button"
            onClick={swapDirection}
            aria-label="Change conversion direction"
            title="Change conversion direction"
          >
            <ArrowLeftRight aria-hidden="true" />
          </button>
          <span className="direction-line" aria-hidden="true" />
        </div>

        <EditorPanel
          id="unicode-editor"
          tone="unicode"
          title="Unicode"
          fontLabel="Noto Sans Devanagari"
          value={unicodeText}
          count={characterCounts.unicode}
          isSource={direction === "unicode-to-legacy"}
          onChange={setUnicodeText}
        />
      </div>

      <div className="converter-actions">
        <div className="action-group">
          <Button variant="outline" onClick={openTextFile}>
            <FolderOpen aria-hidden="true" /> Open File
          </Button>
          <Button variant="outline" onClick={pasteSource}>
            <Clipboard aria-hidden="true" /> Paste
          </Button>
          <Button variant="danger" onClick={clearSource}>
            <Trash2 aria-hidden="true" /> Clear
          </Button>
        </div>

        <Button className="convert-button" onClick={runConversion}>
          <ArrowLeftRight aria-hidden="true" /> Convert
        </Button>

        <div className="action-group action-group-right">
          <Button variant="success" onClick={copyOutput}>
            <Copy aria-hidden="true" /> Copy
          </Button>
          <Button variant="success" onClick={saveOutput}>
            <Download aria-hidden="true" /> Download
          </Button>
        </div>
      </div>

      <div className="converter-feedback" aria-live="polite">
        <FileText aria-hidden="true" />
        <span>{status}</span>
        {warnings.length > 0 && (
          <span className="warning-summary">
            {warnings.slice(0, 2).join(" • ")}
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,text/plain"
        hidden
        onChange={(event) => handleBrowserFile(event.target.files?.[0])}
      />
    </section>
  );
}

interface EditorPanelProps {
  readonly id: string;
  readonly tone: "legacy" | "unicode";
  readonly title: string;
  readonly fontLabel: string;
  readonly value: string;
  readonly count: number;
  readonly isSource: boolean;
  readonly onChange: (value: string) => void;
}

function EditorPanel({
  id,
  tone,
  title,
  fontLabel,
  value,
  count,
  isSource,
  onChange,
}: EditorPanelProps) {
  return (
    <div className={`editor-panel editor-panel-${tone}`}>
      <div className="editor-title-row">
        <h2>{title}</h2>
        {isSource && <span className="source-badge">Source</span>}
      </div>
      <label className="sr-only" htmlFor={`${id}-font`}>
        {title} font
      </label>
      <select id={`${id}-font`} defaultValue={fontLabel}>
        <option>{fontLabel}</option>
      </select>
      <label className="sr-only" htmlFor={id}>
        {title} text
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        className={tone === "unicode" ? "devanagari" : undefined}
      />
      <div className="editor-meta">
        <span>{count} characters</span>
        <span>{isSource ? "Editable source" : "Converted output"}</span>
      </div>
    </div>
  );
}
