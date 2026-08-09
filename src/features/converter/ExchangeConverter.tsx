import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  Clipboard,
  Cloud,
  CloudOff,
  Copy,
  Download,
  FileCode2,
  FileSpreadsheet,
  FileText,
  FileType2,
  FolderOpen,
  Globe2,
  Languages,
  LoaderCircle,
  SpellCheck2,
  Trash2,
} from "lucide-react";

import { saveProductivityExport, type ProductivityExportFormat } from "@/application/document-export";
import {
  TRANSLATION_LANGUAGES,
  translateText as translateLanguage,
  type TranslationLanguageId,
} from "@/application/translation-service";
import { convertText } from "@/application/use-cases/convert-text";
import { Button } from "@/components/ui/button";
import { UseAnywherePanel } from "@/components/UseAnywherePanel";
import { isSupabaseConfigured } from "@/data/supabase/client";
import type { ConversionDirection } from "@/domain/conversion/types";
import { typingSourceToUnicode } from "@/domain/typing/typing-engine";
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

type ConverterTool = "legacy" | "roman-hindi" | "translation";

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
  const [tool, setTool] = useState<ConverterTool>("roman-hindi");
  const [legacyText, setLegacyText] = useState(INITIAL_LEGACY);
  const [unicodeText, setUnicodeText] = useState(INITIAL_UNICODE);
  const [direction, setDirection] = useState<ConversionDirection>("legacy-to-unicode");
  const [legacyProfile, setLegacyProfile] = useState<LegacyEncodingId>("krutidev-010");
  const [unicodeFont, setUnicodeFont] = useState<UnicodeDisplayFontId>("noto-devanagari");
  const [romanText, setRomanText] = useState("mera naam bhasha yantra hai");
  const [translationSource, setTranslationSource] = useState("Good morning. Welcome to BhashaYantra.");
  const [translationOutput, setTranslationOutput] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState<TranslationLanguageId>("en");
  const [targetLanguage, setTargetLanguage] = useState<TranslationLanguageId>("hi");
  const [warnings, setWarnings] = useState<readonly string[]>([]);
  const [status, setStatus] = useState(() => t("converterReady"));
  const [exportingFormat, setExportingFormat] = useState<ProductivityExportFormat>();
  const [translating, setTranslating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeLegacyProfile = READY_LEGACY_ENCODING_PROFILES.find((profile) => profile.id === legacyProfile) ?? READY_LEGACY_ENCODING_PROFILES[0];
  const activeUnicodeFont = getDisplayFont(unicodeFont);
  const romanResult = useMemo(() => typingSourceToUnicode(romanText, "bhashayantra-smart"), [romanText]);
  const sourceText = tool === "legacy"
    ? direction === "legacy-to-unicode" ? legacyText : unicodeText
    : tool === "roman-hindi" ? romanText : translationSource;
  const outputText = tool === "legacy"
    ? direction === "legacy-to-unicode" ? unicodeText : legacyText
    : tool === "roman-hindi" ? romanResult.output : translationOutput;
  const characterCounts = useMemo(() => ({
    legacy: Array.from(legacyText).length,
    unicode: Array.from(unicodeText).length,
    roman: Array.from(romanText).length,
    romanOutput: Array.from(romanResult.output).length,
    translationSource: Array.from(translationSource).length,
    translationOutput: Array.from(translationOutput).length,
  }), [legacyText, romanResult.output, romanText, translationOutput, translationSource, unicodeText]);

  useEffect(() => {
    if (tool !== "legacy") return;
    const result = convertText({ input: sourceText, direction, profile: legacyProfile });
    if (direction === "legacy-to-unicode") {
      setUnicodeText((current) => current === result.output ? current : result.output);
    } else {
      setLegacyText((current) => current === result.output ? current : result.output);
    }
    setWarnings(result.warnings.map((warning) => warning.message));
    setStatus(t("converterLive"));
  }, [direction, legacyProfile, sourceText, t, tool]);

  useEffect(() => {
    if (tool !== "roman-hindi") return;
    setWarnings(romanResult.warnings.map((warning) => warning.message));
    setStatus(t("transliterationLive"));
  }, [romanResult, t, tool]);

  function chooseTool(nextTool: ConverterTool) {
    setTool(nextTool);
    setWarnings([]);
    setStatus(t(nextTool === "legacy" ? "converterReady" : nextTool === "roman-hindi" ? "transliterationLive" : "translationReady"));
  }

  function runLegacyConversion() {
    const result = convertText({ input: sourceText, direction, profile: legacyProfile });
    if (direction === "legacy-to-unicode") setUnicodeText(result.output);
    else setLegacyText(result.output);
    setWarnings(result.warnings.map((warning) => warning.message));
    setStatus(result.warnings.length > 0 ? t("convertedWithWarnings", { count: result.warnings.length }) : t("converterComplete"));
  }

  async function runTranslation() {
    if (translating) return;
    setTranslating(true);
    setStatus(t("translationWorking"));
    try {
      const result = await translateLanguage({ text: translationSource, sourceLanguage, targetLanguage });
      setTranslationOutput(result.translatedText);
      setStatus(t("translationComplete"));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t("translationFailed"));
    } finally {
      setTranslating(false);
    }
  }

  function swapDirection() {
    if (tool === "legacy") {
      setDirection((current) => current === "legacy-to-unicode" ? "unicode-to-legacy" : "legacy-to-unicode");
      setStatus(t("directionChanged"));
      return;
    }
    if (tool === "translation") {
      setSourceLanguage(targetLanguage);
      setTargetLanguage(sourceLanguage);
      if (translationOutput.trim()) {
        setTranslationSource(translationOutput);
        setTranslationOutput(translationSource);
      }
      setStatus(t("directionChanged"));
    }
  }

  function setActiveSource(value: string) {
    if (tool === "legacy") {
      if (direction === "legacy-to-unicode") setLegacyText(value);
      else setUnicodeText(value);
    } else if (tool === "roman-hindi") setRomanText(value);
    else setTranslationSource(value);
  }

  async function pasteSource() {
    try {
      setActiveSource(await navigator.clipboard.readText());
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
    setActiveSource("");
    if (tool === "translation") setTranslationOutput("");
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
        const selected = await open({ multiple: false, directory: false, filters: [{ name: "Text", extensions: ["txt"] }] });
        if (typeof selected === "string") {
          setActiveSource(await readTextFile(selected));
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
    const defaultName = tool === "translation" ? `translation-${targetLanguage}.txt` : tool === "roman-hindi" ? "roman-hindi-unicode.txt" : direction === "legacy-to-unicode" ? "unicode-output.txt" : "legacy-output.txt";
    if (isTauriRuntime()) {
      try {
        const [{ save }, { writeTextFile }] = await Promise.all([
          import("@tauri-apps/plugin-dialog"),
          import("@tauri-apps/plugin-fs"),
        ]);
        const selected = await save({ defaultPath: defaultName, filters: [{ name: "Text", extensions: ["txt"] }] });
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
    if (exportingFormat || !outputText) return;
    setExportingFormat(format);
    setStatus(t("exportingDocument"));
    try {
      const result = await saveProductivityExport({
        text: outputText,
        format,
        displayFont: tool === "legacy" && direction === "unicode-to-legacy" ? activeLegacyProfile.name : activeUnicodeFont.name,
        basename: `bhashayantra-${tool}`,
      });
      setStatus(result === "cancelled" ? t("exportCancelled") : t(format === "docx" ? "wordExported" : format === "xlsx" ? "excelExported" : "browserExported"));
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
      setActiveSource(typeof reader.result === "string" ? reader.result : "");
      setStatus(`${file.name} ${t("sourceOpened")}`);
    };
    reader.onerror = () => setStatus(t("fileReadError"));
    reader.readAsText(file);
  }

  const toolDefinitions = [
    { id: "legacy" as const, icon: FileCode2, title: t("legacyFontTool"), description: t("legacyFontToolDescription") },
    { id: "roman-hindi" as const, icon: SpellCheck2, title: t("romanHindiTool"), description: t("romanHindiToolDescription") },
    { id: "translation" as const, icon: Languages, title: t("languageTranslationTool"), description: t("languageTranslationToolDescription") },
  ];

  return (
    <section className="converter-card" aria-labelledby="converter-title">
      <div className="converter-heading">
        <div><h1 id="converter-title">{t("exchangeConverter")}</h1><p>{t(tool === "legacy" ? "converterSubtitle" : tool === "roman-hindi" ? "romanConverterSubtitle" : "translationSubtitle")}</p></div>
        <div className={`converter-status-chip${tool === "translation" && !isSupabaseConfigured ? " pending" : ""}`}>
          {tool === "translation" && !isSupabaseConfigured ? <CloudOff aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
          {tool === "legacy" ? <>{activeLegacyProfile.name} <ArrowLeftRight aria-hidden="true" /> Unicode</> : tool === "roman-hindi" ? <>Roman <ArrowRight aria-hidden="true" /> हिन्दी</> : t(isSupabaseConfigured ? "translationOnline" : "translationSetupRequired")}
        </div>
      </div>

      <div className="converter-tool-tabs" role="tablist" aria-label={t("converterTools")}>
        {toolDefinitions.map(({ id, icon: Icon, title, description }) => (
          <button type="button" role="tab" aria-selected={tool === id} className={tool === id ? "active" : ""} key={id} onClick={() => chooseTool(id)}>
            <Icon aria-hidden="true" /><span><strong>{title}</strong><small>{description}</small></span>
          </button>
        ))}
      </div>

      {tool === "translation" && !isSupabaseConfigured && (
        <div className="translation-setup-notice" role="status">
          <CloudOff aria-hidden="true" /><div><strong>{t("translationSetupTitle")}</strong><p>{t("translationSetupDescription")}</p></div>
        </div>
      )}

      <div className="converter-grid">
        {tool === "legacy" ? (
          <EditorPanel id="legacy-editor" tone="legacy" title={t("legacySource")} selectedOption={legacyProfile} options={READY_LEGACY_ENCODING_PROFILES.map((profile) => ({ id: profile.id, label: profile.name }))} onOptionChange={(value) => setLegacyProfile(value as LegacyEncodingId)} value={legacyText} count={characterCounts.legacy} isSource={direction === "legacy-to-unicode"} onChange={setLegacyText} />
        ) : tool === "roman-hindi" ? (
          <EditorPanel id="roman-editor" tone="roman" title={t("romanHindiSource")} selectedOption="bhashayantra-smart" options={[{ id: "bhashayantra-smart", label: "BhashaYantra Smart — Roman Hindi" }]} onOptionChange={() => undefined} value={romanText} count={characterCounts.roman} isSource onChange={setRomanText} placeholder="mera naam bhasha yantra hai" />
        ) : (
          <EditorPanel id="translation-source" tone="language" title={t("sourceLanguage")} selectedOption={sourceLanguage} options={TRANSLATION_LANGUAGES.map((language) => ({ id: language.id, label: language.name }))} onOptionChange={(value) => setSourceLanguage(value as TranslationLanguageId)} value={translationSource} count={characterCounts.translationSource} isSource onChange={setTranslationSource} placeholder={t("translationSourcePlaceholder")} />
        )}

        <div className="converter-middle">
          <button type="button" className="swap-button" onClick={swapDirection} disabled={tool === "roman-hindi"} aria-label={t("directionChanged")} title={tool === "roman-hindi" ? t("romanDirectionFixed") : t("directionChanged")}>
            {tool === "roman-hindi" ? <ArrowRight aria-hidden="true" /> : <ArrowLeftRight aria-hidden="true" />}
          </button>
          <span className="direction-line" aria-hidden="true" />
        </div>

        {tool === "legacy" ? (
          <EditorPanel id="unicode-editor" tone="unicode" title={t("unicode")} selectedOption={unicodeFont} options={UNICODE_DISPLAY_FONTS.filter((font) => font.language === "hi").map((font) => ({ id: font.id, label: font.name }))} onOptionChange={(value) => setUnicodeFont(value as UnicodeDisplayFontId)} fontFamily={activeUnicodeFont.cssStack} value={unicodeText} count={characterCounts.unicode} isSource={direction === "unicode-to-legacy"} onChange={setUnicodeText} />
        ) : tool === "roman-hindi" ? (
          <EditorPanel id="roman-output" tone="unicode" title={t("hindiUnicode")} selectedOption={unicodeFont} options={UNICODE_DISPLAY_FONTS.filter((font) => font.language === "hi").map((font) => ({ id: font.id, label: font.name }))} onOptionChange={(value) => setUnicodeFont(value as UnicodeDisplayFontId)} fontFamily={activeUnicodeFont.cssStack} value={romanResult.output} count={characterCounts.romanOutput} isSource={false} onChange={() => undefined} readOnly />
        ) : (
          <EditorPanel id="translation-output" tone="unicode" title={t("targetLanguage")} selectedOption={targetLanguage} options={TRANSLATION_LANGUAGES.map((language) => ({ id: language.id, label: language.name }))} onOptionChange={(value) => setTargetLanguage(value as TranslationLanguageId)} fontFamily={targetLanguage === "en" ? undefined : activeUnicodeFont.cssStack} value={translationOutput} count={characterCounts.translationOutput} isSource={false} onChange={() => undefined} readOnly placeholder={t("translationOutputPlaceholder")} />
        )}
      </div>

      <div className="converter-actions">
        <div className="action-group">
          <Button variant="outline" onClick={openTextFile}><FolderOpen aria-hidden="true" /> {t("openFile")}</Button>
          <Button variant="outline" onClick={pasteSource}><Clipboard aria-hidden="true" /> {t("paste")}</Button>
          <Button variant="danger" onClick={clearSource}><Trash2 aria-hidden="true" /> {t("clear")}</Button>
        </div>

        <Button className="convert-button" onClick={tool === "translation" ? runTranslation : tool === "legacy" ? runLegacyConversion : () => setStatus(t("transliterationLive"))} disabled={!sourceText.trim() || translating || (tool === "translation" && !isSupabaseConfigured)}>
          {translating ? <LoaderCircle className="spin" aria-hidden="true" /> : tool === "translation" ? <Languages aria-hidden="true" /> : <ArrowLeftRight aria-hidden="true" />}
          {t(tool === "translation" ? "translate" : tool === "roman-hindi" ? "transliterate" : "convert")}
        </Button>

        <div className="action-group action-group-right">
          <Button variant="success" onClick={copyOutput} disabled={!outputText}><Copy aria-hidden="true" /> {t("copy")}</Button>
          <Button variant="outline" onClick={() => exportDocument("docx")} disabled={!outputText || Boolean(exportingFormat)}>{exportingFormat === "docx" ? <LoaderCircle className="spin" aria-hidden="true" /> : <FileType2 aria-hidden="true" />} {t("saveWord")}</Button>
          <Button variant="outline" onClick={() => exportDocument("xlsx")} disabled={!outputText || Boolean(exportingFormat)}>{exportingFormat === "xlsx" ? <LoaderCircle className="spin" aria-hidden="true" /> : <FileSpreadsheet aria-hidden="true" />} {t("saveExcel")}</Button>
          <Button variant="outline" onClick={() => exportDocument("html")} disabled={!outputText || Boolean(exportingFormat)}>{exportingFormat === "html" ? <LoaderCircle className="spin" aria-hidden="true" /> : <Globe2 aria-hidden="true" />} {t("saveBrowser")}</Button>
          <Button variant="success" onClick={saveOutput} disabled={!outputText || Boolean(exportingFormat)}><Download aria-hidden="true" /> {t("download")}</Button>
        </div>
      </div>

      <div className="converter-feedback" aria-live="polite">
        {tool === "translation" ? <Cloud aria-hidden="true" /> : <FileText aria-hidden="true" />}<span>{status}</span>
        {warnings.length > 0 && <span className="warning-summary">{warnings.slice(0, 2).join(" • ")}</span>}
      </div>

      <UseAnywherePanel text={outputText} />

      {tool === "legacy" && (
        <div className="converter-profile-coverage" aria-label={t("profileCoverage")}>
          <strong>{t("profileCoverage")}</strong>
          {LEGACY_ENCODING_PROFILES.map((profile) => (
            <span key={profile.id} className={profile.readiness === "ready" ? "ready" : "planned"}>{profile.name}<small>{profile.coverage === "bidirectional" ? t("readyBidirectional") : profile.coverage === "variant-required" ? t("shreeLipiVariantNote") : t("devlysValidationNote")}</small></span>
          ))}
        </div>
      )}

      {tool === "translation" && (
        <div className="translation-provider-note"><Languages aria-hidden="true" /><span><strong>{t("supportedLanguages")}</strong> English, Hindi, Marathi, Punjabi, Bengali, Gujarati</span><small>{t("translationProvider")}</small></div>
      )}

      <input ref={fileInputRef} type="file" accept=".txt,text/plain" hidden onChange={(event) => handleBrowserFile(event.target.files?.[0])} />
    </section>
  );
}

interface EditorPanelProps {
  readonly id: string;
  readonly tone: "legacy" | "unicode" | "roman" | "language";
  readonly title: string;
  readonly selectedOption: string;
  readonly options: readonly { readonly id: string; readonly label: string; readonly disabled?: boolean }[];
  readonly onOptionChange: (value: string) => void;
  readonly fontFamily?: string;
  readonly value: string;
  readonly count: number;
  readonly isSource: boolean;
  readonly onChange: (value: string) => void;
  readonly readOnly?: boolean;
  readonly placeholder?: string;
}

function EditorPanel({ id, tone, title, selectedOption, options, onOptionChange, fontFamily, value, count, isSource, onChange, readOnly = false, placeholder }: EditorPanelProps) {
  const { t } = useI18n();
  return (
    <div className={`editor-panel editor-panel-${tone}`}>
      <div className="editor-title-row"><h2>{title}</h2>{isSource && <span className="source-badge">{t("source")}</span>}</div>
      <label className="sr-only" htmlFor={`${id}-font`}>{title}</label>
      <select id={`${id}-font`} value={selectedOption} onChange={(event) => onOptionChange(event.target.value)}>
        {options.map((option) => <option key={option.id} value={option.id} disabled={option.disabled}>{option.label}{option.disabled ? ` — ${t("validationPending")}` : ""}</option>)}
      </select>
      <label className="sr-only" htmlFor={id}>{title} text</label>
      <textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} readOnly={readOnly} placeholder={placeholder} spellCheck={false} className={tone === "unicode" ? "devanagari" : undefined} style={fontFamily ? { fontFamily } : undefined} />
      <div className="editor-meta"><span>{count} {t("characters")}</span><span>{isSource ? t("editableSource") : t("convertedOutput")}</span></div>
    </div>
  );
}
