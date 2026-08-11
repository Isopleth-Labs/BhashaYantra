import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  AppWindow,
  BellRing,
  BookOpenCheck,
  Building2,
  Check,
  ChevronRight,
  Database,
  Download,
  FileCheck2,
  FileText,
  Gauge,
  GraduationCap,
  Headphones,
  Info,
  Keyboard,
  Languages,
  LockKeyhole,
  Mail,
  Monitor,
  Palette,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Scale,
  Upload,
  UserRound,
  Volume2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  APP_VERSION,
  createUserDataBackup,
  restoreUserDataBackup,
  USER_DATA_SCHEMA_VERSION,
} from "@/application/beta-data-lifecycle";
import {
  DEFAULT_INSTITUTE_WORKSPACE,
  DEFAULT_STUDENT_WORKSPACE,
  INSTITUTE_WORKSPACE_KEY,
  readStoredObject,
  sanitizeSeatLimit,
  STUDENT_WORKSPACE_KEY,
  WORKSPACE_PERMISSIONS,
  type AccountWorkspaceRole,
  type InstituteWorkspaceProfile,
  type StudentWorkspaceProfile,
} from "@/domain/accounts/account-workspaces";
import { WorkspaceLoginPanel } from "@/features/settings/WorkspaceLoginPanel";
import { useWorkspaceAuth } from "@/features/settings/useWorkspaceAuth";
import type { TypingOutputMode } from "@/domain/typing/typing-engine";
import {
  displayFontsForLanguage,
  getDisplayFont,
  getTypingLayoutProfile,
  LEGACY_ENCODING_PROFILES,
  layoutsForLanguage,
  type ReadyTypingLayoutId,
  type TypingLanguageCode,
  type UnicodeDisplayFontId,
} from "@/domain/typing/typing-profiles";
import { useI18n, type InterfaceLanguage } from "@/i18n/I18nProvider";
import {
  LEGAL_DOCUMENTS,
  LEGAL_EFFECTIVE_DATE,
  SECURITY_REPORT_URL,
  SOURCE_REPOSITORY_URL,
  SUPPORT_ISSUES_URL,
} from "@/domain/legal/legal-documents";

