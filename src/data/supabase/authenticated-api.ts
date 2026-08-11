import { supabase } from "@/data/supabase/client";

export async function invokeAuthenticatedFunction<TResponse>(name: string, body: Record<string, unknown>): Promise<TResponse> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error("Sign in before calling this service.");

  const { data, error } = await supabase.functions.invoke(name, {
    body,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (error) throw error;
  return data as TResponse;
}
