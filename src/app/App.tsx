import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  CircleHelp,
  CloudUpload,
  FileSpreadsheet,
  FileText,
  Gauge,
  Globe2,
  Home,
  Keyboard,
  Menu,
  Mic2,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  TerminalSquare,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DEFAULT_SHORTCUTS,
  formatShortcut,
  unicodeToTypingKeys,
  type CustomKeyMapping,
  type ShortcutDefinition,
  type TypingMode,
  type TypingOutputMode,
} from "@/domain/typing/typing-engine";
import { ExchangeConverter } from "@/features/converter/ExchangeConverter";
import { TypingWorkspace } from "@/features/typing/TypingWorkspace";

const navItems = [
  { label: "Start Typing", icon: Home },
  { label: "Convert Document", icon: FileText },
  { label: "Typing Practice", icon: BookOpen },
  { label: "Typing Test", icon: Gauge },
  { label: "Stenography", icon: Mic2 },
] as const;

const characterGroups = {
  स्वर: [
    ["अ", "a"], ["आ", "aa"], ["इ", "i"], ["ई", "ee"], ["उ", "u"], ["ऊ", "oo"], ["ऋ", "ri"],
    ["ए", "e"], ["ऐ", "ai"], ["ओ", "o"], ["औ", "au"], ["अं", "am"], ["अः", "ah"],
  ],
  व्यंजन: [
    ["क", "k"], ["ख", "kh"], ["ग", "g"], ["घ", "gh"], ["च", "ch"], ["छ", "chh"], ["ज", "j"],
    ["झ", "jh"], ["ट", "t"], ["ठ", "th"], ["ड", "d"], ["ढ", "dh"], ["ण", "n"],
  ],
  मात्राएँ: [
    ["ा", "aa"], ["ि", "i"], ["ी", "ee"], ["ु", "u"], ["ू", "oo"], ["ृ", "ri"], ["े", "e"],
    ["ै", "ai"], ["ो", "o"], ["ौ", "au"], ["ं", "am"], ["ँ", "an"], ["ः", "ah"],
  ],
  "संयुक्त अक्षर": [
    ["क्ष", "ksh"], ["त्र", "tra"], ["ज्ञ", "gya"], ["श्र", "shra"], ["त्त", "tta"], ["द्ध", "ddha"], ["द्व", "dva"],
    ["प्र", "pra"], ["क्र", "kra"], ["ग्र", "gra"], ["स्त्र", "stra"], ["न्द्र", "ndra"], ["द्य", "dya"],
  ],
  "विशेष चिन्ह": [
    ["।", "danda"], ["॥", "double"], ["॰", "abbr"], ["ॐ", "om"], ["ऽ", "avagraha"], ["़", "nukta"], ["्", "halant"],
    ["०", "0"], ["१", "1"], ["२", "2"], ["३", "3"], ["४", "4"], ["५", "5"],
  ],
} as const;

type Theme = "light" | "dark";
type StartTool = "typing" | "converter";
type CharacterTab = keyof typeof characterGroups;

function isStoredShortcut(value: unknown): value is ShortcutDefinition {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ShortcutDefinition>;
  return (
    typeof item.id === "string" &&
    typeof item.character === "string" &&
    typeof item.key === "string" && item.key.length === 1 &&
    typeof item.ctrl === "boolean" &&
    typeof item.alt === "boolean" &&
    typeof item.shift === "boolean"
  );
}

function isStoredMapping(value: unknown): value is CustomKeyMapping {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CustomKeyMapping>;
  return (
    typeof item.id === "string" &&
    typeof item.key === "string" && item.key.length === 1 &&
    typeof item.output === "string" && item.output.length > 0
  );
}

