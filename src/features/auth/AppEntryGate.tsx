import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, BookOpenCheck, Check, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AccountWorkspaceRole } from "@/domain/accounts/account-workspaces";
import { WorkspaceLoginPanel } from "@/features/settings/WorkspaceLoginPanel";
import { useWorkspaceAuth } from "@/features/settings/useWorkspaceAuth";

const WIKI_URL = "https://github.com/Isopleth-Labs/BhashaYantra/wiki";

function BrandSplash({ checking = false }: { readonly checking?: boolean }) {
  return (
    <main className="brand-splash" aria-live="polite" aria-label={checking ? "Verifying secure session" : "Opening BhashaYantra"}>
      <div className="brand-splash-orbit" aria-hidden="true" />
      <div className="brand-splash-lockup">
        <span className="brand-splash-mark" aria-hidden="true">भ</span>
        <span className="brand-splash-word">BhashaYantra</span>
        <i aria-hidden="true" />
        <small>{checking ? "Verifying secure session" : "TYPE · TRAIN · ACHIEVE"}</small>
      </div>
    </main>
  );
}

function AccessEnded() {
  const auth = useWorkspaceAuth();
  const suspended = auth.identity?.status === "suspended";
  return (
    <main className="entry-screen">
      <section className="entry-access-card">
        <span className="entry-eyebrow"><ShieldCheck /> SECURE ACCOUNT</span>
        <h1>{suspended ? "Account access is suspended" : "Your free trial has ended"}</h1>
        <p>{suspended ? "Contact support to review this account." : "Your account and progress stay safe. Choose a plan when billing is activated to continue using the complete workspace."}</p>
        <div><a href={`${WIKI_URL}/Legal-and-Support`} target="_blank" rel="noreferrer">Contact support</a><Button variant="outline" onClick={() => void auth.signOut()}>Use another account</Button></div>
      </section>
    </main>
  );
}

export function AppEntryGate({ children }: { readonly children: ReactNode }) {
  const auth = useWorkspaceAuth();
  const [splashComplete, setSplashComplete] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AccountWorkspaceRole>("student");

  useEffect(() => {
    const timer = window.setTimeout(() => setSplashComplete(true), 1_650);
    return () => window.clearTimeout(timer);
  }, []);

  if (!splashComplete || auth.loading) return <BrandSplash checking={splashComplete && auth.loading} />;
  if (auth.identity?.hasAccess) return children;
  if (auth.identity) return <AccessEnded />;

  return (
    <main className="entry-screen">
      <section className="entry-story" aria-label="BhashaYantra introduction">
        <a className="entry-brand" href={WIKI_URL} target="_blank" rel="noreferrer"><span aria-hidden="true">भ</span><strong>BhashaYantra</strong></a>
        <div className="entry-story-copy">
          <span className="entry-eyebrow"><Sparkles /> PROFESSIONAL INDIAN TYPING</span>
          <h1>One serious workspace for typing, exams and stenography.</h1>
          <p>Build verified skills with Hindi and English layouts, exam workstations, court-style transcription and professional Office practice.</p>
          <ul>
            <li><Check /> 14-day complete trial after email verification</li>
            <li><Check /> Separate Student and Institute workspaces</li>
            <li><Check /> Secure Supabase session with automatic JWT refresh</li>
          </ul>
        </div>
        <div className="entry-story-footer"><BookOpenCheck /><span><strong>New to BhashaYantra?</strong><small>Read setup, account and learning guides in the Wiki.</small></span><a href={`${WIKI_URL}/Getting-Started`} target="_blank" rel="noreferrer" aria-label="Open getting started guide"><ArrowRight /></a></div>
      </section>

      <section className="entry-auth">
        <div className="entry-auth-heading"><span>SECURE ENTRY</span><h2>Welcome</h2><p>Sign in with your email or username. New accounts start with a 14-day free trial.</p></div>
        <WorkspaceLoginPanel auth={auth} selectedRole={selectedRole} onSelectedRoleChange={setSelectedRole} />
        <footer>By continuing, you agree to the <a href={`${WIKI_URL}/Legal-and-Support`} target="_blank" rel="noreferrer">Terms and Privacy Policy</a>.</footer>
      </section>
    </main>
  );
}
