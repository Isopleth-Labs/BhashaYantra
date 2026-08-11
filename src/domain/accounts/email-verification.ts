export function normalizeEmailOtp(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function isCompleteEmailOtp(value: string) {
  return /^\d{6}$/.test(normalizeEmailOtp(value));
}

export function isEmailNotConfirmed(message: string | undefined) {
  return Boolean(message && /email (?:address )?not confirmed/i.test(message));
}
