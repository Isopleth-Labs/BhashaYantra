import { invoke } from "@tauri-apps/api/core";

import type { TypingLanguageCode } from "@/domain/typing/typing-profiles";

export type NarrationEngine = "native" | "browser" | "unavailable";

export interface NarrationStatus {
  readonly engine: NarrationEngine;
  readonly label: string;
}

let browserGeneration = 0;

export function splitNarrationText(text: string, maximumCharacters = 190) {
  const words = text.trim().split(/\s+/u).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (current && candidate.length > maximumCharacters) {
      chunks.push(current);
      current = word;
    } else {
      current = candidate;
    }
  });
  if (current) chunks.push(current);
  return chunks;
}

export function narrationRate(wordsPerMinute: number) {
  return Math.min(1.65, Math.max(0.65, wordsPerMinute / 100));
}

async function startBrowserNarration(text: string, language: TypingLanguageCode, wordsPerMinute: number): Promise<NarrationStatus> {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    return { engine: "unavailable", label: "No speech engine is available" };
  }
  const generation = ++browserGeneration;
  const chunks = splitNarrationText(text);
  const locale = language === "hi" ? "hi-IN" : "en-IN";
  const voices = window.speechSynthesis.getVoices();
  const matchingVoice = voices.find((voice) => voice.lang.toLocaleLowerCase().startsWith(language));
  window.speechSynthesis.cancel();

  const speakChunk = (index: number) => {
    if (generation !== browserGeneration || index >= chunks.length) return;
    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    utterance.lang = locale;
    utterance.rate = narrationRate(wordsPerMinute);
    utterance.volume = 1;
    if (matchingVoice) utterance.voice = matchingVoice;
    utterance.onend = () => speakChunk(index + 1);
    utterance.onerror = () => speakChunk(index + 1);
    window.speechSynthesis.speak(utterance);
  };
  speakChunk(0);
  return { engine: "browser", label: matchingVoice?.name ?? "Browser system voice" };
}

export async function startStenographyNarration(text: string, language: TypingLanguageCode, wordsPerMinute: number): Promise<NarrationStatus> {
  try {
    const status = await invoke<{ engine: string }>("start_stenography_voice", {
      text,
      language,
      wordsPerMinute,
    });
    return { engine: "native", label: status.engine };
  } catch {
    return startBrowserNarration(text, language, wordsPerMinute);
  }
}

export async function stopStenographyNarration() {
  browserGeneration += 1;
  window.speechSynthesis?.cancel();
  try {
    await invoke("stop_stenography_voice");
  } catch {
    // Browser preview has no native Tauri command.
  }
}

export async function testStenographyNarration(language: TypingLanguageCode) {
  const text = language === "hi"
    ? "BhashaYantra ki aawaz jaanch safal hai. Ab aap dictation shuru kar sakte hain."
    : "BhashaYantra voice check is working. You can now start the dictation.";
  return startStenographyNarration(text, language, 80);
}

