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
import { summarizeTrainingAttempts, type TrainingAttempt } from "@/domain/training/training-attempt";
import {
  DEFAULT_SHORTCUTS,
  formatShortcut,
  unicodeToTypingSource,
  type CustomKeyMapping,
  type ReadyTypingLayoutId,
  type ShortcutDefinition,
  type TypingMode,
  type TypingOutputMode,
} from "@/domain/typing/typing-engine";
import {
  displayFontsForLanguage,
  isReadyTypingLayout,
  layoutsForLanguage,
  type TypingLayoutId,
  type TypingLanguageCode,
  type UnicodeDisplayFontId,
} from "@/domain/typing/typing-profiles";
import { ExchangeConverter } from "@/features/converter/ExchangeConverter";
import { TypingMockExam } from "@/features/training/TypingMockExam";
import { TypingTraining } from "@/features/training/TypingTraining";
import { TypingWorkspace } from "@/features/typing/TypingWorkspace";
import { useI18n } from "@/i18n/I18nProvider";
import {
  LocalTrainingAttemptsRepository,
  TRAINING_ATTEMPTS_UPDATED_EVENT,
} from "@/data/repositories/local-training-attempts-repository";

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
    typeof item.ctrl === "boolean" && typeof item.alt === "boolean" && typeof item.shift === "boolean" &&
    (item.layoutId === undefined || (typeof item.layoutId === "string" && isReadyTypingLayout(item.layoutId as TypingLayoutId)))
  );
}

