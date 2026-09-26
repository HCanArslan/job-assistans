/**
 * Password handling for the single admin account.
 *
 * The bcrypt hash lives in an environment variable. Next.js processes `.env` files
 * with `$VAR` expansion, so a raw bcrypt hash (`$2b$10$...`) must be written with
 * escaped dollars (`\$2b\$10\$...`) - otherwise the value arrives truncated and every
 * login fails with a misleading "incorrect password". `describeHashProblem` turns
 * that silent failure into an actionable message.
 */
import bcrypt from "bcryptjs";

const BCRYPT_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

export function isBcryptHash(value: string | undefined | null): boolean {
  return typeof value === "string" && BCRYPT_PATTERN.test(value.trim());
}

/** A human-readable explanation when the configured hash cannot work, otherwise null. */
export function describeHashProblem(value: string | undefined | null): string | null {
  const hash = value?.trim() ?? "";
  if (!hash) return "ADMIN_PASSWORD_HASH is not set.";
  if (isBcryptHash(hash)) return null;
  return [
    "ADMIN_PASSWORD_HASH is not a valid bcrypt hash.",
    "Run `npm run generate-password-hash` and paste the printed line; in .env files the",
    "dollar signs must stay escaped (\\$2b\\$10\\$...) because $ is expanded there.",
  ].join(" ");
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/** Escapes a bcrypt hash so it survives `.env` file expansion. */
export function escapeHashForEnvFile(hash: string): string {
  return hash.replace(/\$/g, "\\$");
}
