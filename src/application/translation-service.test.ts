import { describe, expect, it } from "vitest";

import {
  describeLibreTranslateConnectionError,
  normalizeLibreTranslateUrl,
  parseTranslationResponse,
  validateTranslationOutput,
  validateTranslationRequest,
} from "@/application/translation-service";

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

  it("accepts only the selected provider identity", () => {
    expect(parseTranslationResponse({ translatedText: "सुप्रभात", provider: "google-cloud" })).toEqual({
      translatedText: "सुप्रभात",
      detectedSourceLanguage: undefined,
      provider: "google-cloud",
    });
    expect(parseTranslationResponse(
      { translatedText: "सुप्रभात", provider: "libretranslate" },
      "libretranslate",
    ).provider).toBe("libretranslate");
    expect(() => parseTranslationResponse({ translatedText: "" })).toThrow("no text");
    expect(() => parseTranslationResponse({ translatedText: "सुप्रभात", provider: "unknown" })).toThrow("identity");
  });

  it("allows local HTTP but requires HTTPS for remote providers", () => {
    expect(normalizeLibreTranslateUrl("http://127.0.0.1:5000/")).toBe("http://127.0.0.1:5000");
    expect(normalizeLibreTranslateUrl("https://translate.example.com/")).toBe("https://translate.example.com");
    expect(() => normalizeLibreTranslateUrl("http://translate.example.com")).toThrow("must use HTTPS");
    expect(() => normalizeLibreTranslateUrl("file:///tmp/provider")).toThrow("HTTP or HTTPS");
  });

  it("rejects unchanged and wrong-script provider output", () => {
    const request = { text: "Good morning everyone", sourceLanguage: "en", targetLanguage: "hi" } as const;
    expect(() => validateTranslationOutput(request, {
      translatedText: "Good morning everyone",
      provider: "libretranslate",
    })).toThrow("unchanged");
    expect(() => validateTranslationOutput(request, {
      translatedText: "Buenos días",
      provider: "libretranslate",
    })).toThrow("target-language script");
    expect(validateTranslationOutput(request, {
      translatedText: "सभी को सुप्रभात",
      provider: "libretranslate",
    }).translatedText).toBe("सभी को सुप्रभात");
  });

  it("turns provider network failures into setup guidance", () => {
    expect(describeLibreTranslateConnectionError(
      new TypeError("Failed to fetch"),
      "http://127.0.0.1:5000",
    )).toContain("Start the local Docker provider");
  });
});
