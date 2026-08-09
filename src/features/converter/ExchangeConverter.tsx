import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  CheckCircle2,
  Clipboard,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  FileType2,
  FolderOpen,
  Globe2,
  LoaderCircle,
  Trash2,
} from "lucide-react";

import {
  saveProductivityExport,
  type ProductivityExportFormat,
} from "@/application/document-export";
import { convertText } from "@/application/use-cases/convert-text";
import { Button } from "@/components/ui/button";
import type { ConversionDirection } from "@/domain/conversion/types";
import {
  getDisplayFont,
  LEGACY_ENCODING_PROFILES,
  READY_LEGACY_ENCODING_PROFILES,
  UNICODE_DISPLAY_FONTS,
  type LegacyEncodingId,
  type UnicodeDisplayFontId,
} from "@/domain/typing/typing-profiles";
import { useI18n } from "@/i18n/I18nProvider";

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
  const { t } = useI18n();
  const [legacyText, setLegacyText] = useState(INITIAL_LEGACY);
  const [unicodeText, setUnicodeText] = useState(INITIAL_UNICODE);
  const [direction, setDirection] =
    useState<ConversionDirection>("legacy-to-unicode");
  const [legacyProfile, setLegacyProfile] = useState<LegacyEncodingId>("krutidev-010");
  const [unicodeFont, setUnicodeFont] = useState<UnicodeDisplayFontId>("noto-devanagari");
  const [warnings, setWarnings] = useState<readonly string[]>([]);
  const [status, setStatus] = useState(() => t("converterReady"));
  const [exportingFormat, setExportingFormat] = useState<ProductivityExportFormat>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sourceText =
    direction === "legacy-to-unicode" ? legacyText : unicodeText;
  const outputText =
    direction === "legacy-to-unicode" ? unicodeText : legacyText;
  const activeLegacyProfile = READY_LEGACY_ENCODING_PROFILES.find((profile) => profile.id === legacyProfile) ?? READY_LEGACY_ENCODING_PROFILES[0];
  const activeUnicodeFont = getDisplayFont(unicodeFont);

  const characterCounts = useMemo(
    () => ({
      legacy: Array.from(legacyText).length,
      unicode: Array.from(unicodeText).length,
    }),
    [legacyText, unicodeText],
  );

  useEffect(() => {
    const result = convertText({ input: sourceText, direction, profile: legacyProfile });
    if (direction === "legacy-to-unicode") {
      setUnicodeText((current) => current === result.output ? current : result.output);
    } else {
      setLegacyText((current) => current === result.output ? current : result.output);
    }
    setWarnings(result.warnings.map((warning) => warning.message));
    setStatus(t("converterLive"));
  }, [direction, legacyProfile, sourceText, t]);

  function runConversion() {
    const result = convertText({ input: sourceText, direction, profile: legacyProfile });

    if (direction === "legacy-to-unicode") {
      setUnicodeText(result.output);
    } else {
      setLegacyText(result.output);
    }

    setWarnings(result.warnings.map((warning) => warning.message));
    setStatus(
      result.warnings.length > 0
        ? t("convertedWithWarnings", { count: result.warnings.length })
        : t("converterComplete"),
    );
  }

  function swapDirection() {
    setDirection((current) =>
      current === "legacy-to-unicode"
        ? "unicode-to-legacy"
        : "legacy-to-unicode",
    );
    setWarnings([]);
    setStatus(t("directionChanged"));
  }

  async function pasteSource() {
    try {
      const text = await navigator.clipboard.readText();
      if (direction === "legacy-to-unicode") {
        setLegacyText(text);
      } else {
        setUnicodeText(text);
      }
      setStatus(t("clipboardPasted"));
    } catch {
      setStatus(t("clipboardUnavailable"));
    }
  }

  async function copyOutput() {
    try {
      await navigator.clipboard.writeText(outputText);
      setStatus(t("outputCopied"));
    } catch {
      setStatus(t("outputCopyFailed"));
    }
  }

  function clearSource() {
    if (direction === "legacy-to-unicode") {
      setLegacyText("");
    } else {
      setUnicodeText("");
    }
    setWarnings([]);
    setStatus(t("sourceCleared"));
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
          setStatus(t("textFileOpened"));
        }
        return;
      } catch {
        setStatus(t("nativeFileFallback"));
      }
    }

    fileInputRef.current?.click();
  }

  async function saveOutput() {
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
          await writeTextFile(selected, outputText);
          setStatus(t("outputFileSaved"));
        }
        return;
      } catch {
        setStatus(t("nativeSaveFallback"));
      }
    }

    downloadInBrowser(outputText, defaultName);
  }

  async function exportDocument(format: Exclude<ProductivityExportFormat, "txt">) {
    if (exportingFormat) return;
    if (!outputText) return;
    setExportingFormat(format);
    setStatus(t("exportingDocument"));
    try {
      const result = await saveProductivityExport({
        text: outputText,
        format,
        displayFont: direction === "legacy-to-unicode" ? activeUnicodeFont.name : activeLegacyProfile.name,
        basename: direction === "legacy-to-unicode" ? "bhashayantra-unicode" : "bhashayantra-legacy",
      });
      if (result !== "cancelled") {
        setStatus(t(format === "docx" ? "wordExported" : format === "xlsx" ? "excelExported" : "browserExported"));
      } else {
        setStatus(t("exportCancelled"));
      }
    } catch {
      setStatus(t("exportFailed"));
    } finally {
      setExportingFormat(undefined);
    }
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
      setStatus(`${file.name} ${t("sourceOpened")}`);
    };
    reader.onerror = () => setStatus(t("fileReadError"));
    reader.readAsText(file);
  }

  return (
    <section className="converter-card" aria-labelledby="converter-title">
      <div className="converter-heading">
        <div>
          <h1 id="converter-title">{t("exchangeConverter")}</h1>
          <p>{t("converterSubtitle")}</p>
        </div>
        <div className="converter-status-chip">
          <CheckCircle2 aria-hidden="true" />
          {activeLegacyProfile.name} <ArrowLeftRight aria-hidden="true" /> Unicode
        </div>
      </div>

      <div className="converter-grid">
        <EditorPanel
          id="legacy-editor"
          tone="legacy"
          title={t("legacySource")}
          selectedOption={legacyProfile}
          options={READY_LEGACY_ENCODING_PROFILES.map((profile) => ({
            id: profile.id,
            label: profile.name,
          }))}
          onOptionChange={(value) => setLegacyProfile(value as LegacyEncodingId)}
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
            aria-label={t("directionChanged")}
            title={t("directionChanged")}
          >
            <ArrowLeftRight aria-hidden="true" />
          </button>
          <span className="direction-line" aria-hidden="true" />
        </div>

        <EditorPanel
          id="unicode-editor"
          tone="unicode"
          title={t("unicode")}
          selectedOption={unicodeFont}
          options={UNICODE_DISPLAY_FONTS.filter((font) => font.language === "hi").map((font) => ({
            id: font.id,
            label: font.name,
          }))}
          onOptionChange={(value) => setUnicodeFont(value as UnicodeDisplayFontId)}
          fontFamily={activeUnicodeFont.cssStack}
          value={unicodeText}
          count={characterCounts.unicode}
          isSource={direction === "unicode-to-legacy"}
          onChange={setUnicodeText}
        />
      </div>

      <div className="converter-actions">
        <div className="action-group">
          <Button variant="outline" onClick={openTextFile}>
            <FolderOpen aria-hidden="true" /> {t("openFile")}
          </Button>
          <Button variant="outline" onClick={pasteSource}>
            <Clipboard aria-hidden="true" /> {t("paste")}
          </Button>
          <Button variant="danger" onClick={clearSource}>
            <Trash2 aria-hidden="true" /> {t("clear")}
          </Button>
        </div>

        <Button className="convert-button" onClick={runConversion}>
          <ArrowLeftRight aria-hidden="true" /> {t("convert")}
        </Button>

        <div className="action-group action-group-right">
          <Button variant="success" onClick={copyOutput} disabled={!outputText}>
            <Copy aria-hidden="true" /> {t("copy")}
          </Button>
          <Button variant="outline" onClick={() => exportDocument("docx")} disabled={!outputText || Boolean(exportingFormat)}>
            {exportingFormat === "docx" ? <LoaderCircle className="spin" aria-hidden="true" /> : <FileType2 aria-hidden="true" />} {t("saveWord")}
          </Button>
          <Button variant="outline" onClick={() => exportDocument("xlsx")} disabled={!outputText || Boolean(exportingFormat)}>
            {exportingFormat === "xlsx" ? <LoaderCircle className="spin" aria-hidden="true" /> : <FileSpreadsheet aria-hidden="true" />} {t("saveExcel")}
          </Button>
          <Button variant="outline" onClick={() => exportDocument("html")} disabled={!outputText || Boolean(exportingFormat)}>
            {exportingFormat === "html" ? <LoaderCircle className="spin" aria-hidden="true" /> : <Globe2 aria-hidden="true" />} {t("saveBrowser")}
          </Button>
          <Button variant="success" onClick={saveOutput} disabled={!outputText || Boolean(exportingFormat)}>
            <Download aria-hidden="true" /> {t("download")}
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

      <div className="converter-profile-coverage" aria-label={t("profileCoverage")}>
        <strong>{t("profileCoverage")}</strong>
        {LEGACY_ENCODING_PROFILES.map((profile) => (
          <span key={profile.id} className={profile.readiness === "ready" ? "ready" : "planned"}>
            {profile.name}
            <small>{profile.coverage === "bidirectional" ? t("readyBidirectional") : profile.coverage === "variant-required" ? t("shreeLipiVariantNote") : t("devlysValidationNote")}</small>
          </span>
        ))}
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
  readonly selectedOption: string;
  readonly options: readonly { readonly id: string; readonly label: string; readonly disabled?: boolean }[];
  readonly onOptionChange: (value: string) => void;
  readonly fontFamily?: string;
  readonly value: string;
  readonly count: number;
  readonly isSource: boolean;
  readonly onChange: (value: string) => void;
}

function EditorPanel({
  id,
  tone,
  title,
  selectedOption,
  options,
  onOptionChange,
  fontFamily,
  value,
  count,
  isSource,
  onChange,
}: EditorPanelProps) {
  const { t } = useI18n();
  return (
    <div className={`editor-panel editor-panel-${tone}`}>
      <div className="editor-title-row">
        <h2>{title}</h2>
        {isSource && <span className="source-badge">{t("source")}</span>}
      </div>
      <label className="sr-only" htmlFor={`${id}-font`}>
        {title} font
      </label>
      <select id={`${id}-font`} value={selectedOption} onChange={(event) => onOptionChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.id} value={option.id} disabled={option.disabled}>
            {option.label}{option.disabled ? ` — ${t("validationPending")}` : ""}
          </option>
        ))}
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
        style={fontFamily ? { fontFamily } : undefined}
      />
      <div className="editor-meta">
        <span>{count} {t("characters")}</span>
        <span>{isSource ? t("editableSource") : t("convertedOutput")}</span>
      </div>
    </div>
  );
}