function isStoredMapping(value: unknown): value is CustomKeyMapping {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CustomKeyMapping>;
  return typeof item.id === "string" && typeof item.key === "string" && item.key.length === 1 && typeof item.output === "string" && item.output.length > 0 &&
    (item.layoutId === undefined || (typeof item.layoutId === "string" && isReadyTypingLayout(item.layoutId as TypingLayoutId)));
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
  const [typingLanguage, setTypingLanguage] = useState<TypingLanguageCode>(() => localStorage.getItem("bhashayantra-typing-layout") === "english-qwerty" ? "en" : "hi");
  const [typingLayout, setTypingLayout] = useState<ReadyTypingLayoutId>(() => {
    const stored = localStorage.getItem("bhashayantra-typing-layout");
    return stored && isReadyTypingLayout(stored as Parameters<typeof isReadyTypingLayout>[0])
      ? stored as ReadyTypingLayoutId
      : "bhashayantra-smart";
  });
  const [typingMode, setTypingMode] = useState<TypingMode>(() => {
    const stored = localStorage.getItem("bhashayantra-typing-layout");
    return stored === "classic-hindi" || stored === "inscript" ? "advanced" : "simple";
  });
  const [displayFont, setDisplayFont] = useState<UnicodeDisplayFontId>(() => {
    if (localStorage.getItem("bhashayantra-typing-layout") === "english-qwerty") return "segoe-ui";
    const stored = localStorage.getItem("bhashayantra-display-font");
    return stored === "mangal" || stored === "nirmala-ui" ? stored : "noto-devanagari";
  });
  const [outputMode, setOutputMode] = useState<TypingOutputMode>(() => localStorage.getItem("bhashayantra-typing-layout") !== "english-qwerty" && localStorage.getItem("bhashayantra-output-mode") === "legacy" ? "legacy" : "unicode");
  const [activeNav, setActiveNav] = useState<NavId>("start");
  const [startTool, setStartTool] = useState<StartTool>("typing");
  const [shortcutQuery, setShortcutQuery] = useState("");
  const [characterTab, setCharacterTab] = useState<CharacterTab>("स्वर");
  const [typingDrafts, setTypingDrafts] = useState<Record<ReadyTypingLayoutId, string>>(() => ({
    "bhashayantra-smart": localStorage.getItem("bhashayantra-smart-draft") ?? "",
    "classic-hindi": localStorage.getItem("bhashayantra-classic-draft") ?? localStorage.getItem("bhashayantra-typing-draft") ?? "",
    inscript: localStorage.getItem("bhashayantra-inscript-draft") ?? "",
    "english-qwerty": localStorage.getItem("bhashayantra-english-draft") ?? "",
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
  useEffect(() => localStorage.setItem("bhashayantra-typing-language", typingLanguage), [typingLanguage]);
  useEffect(() => localStorage.setItem("bhashayantra-typing-layout", typingLayout), [typingLayout]);
  useEffect(() => localStorage.setItem("bhashayantra-display-font", displayFont), [displayFont]);
  useEffect(() => localStorage.setItem("bhashayantra-output-mode", outputMode), [outputMode]);
  useEffect(() => localStorage.setItem("bhashayantra-smart-draft", typingDrafts["bhashayantra-smart"]), [typingDrafts]);
  useEffect(() => localStorage.setItem("bhashayantra-classic-draft", typingDrafts["classic-hindi"]), [typingDrafts]);
  useEffect(() => localStorage.setItem("bhashayantra-inscript-draft", typingDrafts.inscript), [typingDrafts]);
  useEffect(() => localStorage.setItem("bhashayantra-english-draft", typingDrafts["english-qwerty"]), [typingDrafts]);
  useEffect(() => localStorage.setItem("bhashayantra-custom-shortcuts", JSON.stringify(customShortcuts)), [customShortcuts]);
  useEffect(() => localStorage.setItem("bhashayantra-custom-mappings", JSON.stringify(customMappings)), [customMappings]);

  const activeCustomShortcuts = useMemo(
    () => customShortcuts.filter((shortcut) => (shortcut.layoutId ?? "classic-hindi") === typingLayout),
    [customShortcuts, typingLayout],
  );
  const activeCustomMappings = useMemo(
    () => customMappings.filter((mapping) => (mapping.layoutId ?? "classic-hindi") === typingLayout),
    [customMappings, typingLayout],
  );
  const shortcuts = useMemo(
    () => typingLanguage === "hi" ? [...DEFAULT_SHORTCUTS, ...activeCustomShortcuts] : activeCustomShortcuts,
    [activeCustomShortcuts, typingLanguage],
  );
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
    setTypingLanguage("hi");
    setTypingMode(mode);
    setTypingLayout(mode === "simple" ? "bhashayantra-smart" : "classic-hindi");
    setDisplayFont((current) => current === "segoe-ui" ? "noto-devanagari" : current);
    setStartTool("typing");
    if (mode === "advanced") {
      setAdvancedOpen(true);
      scrollToAdvancedManager();
    } else {
      setAdvancedOpen(false);
    }
  }

  function chooseTypingLayout(layout: ReadyTypingLayoutId) {
    setTypingLayout(layout);
    const language = layout === "english-qwerty" ? "en" : "hi";
    setTypingLanguage(language);
    setTypingMode(layout === "bhashayantra-smart" || layout === "english-qwerty" ? "simple" : "advanced");
    setDisplayFont((current) => {
      if (language === "en") return "segoe-ui";
      return current === "segoe-ui" ? "noto-devanagari" : current;
    });
    if (language === "en") setOutputMode("unicode");
    setActiveNav("start");
    setStartTool("typing");
    setAdvancedOpen(false);
  }

  function chooseTypingLanguage(language: TypingLanguageCode) {
    setTypingLanguage(language);
    if (language === "en") {
      setTypingLayout("english-qwerty");
      setTypingMode("simple");
      setOutputMode("unicode");
      setDisplayFont("segoe-ui");
    } else {
      setTypingLayout("bhashayantra-smart");
      setTypingMode("simple");
      setDisplayFont("noto-devanagari");
    }
    setActiveNav("start");
    setStartTool("typing");
    setAdvancedOpen(false);
  }

  function updateTypingSource(value: string) {
    setTypingDrafts((current) => ({ ...current, [typingLayout]: value }));
  }

  function replaceActiveCustomShortcuts(next: readonly ShortcutDefinition[]) {
    const inactive = customShortcuts.filter((shortcut) => (shortcut.layoutId ?? "classic-hindi") !== typingLayout);
    setCustomShortcuts([...inactive, ...next.map((shortcut) => ({ ...shortcut, layoutId: typingLayout }))]);
  }

  function replaceActiveCustomMappings(next: readonly CustomKeyMapping[]) {
    const inactive = customMappings.filter((mapping) => (mapping.layoutId ?? "classic-hindi") !== typingLayout);
    setCustomMappings([...inactive, ...next.map((mapping) => ({ ...mapping, layoutId: typingLayout }))]);
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
        typingLanguage={typingLanguage} onTypingLanguageChange={chooseTypingLanguage}
        typingLayout={typingLayout} onTypingLayoutChange={chooseTypingLayout}
        displayFont={displayFont} onDisplayFontChange={setDisplayFont}
        outputMode={outputMode} onOutputModeChange={setOutputMode}
      />

      <div className={activeNav === "test" ? "app-body exam-active" : "app-body"}>
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
          {activeNav === "start" && typingLanguage === "hi" && (
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
                  mode={typingMode} layout={typingLayout} displayFont={displayFont} outputMode={outputMode} source={typingSource} onSourceChange={updateTypingSource}
                  shortcuts={shortcuts} customShortcuts={activeCustomShortcuts} onCustomShortcutsChange={replaceActiveCustomShortcuts}
                  customMappings={activeCustomMappings} onCustomMappingsChange={replaceActiveCustomMappings}
                  advancedOpen={advancedOpen} onAdvancedOpenChange={setAdvancedOpen}
                />
              ) : <ExchangeConverter />}
              {typingLanguage === "hi" && <CharacterBrowser activeTab={characterTab} onTabChange={setCharacterTab} onInsertCharacter={insertCharacter} onOpenAll={() => setCharacterLibraryOpen(true)} />}
            </>
          ) : activeNav === "practice" ? (
            <TypingTraining kind="practice" layout={typingLayout} displayFont={displayFont} />
          ) : activeNav === "test" ? (
            <TypingMockExam layout={typingLayout} displayFont={displayFont} />
          ) : <FeaturePlaceholder title={activeNavLabel} onReturn={() => setActiveNav("start")} />}
        </section>

        {activeNav !== "test" && (
          <aside className="right-rail" aria-label={t("shortcutManager")}>
            {typingLanguage === "hi" && <ShortcutManager query={shortcutQuery} onQueryChange={setShortcutQuery} shortcuts={filteredShortcuts} onInsert={insertCharacter} onOpen={() => setShortcutLibraryOpen(true)} />}
            <DocumentConverter onOpen={() => { setActiveNav("start"); setStartTool("converter"); }} />
            <TypingSummary onOpen={() => setActiveNav("test")} />
          </aside>
        )}
      </div>

      {characterLibraryOpen && <CharacterLibraryModal onClose={() => setCharacterLibraryOpen(false)} onInsert={insertCharacter} />}
      {shortcutLibraryOpen && (
        <ShortcutLibraryModal
          shortcuts={shortcuts} customShortcuts={activeCustomShortcuts}
          onCustomShortcutsChange={replaceActiveCustomShortcuts} onInsert={insertCharacter}
          onManage={openAdvancedManager} onClose={() => setShortcutLibraryOpen(false)}
        />
      )}
    </main>
  );
}

