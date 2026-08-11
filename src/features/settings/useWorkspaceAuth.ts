import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { isSupabaseConfigured, signInWithUsername, supabase } from "@/data/supabase/client";
import {
  hasProductAccess,
  isValidUsername,
  normalizeUsername,
  parseAuthTokenClaims,
  trialDaysRemaining,
  type AccountStatus,
  type AuthTokenClaims,
  type PlanTier,
} from "@/domain/accounts/auth-session";
import { isCompleteEmailOtp, isEmailNotConfirmed, normalizeEmailOtp } from "@/domain/accounts/email-verification";
import type { AccountWorkspaceRole } from "@/domain/accounts/account-workspaces";

export interface WorkspaceIdentity {
  readonly userId: string;
  readonly email: string;
  readonly username: string;
  readonly displayName: string;
  readonly role: AccountWorkspaceRole;
  readonly status: AccountStatus;
  readonly plan: PlanTier;
  readonly trialEndsAt: string | null;
  readonly trialDaysRemaining: number;
  readonly deviceLimit: number;
  readonly hasAccess: boolean;
}

export interface PendingEmailVerification {
  readonly email: string;
  readonly role: AccountWorkspaceRole;
  readonly codeJustSent: boolean;
}

interface WorkspaceCredentials {
  readonly role: AccountWorkspaceRole;
  readonly login: string;
  readonly password: string;
  readonly email?: string;
  readonly username?: string;
  readonly displayName?: string;
}

