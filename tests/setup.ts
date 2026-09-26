import { config as loadEnv } from "dotenv";

// Tests read the same env files as the app (never committed).
loadEnv({ path: ".env.local" });
loadEnv();

/**
 * Database-backed tests run against TEST_DATABASE_URL when available.
 * When it is missing we derive it from DATABASE_URL by swapping the database
 * name to `job_assist_test`; if that is impossible the tests skip themselves.
 */
if (!process.env.TEST_DATABASE_URL && process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    url.pathname = "/job_assist_test";
    process.env.TEST_DATABASE_URL = url.toString();
  } catch {
    // leave unset - DB tests will skip
  }
}
