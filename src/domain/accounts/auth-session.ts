import type { AccountWorkspaceRole } from "@/domain/accounts/account-workspaces";

export type AccountStatus = "trialing" | "active" | "expired" | "suspended";
export type PlanTier = "free" | "pro" | "institution";

export interface AuthTokenClaims {
  readonly sub: string;
  readonly email: string;
  readonly username: string;
  readonly displayName: string;
  readonly role: AccountWorkspaceRole;
  readonly status: AccountStatus;
  readonly plan: PlanTier;
  readonly trialEndsAt: string | null;
  readonly expiresAt: number;
}

const ACCOUNT_STATUSES = new Set<AccountStatus>(["trialing", "active", "expired", "suspended"]);
const PLAN_TIERS = new Set<PlanTier>(["free", "pro", "institution"]);

function readString(claims: Record<string, unknown>, key: string) {
  return typeof claims[key] === "string" ? claims[key] : "";
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string) {
  return /^[a-z0-9][a-z0-9._-]{2,31}$/u.test(normalizeUsername(value));
}

export function parseAuthTokenClaims(value: unknown): AuthTokenClaims | null {
  if (!value || typeof value !== "object") return null;
  const claims = value as Record<string, unknown>;
  const sub = readString(claims, "sub");
  const email = readString(claims, "email");
  const username = readString(claims, "username");
  const displayName = readString(claims, "display_name");
  const role = readString(claims, "account_role");
  const status = readString(claims, "account_status");
  const plan = readString(claims, "plan_tier");
  const trialEndsAt = claims.trial_ends_at === null ? null : readString(claims, "trial_ends_at");
  const expiresAt = typeof claims.exp === "number" ? claims.exp : 0;

  if (!sub || !email || !username || (role !== "student" && role !== "institute")) return null;
  if (!ACCOUNT_STATUSES.has(status as AccountStatus) || !PLAN_TIERS.has(plan as PlanTier) || expiresAt <= 0) return null;
  if (trialEndsAt && Number.isNaN(Date.parse(trialEndsAt))) return null;

  return {
    sub,
    email,
    username,
    displayName,
    role,
    status: status as AccountStatus,
    plan: plan as PlanTier,
    trialEndsAt,
    expiresAt,
  };
}

export function hasProductAccess(claims: AuthTokenClaims, now = Date.now()) {
  if (claims.status === "active") return true;
  return claims.status === "trialing" && claims.trialEndsAt !== null && Date.parse(claims.trialEndsAt) > now;
}

export function trialDaysRemaining(claims: AuthTokenClaims, now = Date.now()) {
  if (!claims.trialEndsAt) return 0;
  return Math.max(0, Math.ceil((Date.parse(claims.trialEndsAt) - now) / 86_400_000));
}
