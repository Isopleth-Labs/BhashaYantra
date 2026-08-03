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
import { ExchangeConverter } from "@/features/converter/ExchangeConverter";

const navItems = [
  { label: "Start Typing", icon: Home },
  { label: "Convert Document", icon: FileText },
  { label: "Typing Practice", icon: BookOpen },
  { label: "Typing Test", icon: Gauge },
  { label: "Stenography", icon: Mic2 },
] as const;

const characters = [
  ["अ", "a"],
  ["आ", "aa"],
  ["इ", "i"],
  ["ई", "ee"],
  ["उ", "u"],
  ["ऊ", "oo"],
  ["ऋ", "ri"],
  ["ए", "e"],
  ["ऐ", "ai"],
  ["ओ", "o"],
  ["औ", "au"],
  ["अं", "am"],
  ["अः", "ah"],
] as const;

const shortcuts = [
  ["क्ष", "Ctrl + Alt + K"],
  ["त्र", "Ctrl + Alt + T"],
  ["ज्ञ", "Ctrl + Alt + G"],
  ["श्र", "Ctrl + Alt + S"],
] as const;

type Theme = "light" | "dark";
type TypingMode = "simple" | "advanced";

export default function App() {
  const [theme, setTheme] = useState<Theme>(() =>
    localStorage.getItem("bhashayantra-theme") === "dark" ? "dark" : "light",
  );
  const [typingMode, setTypingMode] = useState<TypingMode>("simple");
  const [activeNav, setActiveNav] = useState("Start Typing");
  const [shortcutQuery, setShortcutQuery] = useState("");
  const [characterTab, setCharacterTab] = useState("स्वर");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("bhashayantra-theme", theme);
  }, [theme]);

  const filteredShortcuts = useMemo(() => {
    const query = shortcutQuery.trim().toLocaleLowerCase();
    if (!query) return shortcuts;
    return shortcuts.filter(([character, shortcut]) =>
      `${character} ${shortcut}`.toLocaleLowerCase().includes(query),
    );
  }, [shortcutQuery]);

  return (
    <main className="app-frame">
      <TopBar theme={theme} onThemeChange={setTheme} />

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
          <div className="mode-switch" role="group" aria-label="Typing mode">
            <button
              type="button"
              className={typingMode === "simple" ? "mode-card active" : "mode-card"}
              onClick={() => setTypingMode("simple")}
            >
              <Sparkles aria-hidden="true" />
              <span>
                <strong>Simple Smart Mode</strong>
                <small>Type easily. No codes to remember.</small>
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
                <small>Use shortcuts & custom mappings.</small>
              </span>
            </button>
          </div>

          {activeNav === "Start Typing" ? (
            <>
              <ExchangeConverter />
              <CharacterBrowser
                activeTab={characterTab}
                onTabChange={setCharacterTab}
              />
            </>
          ) : (
            <FeaturePlaceholder title={activeNav} />
          )}
        </section>

        <aside className="right-rail" aria-label="Quick tools">
          <ShortcutManager
            query={shortcutQuery}
            onQueryChange={setShortcutQuery}
            shortcuts={filteredShortcuts}
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
}: {
  readonly theme: Theme;
  readonly onThemeChange: (theme: Theme) => void;
}) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          भ
        </span>
        <strong>BhashaYantra</strong>
      </div>

      <div className="top-controls">
        <label>
          <span>Language:</span>
          <select defaultValue="Hindi" aria-label="Language">
            <option>Hindi</option>
          </select>
        </label>
        <span className="top-divider" />
        <label>
          <Keyboard aria-hidden="true" />
          <span>Layout:</span>
          <select defaultValue="Classic Hindi" aria-label="Keyboard layout">
            <option>Classic Hindi</option>
          </select>
        </label>
        <span className="top-divider" />
        <label>
          <span>Output:</span>
          <select defaultValue="Unicode" aria-label="Output format">
            <option>Unicode</option>
            <option>Legacy</option>
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
        <Button variant="ghost" size="icon" aria-label="Menu">
          <Menu aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Help">
          <CircleHelp aria-hidden="true" />
        </Button>
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
}: {
  readonly activeTab: string;
  readonly onTabChange: (tab: string) => void;
}) {
  const tabs = ["स्वर", "व्यंजन", "मात्राएँ", "संयुक्त अक्षर", "विशेष चिन्ह"];

  async function copyCharacter(character: string) {
    await navigator.clipboard.writeText(character).catch(() => undefined);
  }

  return (
    <section className="character-browser" aria-label="Character browser">
      <div className="character-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            key={tab}
            onClick={() => onTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="character-grid">
        {characters.map(([character, roman]) => (
          <button
            type="button"
            key={character}
            onClick={() => copyCharacter(character)}
            title={`Copy ${character}`}
          >
            <strong>{character}</strong>
            <small>{roman}</small>
          </button>
        ))}
      </div>
      <Button variant="outline" size="sm">
        View All Characters <ChevronRight aria-hidden="true" />
      </Button>
    </section>
  );
}

function ShortcutManager({
  query,
  onQueryChange,
  shortcuts: visibleShortcuts,
}: {
  readonly query: string;
  readonly onQueryChange: (value: string) => void;
  readonly shortcuts: readonly (readonly [string, string])[];
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
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search character or shortcut"
        />
      </label>
      <div className="shortcut-table" role="table">
        <div className="shortcut-row shortcut-header" role="row">
          <span role="columnheader">Character</span>
          <span role="columnheader">Shortcut</span>
        </div>
        {visibleShortcuts.map(([character, shortcut]) => (
          <div className="shortcut-row" role="row" key={character}>
            <strong role="cell">{character}</strong>
            <span role="cell">{shortcut}</span>
          </div>
        ))}
      </div>
      <button type="button" className="rail-link">
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
      <label
        className="drop-zone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          receiveFiles(event.dataTransfer.files);
        }}
      >
        <CloudUpload aria-hidden="true" />
        <span>{fileName ?? "Drop legacy file here"}</span>
        <small>(.txt, .rtf, .doc, .docx)</small>
        <input
          type="file"
          accept=".txt,.rtf,.doc,.docx"
          hidden
          onChange={(event) => receiveFiles(event.target.files)}
        />
        <span className="document-button">
          <Sparkles aria-hidden="true" /> Convert to Unicode
        </span>
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
        <defs>
          <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0b63f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <path d="M0 51 L36 34 L78 46 L121 29 L164 21 L210 37 L258 45 L311 28 L360 25 L360 68 L0 68 Z" fill="url(#chart-fill)" />
        <path d="M0 51 L36 34 L78 46 L121 29 L164 21 L210 37 L258 45 L311 28 L360 25" fill="none" stroke="#0b63f6" strokeWidth="2" />
        {["0,51", "36,34", "78,46", "121,29", "164,21", "210,37", "258,45", "311,28", "360,25"].map((point) => {
          const [cx, cy] = point.split(",");
          return <circle key={point} cx={cx} cy={cy} r="3.5" fill="#0b63f6" />;
        })}
      </svg>
    </Card>
  );
}

function Metric({ label, value, note }: { readonly label: string; readonly value: string; readonly note: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function FeaturePlaceholder({ title }: { readonly title: string }) {
  return (
    <section className="feature-placeholder">
      <Upload aria-hidden="true" />
      <h1>{title}</h1>
      <p>This module has its architecture contract ready and will be implemented in its roadmap phase.</p>
      <Button onClick={() => window.location.reload()}>Return to Start Typing</Button>
    </section>
  );
}