function loadJsonArray<T>(key: string, validator: (value: unknown) => value is T): readonly T[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(validator) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() =>
    localStorage.getItem("bhashayantra-theme") === "dark" ? "dark" : "light",
  );
  const [typingMode, setTypingMode] = useState<TypingMode>(() =>
    localStorage.getItem("bhashayantra-typing-mode") === "advanced" ? "advanced" : "simple",
  );
  const [outputMode, setOutputMode] = useState<TypingOutputMode>(() =>
    localStorage.getItem("bhashayantra-output-mode") === "legacy" ? "legacy" : "unicode",
  );
  const [activeNav, setActiveNav] = useState("Start Typing");
  const [startTool, setStartTool] = useState<StartTool>("typing");
  const [shortcutQuery, setShortcutQuery] = useState("");
  const [characterTab, setCharacterTab] = useState<CharacterTab>("स्वर");
  const [typingSource, setTypingSource] = useState(() => localStorage.getItem("bhashayantra-typing-draft") ?? "");
  const [customShortcuts, setCustomShortcuts] = useState<readonly ShortcutDefinition[]>(() =>
    loadJsonArray("bhashayantra-custom-shortcuts", isStoredShortcut),
  );
  const [customMappings, setCustomMappings] = useState<readonly CustomKeyMapping[]>(() =>
    loadJsonArray("bhashayantra-custom-mappings", isStoredMapping),
  );
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("bhashayantra-theme", theme);
  }, [theme]);

  useEffect(() => localStorage.setItem("bhashayantra-typing-mode", typingMode), [typingMode]);
  useEffect(() => localStorage.setItem("bhashayantra-output-mode", outputMode), [outputMode]);
  useEffect(() => localStorage.setItem("bhashayantra-typing-draft", typingSource), [typingSource]);
  useEffect(() => localStorage.setItem("bhashayantra-custom-shortcuts", JSON.stringify(customShortcuts)), [customShortcuts]);
  useEffect(() => localStorage.setItem("bhashayantra-custom-mappings", JSON.stringify(customMappings)), [customMappings]);

  const shortcuts = useMemo(
    () => [...DEFAULT_SHORTCUTS, ...customShortcuts],
    [customShortcuts],
  );

  const filteredShortcuts = useMemo(() => {
    const query = shortcutQuery.trim().toLocaleLowerCase();
    if (!query) return shortcuts;
    return shortcuts.filter((shortcut) =>
      `${shortcut.character} ${formatShortcut(shortcut)}`.toLocaleLowerCase().includes(query),
    );
  }, [shortcutQuery, shortcuts]);

  function insertCharacter(character: string) {
    const legacy = unicodeToTypingKeys(character).output;
    setTypingSource((current) => `${current}${legacy}`);
    setActiveNav("Start Typing");
    setStartTool("typing");
  }

  function openAdvancedManager() {
    setActiveNav("Start Typing");
    setStartTool("typing");
    setTypingMode("advanced");
    setAdvancedOpen(true);
  }

  return (
    <main className="app-frame">
      <TopBar
        theme={theme}
        onThemeChange={setTheme}
        outputMode={outputMode}
        onOutputModeChange={setOutputMode}
      />

      <div className="app-body">
        <aside className="sidebar" aria-label="Primary navigation">
          <nav>
            {navItems.map(({ label, icon: Icon }) => (
              <button
                type="button"
                key={label}
                className={activeNav === label ? "nav-item active" : "nav-item"}
                onClick={() => setActiveNav(label)}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
            <div className="nav-separator" />
            <button
              type="button"
              className={activeNav === "Settings" ? "nav-item active" : "nav-item"}
              onClick={() => setActiveNav("Settings")}
            >
              <Settings aria-hidden="true" />
              <span>Settings</span>
            </button>
          </nav>

          <Card className="pro-card">
            <div className="pro-title">
              <ShieldCheck aria-hidden="true" />
              BhashaYantra Pro
            </div>
            <p>Powerful Hindi Typing Suite for Everyone</p>
            <button type="button">Activate Now</button>
          </Card>
        </aside>

        <section className="workspace">
          {activeNav === "Start Typing" && (
            <div className="mode-switch" role="group" aria-label="Typing mode">
              <button
                type="button"
                className={typingMode === "simple" ? "mode-card active" : "mode-card"}
                onClick={() => setTypingMode("simple")}
              >
                <Sparkles aria-hidden="true" />
                <span>
                  <strong>Simple Smart Mode</strong>
                  <small>Automatic matra, reph & joint-letter handling.</small>
                </span>
              </button>
              <button
                type="button"
                className={typingMode === "advanced" ? "mode-card active" : "mode-card"}
                onClick={() => setTypingMode("advanced")}
              >
                <TerminalSquare aria-hidden="true" />
                <span>
                  <strong>Advanced Classic Mode</strong>
                  <small>Shortcuts, custom mappings & layout tools.</small>
                </span>
              </button>
            </div>
          )}

          {activeNav === "Start Typing" ? (
            <>
              <div className="workspace-tool-switch" role="tablist" aria-label="Start workspace tools">
                <button type="button" role="tab" aria-selected={startTool === "typing"} onClick={() => setStartTool("typing")}>
                  <Keyboard aria-hidden="true" /> Typing Pad
                </button>
                <button type="button" role="tab" aria-selected={startTool === "converter"} onClick={() => setStartTool("converter")}>
                  <Sparkles aria-hidden="true" /> Exchange Converter
                </button>
              </div>

              {startTool === "typing" ? (
                <TypingWorkspace
                  mode={typingMode}
                  outputMode={outputMode}
                  source={typingSource}
                  onSourceChange={setTypingSource}
                  shortcuts={shortcuts}
                  customShortcuts={customShortcuts}
                  onCustomShortcutsChange={setCustomShortcuts}
                  customMappings={customMappings}
                  onCustomMappingsChange={setCustomMappings}
                  advancedOpen={advancedOpen}
                  onAdvancedOpenChange={setAdvancedOpen}
                />
              ) : (
                <ExchangeConverter />
              )}

              <CharacterBrowser
                activeTab={characterTab}
                onTabChange={setCharacterTab}
                onInsertCharacter={insertCharacter}
              />
            </>
          ) : (
            <FeaturePlaceholder title={activeNav} onReturn={() => setActiveNav("Start Typing")} />
          )}
        </section>

        <aside className="right-rail" aria-label="Quick tools">
          <ShortcutManager
            query={shortcutQuery}
            onQueryChange={setShortcutQuery}
            shortcuts={filteredShortcuts}
            onInsert={insertCharacter}
            onOpen={openAdvancedManager}
          />
          <DocumentConverter />
          <TypingSummary />
        </aside>
      </div>
    </main>
  );
}

function TopBar({
  theme,
  onThemeChange,
  outputMode,
  onOutputModeChange,
}: {
  readonly theme: Theme;
  readonly onThemeChange: (theme: Theme) => void;
  readonly outputMode: TypingOutputMode;
  readonly onOutputModeChange: (mode: TypingOutputMode) => void;
}) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">भ</span>
        <strong>BhashaYantra</strong>
      </div>

      <div className="top-controls">
        <label>
          <span>Language:</span>
          <select value="Hindi" aria-label="Language" disabled><option>Hindi</option></select>
        </label>
        <span className="top-divider" />
        <label>
          <Keyboard aria-hidden="true" />
          <span>Layout:</span>
          <select value="Classic Hindi" aria-label="Keyboard layout" disabled><option>Classic Hindi</option></select>
        </label>
        <span className="top-divider" />
        <label>
          <span>Output:</span>
          <select value={outputMode} aria-label="Output format" onChange={(event) => onOutputModeChange(event.target.value as TypingOutputMode)}>
            <option value="unicode">Unicode</option>
            <option value="legacy">Legacy</option>
          </select>
        </label>
        <span className="top-divider" />
        <div className="works-in">
          <span>Works in:</span>
          <span><FileText aria-hidden="true" /> Word</span>
          <span><FileSpreadsheet aria-hidden="true" /> Excel</span>
          <span><Globe2 aria-hidden="true" /> Browser</span>
        </div>
      </div>

      <div className="top-actions">
        <Button variant="ghost" size="icon" aria-label="Menu"><Menu aria-hidden="true" /></Button>
        <Button variant="ghost" size="icon" aria-label="Help"><CircleHelp aria-hidden="true" /></Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={theme === "light" ? "Use dark theme" : "Use light theme"}
          onClick={() => onThemeChange(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
        </Button>
      </div>
    </header>
  );
}

function CharacterBrowser({
  activeTab,
  onTabChange,
  onInsertCharacter,
}: {
  readonly activeTab: CharacterTab;
  readonly onTabChange: (tab: CharacterTab) => void;
  readonly onInsertCharacter: (character: string) => void;
}) {
  const tabs = Object.keys(characterGroups) as CharacterTab[];
  const characters = characterGroups[activeTab];

  return (
    <section className="character-browser" aria-label="Character browser">
      <div className="character-tabs" role="tablist">
        {tabs.map((tab) => (
          <button type="button" role="tab" aria-selected={activeTab === tab} key={tab} onClick={() => onTabChange(tab)}>
            {tab}
          </button>
        ))}
      </div>
      <div className="character-grid">
        {characters.map(([character, roman]) => (
          <button type="button" key={character} onClick={() => onInsertCharacter(character)} title={`Insert ${character}`}>
            <strong>{character}</strong>
            <small>{roman}</small>
          </button>
        ))}
      </div>
      <span className="character-help">Select a group, then click a character to insert it into Typing Pad.</span>
    </section>
  );
}

function ShortcutManager({
  query,
  onQueryChange,
  shortcuts,
  onInsert,
  onOpen,
}: {
  readonly query: string;
  readonly onQueryChange: (value: string) => void;
  readonly shortcuts: readonly ShortcutDefinition[];
  readonly onInsert: (character: string) => void;
  readonly onOpen: () => void;
}) {
  return (
    <Card className="rail-card shortcut-card">
      <div className="rail-card-title">
        <strong>Advanced Shortcut Manager</strong>
        <Settings aria-hidden="true" />
      </div>
      <label className="search-field">
        <Search aria-hidden="true" />
        <span className="sr-only">Search character or shortcut</span>
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search character or shortcut" />
      </label>
      <div className="shortcut-table" role="table">
        <div className="shortcut-row shortcut-header" role="row">
          <span role="columnheader">Character</span>
          <span role="columnheader">Shortcut</span>
        </div>
        {shortcuts.slice(0, 6).map((shortcut) => (
          <button className="shortcut-row shortcut-insert-row" role="row" key={shortcut.id} type="button" onClick={() => onInsert(shortcut.character)} title={`Insert ${shortcut.character}`}>
            <strong role="cell">{shortcut.character}</strong>
            <span role="cell">{formatShortcut(shortcut)}</span>
          </button>
        ))}
        {shortcuts.length === 0 && <p className="empty-shortcuts">No matching shortcut</p>}
      </div>
      <button type="button" className="rail-link" onClick={onOpen}>
        Open Full Shortcut Manager <ChevronRight aria-hidden="true" />
      </button>
    </Card>
  );
}

function DocumentConverter() {
  const [fileName, setFileName] = useState<string>();

  function receiveFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) setFileName(file.name);
  }

  return (
    <Card className="rail-card document-card">
      <div className="rail-card-title document-title">
        <span className="green-icon"><FileText aria-hidden="true" /></span>
        <strong>Document Converter</strong>
      </div>
      <label className="drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); receiveFiles(event.dataTransfer.files); }}>
        <CloudUpload aria-hidden="true" />
        <span>{fileName ?? "Drop legacy file here"}</span>
        <small>(.txt, .rtf, .doc, .docx)</small>
        <input type="file" accept=".txt,.rtf,.doc,.docx" hidden onChange={(event) => receiveFiles(event.target.files)} />
        <span className="document-button"><Sparkles aria-hidden="true" /> Convert to Unicode</span>
        <small>Supports: KrutiDev, Shree-Lipi, DevLys & more</small>
      </label>
    </Card>
  );
}

