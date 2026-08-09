import { useEffect, useState } from "react";
import { AppWindow, LoaderCircle, Send } from "lucide-react";

import { sendTextToActiveApplication } from "@/application/use-anywhere";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";

interface UseAnywherePanelProps {
  readonly text: string;
}

export function UseAnywherePanel({ text }: UseAnywherePanelProps) {
  const { t } = useI18n();
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => setStatus(""), [text]);

  async function sendAnywhere() {
    if (!text.trim() || sending) return;
    setSending(true);
    setStatus(t("anywhereSwitching"));
    try {
      const result = await sendTextToActiveApplication(text);
      setStatus(t(result === "sent" ? "anywhereSent" : "anywhereCopied"));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t("anywhereFailed"));
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="use-anywhere-panel" aria-labelledby="use-anywhere-title">
      <div className="use-anywhere-icon"><AppWindow aria-hidden="true" /></div>
      <div className="use-anywhere-copy">
        <strong id="use-anywhere-title">{t("useAnywhere")}</strong>
        <p>{t("useAnywhereDescription")}</p>
        <span aria-live="polite">{status || t("useAnywhereHint")}</span>
      </div>
      <div className="use-anywhere-badges" aria-hidden="true">
        <span>Windows</span><span>Unicode</span>
      </div>
      <Button onClick={sendAnywhere} disabled={!text.trim() || sending}>
        {sending ? <LoaderCircle className="spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
        {t("sendToActiveApp")}
      </Button>
    </section>
  );
}
