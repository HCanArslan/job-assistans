/**
 * Add-job flow: saving a job with a company created inline (combobox →
 * "Create company …"). This used to fail with
 * `websiteUrl: Invalid input: expected string, received undefined`, because the
 * inline path only sends `name` + `remoteHiring` to companyInputSchema.
 *
 * Runs against TEST_DATABASE_URL (see tests/setup.ts) and skips itself when no
 * database is configured.
 */
import { execFileSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// Next's redirect() signals navigation by throwing an error carrying a digest.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    const error = new Error(`NEXT_REDIRECT: ${url}`) as Error & { digest: string };
    error.digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw error;
  }),
}));

vi.mock("@/lib/auth/guard", () => ({
  requireAuthForAction: vi.fn(async () => ({ email: "owner@example.com" })),
}));

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const canRunDbTests = Boolean(TEST_DATABASE_URL);
const NAME_PREFIX = "E2E_INLINE_";

function formDataOf(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

describe.skipIf(!canRunDbTests)("saveJobAction with an inline company", () => {
  let prisma: import("@/generated/prisma/client").PrismaClient;
  let saveJobAction: typeof import("@/lib/actions/jobs").saveJobAction;

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    execFileSync("npx", ["prisma", "migrate", "deploy"], {
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL, DIRECT_URL: TEST_DATABASE_URL },
      stdio: "pipe",
      shell: process.platform === "win32",
    });
    ({ prisma } = await import("@/lib/db/prisma"));
    ({ saveJobAction } = await import("@/lib/actions/jobs"));
    await prisma.company.deleteMany({ where: { name: { startsWith: NAME_PREFIX } } });
  }, 180_000);

  afterAll(async () => {
    if (!prisma) return;
    const companies = await prisma.company.findMany({
      where: { name: { startsWith: NAME_PREFIX } },
      select: { id: true },
    });
    const ids = companies.map((company) => company.id);
    await prisma.applicationEvent.deleteMany({ where: { application: { job: { companyId: { in: ids } } } } });
    await prisma.application.deleteMany({ where: { job: { companyId: { in: ids } } } });
    await prisma.job.deleteMany({ where: { companyId: { in: ids } } });
    await prisma.company.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  });

  it("creates the company and the job when only a name was typed", async () => {
    // Exactly what components/jobs/job-form.tsx + company-combobox.tsx submit.
    const formData = formDataOf({
      companyId: "",
      newCompanyName: `${NAME_PREFIX}Muster Cloud`,
      title: "Backend Engineer",
      jobUrl: "muster-cloud.example.com/jobs/1",
      location: "",
      remoteType: "UNKNOWN",
      salaryText: "",
      notes: "",
      intent: "save",
    });

    await expect(saveJobAction(null, formData)).rejects.toMatchObject({
      digest: expect.stringContaining("/app/jobs/"),
    });

    const company = await prisma.company.findFirstOrThrow({
      where: { name: `${NAME_PREFIX}Muster Cloud` },
      include: { jobs: true },
    });
    expect(company.source).toBe("MANUAL");
    expect(company.remoteHiring).toBe("UNKNOWN");
    expect(company.websiteUrl).toBeNull();
    expect(company.jobsUrl).toBeNull();
    expect(company.linkedinUrl).toBeNull();
    expect(company.employees).toBeNull();
    expect(company.notes).toBeNull();

    expect(company.jobs).toHaveLength(1);
    const job = company.jobs[0]!;
    expect(job.title).toBe("Backend Engineer");
    expect(job.jobUrl).toBe("https://muster-cloud.example.com/jobs/1");
    expect(job.location).toBeNull();
    expect(job.salaryText).toBeNull();
    expect(job.notes).toBeNull();
  });

  it("leaves an existing company untouched when one is selected", async () => {
    const existing = await prisma.company.create({
      data: { name: `${NAME_PREFIX}Existing`, source: "MANUAL", websiteUrl: "https://existing.example.com" },
    });

    const formData = formDataOf({
      companyId: existing.id,
      newCompanyName: "",
      title: "Data Engineer",
      jobUrl: "",
      location: "Berlin",
      remoteType: "HYBRID",
      salaryText: "",
      notes: "",
      intent: "save",
    });

    await expect(saveJobAction(null, formData)).rejects.toMatchObject({
      digest: expect.stringContaining("/app/jobs/"),
    });

    const after = await prisma.company.findUniqueOrThrow({
      where: { id: existing.id },
      include: { jobs: true },
    });
    expect(after.websiteUrl).toBe("https://existing.example.com");
    expect(after.jobs).toHaveLength(1);
    expect(after.jobs[0]!.location).toBe("Berlin");
    expect(after.jobs[0]!.jobUrl).toBeNull();
  });
});