function TypingSummary() {
  return (
    <Card className="rail-card typing-summary">
      <div className="rail-card-title">
        <span className="summary-title"><BarChart3 aria-hidden="true" /> Typing Test</span>
        <button type="button">View History</button>
      </div>
      <div className="metric-grid">
        <Metric label="WPM" value="42" note="Good" />
        <Metric label="Accuracy" value="96%" note="Excellent" />
        <Metric label="KDPH" value="268" note="Great" />
      </div>
      <svg className="trend-chart" viewBox="0 0 360 68" role="img" aria-label="Recent typing progress">
        <defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0b63f6" stopOpacity="0.2" /><stop offset="100%" stopColor="#22c55e" stopOpacity="0.04" /></linearGradient></defs>
        <path d="M0 51 L36 34 L78 46 L121 29 L164 21 L210 37 L258 45 L311 28 L360 25 L360 68 L0 68 Z" fill="url(#chart-fill)" />
        <path d="M0 51 L36 34 L78 46 L121 29 L164 21 L210 37 L258 45 L311 28 L360 25" fill="none" stroke="#0b63f6" strokeWidth="2" />
        {["0,51", "36,34", "78,46", "121,29", "164,21", "210,37", "258,45", "311,28", "360,25"].map((point) => { const [cx, cy] = point.split(","); return <circle key={point} cx={cx} cy={cy} r="3.5" fill="#0b63f6" />; })}
      </svg>
    </Card>
  );
}

function Metric({ label, value, note }: { readonly label: string; readonly value: string; readonly note: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

function FeaturePlaceholder({ title, onReturn }: { readonly title: string; readonly onReturn: () => void }) {
  return (
    <section className="feature-placeholder">
      <Upload aria-hidden="true" />
      <h1>{title}</h1>
      <p>This module has its architecture contract ready and will be implemented after the Start Typing vertical slice.</p>
      <Button onClick={onReturn}>Return to Start Typing</Button>
    </section>
  );
}
