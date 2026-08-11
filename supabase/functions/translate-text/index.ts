const ALLOWED_LANGUAGES = new Set(["en", "hi", "mr", "pa", "bn", "gu"]);
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

function decodeEntities(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // The Edge gateway validates this bearer token because verify_jwt=true. An
  // API key alone represents an anonymous client and must never spend provider
  // quota or access a server-side translation credential.
  const authorization = request.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);

  const apiKey = Deno.env.get("GOOGLE_CLOUD_TRANSLATE_KEY");
  if (!apiKey) return json({ error: "Translation provider is not configured" }, 503);

  try {
    const body = await request.json() as {
      text?: unknown;
      sourceLanguage?: unknown;
      targetLanguage?: unknown;
    };
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const source = typeof body.sourceLanguage === "string" ? body.sourceLanguage : "";
    const target = typeof body.targetLanguage === "string" ? body.targetLanguage : "";

    if (!text || text.length > 5_000) return json({ error: "Text must contain 1 to 5,000 characters" }, 400);
    if (!ALLOWED_LANGUAGES.has(source) || !ALLOWED_LANGUAGES.has(target) || source === target) {
      return json({ error: "Unsupported language pair" }, 400);
    }

    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source, target, format: "text" }),
    });
    const payload = await response.json() as {
      data?: { translations?: Array<{ translatedText?: string; detectedSourceLanguage?: string }> };
      error?: { message?: string };
    };
    if (!response.ok) return json({ error: payload.error?.message ?? "Translation provider failed" }, 502);

    const translation = payload.data?.translations?.[0];
    if (!translation?.translatedText) return json({ error: "Translation provider returned no text" }, 502);
    return json({
      translatedText: decodeEntities(translation.translatedText),
      detectedSourceLanguage: translation.detectedSourceLanguage,
      provider: "google-cloud",
    });
  } catch {
    return json({ error: "Invalid translation request" }, 400);
  }
});
