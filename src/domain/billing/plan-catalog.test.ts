import { describe, expect, it } from "vitest";

import { BILLING_RELEASE_STATUS, DEVELOPMENT_PLAN_CATALOG } from "./plan-catalog";

describe("development plan catalog", () => {
  it("keeps plan identifiers unique", () => {
    const ids = DEVELOPMENT_PLAN_CATALOG.map((plan) => plan.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("does not pretend that the development build can accept payment", () => {
    expect(BILLING_RELEASE_STATUS.purchasable).toBe(false);
  });
});
