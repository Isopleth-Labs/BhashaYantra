import { describe, expect, it } from "vitest";

import { parseTranslationResponse, validateTranslationRequest } from "@/application/translation-service";

describe("translation service boundary", () => {
  it("normalizes valid requests", () => {
    expect(validateTranslationRequest({ text: "  Good morning  ", sourceLanguage: "en", targetLanguage: "hi" })).toEqual({
      text: "Good morning",
      sourceLanguage: "en",
      targetLanguage: "hi",
    });
  });

  it("rejects empty and same-language requests", () => {
    expect(() => validateTranslationRequest({ text: " ", sourceLanguage: "en", targetLanguage: "hi" })).toThrow("Enter text");
    expect(() => validateTranslationRequest({ text: "Hello", sourceLanguage: "en", targetLanguage: "en" })).toThrow("different languages");
  });

  it("accepts only a real provider response", () => {
    expect(parseTranslationResponse({ translatedText: "सुप्रभात", provider: "google-cloud" })).toEqual({
      translatedText: "सुप्रभात",
      detectedSourceLanguage: undefined,
      provider: "google-cloud",
    });
    expect(() => parseTranslationResponse({ translatedText: "" })).toThrow("no text");
    expect(() => parseTranslationResponse({ translatedText: "सुप्रभात", provider: "unknown" })).toThrow("identity");
  });
});
