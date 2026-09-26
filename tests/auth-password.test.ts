/**
 * Password configuration for the single admin account. The interesting cases are
 * the environment-file pitfalls: a bcrypt hash arrives either intact (hosting
 * dashboards, shell exports) or with escaped dollars (`.env` files).
 */
import { describe, expect, it } from "vitest";

import {
  describeHashProblem,
  escapeHashForEnvFile,
  isBcryptHash,
  verifyPassword,
} from "@/lib/auth/password";

const bcrypt = await import("bcryptjs");
const HASH = bcrypt.default.hashSync("correct horse battery staple", 10);

describe("password configuration", () => {
  it("accepts real bcrypt hashes", () => {
    expect(isBcryptHash(HASH)).toBe(true);
    expect(describeHashProblem(HASH)).toBeNull();
  });

  it("explains missing or mangled hashes instead of failing silently", () => {
    expect(describeHashProblem(undefined)).toMatch(/not set/);
    expect(describeHashProblem("")).toMatch(/not set/);

    // What Next.js produces when `$2b$10$...` is written unescaped in a .env file.
    const mangled = HASH.replace(/\$/g, "");
    expect(isBcryptHash(mangled)).toBe(false);
    const problem = describeHashProblem(mangled);
    expect(problem).toMatch(/not a valid bcrypt hash/);
    expect(problem).toMatch(/escaped/);
  });

  it("verifies passwords and rejects wrong ones", async () => {
    expect(await verifyPassword("correct horse battery staple", HASH)).toBe(true);
    expect(await verifyPassword("wrong password", HASH)).toBe(false);
    expect(await verifyPassword("anything", "not-a-hash")).toBe(false);
  });

  it("escapes hashes so they survive .env expansion", () => {
    const escaped = escapeHashForEnvFile(HASH);
    expect(escaped).toContain("\\$2b\\$10\\$");
    expect(escaped.replace(/\\\$/g, "$")).toBe(HASH);
  });
});