export type AppTheme = "light" | "dark";
type SettingsSection = "account" | "appearance" | "typing" | "practice" | "exam" | "stenography" | "direct-typing" | "privacy" | "legal" | "about";

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
  { id: "legal", label: "Legal & support", icon: <Scale /> },
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
  const auth = useWorkspaceAuth();
  const [selectedRole, setSelectedRole] = useState<AccountWorkspaceRole>("student");
  const role = auth.identity?.role ?? selectedRole;
  const [student, setStudent] = useState(() => readStoredObject(STUDENT_WORKSPACE_KEY, DEFAULT_STUDENT_WORKSPACE));
  const [institute, setInstitute] = useState(() => readStoredObject(INSTITUTE_WORKSPACE_KEY, DEFAULT_INSTITUTE_WORKSPACE));
  const [soundOnError, setSoundOnError] = useState(() => loadBoolean("bhashayantra:training:sound-v3", false));
  const [showKeyboard, setShowKeyboard] = useState(() => loadBoolean("bhashayantra:training:keyboard-v2", false));
  const [examSound, setExamSound] = useState(() => loadBoolean("bhashayantra:exam:sound-v2", true));
  const [examConfirm, setExamConfirm] = useState(() => loadBoolean("bhashayantra:exam:confirm-submit-v1", true));
  const [examAutoScroll, setExamAutoScroll] = useState(() => loadBoolean("bhashayantra:exam:auto-scroll-v1", true));
  const [stenoCountdown, setStenoCountdown] = useState(() => loadBoolean("bhashayantra:steno:countdown-v1", true));
  const [stenoVoice, setStenoVoice] = useState(() => loadBoolean("bhashayantra:steno:voice-v1", true));
  const [directTypingAtStartup, setDirectTypingAtStartup] = useState(() => loadBoolean("bhashayantra:direct:start-v1", false));
  const [crashReports, setCrashReports] = useState(() => loadBoolean("bhashayantra:privacy:crash-v1", false));
  const [savedMessage, setSavedMessage] = useState("Preferences are saved automatically on this device.");
  const backupInputRef = useRef<HTMLInputElement>(null);

  function saveBoolean(key: string, value: boolean, setter: (value: boolean) => void) {
    setter(value);
    localStorage.setItem(key, String(value));
    setSavedMessage("Saved locally just now.");
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
    setSoundOnError(false);
    setShowKeyboard(false);
    setExamSound(true);
    setExamConfirm(true);
    setExamAutoScroll(true);
    setStenoCountdown(true);
    setStenoVoice(true);
    setDirectTypingAtStartup(false);
    setCrashReports(false);
    const defaults: readonly [string, boolean][] = [
      ["bhashayantra:training:sound-v3", false], ["bhashayantra:training:keyboard-v2", false],
      ["bhashayantra:exam:sound-v2", true], ["bhashayantra:exam:confirm-submit-v1", true], ["bhashayantra:exam:auto-scroll-v1", true],
      ["bhashayantra:steno:countdown-v1", true], ["bhashayantra:steno:voice-v1", true], ["bhashayantra:direct:start-v1", false], ["bhashayantra:privacy:crash-v1", false],
    ];
    defaults.forEach(([key, value]) => localStorage.setItem(key, String(value)));
    setSavedMessage("Default preferences restored. Account data, drafts, and history were preserved.");
  }

  function exportLocalData() {
    const backup = createUserDataBackup();
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `BhashaYantra-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    setSavedMessage(`Local backup exported with ${Object.keys(backup.entries).length} data entries.`);
  }

  async function importLocalData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!window.confirm("Restore this backup? Current BhashaYantra drafts, settings, and local attempt history will be replaced.")) return;
    try {
      const restored = restoreUserDataBackup(await file.text());
      setSavedMessage(`${restored} local data entries restored. Reloading safely…`);
      window.setTimeout(() => window.location.reload(), 250);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Backup restore failed.";
      window.alert(message);
      setSavedMessage("Backup was rejected; current local data was preserved.");
    }
  }

  function renderSection() {
    if (section === "account") return (
      <>
        <WorkspaceLoginPanel auth={auth} selectedRole={selectedRole} onSelectedRoleChange={setSelectedRole} />
        {auth.identity && role === "student" ? <SettingsCard icon={<GraduationCap />} title="Student profile" description="Private learning identity">
          <div className="settings-control-grid">
            <label><span>Student name</span><small>Shown on local result reports.</small><input value={student.displayName} onChange={(event) => saveStudent({ displayName: event.target.value })} placeholder="Your full name" /></label>
            <label><span>Candidate ID</span><small>Your institute or exam reference, optional.</small><input value={student.candidateId} onChange={(event) => saveStudent({ candidateId: event.target.value })} placeholder="e.g. STU-1042" /></label>
            <label><span>Target exam</span><small>Personalizes the dashboard and recommended practice.</small><select value={student.targetExam} onChange={(event) => saveStudent({ targetExam: event.target.value })}><option>SSC Stenographer</option><option>SSC CHSL / DEST</option><option>High Court Typing</option><option>RRB Typing Skill Test</option><option>General office typing</option></select></label>
            <label><span>Study language</span><small>Does not change the app interface.</small><select value={student.studyLanguage} onChange={(event) => saveStudent({ studyLanguage: event.target.value as "hi" | "en" })}><option value="hi">Hindi</option><option value="en">English</option></select></label>
          </div>
        </SettingsCard> : auth.identity && role === "institute" ? <SettingsCard icon={<Building2 />} title="Institute profile" description="Authenticated organization workspace">
          <div className="settings-control-grid">
            <label><span>Institute name</span><small>Organization displayed in institute reports.</small><input value={institute.instituteName} onChange={(event) => saveInstitute({ instituteName: event.target.value })} placeholder="Institute name" /></label>
            <label><span>Institute code</span><small>Unique joining code after server verification.</small><input value={institute.instituteCode} onChange={(event) => saveInstitute({ instituteCode: event.target.value.toUpperCase() })} placeholder="e.g. BY-JPR-01" /></label>
            <label><span>Administrator</span><small>Primary local admin contact.</small><input value={institute.administratorName} onChange={(event) => saveInstitute({ administratorName: event.target.value })} placeholder="Administrator name" /></label>
            <label><span>Planned seats</span><small>Used for plan estimation; no seats are activated yet.</small><input type="number" min={1} max={5000} value={institute.seatLimit} onChange={(event) => saveInstitute({ seatLimit: Number(event.target.value) })} /></label>
          </div>
          <div className="institute-module-preview"><span><b>Roster</b><small>Manage verified students and batches</small></span><span><b>Assignments</b><small>Publish courses and mock tests</small></span><span><b>Reports</b><small>View server-verified batch results</small></span></div>
        </SettingsCard> : null}
      </>
    );

    if (section === "appearance") return <SettingsCard icon={<Languages />} title="Appearance and language" description="Navigation, labels, and visual theme"><div className="settings-control-grid"><label><span>Interface language</span><small>Language used for navigation and labels.</small><select value={language} onChange={(event) => setLanguage(event.target.value as InterfaceLanguage)}><option value="en">English</option><option value="hi">Hindi</option></select></label><div className="settings-field"><span>Appearance</span><small>Choose the application theme.</small><div className="theme-choice"><button type="button" className={theme === "light" ? "active" : ""} onClick={() => onThemeChange("light")}><Palette /> Light</button><button type="button" className={theme === "dark" ? "active" : ""} onClick={() => onThemeChange("dark")}><Monitor /> Dark</button></div></div></div></SettingsCard>;

    if (section === "typing") {
      const activeLayout = getTypingLayoutProfile(typingLayout);
      const activeFont = getDisplayFont(displayFont);
      return <>
        <SettingsCard icon={<Keyboard />} title="Typing engine defaults" description="Language, layout, font, and output">
          <div className="settings-control-grid">
            <label><span>Typing language</span><small>Choose the active writing language.</small><select value={typingLanguage} onChange={(event) => onTypingLanguageChange(event.target.value as TypingLanguageCode)}><option value="hi">Hindi</option><option value="en">English</option></select></label>
            <label><span>Keyboard layout</span><small>Physical key mapping and composition rules.</small><select value={typingLayout} onChange={(event) => onTypingLayoutChange(event.target.value as ReadyTypingLayoutId)}>{layoutsForLanguage(typingLanguage).map((profile) => <option key={profile.id} value={profile.id}>{profile.name} · {profile.verificationLabel}</option>)}</select></label>
            <label><span>Display font</span><small>Changes preview only, not Unicode content.</small><select value={displayFont} onChange={(event) => onDisplayFontChange(event.target.value as UnicodeDisplayFontId)}>{displayFontsForLanguage(typingLanguage).map((font) => <option key={font.id} value={font.id}>{font.name}</option>)}</select></label>
            <label><span>Default output</span><small>Unicode is recommended for modern applications.</small><select value={outputMode} onChange={(event) => onOutputModeChange(event.target.value as TypingOutputMode)}><option value="unicode">Unicode</option><option value="legacy" disabled={typingLanguage === "en"}>Legacy / KrutiDev</option></select></label>
          </div>
        </SettingsCard>
        <SettingsCard icon={<FileCheck2 />} title="Compatibility and verification" description="What is standardized, compatible, or still being validated">
          <div className="typing-verification-summary">
            <article className={`verification-state ${activeLayout.verification}`}><span>Selected keyboard</span><strong>{activeLayout.name}</strong><b>{activeLayout.verificationLabel}</b><small>{activeLayout.coverageNote}</small>{activeLayout.referenceUrl && <a href={activeLayout.referenceUrl} target="_blank" rel="noreferrer">Open mapping reference</a>}</article>
            <article className="verification-state font"><span>Selected display font</span><strong>{activeFont.name}</strong><b>{activeFont.deliveryLabel}</b><small>Fonts change glyph appearance only. Unicode characters remain the same. A CSS fallback is used if the chosen local font is unavailable.</small><a href={activeFont.referenceUrl} target="_blank" rel="noreferrer">Open font reference</a></article>
          </div>
          {typingLanguage === "hi" && <div className="legacy-verification-list"><span>Legacy conversion profiles</span>{LEGACY_ENCODING_PROFILES.map((profile) => <div key={profile.id}><strong>{profile.name}</strong><b className={profile.readiness}>{profile.readiness === "ready" ? "Working compatibility map" : profile.coverage === "variant-required" ? "Exact variant required" : "Mapping validation pending"}</b></div>)}</div>}
        </SettingsCard>
      </>;
    }

    if (section === "practice") return <SettingsCard icon={<BookOpenCheck />} title="Practice preferences" description="Applied when a lesson starts"><div className="settings-toggle-list"><SettingsToggle checked={soundOnError} onChange={(value) => saveBoolean("bhashayantra:training:sound-v3", value, setSoundOnError)} label="Optional error sound" description="Off by default. Wrong keys are always accepted and marked red." /><SettingsToggle checked={showKeyboard} onChange={(value) => saveBoolean("bhashayantra:training:keyboard-v2", value, setShowKeyboard)} label="Show on-screen keyboard" description="Open lessons with layout and finger guidance visible." /></div><div className="settings-note"><BookOpenCheck /><span><strong>Continuous error marking</strong><small>Practice never blocks a wrong key. The live key stream shows the wrong character in red and keeps the exercise moving.</small></span></div></SettingsCard>;

    if (section === "exam") return <SettingsCard icon={<Gauge />} title="Exam workstation" description="Rules for new mock-test sessions"><div className="settings-toggle-list"><SettingsToggle checked={examSound} onChange={(value) => saveBoolean("bhashayantra:exam:sound-v2", value, setExamSound)} label="Error sound" description="Play feedback only when the selected exam profile allows it." /><SettingsToggle checked={examConfirm} onChange={(value) => saveBoolean("bhashayantra:exam:confirm-submit-v1", value, setExamConfirm)} label="Confirm before final submission" description="Prevent accidental early submission during practice profiles." /><SettingsToggle checked={examAutoScroll} onChange={(value) => saveBoolean("bhashayantra:exam:auto-scroll-v1", value, setExamAutoScroll)} label="Keep current passage line visible" description="Scroll only the passage panel; the page itself stays fixed." /></div><div className="settings-note"><FileCheck2 /><span><strong>Official-reference profiles remain read-only</strong><small>Duration, target speed, backspace rules, and layout requirements come from their linked notice. Always verify the current recruitment notice.</small></span></div></SettingsCard>;

    if (section === "stenography") return <SettingsCard icon={<Headphones />} title="Stenography sessions" description="Dictation and transcription behavior"><div className="settings-toggle-list"><SettingsToggle checked={stenoCountdown} onChange={(value) => saveBoolean("bhashayantra:steno:countdown-v1", value, setStenoCountdown)} label="Pre-dictation countdown" description="Give a three-second preparation cue before audio begins." /><SettingsToggle checked={stenoVoice} onChange={(value) => saveBoolean("bhashayantra:steno:voice-v1", value, setStenoVoice)} label="Local narration by default" description="Use an installed system voice for original BhashaYantra scripts." /></div><div className="settings-note"><Volume2 /><span><strong>Official-reference timing</strong><small>Dictation and transcription are separate phases. Transcript entry stays locked during dictation.</small></span></div></SettingsCard>;

    if (section === "direct-typing") return <SettingsCard icon={<AppWindow />} title="Direct Typing and Windows apps" description="Word, Excel, browser, and standard text fields"><div className="settings-toggle-list"><SettingsToggle checked={directTypingAtStartup} onChange={(value) => saveBoolean("bhashayantra:direct:start-v1", value, setDirectTypingAtStartup)} label="Enable Direct Typing at startup" description="Off by default so BhashaYantra never captures keys without a clear action." /></div><div className="settings-note"><LockKeyhole /><span><strong>Emergency shortcut</strong><small>Use Ctrl + Alt + F12 to turn Direct Typing off. Password and protected fields are excluded.</small></span></div></SettingsCard>;

    if (section === "privacy") return <SettingsCard icon={<LockKeyhole />} title="Data and privacy" description="Offline-first storage and optional services"><div className="privacy-status-grid"><span><Database /><b>Local workspace</b><small>Drafts, preferences, lessons, and attempts stay on this device.</small></span><span><ShieldCheck /><b>No typing telemetry</b><small>Typing content is not uploaded unless you choose a cloud feature.</small></span><span><Info /><b>Optional cloud</b><small>Translation and institute sync require configured providers.</small></span></div><div className="settings-toggle-list"><SettingsToggle checked={crashReports} onChange={(value) => saveBoolean("bhashayantra:privacy:crash-v1", value, setCrashReports)} label="Anonymous crash reports" description="Disabled by default. This beta build does not upload reports." /></div><div className="settings-backup-row"><span><strong>Backup and restore</strong><small>Export drafts, preferences, workspace profiles, custom mappings, and local results before moving devices or installing a major update. Authentication sessions are never included.</small></span><div><Button variant="outline" onClick={exportLocalData}><Download /> Export backup</Button><Button variant="outline" onClick={() => backupInputRef.current?.click()}><Upload /> Restore backup</Button><input ref={backupInputRef} type="file" accept="application/json,.json" hidden onChange={(event) => void importLocalData(event)} /></div></div><div className="settings-danger-row"><span><strong>Reset preferences</strong><small>Account workspaces, drafts, and attempt history are not deleted.</small></span><Button variant="outline" onClick={resetPreferences}><RotateCcw /> Reset preferences</Button></div></SettingsCard>;

    if (section === "legal") return <SettingsCard icon={<Scale />} title="Legal and support" description={`Beta documents · effective ${LEGAL_EFFECTIVE_DATE}`}>
      <div className="legal-document-grid">
        {LEGAL_DOCUMENTS.map((document) => <details key={document.id} className="legal-document" open={document.id === "privacy"}>
          <summary><span>{document.id === "privacy" ? <ShieldCheck /> : <FileText />}<b>{document.title}</b><small>{document.summary}</small></span><ChevronRight /></summary>
          <div className="legal-document-body">{document.sections.map((entry) => <section key={entry.heading}><h3>{entry.heading}</h3><p>{entry.body}</p></section>)}</div>
        </details>)}
      </div>
      <div className="support-contact-card">
        <span><Mail /><span><strong>Contact & support</strong><small>Use public support for bugs and account help. Send vulnerability details only through GitHub's private security reporting.</small></span></span>
        <div className="support-contact-actions"><a href={SUPPORT_ISSUES_URL} target="_blank" rel="noreferrer">Public support</a><a href={SECURITY_REPORT_URL} target="_blank" rel="noreferrer">Private security report</a></div>
      </div>
      <p className="legal-review-note"><LockKeyhole /> Beta legal draft. Obtain counsel review and publish a monitored support/privacy email before a public release.</p>
    </SettingsCard>;

    return <SettingsCard icon={<Info />} title="About BhashaYantra" description="Product, build, and verified support information">
      <div className="about-settings"><span><b>Product</b><small>BhashaYantra Desktop</small></span><span><b>Version</b><small>{APP_VERSION}</small></span><span><b>Build channel</b><small>Public beta candidate · release gated</small></span><span><b>Data format</b><small>Schema {USER_DATA_SCHEMA_VERSION} · upgrade-safe manifest</small></span><span><b>Core mode</b><small>Offline-first typing and training</small></span><span><b>Account status</b><small>{auth.identity ? `${auth.identity.role} account authenticated` : auth.configured ? "Sign-in required" : "Supabase Auth configuration required"}</small></span></div>
      <div className="about-links"><a href={SOURCE_REPOSITORY_URL} target="_blank" rel="noreferrer">Source repository</a><button type="button" onClick={() => setSection("legal")}>Privacy, terms & contact</button></div>
    </SettingsCard>;
  }

  return (
    <section className="settings-page">
      <header className="settings-compact-header"><h1>Settings</h1><span className="settings-saved"><Check /> {savedMessage}</span></header>
      <div className="settings-layout detailed-settings-layout">
        <nav className="settings-index" aria-label="Settings sections">{SETTINGS_SECTIONS.map((item) => <button type="button" className={section === item.id ? "active" : ""} onClick={() => setSection(item.id)} key={item.id}>{item.icon}<span>{item.label}</span><ChevronRight /></button>)}<button type="button" className="settings-pro-link" onClick={onOpenPricing}><Sparkles /> <span>BhashaYantra Pro</span><ChevronRight /></button></nav>
        <div className="settings-sections">{renderSection()}</div>
        <aside className="settings-context-panel">
          <span className="settings-context-icon">{role === "student" ? <GraduationCap /> : <Building2 />}</span>
          <small>{auth.identity ? "ACTIVE WORKSPACE" : "LOGIN TARGET"}</small><h2>{role === "student" ? "Student" : "Institute"}</h2>
          <ul>{WORKSPACE_PERMISSIONS[role].map((permission) => <li key={permission}><Check /> {permission}</li>)}</ul>
          <div className="settings-auth-warning"><LockKeyhole /><span><strong>{auth.identity ? "Authenticated session" : "Login required"}</strong><small>{auth.identity ? `${auth.identity.email} is verified as a ${auth.identity.role} account. The other workspace cannot open in this session.` : "Choose the correct account type and sign in. Student and institute workspaces use separate verified roles."}</small></span></div>
          <Button variant="outline" onClick={onOpenPricing}><Sparkles /> Compare plans</Button>
        </aside>
      </div>
    </section>
  );
}
