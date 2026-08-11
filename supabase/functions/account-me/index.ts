const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

function decodeClaims(token: string) {
  const payload = token.split(".")[1];
  if (!payload) return null;
  const base64 = payload.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
  return JSON.parse(atob(base64)) as Record<string, unknown>;
}

Deno.serve((request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: HEADERS });
  const authorization = request.headers.get("Authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: HEADERS });

  try {
    // The Supabase Edge gateway verifies the JWT before this verify_jwt=true function runs.
    const claims = decodeClaims(token);
    if (!claims?.sub || !claims.exp || Number(claims.exp) * 1000 <= Date.now()) throw new Error("Expired token");
    return new Response(JSON.stringify({
      userId: claims.sub,
      email: claims.email,
      username: claims.username,
      displayName: claims.display_name,
      accountRole: claims.account_role,
      accountStatus: claims.account_status,
      planTier: claims.plan_tier,
      trialEndsAt: claims.trial_ends_at,
    }), { status: 200, headers: HEADERS });
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: HEADERS });
  }
});
