import { supabase } from "@/data/supabase/client";

export const TRANSLATION_LANGUAGES = [
  { id: "en", name: "English" },
  { id: "hi", name: "Hindi" },
  { id: "mr", name: "Marathi" },
  { id: "pa", name: "Punjabi" },
  { id: "bn", name: "Bengali" },
  { id: "gu", name: "Gujarati" },
] as const;

export const TRANSLATION_PROVIDERS = [
  { id: "libretranslate", name: "LibreTranslate — open source / self-hosted" },
  { id: "google-cloud", name: "Google Cloud — Supabase secured" },
] as const;

export type TranslationLanguageId = (typeof TRANSLATION_LANGUAGES)[number]["id"];
export type TranslationProviderId = (typeof TRANSLATION_PROVIDERS)[number]["id"];

export interface TranslationProviderSettings {
  readonly provider: TranslationProviderId;
  readonly libreTranslateUrl: string;
  readonly libreTranslateApiKey: string;
}

export interface TranslationRequest {
  readonly text: string;
  readonly sourceLanguage: TranslationLanguageId;
  readonly targetLanguage: TranslationLanguageId;
}

export interface TranslationResponse {
  readonly translatedText: string;
  readonly detectedSourceLanguage?: string;
  readonly provider: TranslationProviderId;
}

const SETTINGS_KEY = "bhashayantra.translation-provider.v1";
export const DEFAULT_TRANSLATION_PROVIDER_SETTINGS: TranslationProviderSettings = {
  provider: "libretranslate",
  libreTranslateUrl: "http://127.0.0.1:5000",
  libreTranslateApiKey: "",
};

const TARGET_SCRIPT: Partial<Record<TranslationLanguageId, RegExp>> = {
  en: /[A-Za-z]/u,
  hi: /[\u0900-\u097F]/u,
  mr: /[\u0900-\u097F]/u,
  pa: /[\u0A00-\u0A7F]/u,
  bn: /[\u0980-\u09FF]/u,
  gu: /[\u0A80-\u0AFF]/u,
};

export function loadTranslationProviderSettings(): TranslationProviderSettings {
  if (typeof window === "undefined") return DEFAULT_TRANSLATION_PROVIDER_SETTINGS;
  try {
    const saved = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? "null") as Partial<TranslationProviderSettings> | null;
    if (!saved) return DEFAULT_TRANSLATION_PROVIDER_SETTINGS;
    return {
      provider: saved.provider === "google-cloud" ? "google-cloud" : "libretranslate",
      libreTranslateUrl: typeof saved.libreTranslateUrl === "string" ? saved.libreTranslateUrl : DEFAULT_TRANSLATION_PROVIDER_SETTINGS.libreTranslateUrl,
      libreTranslateApiKey: typeof saved.libreTranslateApiKey === "string" ? saved.libreTranslateApiKey : "",
    };
  } catch {
    return DEFAULT_TRANSLATION_PROVIDER_SETTINGS;
  }
}

export function saveTranslationProviderSettings(settings: TranslationProviderSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    ...settings,
    // Remote API keys are session-only until OS credential storage is added.
    libreTranslateApiKey: "",
  }));
}

export function normalizeLibreTranslateUrl(value: string) {
  const input = value.trim();
  if (!input) throw new Error("Enter a LibreTranslate server URL");

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("Enter a valid LibreTranslate server URL");
  }
  if (url.username || url.password) throw new Error("Do not place credentials inside the provider URL");
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("LibreTranslate URL must use HTTP or HTTPS");
  const localHosts = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
  if (url.protocol === "http:" && !localHosts.has(url.hostname)) {
    throw new Error("Remote LibreTranslate servers must use HTTPS");
  }
  return url.toString().replace(/\/$/u, "");
}

export function validateTranslationRequest(request: TranslationRequest) {
  const text = request.text.trim();
  if (!text) throw new Error("Enter text to translate");
  if (text.length > 5_000) throw new Error("Translation is limited to 5,000 characters per request");
  if (request.sourceLanguage === request.targetLanguage) {
    throw new Error("Choose two different languages");
  }
  return { ...request, text };
}

export function parseTranslationResponse(
  value: unknown,
  expectedProvider: TranslationProviderId = "google-cloud",
): TranslationResponse {
  if (!value || typeof value !== "object") throw new Error("Translation provider returned an invalid response");
  const response = value as Partial<TranslationResponse>;
  if (typeof response.translatedText !== "string" || !response.translatedText.trim()) {
    throw new Error("Translation provider returned no text");
  }
  if (response.provider !== expectedProvider) {
    throw new Error("Translation provider identity could not be verified");
  }
  return {
    translatedText: response.translatedText.trim(),
    detectedSourceLanguage: typeof response.detectedSourceLanguage === "string" ? response.detectedSourceLanguage : undefined,
    provider: expectedProvider,
  };
}