function identityFromClaims(claims: AuthTokenClaims): WorkspaceIdentity {
  return {
    userId: claims.sub,
    email: claims.email,
    username: claims.username,
    displayName: claims.displayName,
    role: claims.role,
    status: claims.status,
    plan: claims.plan,
    trialEndsAt: claims.trialEndsAt,
    trialDaysRemaining: trialDaysRemaining(claims),
    deviceLimit: claims.deviceLimit,
    hasAccess: hasProductAccess(claims),
  };
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function WorkspaceAuthProvider({ children }: { readonly children: ReactNode }) {
  const [identity, setIdentity] = useState<WorkspaceIdentity | null>(null);
  const [pendingEmailVerification, setPendingEmailVerification] = useState<PendingEmailVerification | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [message, setMessage] = useState(isSupabaseConfigured ? "Checking your secure session…" : "Supabase Auth is not configured in this build.");

  const hydrateSession = useCallback(async (session: Session | null) => {
    if (!supabase || !session) {
      setIdentity(null);
      setLoading(false);
      setMessage(isSupabaseConfigured ? "Sign in with your verified email or username to continue." : "Supabase Auth is not configured in this build.");
      return null;
    }

    const { data, error } = await supabase.auth.getClaims(session.access_token);
    const claims = error ? null : parseAuthTokenClaims(data?.claims);
    if (!claims) {
      setIdentity(null);
      setLoading(false);
      setMessage(error?.message ?? "This token is missing the server-issued role or trial claims. Deploy the latest Supabase migration and Auth Hook.");
      return null;
    }

    const nextIdentity = identityFromClaims(claims);
    setIdentity(nextIdentity);
    setLoading(false);
    setMessage(`${nextIdentity.role === "student" ? "Student" : "Institute"} account signed in with a verified JWT.`);
    return nextIdentity;
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) void hydrateSession(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) window.setTimeout(() => void hydrateSession(session), 0);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [hydrateSession]);

  const signIn = useCallback(async ({ role, login, password }: WorkspaceCredentials) => {
    if (!supabase) {
      setMessage("Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable secure login.");
      return false;
    }
    const normalizedLogin = login.trim().toLowerCase();
    if (!normalizedLogin) {
      setMessage("Enter your email address or username.");
      return false;
    }
    setLoading(true);
    setMessage("Signing in and verifying the access token…");
    try {
      const result = normalizedLogin.includes("@")
        ? await supabase.auth.signInWithPassword({ email: normalizedLogin, password })
        : await signInWithUsername(normalizedLogin, password);
      if (result.error || !result.data.session) {
        const errorMessage = result.error?.message;
        if (normalizedLogin.includes("@") && isEmailNotConfirmed(errorMessage)) {
          setPendingEmailVerification({ email: normalizedLogin, role, codeJustSent: false });
          setLoading(false);
          setMessage(`${normalizedLogin} is not verified. Request a fresh 6-digit code to continue.`);
          return false;
        }
        setLoading(false);
        setMessage(errorMessage ?? "Invalid username or password.");
        return false;
      }
      const nextIdentity = await hydrateSession(result.data.session);
      if (!nextIdentity || nextIdentity.role !== role) {
        await supabase.auth.signOut();
        setIdentity(null);
        setLoading(false);
        setMessage(nextIdentity ? `This login belongs to a ${nextIdentity.role} account. Use the ${nextIdentity.role} login.` : "Account token could not be verified.");
        return false;
      }
      return true;
    } catch (error) {
      setLoading(false);
      const errorMessage = error instanceof Error ? error.message : "Invalid username or password.";
      setMessage(isEmailNotConfirmed(errorMessage)
        ? "This account is not verified yet. Open Verify email and enter the address used at signup."
        : errorMessage);
      return false;
    }
  }, [hydrateSession]);

  const signUp = useCallback(async ({ role, email = "", username = "", password, displayName }: WorkspaceCredentials) => {
    if (!supabase) {
      setMessage("Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable account creation.");
      return false;
    }
    const normalizedUsername = normalizeUsername(username);
    if (!isValidUsername(normalizedUsername)) {
      setMessage("Username must be 3–32 lowercase letters, numbers, dots, hyphens, or underscores.");
      return false;
    }
    setLoading(true);
    setMessage("Creating your secure 14-day trial…");
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { account_role: role, display_name: displayName?.trim() ?? "", username: normalizedUsername } },
      });
      if (error) {
        setLoading(false);
        setMessage(error.message);
        return false;
      }
      if (!data.session) {
        const normalizedEmail = email.trim().toLowerCase();
        setPendingEmailVerification({ email: normalizedEmail, role, codeJustSent: true });
        setLoading(false);
        setMessage(`Account created. Enter the 6-digit code sent to ${normalizedEmail}.`);
        return true;
      }
      setPendingEmailVerification(null);
      await hydrateSession(data.session);
      return true;
    } catch (error) {
      setLoading(false);
      setMessage(errorMessage(error, "Account creation could not reach the authentication service. Check your connection and try again."));
      return false;
    }
  }, [hydrateSession]);

  const requestEmailOtp = useCallback(async ({ role, email = "" }: WorkspaceCredentials) => {
    if (!supabase) {
      setMessage("Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable email verification.");
      return false;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setMessage("Enter the email address used to create this account.");
      return false;
    }
    setLoading(true);
    setMessage("Sending a fresh one-time verification code…");
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email: normalizedEmail });
      setLoading(false);
      if (error) {
        setMessage(error.message);
        return false;
      }
      setPendingEmailVerification({ email: normalizedEmail, role, codeJustSent: true });
      setMessage(`A fresh 6-digit code was sent to ${normalizedEmail}.`);
      return true;
    } catch (error) {
      setLoading(false);
      setMessage(errorMessage(error, "The verification email could not be sent. Check your connection and try again."));
      return false;
    }
  }, []);

  const verifyEmailOtp = useCallback(async ({ role, email = "", login: token }: WorkspaceCredentials) => {
    if (!supabase) {
      setMessage("Supabase Auth is not configured in this build.");
      return false;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedToken = normalizeEmailOtp(token);
    if (!isCompleteEmailOtp(normalizedToken)) {
      setMessage("Enter the complete 6-digit verification code.");
      return false;
    }
    setLoading(true);
    setMessage("Checking your one-time code…");
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: normalizedToken,
        type: "email",
      });
      if (error || !data.session) {
        setLoading(false);
        setMessage(error?.message ?? "This code is invalid or has expired. Request a fresh code and try again.");
        return false;
      }
      const nextIdentity = await hydrateSession(data.session);
      if (!nextIdentity || nextIdentity.role !== role) {
        await supabase.auth.signOut();
        setIdentity(null);
        setLoading(false);
        setMessage(nextIdentity ? `This email belongs to a ${nextIdentity.role} account. Use the ${nextIdentity.role} login.` : "Account token could not be verified.");
        return false;
      }
      setPendingEmailVerification(null);
      setMessage("Email verified. Your secure 14-day trial is ready.");
      return true;
    } catch (error) {
      setLoading(false);
      setMessage(errorMessage(error, "The verification service could not be reached. Check your connection and try again."));
      return false;
    }
  }, [hydrateSession]);

  const clearEmailVerification = useCallback(() => {
    setPendingEmailVerification(null);
    setLoading(false);
    setMessage("Sign in with your verified email or username to continue.");
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setIdentity(null);
    setPendingEmailVerification(null);
    setLoading(false);
    setMessage("Signed out. Choose Student or Institute login to continue.");
  }, []);

  const value = useMemo(() => ({
    configured: isSupabaseConfigured,
    identity,
    pendingEmailVerification,
    loading,
    message,
    clearEmailVerification,
    requestEmailOtp,
    signIn,
    signUp,
    signOut,
    verifyEmailOtp,
  }), [clearEmailVerification, identity, loading, message, pendingEmailVerification, requestEmailOtp, signIn, signOut, signUp, verifyEmailOtp]);

  return createElement(WorkspaceAuthContext.Provider, { value }, children);
}

const WorkspaceAuthContext = createContext<WorkspaceAuthController | null>(null);

export function useWorkspaceAuth() {
  const auth = useContext(WorkspaceAuthContext);
  if (!auth) throw new Error("useWorkspaceAuth must be used inside WorkspaceAuthProvider.");
  return auth;
}

export type WorkspaceAuthController = {
  readonly configured: boolean;
  readonly identity: WorkspaceIdentity | null;
  readonly pendingEmailVerification: PendingEmailVerification | null;
  readonly loading: boolean;
  readonly message: string;
  readonly clearEmailVerification: () => void;
  readonly requestEmailOtp: (credentials: WorkspaceCredentials) => Promise<boolean>;
  readonly signIn: (credentials: WorkspaceCredentials) => Promise<boolean>;
  readonly signUp: (credentials: WorkspaceCredentials) => Promise<boolean>;
  readonly signOut: () => Promise<void>;
  readonly verifyEmailOtp: (credentials: WorkspaceCredentials) => Promise<boolean>;
};
