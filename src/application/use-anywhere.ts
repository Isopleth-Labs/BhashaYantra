export type AnywhereDeliveryResult = "sent" | "copied";

function isTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

export async function sendTextToActiveApplication(text: string): Promise<AnywhereDeliveryResult> {
  if (!text.trim()) throw new Error("There is no text to send");

  if (!isTauriRuntime()) {
    await navigator.clipboard.writeText(text);
    return "copied";
  }

  const { invoke } = await import("@tauri-apps/api/core");
  await invoke<number>("send_text_to_previous_app", { text });
  return "sent";
}
