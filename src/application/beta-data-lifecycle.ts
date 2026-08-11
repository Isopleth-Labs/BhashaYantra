export const APP_VERSION = __APP_VERSION__;
export const USER_DATA_SCHEMA_VERSION = 1;

const PRODUCT_ID = "com.bhashayantra.desktop";
const STORAGE_PREFIX = "bhashayantra";
const MANIFEST_KEY = "bhashayantra:system:data-manifest:v1";
const MAX_BACKUP_CHARACTERS = 4_500_000;

interface DataManifest {
  readonly schemaVersion: number;
  readonly firstInstalledVersion: string;
  readonly lastSeenVersion: string;
  readonly lastSuccessfulBootAt: string;
}

export interface BhashaYantraBackup {
  readonly product: typeof PRODUCT_ID;
  readonly formatVersion: 1;
  readonly dataSchemaVersion: number;
  readonly appVersion: string;
  readonly exportedAt: string;
  readonly entries: Readonly<Record<string, string>>;
}

export interface DataLifecycleStatus {
  readonly status: "ready" | "newer-schema";
  readonly schemaVersion: number;
  readonly firstInstalledVersion: string;
  readonly lastSeenVersion: string;
}

function parseManifest(value: string | null): DataManifest | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;
    const candidate = parsed as Partial<DataManifest>;
    if (!Number.isInteger(candidate.schemaVersion) || Number(candidate.schemaVersion) < 1) return null;
    if (typeof candidate.firstInstalledVersion !== "string" || typeof candidate.lastSeenVersion !== "string" || typeof candidate.lastSuccessfulBootAt !== "string") return null;
    return candidate as DataManifest;
  } catch {
    return null;
  }
}

function isBackupKey(key: string) {
  return key.startsWith(STORAGE_PREFIX) && key !== MANIFEST_KEY;
}

function listBackupKeys(storage: Storage) {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && isBackupKey(key)) keys.push(key);
  }
  return keys.sort();
}

export function initializeBetaDataLifecycle(storage: Storage = localStorage, appVersion = APP_VERSION): DataLifecycleStatus {
  const now = new Date().toISOString();
  const current = parseManifest(storage.getItem(MANIFEST_KEY));
  if (current && current.schemaVersion > USER_DATA_SCHEMA_VERSION) {
    return {
      status: "newer-schema",
      schemaVersion: current.schemaVersion,
      firstInstalledVersion: current.firstInstalledVersion,
      lastSeenVersion: current.lastSeenVersion,
    };
  }

  const next: DataManifest = {
    schemaVersion: USER_DATA_SCHEMA_VERSION,
    firstInstalledVersion: current?.firstInstalledVersion ?? appVersion,
    lastSeenVersion: appVersion,
    lastSuccessfulBootAt: now,
  };
  storage.setItem(MANIFEST_KEY, JSON.stringify(next));
  return { status: "ready", ...next };
}

export function createUserDataBackup(storage: Storage = localStorage, appVersion = APP_VERSION): BhashaYantraBackup {
  const entries: Record<string, string> = {};
  for (const key of listBackupKeys(storage)) entries[key] = storage.getItem(key) ?? "";
  return {
    product: PRODUCT_ID,
    formatVersion: 1,
    dataSchemaVersion: USER_DATA_SCHEMA_VERSION,
    appVersion,
    exportedAt: new Date().toISOString(),
    entries,
  };
}

function parseBackup(serialized: string): BhashaYantraBackup {
  if (serialized.length > MAX_BACKUP_CHARACTERS) throw new Error("Backup is larger than the supported local-data limit.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new Error("This is not a valid BhashaYantra backup file.");
  }
  if (!parsed || typeof parsed !== "object") throw new Error("This is not a valid BhashaYantra backup file.");
  const backup = parsed as Partial<BhashaYantraBackup>;
  if (backup.product !== PRODUCT_ID || backup.formatVersion !== 1 || backup.dataSchemaVersion !== USER_DATA_SCHEMA_VERSION || !backup.entries || typeof backup.entries !== "object") {
    throw new Error("This backup belongs to an unsupported product or data version.");
  }
  const entries = Object.entries(backup.entries);
  if (entries.some(([key, value]) => !isBackupKey(key) || typeof value !== "string")) {
    throw new Error("The backup contains an unsafe or invalid storage entry.");
  }
  if (typeof backup.appVersion !== "string" || typeof backup.exportedAt !== "string") throw new Error("The backup metadata is incomplete.");
  return backup as BhashaYantraBackup;
}

export function restoreUserDataBackup(serialized: string, storage: Storage = localStorage, appVersion = APP_VERSION) {
  const backup = parseBackup(serialized);
  const currentEntries = new Map(listBackupKeys(storage).map((key) => [key, storage.getItem(key) ?? ""]));
  try {
    for (const key of listBackupKeys(storage)) storage.removeItem(key);
    for (const [key, value] of Object.entries(backup.entries)) storage.setItem(key, value);
    initializeBetaDataLifecycle(storage, appVersion);
  } catch (error) {
    for (const key of listBackupKeys(storage)) storage.removeItem(key);
    for (const [key, value] of currentEntries) storage.setItem(key, value);
    throw error;
  }
  return Object.keys(backup.entries).length;
}
