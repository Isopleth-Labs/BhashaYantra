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
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DEFAULT_SHORTCUTS,
  formatShortcut,
  unicodeToTypingSource,
  type CustomKeyMapping,
  type ShortcutDefinition,
  type TypingLayoutId,
  type TypingMode,
  type TypingOutputMode,
} from "@/domain/typing/typing-engine";
import { ExchangeConverter } from "@/features/converter/ExchangeConverter";
import { TypingWorkspace } from "@/features/typing/TypingWorkspace";
import { useI18n } from "@/i18n/I18nProvider";

const navItems = [
  { id: "start", labelKey: "startTyping", icon: Home },
  { id: "documents", labelKey: "convertDocument", icon: FileText },
  { id: "practice", labelKey: "typingPractice", icon: BookOpen },
  { id: "test", labelKey: "typingTest", icon: Gauge },
  { id: "stenography", labelKey: "stenography", icon: Mic2 },
] as const;

const characterGroups = {
  स्वर: [
    ["अ", "a"], ["आ", "aa"], ["इ", "i"], ["ई", "ee"], ["उ", "u"], ["ऊ", "oo"], ["ऋ", "ri"],
    ["ए", "e"], ["ऐ", "ai"], ["ओ", "o"], ["औ", "au"], ["अं", "am"], ["अः", "ah"],
  ],
  व्यंजन: [
    ["क", "k"], ["ख", "kh"], ["ग", "g"], ["घ", "gh"], ["ङ", "nga"], ["च", "ch"], ["छ", "chh"],
    ["ज", "j"], ["झ", "jh"], ["ञ", "nya"], ["ट", "t"], ["ठ", "th"], ["ड", "d"], ["ढ", "dh"],
    ["ण", "n"], ["त", "ta"], ["थ", "tha"], ["द", "da"], ["ध", "dha"], ["न", "na"], ["प", "pa"],
    ["फ", "pha"], ["ब", "ba"], ["भ", "bha"], ["म", "ma"], ["य", "ya"], ["र", "ra"], ["ल", "la"],
    ["व", "va"], ["श", "sha"], ["ष", "ssa"], ["स", "sa"], ["ह", "ha"],
  ],
  मात्राएँ: [
    ["ा", "aa"], ["ि", "i"], ["ी", "ee"], ["ु", "u"], ["ू", "oo"], ["ृ", "ri"], ["े", "e"],
    ["ै", "ai"], ["ो", "o"], ["ौ", "au"], ["ं", "am"], ["ँ", "an"], ["ः", "ah"], ["ॅ", "candra-e"],
  ],
  "संयुक्त अक्षर": [
    ["क्ष", "ksh"], ["त्र", "tra"], ["ज्ञ", "gya"], ["श्र", "shra"], ["त्त", "tta"], ["द्ध", "ddha"], ["द्व", "dva"],
    ["प्र", "pra"], ["क्र", "kra"], ["ग्र", "gra"], ["स्त्र", "stra"], ["न्द्र", "ndra"], ["द्य", "dya"],
    ["क्त", "kta"], ["प्त", "pta"], ["स्त", "sta"], ["स्व", "sva"], ["ह्न", "hna"], ["ह्म", "hma"],
  ],
  "विशेष चिन्ह": [
    ["।", "danda"], ["॥", "double"], ["॰", "abbr"], ["ॐ", "om"], ["ऽ", "avagraha"], ["़", "nukta"], ["्", "halant"],
    ["०", "0"], ["१", "1"], ["२", "2"], ["३", "3"], ["४", "4"], ["५", "5"], ["६", "6"],
    ["७", "7"], ["८", "8"], ["९", "9"],
  ],
} as const;

type Theme = "light" | "dark";
type StartTool = "typing" | "converter";
type CharacterTab = keyof typeof characterGroups;
type NavId = (typeof navItems)[number]["id"] | "settings";

function isStoredShortcut(value: unknown): value is ShortcutDefinition {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ShortcutDefinition>;
  return (
    typeof item.id === "string" && typeof item.character === "string" &&
    typeof item.key === "string" && item.key.length === 1 &&
    typeof item.ctrl === "boolean" && typeof item.alt === "boolean" && typeof item.shift === "boolean"
  );
}

