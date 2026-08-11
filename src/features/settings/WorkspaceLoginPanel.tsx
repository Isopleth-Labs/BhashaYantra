import { useState, type FormEvent } from "react";
import { Building2, Eye, EyeOff, GraduationCap, Laptop, LockKeyhole, LogIn, ShieldCheck, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AccountWorkspaceRole } from "@/domain/accounts/account-workspaces";
import type { WorkspaceAuthController } from "@/features/settings/useWorkspaceAuth";

export function WorkspaceLoginPanel({ auth, selectedRole, onSelectedRoleChange }: {
  readonly auth: WorkspaceAuthController;
  readonly selectedRole: AccountWorkspaceRole;
  readonly onSelectedRoleChange: (role: AccountWorkspaceRole) => void;
}) {
  const [mode, setMode] = useState<"sign-in" | "create">("sign-in");
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const credentials = { role: selectedRole, login, email, username, password, displayName };
    if (mode === "sign-in") await auth.signIn(credentials);
    else await auth.signUp(credentials);
  }

  if (auth.identity) {
    return (
      <article className="settings-card workspace-session-card">
        <div className="settings-card-title"><span>{auth.identity.role === "student" ? <GraduationCap /> : <Building2 />}<b>Secure workspace session</b></span><small>Verified by Supabase Auth</small></div>
        <div className="workspace-session-summary"><span><small>Signed in as</small><strong>{auth.identity.displayName || auth.identity.username}</strong><em>@{auth.identity.username} · {auth.identity.email}</em></span><span><small>Access</small><strong>{auth.identity.status === "active" ? auth.identity.plan : `${auth.identity.trialDaysRemaining} trial days left`}</strong><em>{auth.identity.deviceLimit} registered device{auth.identity.deviceLimit === 1 ? "" : "s"} allowed</em></span><Button variant="outline" onClick={() => void auth.signOut()}>Sign out</Button></div>
      </article>
    );
  }

  return (
    <article className="settings-card workspace-login-card">
      <div className="settings-card-title"><span><ShieldCheck /><b>Protected account access</b></span><small>Supabase Auth · encrypted session · device licence</small></div>
      <div className="workspace-role-grid" role="radiogroup" aria-label="Account type">
        <button type="button" role="radio" aria-checked={selectedRole === "student"} className={selectedRole === "student" ? "active" : ""} onClick={() => onSelectedRoleChange("student")}><GraduationCap /><span><strong>Student login</strong><small>Personal courses, attempts, result cards, and targets</small></span></button>
        <button type="button" role="radio" aria-checked={selectedRole === "institute"} className={selectedRole === "institute" ? "active" : ""} onClick={() => onSelectedRoleChange("institute")}><Building2 /><span><strong>Institute login</strong><small>Roster, batches, assignments, seats, and reports</small></span></button>
      </div>
      <div className="workspace-auth-tabs"><button type="button" className={mode === "sign-in" ? "active" : ""} onClick={() => setMode("sign-in")}><LogIn /> Sign in</button><button type="button" className={mode === "create" ? "active" : ""} onClick={() => setMode("create")}><UserPlus /> Create account</button></div>
      <form className="workspace-auth-form" onSubmit={(event) => void submit(event)}>
        {mode === "create" ? <><label><span>{selectedRole === "student" ? "Student name" : "Administrator name"}</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" required placeholder="Full name" /></label><label><span>Username</span><input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required minLength={3} maxLength={32} placeholder="amit.kumar" /></label><label><span>Email address</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required placeholder="name@example.com" /></label></> : <label><span>Email or username</span><input value={login} onChange={(event) => setLogin(event.target.value)} autoComplete="username" required placeholder="name@example.com or amit.kumar" /></label>}
        <label><span>Password</span><span className="workspace-password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={8} required placeholder="Minimum 8 characters" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff /> : <Eye />}</button></span></label>
        <Button type="submit" disabled={auth.loading || !auth.configured}>{mode === "sign-in" ? <LogIn /> : <UserPlus />}{auth.loading ? "Please wait…" : mode === "sign-in" ? "Sign in securely" : "Start 14-day free trial"}</Button>
      </form>
      <div className="workspace-device-note"><Laptop /><span><strong>One account, one registered device</strong><small>₹149, ₹349, and Individual Pro licences cannot be shared across a training centre. Institutes use purchased seats and separate member accounts.</small></span></div>
      <div className={`workspace-auth-status ${auth.configured ? "" : "warning"}`} role="status"><LockKeyhole /><span><strong>{auth.configured ? auth.message : "Cloud login needs project configuration"}</strong><small>{auth.configured ? "Your authenticated role decides which workspace opens." : "Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. No insecure local-login bypass is used."}</small></span></div>
    </article>
  );
}
