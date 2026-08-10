import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { isSupabaseConfigured, supabase } from "@/data/supabase/client";
import { isAccountWorkspaceRole, type AccountWorkspaceRole } from "@/domain/accounts/account-workspaces";

export interface WorkspaceIdentity {
  readonly userId: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: AccountWorkspaceRole;
}

interface WorkspaceCredentials {
  readonly role: AccountWorkspaceRole;
  readonly email: string;
  readonly password: string;
  readonly displayName?: string;
}

function identityFromUser(user: User, role: AccountWorkspaceRole, displayName = ""): WorkspaceIdentity {
  return {
    userId: user.id,
    email: user.email ?? "",
    displayName: displayName || String(user.user_metadata.display_name ?? ""),
    role,
  };
}

export function useWorkspaceAuth() {
  const [identity, setIdentity] = useState<WorkspaceIdentity | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [message, setMessage] = useState(isSupabaseConfigured ? "Checking your secure session…" : "Supabase Auth is not configured in this build.");

  const hydrateSession = useCallback(async (session: Session | null) => {
    if (!supabase || !session) {
      setIdentity(null);
      setLoading(false);
      return null;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, account_role")
      .eq("user_id", session.user.id)
      .single();
    if (error) {
      setIdentity(null);
      setLoading(false);
      setMessage(`Account profile could not be loaded: ${error.message}`);
      return null;
    }
    const role = isAccountWorkspaceRole(data.account_role) ? data.account_role : "student";
    const nextIdentity = identityFromUser(session.user, role, data.display_name ?? "");
    setIdentity(nextIdentity);
    setLoading(false);
    setMessage(`${role === "student" ? "Student" : "Institute"} account signed in.`);
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
      if (active) void hydrateSession(session);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [hydrateSession]);

  const signIn = useCallback(async ({ role, email, password }: WorkspaceCredentials) => {
    if (!supabase) {
      setMessage("Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable secure login.");
      return false;
    }
    setLoading(true);
    setMessage("Signing in securely…");
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.session) {
      setLoading(false);
      setMessage(error?.message ?? "Sign-in did not return a session.");
      return false;
    }
    const nextIdentity = await hydrateSession(data.session);
    if (!nextIdentity || nextIdentity.role !== role) {
      await supabase.auth.signOut();
      setIdentity(null);
      setLoading(false);
      setMessage(nextIdentity ? `This email belongs to a ${nextIdentity.role} account. Use the ${nextIdentity.role} login.` : "Account role could not be verified.");
      return false;
    }
    return true;
  }, [hydrateSession]);

  const signUp = useCallback(async ({ role, email, password, displayName }: WorkspaceCredentials) => {
    if (!supabase) {
      setMessage("Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable account creation.");
      return false;
    }
    setLoading(true);
    setMessage("Creating your secure workspace…");
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { account_role: role, display_name: displayName?.trim() ?? "" } },
    });
    if (error) {
      setLoading(false);
      setMessage(error.message);
      return false;
    }
    if (!data.session) {
      setLoading(false);
      setMessage("Account created. Confirm the email, then return to the matching login.");
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

  return { configured: isSupabaseConfigured, identity, loading, message, signIn, signUp, signOut };
}

export type WorkspaceAuthController = ReturnType<typeof useWorkspaceAuth>;