function isStoredMapping(value: unknown): value is CustomKeyMapping {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CustomKeyMapping>;
  return typeof item.id === "string" && typeof item.key === "string" && item.key.length === 1 && typeof item.output === "string" && item.output.length > 0;
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
  const { t } = useI18n();
  const [theme, setTheme] = useState<Theme>(() => localStorage.getItem("bhashayantra-theme") === "dark" ? "dark" : "light");
  const [typingMode, setTypingMode] = useState<TypingMode>(() => localStorage.getItem("bhashayantra-typing-layout") === "classic-hindi" ? "advanced" : "simple");
  const [typingLayout, setTypingLayout] = useState<TypingLayoutId>(() => localStorage.getItem("bhashayantra-typing-layout") === "classic-hindi" ? "classic-hindi" : "bhashayantra-smart");
  const [outputMode, setOutputMode] = useState<TypingOutputMode>(() => localStorage.getItem("bhashayantra-output-mode") === "legacy" ? "legacy" : "unicode");
  const [activeNav, setActiveNav] = useState<NavId>("start");
  const [startTool, setStartTool] = useState<StartTool>("typing");
  const [shortcutQuery, setShortcutQuery] = useState("");
  const [characterTab, setCharacterTab] = useState<CharacterTab>("स्वर");
  const [typingDrafts, setTypingDrafts] = useState<Record<TypingLayoutId, string>>(() => ({
    "bhashayantra-smart": localStorage.getItem("bhashayantra-smart-draft") ?? "",
    "classic-hindi": localStorage.getItem("bhashayantra-classic-draft") ?? localStorage.getItem("bhashayantra-typing-draft") ?? "",
  }));
  const [customShortcuts, setCustomShortcuts] = useState<readonly ShortcutDefinition[]>(() => loadJsonArray("bhashayantra-custom-shortcuts", isStoredShortcut));
  const [customMappings, setCustomMappings] = useState<readonly CustomKeyMapping[]>(() => loadJsonArray("bhashayantra-custom-mappings", isStoredMapping));
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [characterLibraryOpen, setCharacterLibraryOpen] = useState(false);
  const [shortcutLibraryOpen, setShortcutLibraryOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("bhashayantra-theme", theme);
  }, [theme]);
  useEffect(() => localStorage.setItem("bhashayantra-typing-mode", typingMode), [typingMode]);
  useEffect(() => localStorage.setItem("bhashayantra-typing-layout", typingLayout), [typingLayout]);
  useEffect(() => localStorage.setItem("bhashayantra-output-mode", outputMode), [outputMode]);
  useEffect(() => localStorage.setItem("bhashayantra-smart-draft", typingDrafts["bhashayantra-smart"]), [typingDrafts]);
  useEffect(() => localStorage.setItem("bhashayantra-classic-draft", typingDrafts["classic-hindi"]), [typingDrafts]);
  useEffect(() => localStorage.setItem("bhashayantra-custom-shortcuts", JSON.stringify(customShortcuts)), [customShortcuts]);
  useEffect(() => localStorage.setItem("bhashayantra-custom-mappings", JSON.stringify(customMappings)), [customMappings]);

  const shortcuts = useMemo(() => [...DEFAULT_SHORTCUTS, ...customShortcuts], [customShortcuts]);
  const typingSource = typingDrafts[typingLayout];
  const filteredShortcuts = useMemo(() => {
    const query = shortcutQuery.trim().toLocaleLowerCase();
    if (!query) return shortcuts;
    return shortcuts.filter((shortcut) => `${shortcut.character} ${formatShortcut(shortcut)}`.toLocaleLowerCase().includes(query));
  }, [shortcutQuery, shortcuts]);

  function insertCharacter(character: string) {
    setTypingDrafts((current) => ({
      ...current,
      [typingLayout]: `${current[typingLayout]}${unicodeToTypingSource(character, typingLayout).output}`,
    }));
    setActiveNav("start");
    setStartTool("typing");
  }

  function scrollToAdvancedManager() {
    window.setTimeout(() => document.getElementById("advanced-manager-title")?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
  }

  function chooseTypingMode(mode: TypingMode) {
    setTypingMode(mode);
    setTypingLayout(mode === "simple" ? "bhashayantra-smart" : "classic-hindi");
    setStartTool("typing");
    if (mode === "advanced") {
      setAdvancedOpen(true);
      scrollToAdvancedManager();
    } else {
      setAdvancedOpen(false);
    }
  }

  function chooseTypingLayout(layout: TypingLayoutId) {
    setTypingLayout(layout);
    setTypingMode(layout === "bhashayantra-smart" ? "simple" : "advanced");
    setActiveNav("start");
    setStartTool("typing");
    setAdvancedOpen(false);
  }

  function updateTypingSource(value: string) {
    setTypingDrafts((current) => ({ ...current, [typingLayout]: value }));
  }

  function openAdvancedManager() {
    setShortcutLibraryOpen(false);
    setActiveNav("start");
    setStartTool("typing");
    setTypingMode("advanced");
    setTypingLayout("classic-hindi");
    setAdvancedOpen(true);
    scrollToAdvancedManager();
  }

  const activeNavLabel = activeNav === "settings"
    ? t("settings")
    : t(navItems.find((item) => item.id === activeNav)?.labelKey ?? "startTyping");

  return (
    <main className="app-frame">
      <TopBar
        theme={theme} onThemeChange={setTheme}
        typingLayout={typingLayout} onTypingLayoutChange={chooseTypingLayout}
        outputMode={outputMode} onOutputModeChange={setOutputMode}
      />

      <div className="app-body">
        <aside className="sidebar" aria-label={t("menu")}>
          <nav>
            {navItems.map(({ id, labelKey, icon: Icon }) => (
              <button type="button" key={id} className={activeNav === id ? "nav-item active" : "nav-item"} onClick={() => setActiveNav(id)}>
                <Icon aria-hidden="true" /><span>{t(labelKey)}</span>
              </button>
            ))}
            <div className="nav-separator" />
            <button type="button" className={activeNav === "settings" ? "nav-item active" : "nav-item"} onClick={() => setActiveNav("settings")}>
              <Settings aria-hidden="true" /><span>{t("settings")}</span>
            </button>
          </nav>
          <Card className="pro-card">
            <div className="pro-title"><ShieldCheck aria-hidden="true" /> BhashaYantra Pro</div>
            <p>{t("proDescription")}</p>
            <button type="button">{t("activateNow")}</button>
          </Card>
        </aside>

        <section className="workspace">
          {activeNav === "start" && (
            <div className="mode-switch" role="group" aria-label={t("advancedMode")}>
              <button type="button" className={typingMode === "simple" ? "mode-card active" : "mode-card"} onClick={() => chooseTypingMode("simple")}>
                <Sparkles aria-hidden="true" /><span><strong>{t("simpleMode")}</strong><small>{t("simpleModeDescription")}</small></span>
              </button>
              <button type="button" className={typingMode === "advanced" ? "mode-card active" : "mode-card"} onClick={() => chooseTypingMode("advanced")}>
                <TerminalSquare aria-hidden="true" /><span><strong>{t("advancedMode")}</strong><small>{t("advancedModeDescription")}</small></span>
              </button>
            </div>
          )}

          {activeNav === "start" ? (
            <>
              <div className="workspace-tool-switch" role="tablist" aria-label={t("startTyping")}>
                <button type="button" role="tab" aria-selected={startTool === "typing"} onClick={() => setStartTool("typing")}><Keyboard aria-hidden="true" /> {t("typingPad")}</button>
                <button type="button" role="tab" aria-selected={startTool === "converter"} onClick={() => setStartTool("converter")}><Sparkles aria-hidden="true" /> {t("exchangeConverter")}</button>
              </div>
              {startTool === "typing" ? (
                <TypingWorkspace
                  mode={typingMode} layout={typingLayout} outputMode={outputMode} source={typingSource} onSourceChange={updateTypingSource}
                  shortcuts={shortcuts} customShortcuts={customShortcuts} onCustomShortcutsChange={setCustomShortcuts}
                  customMappings={customMappings} onCustomMappingsChange={setCustomMappings}
                  advancedOpen={advancedOpen} onAdvancedOpenChange={setAdvancedOpen}
                />
              ) : <ExchangeConverter />}
              <CharacterBrowser activeTab={characterTab} onTabChange={setCharacterTab} onInsertCharacter={insertCharacter} onOpenAll={() => setCharacterLibraryOpen(true)} />
            </>
          ) : <FeaturePlaceholder title={activeNavLabel} onReturn={() => setActiveNav("start")} />}
        </section>

        <aside className="right-rail" aria-label={t("shortcutManager")}>
          <ShortcutManager query={shortcutQuery} onQueryChange={setShortcutQuery} shortcuts={filteredShortcuts} onInsert={insertCharacter} onOpen={() => setShortcutLibraryOpen(true)} />
          <DocumentConverter />
          <TypingSummary />
        </aside>
      </div>

      {characterLibraryOpen && <CharacterLibraryModal onClose={() => setCharacterLibraryOpen(false)} onInsert={insertCharacter} />}
      {shortcutLibraryOpen && (
        <ShortcutLibraryModal
          shortcuts={shortcuts} customShortcuts={customShortcuts}
          onCustomShortcutsChange={setCustomShortcuts} onInsert={insertCharacter}
          onManage={openAdvancedManager} onClose={() => setShortcutLibraryOpen(false)}
        />
      )}
    </main>
  );
}

