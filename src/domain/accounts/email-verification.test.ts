import { describe, expect, it } from "vitest";

import { isCompleteEmailOtp, isEmailNotConfirmed, normalizeEmailOtp } from "@/domain/accounts/email-verification";

describe("email verification", () => {
  it("normalizes a pasted one-time code without accepting extra digits", () => {
    expect(normalizeEmailOtp("12 34-5678")).toBe("123456");
    expect(isCompleteEmailOtp("123 456")).toBe(true);
    expect(isCompleteEmailOtp("12345")).toBe(false);
  });

  it("recognizes the hosted Auth unconfirmed-email response", () => {
    expect(isEmailNotConfirmed("Email not confirmed")).toBe(true);
    expect(isEmailNotConfirmed("Email address not confirmed")).toBe(true);
    expect(isEmailNotConfirmed("Invalid login credentials")).toBe(false);
  });
});
