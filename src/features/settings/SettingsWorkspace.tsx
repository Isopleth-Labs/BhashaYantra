import { useState, type ReactNode } from "react";
import {
  AppWindow,
  BellRing,
  BookOpenCheck,
  Building2,
  Check,
  ChevronRight,
  Database,
  FileCheck2,
  Gauge,
  GraduationCap,
  Headphones,
  Info,
  Keyboard,
  Languages,
  LockKeyhole,
  Monitor,
  Palette,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UserRound,
  Volume2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ACTIVE_WORKSPACE_ROLE_KEY,
  DEFAULT_INSTITUTE_WORKSPACE,
  DEFAULT_STUDENT_WORKSPACE,
  INSTITUTE_WORKSPACE_KEY,
  isAccountWorkspaceRole,
  readStoredObject,
  sanitizeSeatLimit,
  STUDENT_WORKSPACE_KEY,
  WORKSPACE_PERMISSIONS,
  type AccountWorkspaceRole,
  type InstituteWorkspaceProfile,
  type StudentWorkspaceProfile,
} from "@/domain/accounts/account-workspaces";
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
type SettingsSection = "account" | "appearance" | "typing" | "practice" | "exam" | "stenography" | "direct-typing" | "privacy" | "about";

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

function SettingsCard({ icon, title, description, children }: { readonly icon: ReactNode; readonly title: string; readonly description: string; readonly children: ReactNode }) {
  return <article className="settings-card"><div className="settings-card-title"><span>{icon}<b>{title}</b></span><small>{description}</small></div>{children}</article>;
}

