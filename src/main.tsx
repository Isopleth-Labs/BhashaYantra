import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "@/app/App";
import { APP_VERSION, createUserDataBackup, initializeBetaDataLifecycle } from "@/application/beta-data-lifecycle";
import { I18nProvider } from "@/i18n/I18nProvider";
import { AppEntryGate } from "@/features/auth/AppEntryGate";
import { WorkspaceAuthProvider } from "@/features/settings/useWorkspaceAuth";
import "@/styles/globals.css";

const lifecycle = initializeBetaDataLifecycle();
const root = createRoot(document.getElementById("root")!);

if (lifecycle.status === "newer-schema") {
  function exportRecoveryBackup() {
    const backup = createUserDataBackup();
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `BhashaYantra-recovery-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }
  root.render(<main className="data-recovery-screen"><section><span>DATA PROTECTION</span><h1>A newer BhashaYantra version is required</h1><p>This device contains data schema {lifecycle.schemaVersion}, but app {APP_VERSION} supports an older schema. Your data has not been changed.</p><button type="button" onClick={exportRecoveryBackup}>Export recovery backup</button><small>Install the latest BhashaYantra build, then reopen the app. Do not reset or uninstall application data.</small></section></main>);
} else {
  root.render(
    <StrictMode>
      <I18nProvider>
        <WorkspaceAuthProvider>
          <AppEntryGate><App /></AppEntryGate>
        </WorkspaceAuthProvider>
      </I18nProvider>
    </StrictMode>,
  );
}
