import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, BookOpenCheck, Check, Laptop, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { registerCurrentDevice } from "@/data/supabase/device-licensing";
import type { AccountWorkspaceRole } from "@/domain/accounts/account-workspaces";
import { WorkspaceLoginPanel } from "@/features/settings/WorkspaceLoginPanel";
import { useWorkspaceAuth } from "@/features/settings/useWorkspaceAuth";

const WIKI_URL = "https://github.com/Isopleth-Labs/BhashaYantra/wiki";

type DeviceGate = {
  readonly status: "idle" | "checking" | "allowed" | "blocked" | "error";
  readonly activeDevices: number;
  readonly allowedDevices: number;
};

function BrandSplash({ status = "Preparing your workspace" }: { readonly status?: string }) {
  return (
    <main className="brand-splash" aria-live="polite" aria-label="Opening BhashaYantra">
      <div className="brand-splash-glow" aria-hidden="true" />
      <div className="brand-splash-lockup"><span className="brand-splash-mark" aria-hidden="true"><i>भ</i></span><span className="brand-splash-word">BhashaYantra</span><small>{status}</small><span className="brand-splash-progress" aria-hidden="true"><i /></span></div>
      <span className="brand-splash-edition">PROFESSIONAL TYPING WORKSTATION</span>
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

function DeviceAccessEnded({ gate }: { readonly gate: DeviceGate }) {
  const auth = useWorkspaceAuth();
  const blocked = gate.status === "blocked";
  return (
    <main className="entry-screen entry-device-screen">
      <section className="entry-access-card">
        <span className="entry-access-icon"><Laptop /></span>
        <span className="entry-eyebrow"><LockKeyhole /> DEVICE LICENCE</span>
        <h1>{blocked ? "This account is already active on another device" : "Device licence could not be verified"}</h1>
        <p>{blocked ? `This plan allows ${gate.allowedDevices} registered device. ${gate.activeDevices} device is already active. Training centres must use purchased seats and separate member accounts.` : "BhashaYantra could not securely confirm this installation. Check the connection or deploy the latest Supabase device-licensing migration and function."}</p>
        <div className="entry-access-actions"><a href={`${WIKI_URL}/Student-and-Institute-Accounts`} target="_blank" rel="noreferrer">Device licence help</a><Button variant="outline" onClick={() => void auth.signOut()}>Use another account</Button></div>
      </section>
    </main>
  );
}

export function AppEntryGate({ children }: { readonly children: ReactNode }) {
  const auth = useWorkspaceAuth();
  const [splashComplete, setSplashComplete] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AccountWorkspaceRole>("student");
  const [deviceGate, setDeviceGate] = useState<DeviceGate>({ status: "idle", activeDevices: 0, allowedDevices: 1 });

  useEffect(() => {
    const timer = window.setTimeout(() => setSplashComplete(true), 1_200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!auth.identity?.hasAccess) {
      setDeviceGate({ status: "idle", activeDevices: 0, allowedDevices: auth.identity?.deviceLimit ?? 1 });
      return;
    }
    let active = true;
    setDeviceGate({ status: "checking", activeDevices: 0, allowedDevices: auth.identity.deviceLimit });
    void registerCurrentDevice().then((result) => {
      if (!active) return;
      setDeviceGate({
        status: result.allowed ? "allowed" : "blocked",
        activeDevices: result.activeDevices,
        allowedDevices: result.allowedDevices,
      });
    }).catch(() => {
      if (active) setDeviceGate({ status: "error", activeDevices: 0, allowedDevices: auth.identity?.deviceLimit ?? 1 });
    });
    return () => { active = false; };
  }, [auth.identity?.deviceLimit, auth.identity?.hasAccess, auth.identity?.userId]);

  if (!splashComplete) return <BrandSplash />;
  if (auth.loading) return <BrandSplash status="Verifying your secure session" />;
  if (auth.identity?.hasAccess && (deviceGate.status === "idle" || deviceGate.status === "checking")) return <BrandSplash status="Registering this licensed device" />;
  if (auth.identity?.hasAccess && deviceGate.status === "allowed") return children;
  if (auth.identity?.hasAccess && (deviceGate.status === "blocked" || deviceGate.status === "error")) return <DeviceAccessEnded gate={deviceGate} />;
  if (auth.identity) return <AccessEnded />;

  return (
    <main className="entry-screen entry-screen-reveal">
      <section className="entry-story" aria-label="BhashaYantra introduction">
        <a className="entry-brand" href={WIKI_URL} target="_blank" rel="noreferrer"><span aria-hidden="true">भ</span><strong>BhashaYantra</strong></a>
        <div className="entry-story-copy">
          <span className="entry-eyebrow"><Sparkles /> BUILT FOR SERIOUS PRACTICE</span>
          <h1>Master every keystroke.</h1>
          <p>A focused Hindi and English workstation for typing mastery, exam preparation, stenography, and professional Office practice.</p>
          <div className="entry-proof-row"><span><b>Offline</b><small>typing engine</small></span><span><b>Verified</b><small>Supabase access</small></span><span><b>1 device</b><small>individual licence</small></span></div>
          <ul>
            <li><Check /> 14-day complete trial after email verification</li><li><Check /> Separate Student and Institute identities</li><li><Check /> Device-bound personal licences and managed institute seats</li>
          </ul>
        </div>
        <div className="entry-story-footer"><BookOpenCheck /><span><strong>New to BhashaYantra?</strong><small>Read setup, account and learning guides in the Wiki.</small></span><a href={`${WIKI_URL}/Getting-Started`} target="_blank" rel="noreferrer" aria-label="Open getting started guide"><ArrowRight /></a></div>
      </section>

      <section className="entry-auth">
        <div className="entry-auth-heading"><span>SECURE ENTRY</span><h2>Continue to BhashaYantra</h2><p>Use your verified email or username. New accounts receive a 14-day trial on one registered device.</p></div>
        <WorkspaceLoginPanel auth={auth} selectedRole={selectedRole} onSelectedRoleChange={setSelectedRole} />
        <footer>By continuing, you agree to the <a href={`${WIKI_URL}/Legal-and-Support`} target="_blank" rel="noreferrer">Terms and Privacy Policy</a>.</footer>
      </section>
    </main>
  );
}
