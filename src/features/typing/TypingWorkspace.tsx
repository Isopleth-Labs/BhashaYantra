import {
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CheckCircle2,
  Copy,
  Download,
  FileJson,
  FolderOpen,
  Keyboard,
  RotateCcw,
  Save,
  Settings2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CLASSIC_HINDI_KEYBOARD,
  findMatchingShortcut,
  formatShortcut,
  getTypingMetrics,
  hasKeyMappingConflict,
  hasShortcutConflict,
  insertAtSelection,
  typingKeysToUnicode,
  unicodeToTypingKeys,
  type CustomKeyMapping,
  type ShortcutDefinition,
  type TypingMode,
  type TypingOutputMode,
} from "@/domain/typing/typing-engine";
import { useI18n } from "@/i18n/I18nProvider";

const SUGGESTIONS = ["नमस्ते", "भारत", "हिंदी", "भाषा", "धन्यवाद"] as const;

interface TypingWorkspaceProps {
  readonly mode: TypingMode;
  readonly outputMode: TypingOutputMode;
  readonly source: string;
  readonly onSourceChange: (value: string) => void;
  readonly shortcuts: readonly ShortcutDefinition[];
  readonly customShortcuts: readonly ShortcutDefinition[];
  readonly onCustomShortcutsChange: (shortcuts: readonly ShortcutDefinition[]) => void;
  readonly customMappings: readonly CustomKeyMapping[];
  readonly onCustomMappingsChange: (mappings: readonly CustomKeyMapping[]) => void;
  readonly advancedOpen: boolean;
  readonly onAdvancedOpenChange: (open: boolean) => void;
}

function isTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

