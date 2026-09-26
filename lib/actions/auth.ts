"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createSession, sessionCookieOptions } from "@/lib/auth/session";
import { getSession } from "@/lib/auth/guard";
import { describeHashProblem, verifyPassword } from "@/lib/auth/password";

export interface LoginState {
  ok: boolean;
  error?: string;
}

const INVALID_CREDENTIALS = "Incorrect email or password.";

/** Constant-time-ish string compare to avoid leaking the admin email by timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function sanitizeNextPath(value: unknown): string {
  const raw = typeof value === "string" ? value : "";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/app";
  return raw;
}

export async function loginAction(_prev: LoginState | null, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextPath = sanitizeNextPath(formData.get("next"));

  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminEmail || !adminHash) {
    return {
      ok: false,
      error:
        "Login is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD_HASH (see README → Authentication).",
    };
  }

  const hashProblem = describeHashProblem(adminHash);
  if (hashProblem) return { ok: false, error: hashProblem };

  if (!email || !password) return { ok: false, error: INVALID_CREDENTIALS };

  const emailMatches = safeEqual(email.toLowerCase(), adminEmail.toLowerCase());
  const passwordMatches = await verifyPassword(password, adminHash.trim());

  if (!emailMatches || !passwordMatches) return { ok: false, error: INVALID_CREDENTIALS };

  const { token } = await createSession(email);
  const store = await cookies();
  store.set(sessionCookieOptions.name, token, {
    httpOnly: sessionCookieOptions.httpOnly,
    sameSite: sessionCookieOptions.sameSite,
    secure: sessionCookieOptions.secure,
    path: sessionCookieOptions.path,
    maxAge: sessionCookieOptions.maxAge,
  });

  redirect(nextPath);
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(sessionCookieOptions.name);
  await getSession();
  redirect("/login");
}