function TopBar({ theme, onThemeChange, typingLanguage, onTypingLanguageChange, typingLayout, onTypingLayoutChange, displayFont, onDisplayFontChange, outputMode, onOutputModeChange }: {
  readonly theme: Theme; readonly onThemeChange: (theme: Theme) => void;
  readonly typingLanguage: TypingLanguageCode; readonly onTypingLanguageChange: (language: TypingLanguageCode) => void;
  readonly typingLayout: ReadyTypingLayoutId; readonly onTypingLayoutChange: (layout: ReadyTypingLayoutId) => void;
  readonly displayFont: UnicodeDisplayFontId; readonly onDisplayFontChange: (font: UnicodeDisplayFontId) => void;
  readonly outputMode: TypingOutputMode; readonly onOutputModeChange: (mode: TypingOutputMode) => void;
}) {
  const { language, setLanguage, t } = useI18n();
  return (
    <header className="topbar">
      <div className="brand"><span className="brand-mark" aria-hidden="true">भ</span><strong>BhashaYantra</strong></div>
      <div className="top-controls">
        <label><span>{t("language")}:</span><select value={language} aria-label={t("language")} onChange={(event) => setLanguage(event.target.value as "hi" | "en")}><option value="hi">{t("hindi")}</option><option value="en">{t("english")}</option></select></label>
        <span className="top-divider" />
        <label><Globe2 aria-hidden="true" /><span>{t("typingLanguage")}:</span><select value={typingLanguage} aria-label={t("typingLanguage")} onChange={(event) => onTypingLanguageChange(event.target.value as TypingLanguageCode)}><option value="hi">{t("hindi")}</option><option value="en">{t("english")}</option></select></label>
        <span className="top-divider" />
        <label><Keyboard aria-hidden="true" /><span>{t("layout")}:</span><select value={typingLayout} aria-label={t("layout")} onChange={(event) => onTypingLayoutChange(event.target.value as ReadyTypingLayoutId)}>{layoutsForLanguage(typingLanguage).map((profile) => <option key={profile.id} value={profile.id} disabled={profile.readiness !== "ready"}>{profile.name}{profile.readiness === "validation" ? ` — ${t("validationPending")}` : ""}</option>)}</select></label>
        <span className="top-divider" />
        <label><span>{t("output")}:</span><select value={outputMode} aria-label={t("output")} onChange={(event) => onOutputModeChange(event.target.value as TypingOutputMode)}><option value="unicode">{t("unicode")}</option><option value="legacy" disabled={typingLanguage === "en"}>{t("legacy")}</option></select></label>
        <label><span>{t("displayFont")}:</span><select value={displayFont} aria-label={t("displayFont")} onChange={(event) => onDisplayFontChange(event.target.value as UnicodeDisplayFontId)}>{displayFontsForLanguage(typingLanguage).map((font) => <option key={font.id} value={font.id}>{font.name}</option>)}</select></label>
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

function DocumentConverter({ onOpen }: { readonly onOpen: () => void }) {
  const { t } = useI18n();
  return (
    <Card className="rail-card document-card">
      <div className="rail-card-title document-title"><span className="green-icon"><FileText aria-hidden="true" /></span><strong>{t("documentConverter")}</strong></div>
      <div className="drop-zone"><CloudUpload aria-hidden="true" /><span>{t("documentEnginePlanned")}</span><small>{t("documentFormatsPlanned")}</small><button type="button" className="document-button" onClick={onOpen}><Sparkles aria-hidden="true" /> {t("openExchangeConverter")}</button><small>{t("supportedFonts")}</small></div>
    </Card>
  );
}

const trainingAttemptsRepository = new LocalTrainingAttemptsRepository();

function TypingSummary({ onOpen }: { readonly onOpen: () => void }) {
  const { t } = useI18n();
  const [attempts, setAttempts] = useState<readonly TrainingAttempt[]>([]);
  const summary = useMemo(() => summarizeTrainingAttempts(attempts), [attempts]);
  const trendPoints = useMemo(() => {
    if (summary.recentWpm.length < 2) return "";
    const highest = Math.max(1, ...summary.recentWpm);
    return summary.recentWpm.map((value, index) => {
      const x = (index / (summary.recentWpm.length - 1)) * 360;
      const y = 60 - (value / highest) * 48;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  }, [summary.recentWpm]);

  useEffect(() => {
    function load() {
      void trainingAttemptsRepository.list().then(setAttempts);
    }
    load();
    window.addEventListener(TRAINING_ATTEMPTS_UPDATED_EVENT, load);
    return () => window.removeEventListener(TRAINING_ATTEMPTS_UPDATED_EVENT, load);
  }, []);

  return (
    <Card className="rail-card typing-summary">
      <div className="rail-card-title"><span className="summary-title"><BarChart3 aria-hidden="true" /> {t("attemptHistory")}</span><button type="button" onClick={onOpen}>{t("viewHistory")}</button></div>
      <div className="metric-grid"><Metric label={t("bestWpm")} value={summary.attemptCount ? String(summary.bestWpm) : "—"} note={`${summary.attemptCount} ${t("attempts")}`} /><Metric label={t("averageAccuracy")} value={summary.attemptCount ? `${summary.averageAccuracy}%` : "—"} note={`${summary.completedExerciseCount} ${t("completedExercises")}`} /><Metric label={t("bestKdph")} value={summary.attemptCount ? String(summary.bestKdph) : "—"} note={t("autosavedOffline")} /></div>
      {trendPoints ? <svg className="trend-chart" viewBox="0 0 360 68" role="img" aria-label={t("typingTest")}><polyline points={trendPoints} fill="none" stroke="#0b63f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg> : <p className="summary-empty">{t("noAttempts")}</p>}
    </Card>
  );
}

function Metric({ label, value, note }: { readonly label: string; readonly value: string; readonly note: string }) { return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }

function FeaturePlaceholder({ title, onReturn }: { readonly title: string; readonly onReturn: () => void }) {
  const { t } = useI18n();
  return <section className="feature-placeholder"><Upload aria-hidden="true" /><h1>{title}</h1><p>{t("modulePending")}</p><Button onClick={onReturn}>{t("returnToTyping")}</Button></section>;
}
