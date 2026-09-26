import type { PrismaClient } from "@/generated/prisma/client";
import { prisma as defaultClient } from "@/lib/db/prisma";
import type { CompanyInput } from "@/lib/validation/schemas";

export interface CompanyServiceOptions {
  client?: PrismaClient;
}

const clientOf = (options: CompanyServiceOptions = {}) => options.client ?? defaultClient;

export async function createCompany(input: CompanyInput, options: CompanyServiceOptions = {}) {
  return clientOf(options).company.create({
    data: {
      name: input.name,
      websiteUrl: input.websiteUrl,
      jobsUrl: input.jobsUrl,
      linkedinUrl: input.linkedinUrl,
      employees: input.employees,
      hqCountry: input.hqCountry,
      hqState: input.hqState,
      hqCity: input.hqCity,
      tagline: input.tagline,
      remoteHiring: input.remoteHiring,
      source: "MANUAL",
      sourceId: null,
      notes: input.notes,
    },
  });
}

export async function updateCompany(
  id: string,
  input: CompanyInput,
  options: CompanyServiceOptions = {},
) {
  return clientOf(options).company.update({
    where: { id },
    data: {
      name: input.name,
      websiteUrl: input.websiteUrl,
      jobsUrl: input.jobsUrl,
      linkedinUrl: input.linkedinUrl,
      employees: input.employees,
      hqCountry: input.hqCountry,
      hqState: input.hqState,
      hqCity: input.hqCity,
      tagline: input.tagline,
      remoteHiring: input.remoteHiring,
      notes: input.notes,
    },
  });
}

/** Notes are user-owned: edited separately from the rest of the company form. */
export async function updateCompanyNotes(
  id: string,
  notes: string | null,
  options: CompanyServiceOptions = {},
) {
  return clientOf(options).company.update({ where: { id }, data: { notes } });
}

export async function setCompanyFavorite(
  id: string,
  favorite: boolean,
  options: CompanyServiceOptions = {},
) {
  return clientOf(options).company.update({ where: { id }, data: { favorite } });
}

export async function setCompanyIgnored(
  id: string,
  ignored: boolean,
  options: CompanyServiceOptions = {},
) {
  return clientOf(options).company.update({ where: { id }, data: { ignored } });
}

export interface DeleteImpact {
  companyName: string;
  jobs: number;
  applications: number;
  events: number;
  applicationTitles: string[];
}

export async function getCompanyDeleteImpact(
  id: string,
  options: CompanyServiceOptions = {},
): Promise<DeleteImpact | null> {
  const client = clientOf(options);
  const company = await client.company.findUnique({
    where: { id },
    select: {
      name: true,
      _count: { select: { jobs: true } },
      jobs: {
        select: {
          title: true,
          application: {
            select: { id: true, _count: { select: { events: true } } },
          },
        },
      },
    },
  });
  if (!company) return null;

  const applications = company.jobs.filter((job) => job.application);
  const events = applications.reduce(
    (total, job) => total + (job.application?._count.events ?? 0),
    0,
  );

  return {
    companyName: company.name,
    jobs: company._count.jobs,
    applications: applications.length,
    events,
    applicationTitles: applications.map((job) => job.title).slice(0, 8),
  };
}

/** Deletes a company together with its jobs, applications and events (cascades). */
export async function deleteCompany(id: string, options: CompanyServiceOptions = {}) {
  const client = clientOf(options);
  return client.$transaction(async (tx) => {
    await tx.applicationEvent.deleteMany({
      where: { application: { job: { companyId: id } } },
    });
    await tx.application.deleteMany({ where: { job: { companyId: id } } });
    await tx.job.deleteMany({ where: { companyId: id } });
    return tx.company.delete({ where: { id } });
  });
}
