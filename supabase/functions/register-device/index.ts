const jsonHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return respond(405, { error: "Method not allowed" });

  const authorization = request.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return respond(401, { error: "Authentication required" });

  let payload: { deviceHash?: unknown; deviceLabel?: unknown };
  try {
    payload = await request.json();
  } catch {
    return respond(400, { error: "Invalid request" });
  }

  const deviceHash = typeof payload.deviceHash === "string" ? payload.deviceHash.toLowerCase() : "";
  const deviceLabel = typeof payload.deviceLabel === "string" ? payload.deviceLabel.trim() : "Windows device";
  if (!/^[a-f0-9]{64}$/u.test(deviceHash) || deviceLabel.length < 1 || deviceLabel.length > 80) {
    return respond(400, { error: "Invalid device registration" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!supabaseUrl || !publishableKey) return respond(503, { error: "Device licensing is unavailable" });

  const restUrl = supabaseUrl === "http://kong:8000" ? "http://rest:3000" : `${supabaseUrl}/rest/v1`;
  const registration = await fetch(`${restUrl}/rpc/register_current_device`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: authorization,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_device_hash: deviceHash, p_device_label: deviceLabel }),
  });
  const result = await registration.json().catch(() => null) as null | Array<{
    allowed?: boolean;
    active_devices?: number;
    allowed_devices?: number;
    new_registration?: boolean;
  }>;

  if (!registration.ok || !result?.[0]) {
    return respond(registration.status >= 400 && registration.status < 500 ? registration.status : 503, {
      error: "Device licence could not be verified",
    });
  }

  return respond(200, {
    allowed: result[0].allowed === true,
    activeDevices: Number(result[0].active_devices ?? 0),
    allowedDevices: Number(result[0].allowed_devices ?? 1),
    newRegistration: result[0].new_registration === true,
  });
});
