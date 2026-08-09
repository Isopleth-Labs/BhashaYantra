import { useEffect, useMemo, useState } from "react";
import { BarChart3, ChevronRight, FileOutput, Search, Settings2, UploadCloud } from "lucide-react";

import {
  LocalTrainingAttemptsRepository,
  TRAINING_ATTEMPTS_UPDATED_EVENT,
} from "@/data/repositories/local-training-attempts-repository";
import { summarizeTrainingAttempts, type TrainingAttempt } from "@/domain/training/training-attempt";
import { formatShortcut, type ReadyTypingLayoutId, type ShortcutDefinition } from "@/domain/typing/typing-engine";
import { useI18n } from "@/i18n/I18nProvider";

interface ProductivityRailProps {
  readonly layoutId: ReadyTypingLayoutId;
  readonly shortcuts: readonly ShortcutDefinition[];
  readonly onInsertShortcut: (character: string) => void;
  readonly onOpenShortcutLibrary: () => void;
  readonly onOpenDocuments: () => void;
  readonly onOpenHistory: () => void;
}

export function ProductivityRail({
  layoutId,
  shortcuts,
  onInsertShortcut,
  onOpenShortcutLibrary,
  onOpenDocuments,
  onOpenHistory,
}: ProductivityRailProps) {
  const { t } = useI18n();
  const repository = useMemo(() => new LocalTrainingAttemptsRepository(), []);
  const [attempts, setAttempts] = useState<readonly TrainingAttempt[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    const load = () => void repository.list().then((items) => {
      if (active) setAttempts(items);
    });
    load();
    window.addEventListener(TRAINING_ATTEMPTS_UPDATED_EVENT, load);
    return () => {
      active = false;
      window.removeEventListener(TRAINING_ATTEMPTS_UPDATED_EVENT, load);
    };
  }, [repository]);

  const visibleShortcuts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return shortcuts
      .filter((shortcut) => `${shortcut.character} ${formatShortcut(shortcut)}`.toLocaleLowerCase().includes(normalizedQuery))
      .slice(0, 4);
  }, [query, shortcuts]);
  const summary = useMemo(() => summarizeTrainingAttempts(attempts, layoutId), [attempts, layoutId]);
  const chartPoints = useMemo(() => {
    if (summary.recentWpm.length < 2) return "";
    const maximum = Math.max(...summary.recentWpm, 1);
    return summary.recentWpm.map((value, index) => {
      const x = (index / (summary.recentWpm.length - 1)) * 300;
      const y = 65 - (value / maximum) * 52;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  }, [summary.recentWpm]);

  return (
    <aside className="right-rail" aria-label={t("productivityTools")}>
      <section className="rail-card shortcut-preview-card">
        <div className="rail-card-title"><strong>{t("shortcutManager")}</strong><Settings2 aria-hidden="true" /></div>
        <label className="search-field"><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchShortcut")} /></label>
        <div className="shortcut-table" role="table">
          <div className="shortcut-row shortcut-header" role="row"><span>{t("character")}</span><span>{t("shortcut")}</span></div>
          {visibleShortcuts.map((shortcut) => (
            <button type="button" className="shortcut-row shortcut-insert-row" role="row" key={shortcut.id} onClick={() => onInsertShortcut(shortcut.character)}>
              <strong>{shortcut.character}</strong><span>{formatShortcut(shortcut)}</span>
            </button>
          ))}
          {visibleShortcuts.length === 0 && <p className="empty-shortcuts">{t("noMatchingShortcut")}</p>}
        </div>
        <button type="button" className="rail-link" onClick={onOpenShortcutLibrary}>{t("viewAllShortcuts")} <ChevronRight aria-hidden="true" /></button>
      </section>

      <section className="rail-card document-rail-card">
        <div className="rail-card-title document-title"><span className="green-icon"><FileOutput aria-hidden="true" /></span><strong>{t("documentConverter")}</strong></div>
        <button type="button" className="drop-zone" onClick={onOpenDocuments}>
          <UploadCloud aria-hidden="true" />
          <span>{t("documentWorkspaceDescription")}</span>
          <small>{t("documentWorkspaceFormats")}</small>
          <span className="document-button">{t("openExchangeConverter")}</span>
        </button>
      </section>

      <section className="rail-card typing-summary">
        <div className="rail-card-title"><span className="summary-title"><BarChart3 aria-hidden="true" />{t("typingTest")}</span><button type="button" onClick={onOpenHistory}>{t("viewHistory")}</button></div>
        <div className="metric-grid">
          <div className="metric"><span>{t("bestWpm")}</span><strong>{summary.bestWpm}</strong><small>{summary.attemptCount} {t("attempts")}</small></div>
          <div className="metric"><span>{t("averageAccuracy")}</span><strong>{summary.averageAccuracy}%</strong><small>{summary.completedExerciseCount} {t("completedExercises")}</small></div>
          <div className="metric"><span>{t("bestKdph")}</span><strong>{summary.bestKdph}</strong><small>{t("savedOffline")}</small></div>
        </div>
        {chartPoints ? (
          <svg className="trend-chart" viewBox="0 0 300 74" role="img" aria-label={t("recentSpeedTrend")} preserveAspectRatio="none">
            <path d="M0 66 H300" className="trend-baseline" />
            <polyline points={chartPoints} className="trend-line" />
          </svg>
        ) : <p className="summary-empty">{t("noAttempts")}</p>}
      </section>
    </aside>
  );
}
