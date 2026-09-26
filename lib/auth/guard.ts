import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE_NAME, verifySessionToken, type SessionPayload } from "@/lib/auth/session";

/** Reads and verifies the session cookie (null when signed out). */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Server components under /app: redirect unauthenticated visitors to /login. */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Server actions / mutations: same guarantee, no navigation side effect. */
export async function requireAuthForAction(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized: please sign in again.");
  return session;
}
