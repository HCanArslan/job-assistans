/**
 * Credential checks for the single admin account.
 *
 * The submitted password is compared against `ADMIN_PASSWORD` through
 * `crypto.timingSafeEqual`, so the comparison cannot leak the configured value
 * through response timing. Both variables are server-only: they are read inside
 * server actions, never sent to the browser, and only a boolean leaves this module.
 */
import { timingSafeEqual } from "node:crypto";

export const LOGIN_NOT_CONFIGURED =
  "Login is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD (see README → Authentication).";

/** Constant-time string comparison. The length check first is safe: lengths are not secret. */
export function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a, "utf8");
  const bBuffer = Buffer.from(b, "utf8");
  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

export interface AdminCredentials {
  email: string;
  password: string;
}

/** The configured admin credentials, or null when login has not been set up. */
export function getAdminCredentials(): AdminCredentials | null {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
}

/** Email matches case-insensitively; both checks always run so neither leaks by timing. */
export function credentialsMatch(
  email: string,
  password: string,
  admin: AdminCredentials,
): boolean {
  const emailMatches = safeEqual(email.trim().toLowerCase(), admin.email.toLowerCase());
  const passwordMatches = safeEqual(password, admin.password);
  return emailMatches && passwordMatches;
}
