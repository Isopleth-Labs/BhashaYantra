import { describe, expect, it } from "vitest";

import {
  createUserDataBackup,
  initializeBetaDataLifecycle,
  restoreUserDataBackup,
} from "@/application/beta-data-lifecycle";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe("beta data lifecycle", () => {
  it("keeps the original install version while recording upgrades", () => {
    const storage = new MemoryStorage();
    expect(initializeBetaDataLifecycle(storage, "0.2.0-beta.1").firstInstalledVersion).toBe("0.2.0-beta.1");
    const upgraded = initializeBetaDataLifecycle(storage, "0.2.0-beta.2");
    expect(upgraded.firstInstalledVersion).toBe("0.2.0-beta.1");
    expect(upgraded.lastSeenVersion).toBe("0.2.0-beta.2");
  });

  it("exports and restores only BhashaYantra user data", () => {
    const storage = new MemoryStorage();
    storage.setItem("bhashayantra-classic-draft", "saved Hindi draft");
    storage.setItem("external-token", "must-not-export");
    initializeBetaDataLifecycle(storage, "0.2.0-beta.1");
    const serialized = JSON.stringify(createUserDataBackup(storage, "0.2.0-beta.1"));
    storage.setItem("bhashayantra-classic-draft", "changed");
    storage.setItem("bhashayantra-new-setting", "remove-me");
    expect(restoreUserDataBackup(serialized, storage, "0.2.0-beta.1")).toBe(1);
    expect(storage.getItem("bhashayantra-classic-draft")).toBe("saved Hindi draft");
    expect(storage.getItem("bhashayantra-new-setting")).toBeNull();
    expect(storage.getItem("external-token")).toBe("must-not-export");
  });

  it("rejects backup entries outside the product namespace", () => {
    const storage = new MemoryStorage();
    const backup = createUserDataBackup(storage, "0.2.0-beta.1");
    const unsafe = JSON.stringify({ ...backup, entries: { "supabase.auth.token": "secret" } });
    expect(() => restoreUserDataBackup(unsafe, storage, "0.2.0-beta.1")).toThrow(/unsafe/i);
  });

  it("does not rewrite a manifest created by a newer data schema", () => {
    const storage = new MemoryStorage();
    const newerManifest = JSON.stringify({ schemaVersion: 2, firstInstalledVersion: "0.3.0-beta.1", lastSeenVersion: "0.3.0-beta.1", lastSuccessfulBootAt: new Date().toISOString() });
    storage.setItem("bhashayantra:system:data-manifest:v1", newerManifest);
    expect(initializeBetaDataLifecycle(storage, "0.2.0-beta.1").status).toBe("newer-schema");
    expect(storage.getItem("bhashayantra:system:data-manifest:v1")).toBe(newerManifest);
  });
});
