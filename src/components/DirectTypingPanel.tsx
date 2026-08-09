import { useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, LoaderCircle, Power, ShieldCheck } from "lucide-react";

import {
  createDirectTypingProfile,
  getDirectTypingStatus,
  isDirectTypingDesktopAvailable,
  startDirectTyping,
  stopDirectTyping,
  updateDirectTyping,
  type DirectTypingStatus,
} from "@/application/direct-typing";
import { Button } from "@/components/ui/button";
import type {
  CustomKeyMapping,
  ReadyTypingLayoutId,
  ShortcutDefinition,
  TypingOutputMode,
} from "@/domain/typing/typing-engine";
import { TYPING_LAYOUT_PROFILES } from "@/domain/typing/typing-profiles";
import { useI18n } from "@/i18n/I18nProvider";

interface DirectTypingPanelProps {
  readonly layout: ReadyTypingLayoutId;
  readonly outputMode: TypingOutputMode;
  readonly customMappings: readonly CustomKeyMapping[];
  readonly shortcuts: readonly ShortcutDefinition[];
}

const EMPTY_STATUS: DirectTypingStatus = {
  available: false,
  enabled: false,
  layout: null,
  outputMode: null,
  lastError: null,
};

export function DirectTypingPanel({ layout, outputMode, customMappings, shortcuts }: DirectTypingPanelProps) {
  const { t } = useI18n();
  const desktopAvailable = isDirectTypingDesktopAvailable();
  const profile = useMemo(
    () => createDirectTypingProfile(layout, outputMode, customMappings, shortcuts),
    [customMappings, layout, outputMode, shortcuts],
  );
  const profileSignature = useMemo(
    () => JSON.stringify({ layout, outputMode, customMappings, shortcuts }),
    [customMappings, layout, outputMode, shortcuts],
  );
  const lastSyncedProfile = useRef(profileSignature);
  const [nativeStatus, setNativeStatus] = useState<DirectTypingStatus>(EMPTY_STATUS);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const selectedLayout = TYPING_LAYOUT_PROFILES.find((item) => item.id === layout)?.name ?? layout;
  const enabled = nativeStatus.enabled;

  useEffect(() => {
    if (!desktopAvailable) return;
    let cancelled = false;

    async function refresh() {
      try {
        const next = await getDirectTypingStatus();
        if (!cancelled) setNativeStatus(next);
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : t("directTypingFailed"));
      }
    }

    void refresh();
    const timer = window.setInterval(() => void refresh(), 800);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [desktopAvailable, t]);

  useEffect(() => {
    if (!enabled || lastSyncedProfile.current === profileSignature) return;
    lastSyncedProfile.current = profileSignature;
    void updateDirectTyping(profile)
      .then(() => setMessage(t("directTypingProfileUpdated")))
      .catch((error) => setMessage(error instanceof Error ? error.message : t("directTypingFailed")));
  }, [enabled, profile, profileSignature, t]);

  async function toggleDirectTyping() {
    if (busy || !desktopAvailable) return;
    setBusy(true);
    setMessage("");
    try {
      const next = enabled ? await stopDirectTyping() : await startDirectTyping(profile);
      lastSyncedProfile.current = profileSignature;
      if (next) setNativeStatus(next);
      setMessage(t(enabled ? "directTypingStopped" : "directTypingStarted"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("directTypingFailed"));
    } finally {
      setBusy(false);
    }
  }

  const statusMessage = nativeStatus.lastError
    || message
    || (!desktopAvailable
      ? t("directTypingDesktopOnly")
      : enabled
        ? t("directTypingActiveHint")
        : t("directTypingInactiveHint"));

  return (
    <section className={enabled ? "direct-typing-panel active" : "direct-typing-panel"} aria-labelledby="direct-typing-title">
      <div className="direct-typing-icon"><Keyboard aria-hidden="true" /></div>
      <div className="direct-typing-copy">
        <div className="direct-typing-title-row">
          <strong id="direct-typing-title">{t("directTyping")}</strong>
          <span className={enabled ? "direct-status active" : "direct-status"}>{t(enabled ? "directTypingOn" : "directTypingOff")}</span>
        </div>
        <p>{t("directTypingDescription")}</p>
        <span aria-live="polite">{statusMessage}</span>
      </div>
      <div className="direct-typing-profile" aria-label={t("directTypingSelectedProfile")}>
        <strong>{selectedLayout}</strong>
        <span>{outputMode === "legacy" ? "Kruti Dev 010 / Legacy" : "Unicode"}</span>
        {outputMode === "legacy" && <small>{t("directTypingLegacyFontRequired")}</small>}
      </div>
      <div className="direct-typing-safety">
        <ShieldCheck aria-hidden="true" />
        <span><strong>Ctrl + Alt + F12</strong><small>{t("directTypingEmergencyOff")}</small></span>
      </div>
      <Button
        className="direct-typing-toggle"
        variant={enabled ? "danger" : "default"}
        onClick={toggleDirectTyping}
        disabled={busy || !desktopAvailable}
        aria-pressed={enabled}
      >
        {busy ? <LoaderCircle className="spin" aria-hidden="true" /> : <Power aria-hidden="true" />}
        {t(enabled ? "turnDirectTypingOff" : "turnDirectTypingOn")}
      </Button>
    </section>
  );
}
