import { describe, expect, it } from "vitest";

import { hasProductAccess, isValidUsername, normalizeUsername, parseAuthTokenClaims, trialDaysRemaining } from "@/domain/accounts/auth-session";

const claims = {
  sub: "a3ea63ac-f627-4458-9d5a-b07cbfeaf5e8",
  email: "student@example.com",
  username: "student.one",
  display_name: "Student One",
  account_role: "student",
  account_status: "trialing",
  plan_tier: "free",
  trial_ends_at: "2026-08-25T00:00:00.000Z",
  exp: 1_787_616_000,
};

describe("auth token claims", () => {
  it("parses the server-issued identity and entitlement claims", () => {
    expect(parseAuthTokenClaims(claims)).toMatchObject({
      username: "student.one",
      role: "student",
      status: "trialing",
      plan: "free",
    });
  });

  it("rejects a token without server-issued role and trial claims", () => {
    expect(parseAuthTokenClaims({ sub: claims.sub, email: claims.email, exp: claims.exp })).toBeNull();
  });

  it("opens an active trial and closes an expired one", () => {
    const parsed = parseAuthTokenClaims(claims)!;
    expect(hasProductAccess(parsed, Date.parse("2026-08-11T00:00:00.000Z"))).toBe(true);
    expect(trialDaysRemaining(parsed, Date.parse("2026-08-11T00:00:00.000Z"))).toBe(14);
    expect(hasProductAccess(parsed, Date.parse("2026-08-26T00:00:00.000Z"))).toBe(false);
  });
});

describe("username rules", () => {
  it("normalizes and validates stable login names", () => {
    expect(normalizeUsername("  Amit.User  ")).toBe("amit.user");
    expect(isValidUsername("amit.user")).toBe(true);
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("not allowed")).toBe(false);
  });
});
