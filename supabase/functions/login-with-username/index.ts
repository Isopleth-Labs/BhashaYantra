const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, content-type, x-client-info",
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !publishableKey || !serviceRoleKey) return json({ error: "Login service is not configured" }, 503);
  const restBaseUrl = url === "http://kong:8000" ? "http://rest:3000" : `${url}/rest/v1`;
  const authBaseUrl = url === "http://kong:8000" ? "http://auth:9999" : `${url}/auth/v1`;

  try {
    const body = await request.json() as { username?: unknown; password?: unknown };
    const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!/^[a-z0-9][a-z0-9._-]{2,31}$/u.test(username) || password.length < 8 || password.length > 128) {
      return json({ error: "Invalid username or password" }, 401);
    }

    const profileResponse = await fetch(`${restBaseUrl}/profiles?select=login_email&username=eq.${encodeURIComponent(username)}&limit=1`, {
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    });
    const profiles = profileResponse.ok ? await profileResponse.json() as Array<{ login_email?: string }> : [];
    const email = profiles[0]?.login_email;
    if (!email) return json({ error: "Invalid username or password" }, 401);

    const authResponse = await fetch(`${authBaseUrl}/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: publishableKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const session = await authResponse.json() as {
      access_token?: string;
      refresh_token?: string;
      expires_at?: number;
      token_type?: string;
    };
    if (!authResponse.ok || !session.access_token || !session.refresh_token) return json({ error: "Invalid username or password" }, 401);

    return json({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      token_type: session.token_type,
    });
  } catch {
    return json({ error: "Invalid username or password" }, 401);
  }
});