function TopBar({ theme, onThemeChange, typingLayout, onTypingLayoutChange, outputMode, onOutputModeChange }: {
  readonly theme: Theme; readonly onThemeChange: (theme: Theme) => void;
  readonly typingLayout: TypingLayoutId; readonly onTypingLayoutChange: (layout: TypingLayoutId) => void;
  readonly outputMode: TypingOutputMode; readonly onOutputModeChange: (mode: TypingOutputMode) => void;
}) {
  const { language, setLanguage, t } = useI18n();
  return (
    <header className="topbar">
      <div className="brand"><span className="brand-mark" aria-hidden="true">भ</span><strong>BhashaYantra</strong></div>
      <div className="top-controls">
        <label><span>{t("language")}:</span><select value={language} aria-label={t("language")} onChange={(event) => setLanguage(event.target.value as "hi" | "en")}><option value="hi">{t("hindi")}</option><option value="en">{t("english")}</option></select></label>
        <span className="top-divider" />
        <label><Keyboard aria-hidden="true" /><span>{t("layout")}:</span><select value={typingLayout} aria-label={t("layout")} onChange={(event) => onTypingLayoutChange(event.target.value as TypingLayoutId)}><option value="bhashayantra-smart">{t("bhashaYantraSmart")}</option><option value="classic-hindi">{t("classicHindi")}</option></select></label>
        <span className="top-divider" />
        <label><span>{t("output")}:</span><select value={outputMode} aria-label={t("output")} onChange={(event) => onOutputModeChange(event.target.value as TypingOutputMode)}><option value="unicode">{t("unicode")}</option><option value="legacy">{t("legacy")}</option></select></label>
        <span className="top-divider" />
        <div className="works-in"><span>{t("worksIn")}:</span><span><FileText aria-hidden="true" /> Word</span><span><FileSpreadsheet aria-hidden="true" /> Excel</span><span><Globe2 aria-hidden="true" /> Browser</span></div>
      </div>
      <div className="top-actions">
        <Button variant="ghost" size="icon" aria-label={t("menu")}><Menu aria-hidden="true" /></Button>
        <Button variant="ghost" size="icon" aria-label={t("help")}><CircleHelp aria-hidden="true" /></Button>
        <Button variant="ghost" size="icon" aria-label={theme === "light" ? t("useDarkTheme") : t("useLightTheme")} onClick={() => onThemeChange(theme === "light" ? "dark" : "light")}>
          {theme === "light" ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
        </Button>
      </div>
    </header>
  );
}

function CharacterBrowser({ activeTab, onTabChange, onInsertCharacter, onOpenAll }: {
  readonly activeTab: CharacterTab; readonly onTabChange: (tab: CharacterTab) => void;
  readonly onInsertCharacter: (character: string) => void; readonly onOpenAll: () => void;
}) {
  const { t } = useI18n();
  const tabs = Object.keys(characterGroups) as CharacterTab[];
  return (
    <section className="character-browser" aria-label={t("characterBrowser")}>
      <div className="character-tabs" role="tablist">{tabs.map((tab) => <button type="button" role="tab" aria-selected={activeTab === tab} key={tab} onClick={() => onTabChange(tab)}>{tab}</button>)}</div>
      <div className="character-grid">{characterGroups[activeTab].slice(0, 13).map(([character, roman]) => <button type="button" key={character} onClick={() => onInsertCharacter(character)} title={`${t("insert")} ${character}`}><strong>{character}</strong><small>{roman}</small></button>)}</div>
      <Button variant="outline" size="sm" onClick={onOpenAll}>{t("viewAllCharacters")} <ChevronRight aria-hidden="true" /></Button>
      <span className="character-help">{t("insertCharacterHelp")}</span>
    </section>
  );
}

function ShortcutManager({ query, onQueryChange, shortcuts, onInsert, onOpen }: {
  readonly query: string; readonly onQueryChange: (value: string) => void; readonly shortcuts: readonly ShortcutDefinition[];
  readonly onInsert: (character: string) => void; readonly onOpen: () => void;
}) {
  const { t } = useI18n();
  return (
    <Card className="rail-card shortcut-card">
      <div className="rail-card-title"><strong>{t("shortcutManager")}</strong><Settings aria-hidden="true" /></div>
      <label className="search-field"><Search aria-hidden="true" /><span className="sr-only">{t("searchShortcut")}</span><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={t("searchShortcut")} /></label>
      <div className="shortcut-table" role="table">
        <div className="shortcut-row shortcut-header" role="row"><span role="columnheader">{t("character")}</span><span role="columnheader">{t("shortcut")}</span></div>
        {shortcuts.slice(0, 6).map((shortcut) => <button className="shortcut-row shortcut-insert-row" role="row" key={shortcut.id} type="button" onClick={() => onInsert(shortcut.character)} title={`${t("insert")} ${shortcut.character}`}><strong role="cell">{shortcut.character}</strong><span role="cell">{formatShortcut(shortcut)}</span></button>)}
        {shortcuts.length === 0 && <p className="empty-shortcuts">{t("noMatchingShortcut")}</p>}
      </div>
      <button type="button" className="rail-link" onClick={onOpen}>{t("viewAllShortcuts")} <ChevronRight aria-hidden="true" /></button>
    </Card>
  );
}

function CharacterLibraryModal({ onClose, onInsert }: { readonly onClose: () => void; readonly onInsert: (character: string) => void }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<CharacterTab | "all">("all");
  const entries = (Object.entries(characterGroups) as [CharacterTab, readonly (readonly [string, string])[]][])
    .filter(([name]) => group === "all" || group === name)
    .flatMap(([name, characters]) => characters.map(([character, roman]) => ({ name, character, roman })))
    .filter(({ character, roman }) => `${character} ${roman}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="library-modal" role="dialog" aria-modal="true" aria-labelledby="character-library-title">
        <div className="library-modal-heading"><div><h2 id="character-library-title">{t("allCharacters")}</h2><p>{t("allCharactersDescription")}</p></div><button type="button" onClick={onClose} aria-label={t("close")}><X aria-hidden="true" /></button></div>
        <label className="library-search"><Search aria-hidden="true" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchCharacters")} /></label>
        <div className="library-filters"><button type="button" className={group === "all" ? "active" : ""} onClick={() => setGroup("all")}>{t("allGroups")}</button>{(Object.keys(characterGroups) as CharacterTab[]).map((name) => <button type="button" className={group === name ? "active" : ""} key={name} onClick={() => setGroup(name)}>{name}</button>)}</div>
        <div className="full-character-grid">{entries.map(({ name, character, roman }) => <button type="button" key={`${name}-${character}`} onClick={() => { onInsert(character); onClose(); }} title={`${t("insert")} ${character}`}><strong>{character}</strong><small>{roman}</small><span>{name}</span></button>)}</div>
        {entries.length === 0 && <p className="library-empty">{t("noMatchingShortcut")}</p>}
      </section>
    </div>
  );
}

function ShortcutLibraryModal({ shortcuts, customShortcuts, onCustomShortcutsChange, onInsert, onManage, onClose }: {
  readonly shortcuts: readonly ShortcutDefinition[]; readonly customShortcuts: readonly ShortcutDefinition[];
  readonly onCustomShortcutsChange: (value: readonly ShortcutDefinition[]) => void; readonly onInsert: (character: string) => void;
  readonly onManage: () => void; readonly onClose: () => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const visible = shortcuts.filter((shortcut) => `${shortcut.character} ${formatShortcut(shortcut)}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="library-modal shortcut-library-modal" role="dialog" aria-modal="true" aria-labelledby="shortcut-library-title">
        <div className="library-modal-heading"><div><h2 id="shortcut-library-title">{t("completeShortcutLibrary")}</h2><p>{t("completeShortcutDescription")}</p></div><button type="button" onClick={onClose} aria-label={t("close")}><X aria-hidden="true" /></button></div>
        <label className="library-search"><Search aria-hidden="true" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchShortcut")} /></label>
        <div className="full-shortcut-list" role="table">
          <div className="full-shortcut-row full-shortcut-header" role="row"><span>{t("character")}</span><span>{t("shortcut")}</span><span>{t("source")}</span><span /></div>
          {visible.map((shortcut) => (
            <div className="full-shortcut-row" role="row" key={shortcut.id}>
              <button type="button" className="shortcut-character-button" onClick={() => { onInsert(shortcut.character); onClose(); }} title={t("insertCharacter")}><strong>{shortcut.character}</strong></button>
              <span>{formatShortcut(shortcut)}</span><span className={shortcut.builtIn ? "rule-badge" : "rule-badge custom"}>{shortcut.builtIn ? t("builtIn") : t("custom")}</span>
              {shortcut.builtIn ? <span /> : <button type="button" className="delete-rule-button" aria-label={`${t("clear")} ${shortcut.character}`} onClick={() => onCustomShortcutsChange(customShortcuts.filter((item) => item.id !== shortcut.id))}><Trash2 aria-hidden="true" /></button>}
            </div>
          ))}
        </div>
        {visible.length === 0 && <p className="library-empty">{t("noMatchingShortcut")}</p>}
        <div className="library-modal-actions"><Button variant="outline" onClick={onClose}>{t("close")}</Button><Button onClick={onManage}><Settings aria-hidden="true" /> {t("manageCustomShortcuts")}</Button></div>
      </section>
    </div>
  );
}

function DocumentConverter() {
  const { t } = useI18n();
  const [fileName, setFileName] = useState<string>();
  const receiveFiles = (files: FileList | null) => { const file = files?.[0]; if (file) setFileName(file.name); };
  return (
    <Card className="rail-card document-card">
      <div className="rail-card-title document-title"><span className="green-icon"><FileText aria-hidden="true" /></span><strong>{t("documentConverter")}</strong></div>
      <label className="drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); receiveFiles(event.dataTransfer.files); }}><CloudUpload aria-hidden="true" /><span>{fileName ?? t("dropLegacyFile")}</span><small>(.txt, .rtf, .doc, .docx)</small><input type="file" accept=".txt,.rtf,.doc,.docx" hidden onChange={(event) => receiveFiles(event.target.files)} /><span className="document-button"><Sparkles aria-hidden="true" /> {t("convertToUnicode")}</span><small>{t("supportedFonts")}</small></label>
    </Card>
  );
}

function TypingSummary() {
  const { t } = useI18n();
  return (
    <Card className="rail-card typing-summary">
      <div className="rail-card-title"><span className="summary-title"><BarChart3 aria-hidden="true" /> {t("typingTest")}</span><button type="button">{t("viewHistory")}</button></div>
      <div className="metric-grid"><Metric label="WPM" value="42" note={t("good")} /><Metric label="Accuracy" value="96%" note={t("excellent")} /><Metric label="KDPH" value="268" note={t("great")} /></div>
      <svg className="trend-chart" viewBox="0 0 360 68" role="img" aria-label={t("typingTest")}><defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0b63f6" stopOpacity="0.2" /><stop offset="100%" stopColor="#22c55e" stopOpacity="0.04" /></linearGradient></defs><path d="M0 51 L36 34 L78 46 L121 29 L164 21 L210 37 L258 45 L311 28 L360 25 L360 68 L0 68 Z" fill="url(#chart-fill)" /><path d="M0 51 L36 34 L78 46 L121 29 L164 21 L210 37 L258 45 L311 28 L360 25" fill="none" stroke="#0b63f6" strokeWidth="2" />{["0,51", "36,34", "78,46", "121,29", "164,21", "210,37", "258,45", "311,28", "360,25"].map((point) => { const [cx, cy] = point.split(","); return <circle key={point} cx={cx} cy={cy} r="3.5" fill="#0b63f6" />; })}</svg>
    </Card>
  );
}

function Metric({ label, value, note }: { readonly label: string; readonly value: string; readonly note: string }) { return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }

function FeaturePlaceholder({ title, onReturn }: { readonly title: string; readonly onReturn: () => void }) {
  const { t } = useI18n();
  return <section className="feature-placeholder"><Upload aria-hidden="true" /><h1>{title}</h1><p>{t("modulePending")}</p><Button onClick={onReturn}>{t("returnToTyping")}</Button></section>;
}
