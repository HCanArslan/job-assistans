/**
 * Credential checks for the single admin account.
 *
 * `ADMIN_PASSWORD` is compared as configured, through `crypto.timingSafeEqual` so the
 * comparison does not leak the configured value through timing. The interesting cases are
 * the ones a plain `===` gets wrong: equal-prefix values, differing lengths (which would
 * make `timingSafeEqual` itself throw) and multi-byte characters.
 */
import { afterEach, describe, expect, it } from "vitest";

import { credentialsMatch, getAdminCredentials, safeEqual } from "@/lib/auth/password";

const ENV_KEYS = ["ADMIN_EMAIL", "ADMIN_PASSWORD"] as const;
const original = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

function setEnv(values: Partial<Record<(typeof ENV_KEYS)[number], string>>) {
  for (const key of ENV_KEYS) {
    const value = values[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

afterEach(() => {
  setEnv(original);
});

describe("safeEqual", () => {
  it("accepts identical strings", () => {
    expect(safeEqual("correct horse battery staple", "correct horse battery staple")).toBe(true);
  });

  it("rejects same-length strings that differ", () => {
    expect(safeEqual("correct horse battery stapl3", "correct horse battery staple")).toBe(false);
  });

  it("rejects different lengths instead of throwing", () => {
    expect(safeEqual("short", "a much longer password")).toBe(false);
    expect(safeEqual("", "anything")).toBe(false);
    expect(safeEqual("", "")).toBe(true);
  });

  it("compares multi-byte characters by bytes", () => {
    expect(safeEqual("şifre-çğü", "şifre-çğü")).toBe(true);
    expect(safeEqual("şifre-çğü", "sifre-cgu")).toBe(false);
  });
});

describe("getAdminCredentials", () => {
  it("returns the configured email and password", () => {
    setEnv({ ADMIN_EMAIL: "me@example.com", ADMIN_PASSWORD: "choose-a-long-private-password" });
    expect(getAdminCredentials()).toEqual({
      email: "me@example.com",
      password: "choose-a-long-private-password",
    });
  });

  it("trims the email but keeps the password verbatim", () => {
    setEnv({ ADMIN_EMAIL: "  me@example.com  ", ADMIN_PASSWORD: "  spaced  " });
    expect(getAdminCredentials()).toEqual({ email: "me@example.com", password: "  spaced  " });
  });

  it("returns null when either value is missing or empty", () => {
    setEnv({ ADMIN_EMAIL: "me@example.com", ADMIN_PASSWORD: "" });
    expect(getAdminCredentials()).toBeNull();

    setEnv({ ADMIN_EMAIL: "", ADMIN_PASSWORD: "choose-a-long-private-password" });
    expect(getAdminCredentials()).toBeNull();

    setEnv({ ADMIN_EMAIL: undefined, ADMIN_PASSWORD: undefined });
    expect(getAdminCredentials()).toBeNull();
  });
});

describe("credentialsMatch", () => {
  const admin = { email: "me@example.com", password: "choose-a-long-private-password" };

  it("accepts the exact pair", () => {
    expect(credentialsMatch("me@example.com", "choose-a-long-private-password", admin)).toBe(true);
  });

  it("matches the email case-insensitively and ignores surrounding whitespace", () => {
    expect(credentialsMatch("  ME@Example.com ", "choose-a-long-private-password", admin)).toBe(true);
  });

  it("rejects a wrong password", () => {
    expect(credentialsMatch("me@example.com", "not-the-password", admin)).toBe(false);
  });

  it("rejects a wrong email", () => {
    expect(credentialsMatch("someone@else.com", "choose-a-long-private-password", admin)).toBe(false);
  });

  it("rejects an empty submission", () => {
    expect(credentialsMatch("", "", admin)).toBe(false);
  });
});
