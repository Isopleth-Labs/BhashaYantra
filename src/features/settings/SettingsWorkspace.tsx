import { useState } from "react";
import {
  BellRing,
  Check,
  ChevronRight,
  Database,
  Info,
  Keyboard,
  Languages,
  LockKeyhole,
  Monitor,
  Palette,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Volume2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { TypingOutputMode } from "@/domain/typing/typing-engine";
import {
  displayFontsForLanguage,
  layoutsForLanguage,
  type ReadyTypingLayoutId,
  type TypingLanguageCode,
  type UnicodeDisplayFontId,
} from "@/domain/typing/typing-profiles";
import { useI18n, type InterfaceLanguage } from "@/i18n/I18nProvider";

export type AppTheme = "light" | "dark";

interface SettingsWorkspaceProps {
  readonly theme: AppTheme;
  readonly onThemeChange: (theme: AppTheme) => void;
  readonly typingLanguage: TypingLanguageCode;
  readonly onTypingLanguageChange: (language: TypingLanguageCode) => void;
  readonly typingLayout: ReadyTypingLayoutId;
  readonly onTypingLayoutChange: (layout: ReadyTypingLayoutId) => void;
  readonly displayFont: UnicodeDisplayFontId;
  readonly onDisplayFontChange: (font: UnicodeDisplayFontId) => void;
  readonly outputMode: TypingOutputMode;
  readonly onOutputModeChange: (mode: TypingOutputMode) => void;
  readonly onOpenPricing: () => void;
  readonly onResetPreferences: () => void;
}

function loadBoolean(key: string, fallback: boolean) {
  const value = localStorage.getItem(key);
  return value === null ? fallback : value === "true";
}

function SettingsToggle({ checked, onChange, label, description }: { readonly checked: boolean; readonly onChange: (checked: boolean) => void; readonly label: string; readonly description: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="settings-toggle-row" onClick={() => onChange(!checked)}>
      <span><strong>{label}</strong><small>{description}</small></span>
      <i className={checked ? "settings-switch active" : "settings-switch"}><b /></i>
    </button>
  );
}

export function SettingsWorkspace({
  theme,
  onThemeChange,
  typingLanguage,
  onTypingLanguageChange,
  typingLayout,
  onTypingLayoutChange,
  displayFont,
  onDisplayFontChange,
  outputMode,
  onOutputModeChange,
  onOpenPricing,
  onResetPreferences,
}: SettingsWorkspaceProps) {
  const { language, setLanguage } = useI18n();
  const [soundOnError, setSoundOnError] = useState(() => loadBoolean("bhashayantra:training:sound-v2", true));
  const [showKeyboard, setShowKeyboard] = useState(() => loadBoolean("bhashayantra:training:keyboard-v2", false));
  const [moveOnError, setMoveOnError] = useState(() => loadBoolean("bhashayantra:training:move-on-error-v2", false));
  const [savedMessage, setSavedMessage] = useState("Preferences are saved automatically on this device.");

  function saveBoolean(key: string, value: boolean, setter: (value: boolean) => void) {
    setter(value);
    localStorage.setItem(key, String(value));
    setSavedMessage("Saved locally just now.");
  }

  function resetPreferences() {
    if (!window.confirm("Reset interface, typing, and training preferences to their defaults? Saved drafts and attempt history will stay untouched.")) return;
    onResetPreferences();
    setLanguage("en");
    setSoundOnError(true);
    setShowKeyboard(false);
    setMoveOnError(false);
    localStorage.setItem("bhashayantra:training:sound-v2", "true");
    localStorage.setItem("bhashayantra:training:keyboard-v2", "false");
    localStorage.setItem("bhashayantra:training:move-on-error-v2", "false");
    setSavedMessage("Default preferences restored. Drafts and history were preserved.");
  }

  return (
    <section className="settings-page">
      <header className="settings-hero">
        <div><span className="page-eyebrow"><Monitor /> CONTROL CENTER</span><h1>Settings</h1><p>Configure your language engine, learning experience, appearance, and local data.</p></div>
        <span className="settings-saved"><Check /> {savedMessage}</span>
      </header>

      <div className="settings-layout">
        <nav className="settings-index" aria-label="Settings sections">
          <a href="#general-settings"><Languages /> General <ChevronRight /></a>
          <a href="#typing-settings"><Keyboard /> Typing engine <ChevronRight /></a>
          <a href="#training-settings"><Volume2 /> Training <ChevronRight /></a>
          <a href="#privacy-settings"><ShieldCheck /> Privacy & data <ChevronRight /></a>
          <button type="button" onClick={onOpenPricing}><Sparkles /> BhashaYantra Pro <ChevronRight /></button>
        </nav>

        <div className="settings-sections">
          <article id="general-settings" className="settings-card">
            <div className="settings-card-title"><span><Languages /><b>General</b></span><small>Interface and appearance</small></div>
            <div className="settings-control-grid">
              <label><span>Interface language</span><small>Language used for navigation and labels.</small><select value={language} onChange={(event) => setLanguage(event.target.value as InterfaceLanguage)}><option value="en">English</option><option value="hi">Hindi</option></select></label>
              <div className="settings-field"><span>Appearance</span><small>Choose the application theme.</small><div className="theme-choice"><button type="button" className={theme === "light" ? "active" : ""} onClick={() => onThemeChange("light")}><Palette /> Light</button><button type="button" className={theme === "dark" ? "active" : ""} onClick={() => onThemeChange("dark")}><Monitor /> Dark</button></div></div>
            </div>
          </article>

          <article id="typing-settings" className="settings-card">
            <div className="settings-card-title"><span><Keyboard /><b>Typing engine defaults</b></span><small>Used whenever BhashaYantra starts</small></div>
            <div className="settings-control-grid three">
              <label><span>Typing language</span><small>Choose the active writing language.</small><select value={typingLanguage} onChange={(event) => onTypingLanguageChange(event.target.value as TypingLanguageCode)}><option value="hi">Hindi</option><option value="en">English</option></select></label>
              <label><span>Keyboard layout</span><small>Physical key mapping and composition rules.</small><select value={typingLayout} onChange={(event) => onTypingLayoutChange(event.target.value as ReadyTypingLayoutId)}>{layoutsForLanguage(typingLanguage).map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label>
              <label><span>Display font</span><small>Changes preview only, not Unicode content.</small><select value={displayFont} onChange={(event) => onDisplayFontChange(event.target.value as UnicodeDisplayFontId)}>{displayFontsForLanguage(typingLanguage).map((font) => <option key={font.id} value={font.id}>{font.name}</option>)}</select></label>
              <label><span>Default output</span><small>Unicode is recommended for modern applications.</small><select value={outputMode} onChange={(event) => onOutputModeChange(event.target.value as TypingOutputMode)}><option value="unicode">Unicode</option><option value="legacy" disabled={typingLanguage === "en"}>Legacy / KrutiDev</option></select></label>
            </div>
          </article>

          <article id="training-settings" className="settings-card">
            <div className="settings-card-title"><span><BellRing /><b>Practice and exam feedback</b></span><small>Applied to new training sessions</small></div>
            <div className="settings-toggle-list">
              <SettingsToggle checked={soundOnError} onChange={(value) => saveBoolean("bhashayantra:training:sound-v2", value, setSoundOnError)} label="Sound on error" description="Play a short local cue when a wrong key is entered." />
              <SettingsToggle checked={showKeyboard} onChange={(value) => saveBoolean("bhashayantra:training:keyboard-v2", value, setShowKeyboard)} label="Show on-screen keyboard" description="Open new practice sessions with the layout keyboard visible." />
              <SettingsToggle checked={moveOnError} onChange={(value) => saveBoolean("bhashayantra:training:move-on-error-v2", value, setMoveOnError)} label="Continue after an error" description="Advance to the next character instead of blocking the lesson." />
            </div>
          </article>

          <article id="privacy-settings" className="settings-card">
            <div className="settings-card-title"><span><LockKeyhole /><b>Privacy and local data</b></span><small>Offline-first by design</small></div>
            <div className="privacy-status-grid">
              <span><Database /><b>Local workspace</b><small>Drafts, settings, lessons, and attempts stay on this Windows device.</small></span>
              <span><ShieldCheck /><b>No training telemetry</b><small>No typing content is uploaded unless you explicitly use a cloud service.</small></span>
              <span><Info /><b>Cloud features are optional</b><small>Translation and future sync require a provider configured by the user.</small></span>
            </div>
            <div className="settings-danger-row"><span><strong>Reset preferences</strong><small>Restores defaults without deleting drafts or attempt history.</small></span><Button variant="outline" onClick={resetPreferences}><RotateCcw /> Reset preferences</Button></div>
          </article>
        </div>

        <aside className="settings-pro-panel">
          <span className="pro-orbit"><Sparkles /></span>
          <small>BHASHAYANTRA PRO</small>
          <h2>Build exam-ready speed with the complete toolkit.</h2>
          <ul><li><Check /> All 2,820 exercises</li><li><Check /> Stenography Studio</li><li><Check /> Advanced reports</li><li><Check /> Every converter and layout</li></ul>
          <Button size="lg" onClick={onOpenPricing}>View plans</Button>
          <p>Plan selection is available. Payment remains disabled in this development build.</p>
        </aside>
      </div>
    </section>
  );
}