function downloadText(contents: string, filename: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function TypingWorkspace({
  mode,
  outputMode,
  source,
  onSourceChange,
  shortcuts,
  customShortcuts,
  onCustomShortcutsChange,
  customMappings,
  onCustomMappingsChange,
  advancedOpen,
  onAdvancedOpenChange,
}: TypingWorkspaceProps) {
  const { t } = useI18n();
  const sourceRef = useRef<HTMLTextAreaElement>(null);
  const sourceFileRef = useRef<HTMLInputElement>(null);
  const configFileRef = useRef<HTMLInputElement>(null);
  const [shifted, setShifted] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(true);
  const [status, setStatus] = useState(() => t("readyTyping"));
  const [startedAt, setStartedAt] = useState<number>();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [shortcutKey, setShortcutKey] = useState("");
  const [shortcutOutput, setShortcutOutput] = useState("");
  const [shortcutCtrl, setShortcutCtrl] = useState(true);
  const [shortcutAlt, setShortcutAlt] = useState(true);
  const [shortcutShift, setShortcutShift] = useState(false);
  const [mappingKey, setMappingKey] = useState("");
  const [mappingOutput, setMappingOutput] = useState("");
  const [configurationError, setConfigurationError] = useState("");

  const unicodeResult = useMemo(() => typingKeysToUnicode(source), [source]);
  const displayedOutput = outputMode === "unicode" ? unicodeResult.output : source;
  const metrics = useMemo(() => getTypingMetrics(unicodeResult.output), [unicodeResult.output]);
  const estimatedWpm = useMemo(() => {
    if (!startedAt || elapsedSeconds < 2) return 0;
    return Math.round((metrics.characters / 5 / elapsedSeconds) * 60);
  }, [elapsedSeconds, metrics.characters, startedAt]);

  useEffect(() => {
    if (!startedAt) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  function updateSource(value: string) {
    if (!startedAt && value.length > 0) setStartedAt(Date.now());
    if (value.length === 0) {
      setStartedAt(undefined);
      setElapsedSeconds(0);
    }
    onSourceChange(value);
    setStatus(t("draftSaved"));
  }

  function placeCaret(caret: number) {
    window.requestAnimationFrame(() => {
      sourceRef.current?.focus();
      sourceRef.current?.setSelectionRange(caret, caret);
    });
  }

  function insertTypingKeys(keys: string) {
    const editor = sourceRef.current;
    const start = editor?.selectionStart ?? source.length;
    const end = editor?.selectionEnd ?? start;
    const result = insertAtSelection(source, keys, start, end);
    updateSource(result.value);
    placeCaret(result.caret);
  }

  function insertUnicode(unicode: string) {
    const converted = unicodeToTypingKeys(unicode);
    insertTypingKeys(converted.output);
    setStatus(converted.warnings.length ? t("insertedWithWarning") : `${unicode} ${t("inserted")}`);
  }

  function handleTypingKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    const shortcut = findMatchingShortcut(event.nativeEvent, shortcuts);
    if (shortcut) {
      event.preventDefault();
      insertUnicode(shortcut.character);
      setStatus(`${formatShortcut(shortcut)} → ${shortcut.character}`);
      return;
    }

    if (mode !== "advanced" || event.ctrlKey || event.altKey || event.metaKey || event.key.length !== 1) {
      return;
    }

    const mapping = customMappings.find(
      (item) => item.key.toLocaleLowerCase() === event.key.toLocaleLowerCase(),
    );
    if (mapping) {
      event.preventDefault();
      insertUnicode(mapping.output);
      setStatus(`${event.key} → ${mapping.output}`);
    }
  }

  async function copyOutput() {
    try {
      await navigator.clipboard.writeText(displayedOutput);
      setStatus(t("outputCopied"));
    } catch {
      setStatus(t("clipboardUnavailable"));
    }
  }

  async function saveOutput() {
    const filename = outputMode === "unicode" ? "bhashayantra-unicode.txt" : "bhashayantra-legacy.txt";
    if (isTauriRuntime()) {
      try {
        const [{ save }, { writeTextFile }] = await Promise.all([
          import("@tauri-apps/plugin-dialog"),
          import("@tauri-apps/plugin-fs"),
        ]);
        const selected = await save({
          defaultPath: filename,
          filters: [{ name: "Text", extensions: ["txt"] }],
        });
        if (selected) {
          await writeTextFile(selected, displayedOutput);
          setStatus(t("outputSaved"));
        }
        return;
      } catch {
        setStatus(t("nativeSaveFallback"));
      }
    }
    downloadText(displayedOutput, filename);
  }

  function handleSourceFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateSource(typeof reader.result === "string" ? reader.result : "");
      setStatus(`${file.name} ${t("sourceOpened")}`);
    };
    reader.onerror = () => setStatus(t("fileReadError"));
    reader.readAsText(file);
  }

  function addShortcut() {
    setConfigurationError("");
    const key = shortcutKey.trim().slice(0, 1);
    const character = shortcutOutput.trim();
    if (!key || !character) {
      setConfigurationError(t("shortcutFieldsRequired"));
      return;
    }
    if (!shortcutCtrl && !shortcutAlt) {
      setConfigurationError(t("shortcutModifierRequired"));
      return;
    }
    const candidate = { key, ctrl: shortcutCtrl, alt: shortcutAlt, shift: shortcutShift };
    if (hasShortcutConflict(candidate, shortcuts)) {
      setConfigurationError(t("shortcutConflict"));
      return;
    }
    const next: ShortcutDefinition = {
      id: crypto.randomUUID(),
      character,
      builtIn: false,
      ...candidate,
    };
    onCustomShortcutsChange([...customShortcuts, next]);
    setShortcutKey("");
    setShortcutOutput("");
    setStatus(`${formatShortcut(next)} saved`);
  }

  function addMapping() {
    setConfigurationError("");
    const key = mappingKey.trim().slice(0, 1);
    const output = mappingOutput.trim();
    if (!key || !output) {
      setConfigurationError(t("mappingFieldsRequired"));
      return;
    }
    if (hasKeyMappingConflict(key, customMappings)) {
      setConfigurationError(t("mappingConflict"));
      return;
    }
    onCustomMappingsChange([
      ...customMappings,
      { id: crypto.randomUUID(), key, output },
    ]);
    setMappingKey("");
    setMappingOutput("");
    setStatus(`${key.toLocaleUpperCase()} custom mapping saved`);
  }

  function exportConfiguration() {
    downloadText(
      JSON.stringify(
        {
          schemaVersion: 1,
          profile: "Classic Hindi Custom",
          shortcuts: customShortcuts,
          mappings: customMappings,
        },
        null,
        2,
      ),
      "bhashayantra-classic-hindi-layout.json",
      "application/json;charset=utf-8",
    );
    setStatus(t("layoutExported"));
  }

  function importConfiguration(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as {
          schemaVersion?: unknown;
          shortcuts?: unknown;
          mappings?: unknown;
        };
        if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.shortcuts) || !Array.isArray(parsed.mappings)) {
          throw new Error("Invalid layout file");
        }
        const validShortcuts = parsed.shortcuts.filter(isShortcutDefinition).map((item) => ({ ...item, builtIn: false }));
        const validMappings = parsed.mappings.filter(isCustomKeyMapping);
        if (validShortcuts.length !== parsed.shortcuts.length || validMappings.length !== parsed.mappings.length) {
          throw new Error("Invalid mapping entry");
        }
        const signatures = new Set<string>();
        for (const shortcut of [...shortcuts.filter((item) => item.builtIn), ...validShortcuts]) {
          const signature = `${shortcut.ctrl}:${shortcut.alt}:${shortcut.shift}:${shortcut.key.toLocaleLowerCase()}`;
          if (signatures.has(signature)) throw new Error("Conflicting shortcuts");
          signatures.add(signature);
        }
        const mappingKeys = new Set<string>();
        for (const mapping of validMappings) {
          const key = mapping.key.toLocaleLowerCase();
          if (mappingKeys.has(key)) throw new Error("Conflicting mappings");
          mappingKeys.add(key);
        }
        onCustomShortcutsChange(validShortcuts);
        onCustomMappingsChange(validMappings);
        setConfigurationError("");
        setStatus(`${file.name} — ${t("layoutImported")}`);
      } catch {
        setConfigurationError(t("invalidLayout"));
      }
    };
    reader.readAsText(file);
  }

  function resetConfiguration() {
    onCustomShortcutsChange([]);
    onCustomMappingsChange([]);
    setConfigurationError("");
    setStatus(t("layoutReset"));
  }

  return (
    <section className="typing-card" aria-labelledby="typing-workspace-title">
      <div className="typing-heading">
        <div>
          <h1 id="typing-workspace-title">{t("startTyping")}</h1>
          <p>{t("typingIntro")}</p>
        </div>
        <div className="typing-status-chip">
          <CheckCircle2 aria-hidden="true" />
          {mode === "simple" ? t("smartCompositionOn") : t("advancedMappingsOn")}
        </div>
      </div>

      <div className="typing-editor-grid">
        <div className="typing-editor-panel typing-source-panel">
          <div className="typing-panel-heading">
            <span>
              <Keyboard aria-hidden="true" />
              <strong>{t("familiarKeys")}</strong>
            </span>
            <small>{t("krutidevInput")}</small>
          </div>
          <textarea
            ref={sourceRef}
            id="typing-source"
            value={source}
            onChange={(event) => updateSource(event.target.value)}
            onKeyDown={handleTypingKeyDown}
            placeholder={t("typingPlaceholder")}
            spellCheck={false}
            autoFocus
          />
          <div className="typing-panel-meta">
            <span>{Array.from(source).length} {t("keys")}</span>
            <span>{t("autosavedOffline")}</span>
          </div>
        </div>

        <div className="typing-editor-panel typing-output-panel">
          <div className="typing-panel-heading">
            <span>
              <Sparkles aria-hidden="true" />
              <strong>{outputMode === "unicode" ? t("unicodeOutput") : t("legacyOutput")}</strong>
            </span>
            <small>{t("livePreview")}</small>
          </div>
          <textarea
            id="typing-output"
            className={outputMode === "unicode" ? "devanagari" : undefined}
            value={displayedOutput}
            readOnly
            aria-label={`${outputMode} typing output`}
            placeholder={t("outputPlaceholder")}
          />
          <div className="typing-panel-meta">
            <span>{metrics.characters} {t("characters")}</span>
            <span>{unicodeResult.warnings.length ? `${unicodeResult.warnings.length} ${t("mappingWarnings")}` : t("unicodeNormalized")}</span>
          </div>
        </div>
      </div>

      <div className="typing-metrics" aria-label="Live typing metrics">
        <TypingMetric label={t("words")} value={metrics.words} />
        <TypingMetric label={t("characters")} value={metrics.characters} />
        <TypingMetric label={t("lines")} value={metrics.lines} />
        <TypingMetric label={t("liveWpm")} value={estimatedWpm} />
        <span className="typing-live-status" aria-live="polite">{status}</span>
      </div>

      <div className="typing-actions">
        <div className="action-group">
          <Button variant="outline" onClick={() => sourceFileRef.current?.click()}>
            <FolderOpen aria-hidden="true" /> {t("openText")}
          </Button>
          <Button variant="outline" onClick={() => setKeyboardVisible((current) => !current)}>
            <Keyboard aria-hidden="true" /> {keyboardVisible ? t("hideKeyboard") : t("showKeyboard")}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              updateSource("");
              setStatus(t("typingCleared"));
              sourceRef.current?.focus();
            }}
            disabled={!source}
          >
            <Trash2 aria-hidden="true" /> {t("clear")}
          </Button>
        </div>
        <div className="action-group action-group-right">
          <Button variant="success" onClick={copyOutput} disabled={!displayedOutput}>
            <Copy aria-hidden="true" /> {t("copyOutput")}
          </Button>
          <Button variant="success" onClick={saveOutput} disabled={!displayedOutput}>
            <Download aria-hidden="true" /> {t("saveText")}
          </Button>
        </div>
      </div>

      {mode === "simple" && (
        <div className="typing-suggestions" aria-label="Hindi word suggestions">
          <span>{t("quickWords")}</span>
          {SUGGESTIONS.map((suggestion) => (
            <button type="button" key={suggestion} onClick={() => insertUnicode(`${source && !source.endsWith(" ") ? " " : ""}${suggestion}`)}>
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {keyboardVisible && (
        <div className="virtual-keyboard" aria-label="Classic Hindi on-screen keyboard">
          <div className="virtual-keyboard-toolbar">
            <span><Keyboard aria-hidden="true" /> {t("classicKeyboard")}</span>
            <button
              type="button"
              className={shifted ? "shift-toggle active" : "shift-toggle"}
              onClick={() => setShifted((current) => !current)}
              aria-pressed={shifted}
            >
              {t("shift")} {shifted ? t("on") : t("off")}
            </button>
          </div>
          {CLASSIC_HINDI_KEYBOARD.map((row, rowIndex) => (
            <div className="virtual-keyboard-row" key={`keyboard-row-${rowIndex}`}>
              {row.map((keyDefinition) => {
                const key = shifted && keyDefinition.shiftKey ? keyDefinition.shiftKey : keyDefinition.key;
                const label = shifted && keyDefinition.shiftLabel ? keyDefinition.shiftLabel : keyDefinition.label;
                return (
                  <button
                    type="button"
                    className={keyDefinition.width ? `keyboard-key ${keyDefinition.width}` : "keyboard-key"}
                    key={`${keyDefinition.key}-${keyDefinition.shiftKey ?? ""}`}
                    onClick={() => {
                      insertTypingKeys(key);
                      if (shifted) setShifted(false);
                    }}
                    title={`Type ${key === " " ? "space" : key}`}
                  >
                    <strong>{label}</strong>
                    <small>{key === " " ? t("space") : key}</small>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {mode === "advanced" && (
        <div className="advanced-toggle-row">
          <Button variant="outline" onClick={() => onAdvancedOpenChange(!advancedOpen)}>
            <Settings2 aria-hidden="true" />
            {advancedOpen ? t("closeAdvancedManager") : t("openAdvancedManager")}
          </Button>
          <span>{t("protectedDefaults")}</span>
        </div>
      )}

      {mode === "advanced" && advancedOpen && (
        <section className="advanced-manager" aria-labelledby="advanced-manager-title">
          <div className="advanced-manager-heading">
            <div>
              <h2 id="advanced-manager-title">{t("advancedManager")}</h2>
              <p>{t("advancedManagerDescription")}</p>
            </div>
            <button type="button" aria-label="Close advanced manager" onClick={() => onAdvancedOpenChange(false)}>
              <X aria-hidden="true" />
            </button>
          </div>

          {configurationError && <div className="configuration-error" role="alert">{configurationError}</div>}

          <div className="advanced-manager-grid">
            <div className="advanced-form-card">
              <h3>{t("newShortcut")}</h3>
              <div className="advanced-inline-fields">
                <label>
                  <span>{t("key")}</span>
                  <input value={shortcutKey} maxLength={1} onChange={(event) => setShortcutKey(event.target.value)} placeholder="K" />
                </label>
                <label className="advanced-output-field">
                  <span>{t("unicodeValue")}</span>
                  <input className="devanagari" value={shortcutOutput} onChange={(event) => setShortcutOutput(event.target.value)} placeholder="क्ष" />
                </label>
              </div>
              <div className="modifier-options">
                <ModifierCheckbox label="Ctrl" checked={shortcutCtrl} onChange={setShortcutCtrl} />
                <ModifierCheckbox label="Alt" checked={shortcutAlt} onChange={setShortcutAlt} />
                <ModifierCheckbox label={t("shift")} checked={shortcutShift} onChange={setShortcutShift} />
              </div>
              <Button size="sm" onClick={addShortcut}><Save aria-hidden="true" /> {t("saveShortcut")}</Button>
            </div>

            <div className="advanced-form-card">
              <h3>{t("customKeyMapping")}</h3>
              <div className="advanced-inline-fields">
                <label>
                  <span>{t("physicalKey")}</span>
                  <input value={mappingKey} maxLength={1} onChange={(event) => setMappingKey(event.target.value)} placeholder="q" />
                </label>
                <label className="advanced-output-field">
                  <span>{t("unicodeValue")}</span>
                  <input className="devanagari" value={mappingOutput} onChange={(event) => setMappingOutput(event.target.value)} placeholder="क" />
                </label>
              </div>
              <p className="advanced-hint">{t("advancedOnly")}</p>
              <Button size="sm" onClick={addMapping}><Save aria-hidden="true" /> {t("saveMapping")}</Button>
            </div>
          </div>

          <div className="custom-rule-list">
            {[...customShortcuts, ...customMappings].length === 0 ? (
              <p>{t("noCustomRules")}</p>
            ) : (
              <>
                {customShortcuts.map((shortcut) => (
                  <div className="custom-rule" key={shortcut.id}>
                    <span><strong>{formatShortcut(shortcut)}</strong> → <b className="devanagari">{shortcut.character}</b></span>
                    <button type="button" aria-label={`Delete ${formatShortcut(shortcut)}`} onClick={() => onCustomShortcutsChange(customShortcuts.filter((item) => item.id !== shortcut.id))}>
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                ))}
                {customMappings.map((mapping) => (
                  <div className="custom-rule" key={mapping.id}>
                    <span><strong>Key {mapping.key.toLocaleUpperCase()}</strong> → <b className="devanagari">{mapping.output}</b></span>
                    <button type="button" aria-label={`Delete key ${mapping.key}`} onClick={() => onCustomMappingsChange(customMappings.filter((item) => item.id !== mapping.id))}>
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="configuration-actions">
            <Button variant="outline" size="sm" onClick={exportConfiguration}>
              <FileJson aria-hidden="true" /> {t("exportLayout")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => configFileRef.current?.click()}>
              <Upload aria-hidden="true" /> {t("importLayout")}
            </Button>
            <Button variant="danger" size="sm" onClick={resetConfiguration} disabled={!customShortcuts.length && !customMappings.length}>
              <RotateCcw aria-hidden="true" /> {t("resetCustomLayer")}
            </Button>
          </div>
        </section>
      )}

      <input ref={sourceFileRef} type="file" accept=".txt,text/plain" hidden onChange={(event) => handleSourceFile(event.target.files?.[0])} />
      <input ref={configFileRef} type="file" accept=".json,application/json" hidden onChange={(event) => importConfiguration(event.target.files?.[0])} />
    </section>
  );
}

function TypingMetric({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <span className="typing-metric">
      <small>{label}</small>
      <strong>{value}</strong>
    </span>
  );
}

function ModifierCheckbox({
  label,
  checked,
  onChange,
}: {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}) {
  return (
    <label>
      <input type="checkbox" checked={checked} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function isShortcutDefinition(value: unknown): value is ShortcutDefinition {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ShortcutDefinition>;
  return (
    typeof item.id === "string" &&
    typeof item.character === "string" && item.character.length > 0 &&
    typeof item.key === "string" && item.key.length === 1 &&
    typeof item.ctrl === "boolean" &&
    typeof item.alt === "boolean" &&
    typeof item.shift === "boolean"
  );
}

function isCustomKeyMapping(value: unknown): value is CustomKeyMapping {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CustomKeyMapping>;
  return (
    typeof item.id === "string" &&
    typeof item.key === "string" && item.key.length === 1 &&
    typeof item.output === "string" && item.output.length > 0
  );
}
