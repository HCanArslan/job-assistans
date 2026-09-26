import type { ApplicationStatus, PrismaClient } from "@/generated/prisma/client";
import { prisma as defaultClient } from "@/lib/db/prisma";
import { eventForStatusChange } from "@/lib/services/status-events";
import type { JobInput } from "@/lib/validation/schemas";

export interface JobServiceOptions {
  client?: PrismaClient;
}

const clientOf = (options: JobServiceOptions = {}) => options.client ?? defaultClient;

export async function createJob(
  input: JobInput,
  options: JobServiceOptions & { initialStatus?: ApplicationStatus | null; note?: string | null } = {},
) {
  const client = clientOf(options);
  const initialStatus = options.initialStatus ?? null;

  return client.$transaction(async (tx) => {
    const job = await tx.job.create({
      data: {
        companyId: input.companyId,
        title: input.title,
        jobUrl: input.jobUrl,
        location: input.location,
        remoteType: input.remoteType,
        salaryText: input.salaryText,
        notes: input.notes,
      },
    });

    if (!initialStatus) return { job, application: null };

    const now = new Date();
    const application = await tx.application.create({
      data: {
        jobId: job.id,
        status: initialStatus,
        appliedAt: initialStatus === "APPLIED" ? now : null,
        lastActivityAt: now,
      },
    });
    const event = eventForStatusChange(null, initialStatus, options.note ?? null, now);
    await tx.applicationEvent.create({
      data: {
        applicationId: application.id,
        type: event.type,
        title: event.title,
        notes: event.notes,
        eventAt: event.eventAt,
      },
    });
    return { job, application };
  });
}

export async function updateJob(
  id: string,
  input: Omit<JobInput, "companyId"> & { companyId?: string },
  options: JobServiceOptions = {},
) {
  return clientOf(options).job.update({
    where: { id },
    data: {
      title: input.title,
      jobUrl: input.jobUrl,
      location: input.location,
      remoteType: input.remoteType,
      salaryText: input.salaryText,
      notes: input.notes,
      ...(input.companyId ? { companyId: input.companyId } : {}),
    },
  });
}

export async function getJobDeleteImpact(id: string, options: JobServiceOptions = {}) {
  const client = clientOf(options);
  const job = await client.job.findUnique({
    where: { id },
    select: {
      title: true,
      company: { select: { name: true } },
      application: { select: { id: true, status: true, _count: { select: { events: true } } } },
    },
  });
  if (!job) return null;
  return {
    title: job.title,
    companyName: job.company.name,
    hasApplication: Boolean(job.application),
    applicationStatus: job.application?.status ?? null,
    events: job.application?._count.events ?? 0,
  };
}

export async function deleteJob(id: string, options: JobServiceOptions = {}) {
  const client = clientOf(options);
  return client.$transaction(async (tx) => {
    await tx.applicationEvent.deleteMany({ where: { application: { jobId: id } } });
    await tx.application.deleteMany({ where: { jobId: id } });
    return tx.job.delete({ where: { id } });
  });
}
