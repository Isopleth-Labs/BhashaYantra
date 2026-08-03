import { describe, expect, it } from "vitest";

import { hasEntitlement, PRODUCT_ENTITLEMENTS } from "./feature-entitlements";

describe("product entitlements", () => {
  it("keeps core typing useful on the free tier", () => {
    expect(hasEntitlement("free", "smart-typing")).toBe(true);
    expect(hasEntitlement("free", "classic-typing")).toBe(true);
    expect(hasEntitlement("free", "basic-text-conversion")).toBe(true);
  });

  it("reserves durable workflow value for Pro", () => {
    expect(hasEntitlement("free", "custom-layout-studio")).toBe(false);
    expect(hasEntitlement("pro", "custom-layout-studio")).toBe(true);
    expect(hasEntitlement("pro", "document-conversion")).toBe(true);
  });

  it("adds organization controls only to Institution", () => {
    expect(hasEntitlement("pro", "admin-dashboard")).toBe(false);
    expect(hasEntitlement("institution", "admin-dashboard")).toBe(true);
    expect(new Set(PRODUCT_ENTITLEMENTS.institution).size).toBe(
      PRODUCT_ENTITLEMENTS.institution.length,
    );
  });
});