const SETTINGS_SECTIONS: readonly { id: SettingsSection; label: string; icon: ReactNode }[] = [
  { id: "account", label: "Account & workspace", icon: <UserRound /> },
  { id: "appearance", label: "Appearance & language", icon: <Languages /> },
  { id: "typing", label: "Typing engine", icon: <Keyboard /> },
  { id: "practice", label: "Practice", icon: <BookOpenCheck /> },
  { id: "exam", label: "Exam workstation", icon: <Gauge /> },
  { id: "stenography", label: "Stenography", icon: <Headphones /> },
  { id: "direct-typing", label: "Direct Typing & apps", icon: <AppWindow /> },
  { id: "privacy", label: "Data & privacy", icon: <ShieldCheck /> },
  { id: "about", label: "About", icon: <Info /> },
] as const;

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
  const [section, setSection] = useState<SettingsSection>("account");
  const [role, setRole] = useState<AccountWorkspaceRole>(() => {
    const value = localStorage.getItem(ACTIVE_WORKSPACE_ROLE_KEY);
    return isAccountWorkspaceRole(value) ? value : "student";
  });
  const [student, setStudent] = useState(() => readStoredObject(STUDENT_WORKSPACE_KEY, DEFAULT_STUDENT_WORKSPACE));
  const [institute, setInstitute] = useState(() => readStoredObject(INSTITUTE_WORKSPACE_KEY, DEFAULT_INSTITUTE_WORKSPACE));
  const [soundOnError, setSoundOnError] = useState(() => loadBoolean("bhashayantra:training:sound-v2", true));
  const [showKeyboard, setShowKeyboard] = useState(() => loadBoolean("bhashayantra:training:keyboard-v2", false));
  const [moveOnError, setMoveOnError] = useState(() => loadBoolean("bhashayantra:training:move-on-error-v2", false));
  const [examSound, setExamSound] = useState(() => loadBoolean("bhashayantra:exam:sound-v2", true));
  const [examConfirm, setExamConfirm] = useState(() => loadBoolean("bhashayantra:exam:confirm-submit-v1", true));
  const [examAutoScroll, setExamAutoScroll] = useState(() => loadBoolean("bhashayantra:exam:auto-scroll-v1", true));
  const [stenoCountdown, setStenoCountdown] = useState(() => loadBoolean("bhashayantra:steno:countdown-v1", true));
  const [stenoVoice, setStenoVoice] = useState(() => loadBoolean("bhashayantra:steno:voice-v1", true));
  const [directTypingAtStartup, setDirectTypingAtStartup] = useState(() => loadBoolean("bhashayantra:direct:start-v1", false));
  const [crashReports, setCrashReports] = useState(() => loadBoolean("bhashayantra:privacy:crash-v1", false));
  const [savedMessage, setSavedMessage] = useState("Preferences are saved automatically on this device.");

  function saveBoolean(key: string, value: boolean, setter: (value: boolean) => void) {
    setter(value);
    localStorage.setItem(key, String(value));
    setSavedMessage("Saved locally just now.");
  }

  function chooseRole(nextRole: AccountWorkspaceRole) {
    setRole(nextRole);
    localStorage.setItem(ACTIVE_WORKSPACE_ROLE_KEY, nextRole);
    setSavedMessage(`${nextRole === "student" ? "Student" : "Institute"} workspace selected.`);
  }

  function saveStudent(patch: Partial<StudentWorkspaceProfile>) {
    const next = { ...student, ...patch };
    setStudent(next);
    localStorage.setItem(STUDENT_WORKSPACE_KEY, JSON.stringify(next));
    setSavedMessage("Student workspace saved locally.");
  }

  function saveInstitute(patch: Partial<InstituteWorkspaceProfile>) {
    const next = { ...institute, ...patch, seatLimit: sanitizeSeatLimit(patch.seatLimit ?? institute.seatLimit) };
    setInstitute(next);
    localStorage.setItem(INSTITUTE_WORKSPACE_KEY, JSON.stringify(next));
    setSavedMessage("Institute workspace saved locally.");
  }

  function resetPreferences() {
    if (!window.confirm("Reset interface, typing, and training preferences to their defaults? Account workspaces, drafts, and attempt history will stay untouched.")) return;
    onResetPreferences();
    setLanguage("en");
    setSoundOnError(true);
    setShowKeyboard(false);
    setMoveOnError(false);
    setExamSound(true);
    setExamConfirm(true);
    setExamAutoScroll(true);
    setStenoCountdown(true);
    setStenoVoice(true);
    setDirectTypingAtStartup(false);
    setCrashReports(false);
    const defaults: readonly [string, boolean][] = [
      ["bhashayantra:training:sound-v2", true], ["bhashayantra:training:keyboard-v2", false], ["bhashayantra:training:move-on-error-v2", false],
      ["bhashayantra:exam:sound-v2", true], ["bhashayantra:exam:confirm-submit-v1", true], ["bhashayantra:exam:auto-scroll-v1", true],
      ["bhashayantra:steno:countdown-v1", true], ["bhashayantra:steno:voice-v1", true], ["bhashayantra:direct:start-v1", false], ["bhashayantra:privacy:crash-v1", false],
    ];
    defaults.forEach(([key, value]) => localStorage.setItem(key, String(value)));
    setSavedMessage("Default preferences restored. Account data, drafts, and history were preserved.");
  }

  function renderSection() {
    if (section === "account") return (
      <>
        <SettingsCard icon={<UserRound />} title="Account and workspace" description="Student and institute data are stored separately">
          <div className="workspace-role-grid" role="radiogroup" aria-label="Workspace role">
            {(["student", "institute"] as const).map((item) => <button type="button" role="radio" aria-checked={role === item} className={role === item ? "active" : ""} onClick={() => chooseRole(item)} key={item}>{item === "student" ? <GraduationCap /> : <Building2 />}<span><strong>{item === "student" ? "Student workspace" : "Institute workspace"}</strong><small>{item === "student" ? "Personal learning, attempts, and exam targets" : "Batches, assignments, lab defaults, and reports"}</small></span>{role === item && <Check />}</button>)}
          </div>
        </SettingsCard>
        {role === "student" ? <SettingsCard icon={<GraduationCap />} title="Student profile" description="Private learning identity">
          <div className="settings-control-grid">
            <label><span>Student name</span><small>Shown on local result reports.</small><input value={student.displayName} onChange={(event) => saveStudent({ displayName: event.target.value })} placeholder="Your full name" /></label>
            <label><span>Candidate ID</span><small>Your institute or exam reference, optional.</small><input value={student.candidateId} onChange={(event) => saveStudent({ candidateId: event.target.value })} placeholder="e.g. STU-1042" /></label>
            <label><span>Target exam</span><small>Personalizes the dashboard and recommended practice.</small><select value={student.targetExam} onChange={(event) => saveStudent({ targetExam: event.target.value })}><option>SSC Stenographer</option><option>SSC CHSL / DEST</option><option>High Court Typing</option><option>RRB Typing Skill Test</option><option>General office typing</option></select></label>
            <label><span>Study language</span><small>Does not change the app interface.</small><select value={student.studyLanguage} onChange={(event) => saveStudent({ studyLanguage: event.target.value as "hi" | "en" })}><option value="hi">Hindi</option><option value="en">English</option></select></label>
          </div>
        </SettingsCard> : <SettingsCard icon={<Building2 />} title="Institute profile" description="Organization workspace preview">
          <div className="settings-control-grid">
            <label><span>Institute name</span><small>Organization displayed in institute reports.</small><input value={institute.instituteName} onChange={(event) => saveInstitute({ instituteName: event.target.value })} placeholder="Institute name" /></label>
            <label><span>Institute code</span><small>Unique joining code after server verification.</small><input value={institute.instituteCode} onChange={(event) => saveInstitute({ instituteCode: event.target.value.toUpperCase() })} placeholder="e.g. BY-JPR-01" /></label>
            <label><span>Administrator</span><small>Primary local admin contact.</small><input value={institute.administratorName} onChange={(event) => saveInstitute({ administratorName: event.target.value })} placeholder="Administrator name" /></label>
            <label><span>Planned seats</span><small>Used for plan estimation; no seats are activated yet.</small><input type="number" min={1} max={5000} value={institute.seatLimit} onChange={(event) => saveInstitute({ seatLimit: Number(event.target.value) })} /></label>
          </div>
          <div className="institute-module-preview"><span><b>Roster</b><small>Add students after sign-in is connected</small></span><span><b>Assignments</b><small>Publish courses and mock tests</small></span><span><b>Reports</b><small>View server-verified batch results</small></span></div>
        </SettingsCard>}
      </>
    );

    if (section === "appearance") return <SettingsCard icon={<Languages />} title="Appearance and language" description="Navigation, labels, and visual theme"><div className="settings-control-grid"><label><span>Interface language</span><small>Language used for navigation and labels.</small><select value={language} onChange={(event) => setLanguage(event.target.value as InterfaceLanguage)}><option value="en">English</option><option value="hi">Hindi</option></select></label><div className="settings-field"><span>Appearance</span><small>Choose the application theme.</small><div className="theme-choice"><button type="button" className={theme === "light" ? "active" : ""} onClick={() => onThemeChange("light")}><Palette /> Light</button><button type="button" className={theme === "dark" ? "active" : ""} onClick={() => onThemeChange("dark")}><Monitor /> Dark</button></div></div></div></SettingsCard>;

    if (section === "typing") return <SettingsCard icon={<Keyboard />} title="Typing engine defaults" description="Language, layout, font, and output"><div className="settings-control-grid"><label><span>Typing language</span><small>Choose the active writing language.</small><select value={typingLanguage} onChange={(event) => onTypingLanguageChange(event.target.value as TypingLanguageCode)}><option value="hi">Hindi</option><option value="en">English</option></select></label><label><span>Keyboard layout</span><small>Physical key mapping and composition rules.</small><select value={typingLayout} onChange={(event) => onTypingLayoutChange(event.target.value as ReadyTypingLayoutId)}>{layoutsForLanguage(typingLanguage).map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label><label><span>Display font</span><small>Changes preview only, not Unicode content.</small><select value={displayFont} onChange={(event) => onDisplayFontChange(event.target.value as UnicodeDisplayFontId)}>{displayFontsForLanguage(typingLanguage).map((font) => <option key={font.id} value={font.id}>{font.name}</option>)}</select></label><label><span>Default output</span><small>Unicode is recommended for modern applications.</small><select value={outputMode} onChange={(event) => onOutputModeChange(event.target.value as TypingOutputMode)}><option value="unicode">Unicode</option><option value="legacy" disabled={typingLanguage === "en"}>Legacy / KrutiDev</option></select></label></div></SettingsCard>;

    if (section === "practice") return <SettingsCard icon={<BookOpenCheck />} title="Practice preferences" description="Applied when a lesson starts"><div className="settings-toggle-list"><SettingsToggle checked={soundOnError} onChange={(value) => saveBoolean("bhashayantra:training:sound-v2", value, setSoundOnError)} label="Sound on error" description="Play a short local cue for a wrong key." /><SettingsToggle checked={showKeyboard} onChange={(value) => saveBoolean("bhashayantra:training:keyboard-v2", value, setShowKeyboard)} label="Show on-screen keyboard" description="Open lessons with layout and finger guidance visible." /><SettingsToggle checked={moveOnError} onChange={(value) => saveBoolean("bhashayantra:training:move-on-error-v2", value, setMoveOnError)} label="Continue after an error" description="Advance instead of blocking on the incorrect character." /></div></SettingsCard>;

    if (section === "exam") return <SettingsCard icon={<Gauge />} title="Exam workstation" description="Rules for new mock-test sessions"><div className="settings-toggle-list"><SettingsToggle checked={examSound} onChange={(value) => saveBoolean("bhashayantra:exam:sound-v2", value, setExamSound)} label="Error sound" description="Play feedback only when the selected exam profile allows it." /><SettingsToggle checked={examConfirm} onChange={(value) => saveBoolean("bhashayantra:exam:confirm-submit-v1", value, setExamConfirm)} label="Confirm before final submission" description="Prevent accidental early submission during practice profiles." /><SettingsToggle checked={examAutoScroll} onChange={(value) => saveBoolean("bhashayantra:exam:auto-scroll-v1", value, setExamAutoScroll)} label="Keep current passage line visible" description="Scroll only the passage panel; the page itself stays fixed." /></div><div className="settings-note"><FileCheck2 /><span><strong>Official-reference profiles remain read-only</strong><small>Duration, target speed, backspace rules, and layout requirements come from their linked notice. Always verify the current recruitment notice.</small></span></div></SettingsCard>;

    if (section === "stenography") return <SettingsCard icon={<Headphones />} title="Stenography sessions" description="Dictation and transcription behavior"><div className="settings-toggle-list"><SettingsToggle checked={stenoCountdown} onChange={(value) => saveBoolean("bhashayantra:steno:countdown-v1", value, setStenoCountdown)} label="Pre-dictation countdown" description="Give a three-second preparation cue before audio begins." /><SettingsToggle checked={stenoVoice} onChange={(value) => saveBoolean("bhashayantra:steno:voice-v1", value, setStenoVoice)} label="Local narration by default" description="Use an installed system voice for original BhashaYantra scripts." /></div><div className="settings-note"><Volume2 /><span><strong>Official-reference timing</strong><small>Dictation and transcription are separate phases. Transcript entry stays locked during dictation.</small></span></div></SettingsCard>;

    if (section === "direct-typing") return <SettingsCard icon={<AppWindow />} title="Direct Typing and Windows apps" description="Word, Excel, browser, and standard text fields"><div className="settings-toggle-list"><SettingsToggle checked={directTypingAtStartup} onChange={(value) => saveBoolean("bhashayantra:direct:start-v1", value, setDirectTypingAtStartup)} label="Enable Direct Typing at startup" description="Off by default so BhashaYantra never captures keys without a clear action." /></div><div className="settings-note"><LockKeyhole /><span><strong>Emergency shortcut</strong><small>Use Ctrl + Alt + F12 to turn Direct Typing off. Password and protected fields are excluded.</small></span></div></SettingsCard>;

    if (section === "privacy") return <SettingsCard icon={<LockKeyhole />} title="Data and privacy" description="Offline-first storage and optional services"><div className="privacy-status-grid"><span><Database /><b>Local workspace</b><small>Drafts, preferences, lessons, and attempts stay on this device.</small></span><span><ShieldCheck /><b>No typing telemetry</b><small>Typing content is not uploaded unless you choose a cloud feature.</small></span><span><Info /><b>Optional cloud</b><small>Translation and institute sync require configured providers.</small></span></div><div className="settings-toggle-list"><SettingsToggle checked={crashReports} onChange={(value) => saveBoolean("bhashayantra:privacy:crash-v1", value, setCrashReports)} label="Anonymous crash reports" description="Disabled by default. This development build does not upload reports." /></div><div className="settings-danger-row"><span><strong>Reset preferences</strong><small>Account workspaces, drafts, and attempt history are not deleted.</small></span><Button variant="outline" onClick={resetPreferences}><RotateCcw /> Reset preferences</Button></div></SettingsCard>;

    return <SettingsCard icon={<Info />} title="About BhashaYantra" description="Build and support information"><div className="about-settings"><span><b>Product</b><small>BhashaYantra Desktop</small></span><span><b>Build channel</b><small>Development · no public release</small></span><span><b>Core mode</b><small>Offline-first typing and training</small></span><span><b>Account status</b><small>Local workspace preview; Supabase sign-in is not connected yet</small></span></div></SettingsCard>;
  }

  return (
    <section className="settings-page">
      <header className="settings-hero"><div><span className="page-eyebrow"><Monitor /> CONTROL CENTER</span><h1>Settings</h1><p>One category at a time. Account, exam, typing, and privacy controls are kept separate.</p></div><span className="settings-saved"><Check /> {savedMessage}</span></header>
      <div className="settings-layout detailed-settings-layout">
        <nav className="settings-index" aria-label="Settings sections">{SETTINGS_SECTIONS.map((item) => <button type="button" className={section === item.id ? "active" : ""} onClick={() => setSection(item.id)} key={item.id}>{item.icon}<span>{item.label}</span><ChevronRight /></button>)}<button type="button" className="settings-pro-link" onClick={onOpenPricing}><Sparkles /> <span>BhashaYantra Pro</span><ChevronRight /></button></nav>
        <div className="settings-sections">{renderSection()}</div>
        <aside className="settings-context-panel">
          <span className="settings-context-icon">{role === "student" ? <GraduationCap /> : <Building2 />}</span>
          <small>ACTIVE WORKSPACE</small><h2>{role === "student" ? "Student" : "Institute"}</h2>
          <ul>{WORKSPACE_PERMISSIONS[role].map((permission) => <li key={permission}><Check /> {permission}</li>)}</ul>
          <div className="settings-auth-warning"><LockKeyhole /><span><strong>Local preview</strong><small>Production institute access needs Supabase sign-in and server-verified membership. Selecting this role does not grant admin permissions.</small></span></div>
          <Button variant="outline" onClick={onOpenPricing}><Sparkles /> Compare plans</Button>
        </aside>
      </div>
    </section>
  );
}
