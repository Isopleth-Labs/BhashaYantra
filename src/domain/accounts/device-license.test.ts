import { describe, expect, it } from "vitest";

import { getOrCreateInstallationId, hashInstallationId } from "@/domain/accounts/device-license";

describe("device licence identity", () => {
  it("reuses one privacy-safe installation id", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
    };
    expect(getOrCreateInstallationId(storage)).toBe(getOrCreateInstallationId(storage));
  });

  it("hashes the installation id before transmission", async () => {
    expect(await hashInstallationId("bhashayantra-test-installation")).toBe("cae02d92ca049176f9a22d4632d3efec0feac2a139c80abe4586b073394c850a");
  });
});
