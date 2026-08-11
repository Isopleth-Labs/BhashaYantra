const INSTALLATION_ID_KEY = "bhashayantra:installation-id-v1";

export interface DeviceLicenseResult {
  readonly allowed: boolean;
  readonly activeDevices: number;
  readonly allowedDevices: number;
  readonly newRegistration: boolean;
}

function createInstallationId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

export function getOrCreateInstallationId(storage: Pick<Storage, "getItem" | "setItem"> = window.localStorage) {
  const existing = storage.getItem(INSTALLATION_ID_KEY);
  if (existing && /^[a-f0-9-]{32,64}$/iu.test(existing)) return existing;
  const created = createInstallationId();
  storage.setItem(INSTALLATION_ID_KEY, created);
  return created;
}

export async function hashInstallationId(installationId: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(installationId));
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

export async function createDeviceRegistration() {
  return {
    deviceHash: await hashInstallationId(getOrCreateInstallationId()),
    deviceLabel: "BhashaYantra Windows desktop",
  } as const;
}
