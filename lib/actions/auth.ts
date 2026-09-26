"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createSession, sessionCookieOptions } from "@/lib/auth/session";
import { getSession } from "@/lib/auth/guard";
import { credentialsMatch, getAdminCredentials, LOGIN_NOT_CONFIGURED } from "@/lib/auth/password";

export interface LoginState {
  ok: boolean;
  error?: string;
}

const INVALID_CREDENTIALS = "Incorrect email or password.";

function sanitizeNextPath(value: unknown): string {
  const raw = typeof value === "string" ? value : "";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/app";
  return raw;
}

export async function loginAction(_prev: LoginState | null, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextPath = sanitizeNextPath(formData.get("next"));

  const admin = getAdminCredentials();
  if (!admin) return { ok: false, error: LOGIN_NOT_CONFIGURED };

  if (!email || !password) return { ok: false, error: INVALID_CREDENTIALS };

  if (!credentialsMatch(email, password, admin)) {
    return { ok: false, error: INVALID_CREDENTIALS };
  }

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
