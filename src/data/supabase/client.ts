import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey,
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: "pkce",
      },
    })
  : null;

export async function signInWithUsername(username: string, password: string) {
  if (!supabase || !supabaseUrl || !supabasePublishableKey) throw new Error("Supabase Auth is not configured in this build.");
  const response = await fetch(`${supabaseUrl}/functions/v1/login-with-username`, {
    method: "POST",
    headers: {
      apikey: supabasePublishableKey,
      "Content-Type": "application/json",
      "X-Client-Info": "bhashayantra-desktop",
    },
    body: JSON.stringify({ username, password }),
  });
  const payload = await response.json() as { access_token?: string; refresh_token?: string; error?: string };
  if (!response.ok || !payload.access_token || !payload.refresh_token) {
    throw new Error(payload.error ?? "Invalid username or password.");
  }
  return supabase.auth.setSession({ access_token: payload.access_token, refresh_token: payload.refresh_token });
}
