/**
 * Database-backed tests for import idempotency, user-data preservation and
 * application status events. They run against TEST_DATABASE_URL (see tests/setup.ts)
 * and skip themselves when no database is configured.
 */
import { execFileSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { NormalizedCompany, NormalizeResult } from "@/lib/still-hiring/types";

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const canRunDbTests = Boolean(TEST_DATABASE_URL);

describe.skipIf(!canRunDbTests)("import + tracking against a real database", () => {
  let prisma: import("@/generated/prisma/client").PrismaClient;
  let importStillHiringCompanies: typeof import("@/lib/still-hiring/import").importStillHiringCompanies;
  let changeApplicationStatus: typeof import("@/lib/services/applications").changeApplicationStatus;
  let startApplication: typeof import("@/lib/services/applications").startApplication;
  let createJob: typeof import("@/lib/services/jobs").createJob;

  const sourceId = `recTest${Date.now()}`;

  const normalized = (overrides: Partial<NormalizedCompany> = {}): NormalizeResult => ({
    companies: [
      {
        sourceId,
        name: "Sync Test GmbH",
        websiteUrl: null,
        jobsUrl: "https://sync-test.example.com/careers",
        linkedinUrl: null,
        employees: 120,
        employeesText: "51-200",
        hqCountry: "Germany",
        hqState: "Berlin",
        hqCity: "Berlin",
        tagline: "First import",
        remoteHiring: "YES",
        hiringFunctions: ["Hiring Engineering"],
        engineeringRoles: ["Hiring Software Engineering"],
        salesMarketingCsRoles: [],
        growthSignals: ["Recruiting Velocity: High"],
        fundingSignals: ["Funding: $10M to $50M"],
        ...overrides,
      },
    ],
    invalid: [],
    totalRows: 1,
    columnCount: 13,
    resolvedColumns: {},
  });

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    execFileSync("npx", ["prisma", "migrate", "deploy"], {
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL, DIRECT_URL: TEST_DATABASE_URL },
      stdio: "pipe",
      shell: process.platform === "win32",
    });
    ({ prisma } = await import("@/lib/db/prisma"));
    ({ importStillHiringCompanies } = await import("@/lib/still-hiring/import"));
    ({ changeApplicationStatus, startApplication } = await import("@/lib/services/applications"));
    ({ createJob } = await import("@/lib/services/jobs"));
    await prisma.company.deleteMany({ where: { sourceId } });
  }, 180_000);

  afterAll(async () => {
    if (!prisma) return;
    const company = await prisma.company.findFirst({
      where: { sourceId },
      select: { id: true },
    });
    if (company) {
      await prisma.applicationEvent.deleteMany({ where: { application: { job: { companyId: company.id } } } });
      await prisma.application.deleteMany({ where: { job: { companyId: company.id } } });
      await prisma.job.deleteMany({ where: { companyId: company.id } });
      await prisma.company.delete({ where: { id: company.id } });
    }
    await prisma.$disconnect();
  });

  it("imports a company idempotently", async () => {
    const first = await importStillHiringCompanies(normalized(), { client: prisma });
    expect(first.created).toBe(1);
    expect(first.updated).toBe(0);

    const second = await importStillHiringCompanies(normalized({ name: "Sync Test GmbH" }), {
      client: prisma,
    });
    expect(second.created).toBe(0);
    expect(second.updated).toBe(1);

    const count = await prisma.company.count({ where: { sourceId } });
    expect(count).toBe(1);
  });

  it("updates StillHiring fields but preserves user-owned data", async () => {
    const company = await prisma.company.findFirstOrThrow({ where: { sourceId } });

    // User-owned edits + tracking data.
    await prisma.company.update({
      where: { id: company.id },
      data: { notes: "My private notes", favorite: true, ignored: true },
    });
    const { job } = await createJob(
      {
        companyId: company.id,
        title: "Backend Engineer",
        jobUrl: "https://sync-test.example.com/jobs/1",
        location: "Berlin",
        remoteType: "HYBRID",
        salaryText: "€80k",
        notes: "job notes",
      },
      { client: prisma, initialStatus: "APPLIED" },
    );
    const application = await prisma.application.findFirstOrThrow({ where: { jobId: job.id } });
    await changeApplicationStatus(application.id, "TECHNICAL_INTERVIEW", {
      client: prisma,
      note: "booked with the team",
    });

    await importStillHiringCompanies(
      normalized({
        name: "Sync Test GmbH (renamed by StillHiring)",
        tagline: "Updated tagline",
        remoteHiring: "NO",
        engineeringRoles: ["Hiring Dev Ops"],
      }),
      { client: prisma },
    );

    const after = await prisma.company.findFirstOrThrow({
      where: { id: company.id },
      include: { jobs: { include: { application: { include: { events: true } } } } },
    });

    // External fields updated.
    expect(after.name).toBe("Sync Test GmbH (renamed by StillHiring)");
    expect(after.tagline).toBe("Updated tagline");
    expect(after.remoteHiring).toBe("NO");
    expect(after.engineeringRoles).toEqual(["Hiring Dev Ops"]);

    // User-owned data untouched.
    expect(after.notes).toBe("My private notes");
    expect(after.favorite).toBe(true);
    expect(after.ignored).toBe(true);
    expect(after.jobs).toHaveLength(1);
    const preservedApplication = after.jobs[0].application!;
    expect(preservedApplication.status).toBe("TECHNICAL_INTERVIEW");
    expect(preservedApplication.events.some((event) => event.type === "APPLIED")).toBe(true);
  });

  it("creates an event whenever an application status changes", async () => {
    const company = await prisma.company.findFirstOrThrow({ where: { sourceId } });
    const job = await prisma.job.findFirstOrThrow({ where: { companyId: company.id } });
    const application = await prisma.application.findFirstOrThrow({ where: { jobId: job.id } });

    const before = await prisma.applicationEvent.count({ where: { applicationId: application.id } });
    const { event } = await changeApplicationStatus(application.id, "OFFER", { client: prisma });
    const after = await prisma.applicationEvent.count({ where: { applicationId: application.id } });

    expect(after).toBe(before + 1);
    expect(event?.type).toBe("OFFER");
    expect(event?.title).toContain("Offer");

    const updated = await prisma.application.findUniqueOrThrow({ where: { id: application.id } });
    expect(updated.status).toBe("OFFER");

    // Changing to the same status is a no-op event-wise.
    const { event: repeat } = await changeApplicationStatus(application.id, "OFFER", { client: prisma });
    expect(repeat).toBeNull();
  });

  it("starts an application only once per job", async () => {
    const company = await prisma.company.findFirstOrThrow({ where: { sourceId } });
    const job = await createJob(
      {
        companyId: company.id,
        title: "Second role",
        jobUrl: null,
        location: null,
        remoteType: "UNKNOWN",
        salaryText: null,
        notes: null,
      },
      { client: prisma },
    );
    const first = await startApplication(job.job.id, { client: prisma, status: "TO_APPLY" });
    const second = await startApplication(job.job.id, { client: prisma, status: "APPLIED" });
    expect(second.id).toBe(first.id);
    expect(second.status).toBe("TO_APPLY");
  });
});
