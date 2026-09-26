import { expect, test } from "@playwright/test";

const email = process.env.ADMIN_EMAIL ?? "admin@jobassist.local";
const password = process.env.E2E_ADMIN_PASSWORD ?? "jobassist-dev";

test.describe("single-user authentication", () => {
  test("redirects unauthenticated visitors from /app to /login", async ({ page }) => {
    await page.goto("/app");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("Private job search workspace")).toBeVisible();
  });

  test("rejects an incorrect password", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("definitely-not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("accepts the correct credentials and keeps the session", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    // Cookie is http-only and the session survives navigation.
    const cookies = await page.context().cookies();
    const session = cookies.find((cookie) => cookie.name === "job_assist_session");
    expect(session?.httpOnly).toBe(true);

    await page.goto("/app/companies");
    await expect(page).toHaveURL(/\/app\/companies/);
  });
});