export function validateTranslationOutput(request: TranslationRequest, response: TranslationResponse) {
  const source = request.text.trim().normalize("NFC");
  const output = response.translatedText.trim().normalize("NFC");
  if (source.localeCompare(output, undefined, { sensitivity: "base" }) === 0 && source.split(/\s+/u).length > 1) {
    throw new Error("Provider returned the source text unchanged; translation was rejected");
  }

  const script = TARGET_SCRIPT[request.targetLanguage];
  if (script && /\p{L}/u.test(output) && !script.test(output)) {
    throw new Error("Provider output does not match the selected target-language script");
  }
  return { ...response, translatedText: output };
}

async function readProviderError(response: Response) {
  try {
    const payload = await response.json() as { error?: unknown };
    if (typeof payload.error === "string") return payload.error;
  } catch {
    // Use the status fallback when a provider returns HTML or an empty body.
  }
  return `Translation provider failed (${response.status})`;
}

export function describeLibreTranslateConnectionError(error: unknown, baseUrl: string) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "LibreTranslate did not respond within 45 seconds";
  }
  if (error instanceof TypeError || (error instanceof Error && /failed to fetch|networkerror/iu.test(error.message))) {
    return `LibreTranslate is not reachable at ${baseUrl}. Start the local Docker provider, then check again.`;
  }
  return error instanceof Error ? error.message : "LibreTranslate connection failed";
}

async function translateWithLibreTranslate(
  request: TranslationRequest,
  settings: TranslationProviderSettings,
): Promise<TranslationResponse> {
  const baseUrl = normalizeLibreTranslateUrl(settings.libreTranslateUrl);
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch(`${baseUrl}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        q: request.text,
        source: request.sourceLanguage,
        target: request.targetLanguage,
        format: "text",
        ...(settings.libreTranslateApiKey.trim() ? { api_key: settings.libreTranslateApiKey.trim() } : {}),
      }),
    });
    if (!response.ok) throw new Error(await readProviderError(response));
    const payload = await response.json() as { translatedText?: unknown; detectedLanguage?: { language?: unknown } };
    return parseTranslationResponse({
      translatedText: payload.translatedText,
      detectedSourceLanguage: payload.detectedLanguage?.language,
      provider: "libretranslate",
    }, "libretranslate");
  } catch (error) {
    throw new Error(describeLibreTranslateConnectionError(error, baseUrl));
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

async function translateWithGoogle(request: TranslationRequest): Promise<TranslationResponse> {
  if (!supabase) throw new Error("Connect Supabase to use Google Cloud Translation");
  const { data, error } = await supabase.functions.invoke("translate-text", { body: request });
  if (error) throw new Error(error.message || "Translation request failed");
  return parseTranslationResponse(data, "google-cloud");
}

export async function testTranslationProvider(settings: TranslationProviderSettings) {
  if (settings.provider === "google-cloud") {
    if (!supabase) throw new Error("Supabase is not configured");
    return "Google Cloud boundary is configured";
  }

  const baseUrl = normalizeLibreTranslateUrl(settings.libreTranslateUrl);
  try {
    const response = await fetch(`${baseUrl}/languages`);
    if (!response.ok) throw new Error(await readProviderError(response));
    const languages = await response.json() as Array<{ code?: unknown }>;
    if (!Array.isArray(languages)) throw new Error("LibreTranslate returned an invalid language list");
    const codes = new Set(languages.map((language) => language.code).filter((code): code is string => typeof code === "string"));
    if (!codes.has("en") || !codes.has("hi")) {
      throw new Error("This LibreTranslate server does not have both English and Hindi models installed");
    }
    return `LibreTranslate connected — ${codes.size} languages available`;
  } catch (error) {
    throw new Error(describeLibreTranslateConnectionError(error, baseUrl));
  }
}

export async function translateText(
  request: TranslationRequest,
  settings: TranslationProviderSettings = loadTranslationProviderSettings(),
): Promise<TranslationResponse> {
  const validated = validateTranslationRequest(request);
  const response = settings.provider === "libretranslate"
    ? await translateWithLibreTranslate(validated, settings)
    : await translateWithGoogle(validated);
  return validateTranslationOutput(validated, response);
}
