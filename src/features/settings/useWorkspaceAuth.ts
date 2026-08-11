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

export function WorkspaceAuthProvider({ children }: { readonly children: ReactNode }) {
  const [identity, setIdentity] = useState<WorkspaceIdentity | null>(null);
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
        setLoading(false);
        setMessage(result.error?.message ?? "Invalid username or password.");
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
    } catch {
      setLoading(false);
      setMessage("Invalid username or password.");
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
      setLoading(false);
      setMessage("Account created. Confirm your email, then sign in to start the 14-day trial.");
      return true;
    }
    await hydrateSession(data.session);
    return true;
  }, [hydrateSession]);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setIdentity(null);
    setLoading(false);
    setMessage("Signed out. Choose Student or Institute login to continue.");
  }, []);

  const value = useMemo(() => ({
    configured: isSupabaseConfigured,
    identity,
    loading,
    message,
    signIn,
    signUp,
    signOut,
  }), [identity, loading, message, signIn, signOut, signUp]);

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
  readonly loading: boolean;
  readonly message: string;
  readonly signIn: (credentials: WorkspaceCredentials) => Promise<boolean>;
  readonly signUp: (credentials: WorkspaceCredentials) => Promise<boolean>;
  readonly signOut: () => Promise<void>;
};
