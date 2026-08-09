import { supabase } from "@/data/supabase/client";

export const TRANSLATION_LANGUAGES = [
  { id: "en", name: "English" },
  { id: "hi", name: "Hindi" },
  { id: "mr", name: "Marathi" },
  { id: "pa", name: "Punjabi" },
  { id: "bn", name: "Bengali" },
  { id: "gu", name: "Gujarati" },
] as const;

export type TranslationLanguageId = (typeof TRANSLATION_LANGUAGES)[number]["id"];

export interface TranslationRequest {
  readonly text: string;
  readonly sourceLanguage: TranslationLanguageId;
  readonly targetLanguage: TranslationLanguageId;
}

export interface TranslationResponse {
  readonly translatedText: string;
  readonly detectedSourceLanguage?: string;
  readonly provider: "google-cloud";
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

export function parseTranslationResponse(value: unknown): TranslationResponse {
  if (!value || typeof value !== "object") throw new Error("Translation provider returned an invalid response");
  const response = value as Partial<TranslationResponse>;
  if (typeof response.translatedText !== "string" || !response.translatedText.trim()) {
    throw new Error("Translation provider returned no text");
  }
  if (response.provider !== "google-cloud") {
    throw new Error("Translation provider identity could not be verified");
  }
  return {
    translatedText: response.translatedText,
    detectedSourceLanguage: typeof response.detectedSourceLanguage === "string" ? response.detectedSourceLanguage : undefined,
    provider: "google-cloud",
  };
}

export async function translateText(request: TranslationRequest): Promise<TranslationResponse> {
  const validated = validateTranslationRequest(request);
  if (!supabase) {
    throw new Error("Connect Supabase to enable secure language translation");
  }

  const { data, error } = await supabase.functions.invoke("translate-text", {
    body: validated,
  });
  if (error) throw new Error(error.message || "Translation request failed");
  return parseTranslationResponse(data);
}
