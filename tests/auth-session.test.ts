import { describe, expect, it } from "vitest";

import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  createSession,
  signSessionToken,
  verifySessionToken,
} from "@/lib/auth/session";

const SECRET = "test-secret-that-is-long-enough-for-hmac";

describe("session tokens", () => {
  it("signs and verifies a session", async () => {
    const envSecret = process.env.AUTH_SECRET;
    expect(envSecret && envSecret.length).toBeGreaterThanOrEqual(16);
    const { token, expiresAt } = await createSession("admin@example.com");
    const payload = await verifySessionToken(token, envSecret);
    expect(payload?.sub).toBe("admin@example.com");
    expect(Math.round(expiresAt.getTime() / 1000)).toBe(payload?.exp);
    expect(payload!.exp - payload!.iat).toBe(SESSION_TTL_SECONDS);
  });

  it("rejects a tampered payload", async () => {
    const { token } = await createSession("admin@example.com");
    const [body, signature] = token.split(".");
    const forgedBody = Buffer.from(
      JSON.stringify({ sub: "attacker@example.com", iat: 1, exp: 4_000_000_000 }),
    )
      .toString("base64url");
    expect(await verifySessionToken(`${forgedBody}.${signature}`, SECRET)).toBeNull();
    expect(await verifySessionToken(`${body}.deadbeef`, SECRET)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signSessionToken({ sub: "a@b.c", iat: 0, exp: 4_000_000_000 }, "another-secret-value");
    expect(await verifySessionToken(token, SECRET)).toBeNull();
  });

  it("rejects expired tokens and garbage input", async () => {
    const expired = await signSessionToken({ sub: "a@b.c", iat: 0, exp: 1 }, SECRET);
    expect(await verifySessionToken(expired, SECRET)).toBeNull();
    expect(await verifySessionToken("not-a-token", SECRET)).toBeNull();
    expect(await verifySessionToken(undefined, SECRET)).toBeNull();
    expect(await verifySessionToken(null, SECRET)).toBeNull();
  });

  it("uses an http-only cookie name", () => {
    expect(SESSION_COOKIE_NAME).toBe("job_assist_session");
  });
});
