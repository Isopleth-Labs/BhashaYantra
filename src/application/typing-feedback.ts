export type TypingFeedbackTone = "error" | "success" | "preview";

let sharedContext: AudioContext | undefined;

export function playTypingFeedback(tone: TypingFeedbackTone) {
  const AudioContextClass = window.AudioContext;
  if (!AudioContextClass) return;
  try {
    sharedContext ??= new AudioContextClass();
    if (sharedContext.state === "suspended") void sharedContext.resume();
    const oscillator = sharedContext.createOscillator();
    const gain = sharedContext.createGain();
    const now = sharedContext.currentTime;
    oscillator.type = tone === "error" ? "square" : "sine";
    oscillator.frequency.setValueAtTime(tone === "error" ? 185 : tone === "success" ? 720 : 440, now);
    gain.gain.setValueAtTime(tone === "error" ? 0.055 : 0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (tone === "error" ? 0.11 : 0.08));
    oscillator.connect(gain);
    gain.connect(sharedContext.destination);
    oscillator.start(now);
    oscillator.stop(now + (tone === "error" ? 0.11 : 0.08));
  } catch {
    // Optional feedback must never interrupt a typing session.
  }
}
