import type { PrismaClient } from "@/generated/prisma/client";

import { normalizeSharedView } from "./normalize";
import type { InvalidRow, NormalizeResult, NormalizedCompany } from "./types";

/**
 * Fields that StillHiring owns. The sync may only ever write these.
 * Everything else on a company (notes, favorite, ignored, jobs, applications,
 * events, recruiter/interview/follow-up data) is user-owned and untouched.
 */
export const STILL_HIRING_OWNED_FIELDS = [
  "name",
  "jobsUrl",
  "employees",
  "employeesText",
  "hqCountry",
  "hqState",
  "hqCity",
  "tagline",
  "remoteHiring",
  "hiringFunctions",
  "engineeringRoles",
  "salesMarketingCsRoles",
  "growthSignals",
  "fundingSignals",
  "stillHiringImportedAt",
] as const;

export type StillHiringUpdateData = Record<string, unknown>;

/** The exact update payload sent for an existing imported company. */
export function buildStillHiringUpdateData(
  company: NormalizedCompany,
  importedAt: Date,
): StillHiringUpdateData {
  const data: StillHiringUpdateData = {
    name: company.name,
    jobsUrl: company.jobsUrl,
    employees: company.employees,
    employeesText: company.employeesText,
    hqCountry: company.hqCountry,
    hqState: company.hqState,
    hqCity: company.hqCity,
    tagline: company.tagline,
    remoteHiring: company.remoteHiring,
    hiringFunctions: company.hiringFunctions,
    engineeringRoles: company.engineeringRoles,
    salesMarketingCsRoles: company.salesMarketingCsRoles,
    growthSignals: company.growthSignals,
    fundingSignals: company.fundingSignals,
    stillHiringImportedAt: importedAt,
  };
  // Optional columns are only written when the shared view actually provides them,
  // so a dataset without them never wipes previously imported values.
  if (company.websiteUrl) data.websiteUrl = company.websiteUrl;
  if (company.linkedinUrl) data.linkedinUrl = company.linkedinUrl;
  return data;
}

export function buildStillHiringCreateData(
  company: NormalizedCompany,
  importedAt: Date,
): StillHiringUpdateData {
  return {
    ...buildStillHiringUpdateData(company, importedAt),
    source: "STILL_HIRING",
    sourceId: company.sourceId,
  };
}

export interface ImportSummary {
  totalRows: number;
  validCompanies: number;
  invalidCompanies: number;
  created: number;
  updated: number;
  failed: number;
  invalidRows: InvalidRow[];
  failures: { sourceId: string; name: string; message: string }[];
  startedAt: Date;
  finishedAt: Date;
  importedAt: Date;
}

export interface ImportOptions {
  client?: PrismaClient;
  now?: Date;
  concurrency?: number;
  onProgress?: (processed: number, total: number, company: NormalizedCompany) => void;
}

async function getDefaultClient(): Promise<PrismaClient> {
  const { prisma } = await import("@/lib/db/prisma");
  return prisma;
}

/**
 * Idempotent upsert keyed on (source = STILL_HIRING, sourceId = Airtable record id).
 * Running it twice never creates duplicates and never touches user-owned data.
 */
export async function importStillHiringCompanies(
  normalized: NormalizeResult,
  options: ImportOptions = {},
): Promise<ImportSummary> {
  const client = options.client ?? (await getDefaultClient());
  const importedAt = options.now ?? new Date();
  const startedAt = new Date();
  const concurrency = Math.max(1, options.concurrency ?? 4);

  const failures: ImportSummary["failures"] = [];
  let created = 0;
  let updated = 0;
  let processed = 0;

  const companies = normalized.companies;
  let cursor = 0;

  async function worker() {
    while (cursor < companies.length) {
      const company = companies[cursor];
      cursor += 1;
      try {
        const existing = await client.company.findUnique({
          where: { source_sourceId: { source: "STILL_HIRING", sourceId: company.sourceId } },
          select: { id: true },
        });
        await client.company.upsert({
          where: { source_sourceId: { source: "STILL_HIRING", sourceId: company.sourceId } },
          create: buildStillHiringCreateData(company, importedAt) as never,
          update: buildStillHiringUpdateData(company, importedAt) as never,
        });
        if (existing) updated += 1;
        else created += 1;
      } catch (error) {
        failures.push({
          sourceId: company.sourceId,
          name: company.name,
          message: error instanceof Error ? error.message : String(error),
        });
      }
      processed += 1;
      options.onProgress?.(processed, companies.length, company);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, companies.length || 1) }, worker));

  return {
    totalRows: normalized.totalRows,
    validCompanies: normalized.companies.length,
    invalidCompanies: normalized.invalid.length,
    created,
    updated,
    failed: failures.length,
    invalidRows: normalized.invalid,
    failures,
    startedAt,
    finishedAt: new Date(),
    importedAt,
  };
}

export interface SyncDeps {
  /** Captures the public readSharedViewData response (Playwright in the CLI). */
  capture: () => Promise<unknown>;
  client?: PrismaClient;
  now?: Date;
  log?: (line: string) => void;
  onProgress?: (processed: number, total: number) => void;
}

/** End-to-end sync used by `npm run stillhiring:sync`. */
export async function runStillHiringSync(deps: SyncDeps): Promise<ImportSummary> {
  const log = deps.log ?? console.log;
  log("Loading public Airtable view...");
  const payload = await deps.capture();
  log("Shared view response captured.");

  const normalized = normalizeSharedView(payload);
  log("");
  log(`Rows received: ${normalized.totalRows}`);
  log("");
  log("Normalizing...");
  log(`${normalized.companies.length} valid companies`);
  log(`${normalized.invalid.length} invalid companies`);
  if (normalized.invalid.length > 0) {
    for (const row of normalized.invalid.slice(0, 10)) {
      log(`  - ${row.rowId}: ${row.reason}`);
    }
  }

  const summary = await importStillHiringCompanies(normalized, {
    client: deps.client,
    now: deps.now,
    onProgress: deps.onProgress
      ? (processed, total) => deps.onProgress?.(processed, total)
      : undefined,
  });

  log("");
  log("Database:");
  log(`${summary.created} created`);
  log(`${summary.updated} updated`);
  log(`${summary.failed} failed`);
  if (summary.failures.length > 0) {
    for (const failure of summary.failures.slice(0, 10)) {
      log(`  - ${failure.name} (${failure.sourceId}): ${failure.message}`);
    }
  }
  log("");
  log("Sync complete.");
  return summary;
}
