import type {
  ApplicationEventType,
  ApplicationStatus,
  PrismaClient,
} from "@/generated/prisma/client";
import { prisma as defaultClient } from "@/lib/db/prisma";
import { eventForStatusChange } from "@/lib/services/status-events";
import type { ApplicationUpdateInput } from "@/lib/validation/schemas";

export interface ApplicationServiceOptions {
  client?: PrismaClient;
  now?: Date;
}

const clientOf = (options: ApplicationServiceOptions = {}) => options.client ?? defaultClient;

/** Creates the single Application for a job (no-op when one already exists). */
export async function startApplication(
  jobId: string,
  options: ApplicationServiceOptions & { status?: ApplicationStatus; note?: string | null } = {},
) {
  const client = clientOf(options);
  const now = options.now ?? new Date();
  const status: ApplicationStatus = options.status ?? "INTERESTED";

  return client.$transaction(async (tx) => {
    const existing = await tx.application.findUnique({ where: { jobId } });
    if (existing) return existing;

    const application = await tx.application.create({
      data: {
        jobId,
        status,
        appliedAt: status === "APPLIED" ? now : null,
        lastActivityAt: now,
      },
    });
    const event = eventForStatusChange(null, status, options.note ?? null, now);
    await tx.applicationEvent.create({
      data: {
        applicationId: application.id,
        type: event.type,
        title: event.title,
        notes: event.notes,
        eventAt: event.eventAt,
      },
    });
    return application;
  });
}

/**
 * Changes an application status and always records a timeline event
 * (spec 19: status changes create events automatically).
 */
export async function changeApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  options: ApplicationServiceOptions & { note?: string | null } = {},
) {
  const client = clientOf(options);
  const now = options.now ?? new Date();

  return client.$transaction(async (tx) => {
    const current = await tx.application.findUniqueOrThrow({
      where: { id: applicationId },
      select: { id: true, status: true, appliedAt: true },
    });

    const application = await tx.application.update({
      where: { id: applicationId },
      data: {
        status,
        lastActivityAt: now,
        ...(status === "APPLIED" && !current.appliedAt ? { appliedAt: now } : {}),
      },
    });

    let event = null;
    if (current.status !== status) {
      const draft = eventForStatusChange(current.status, status, options.note ?? null, now);
      event = await tx.applicationEvent.create({
        data: {
          applicationId,
          type: draft.type,
          title: draft.title,
          notes: draft.notes,
          eventAt: draft.eventAt,
        },
      });
    }
    return { application, event };
  });
}

export async function updateApplication(
  applicationId: string,
  input: Partial<ApplicationUpdateInput> & { status?: ApplicationStatus },
  options: ApplicationServiceOptions = {},
) {
  const client = clientOf(options);
  const now = options.now ?? new Date();

  if (input.status) {
    const { status, ...rest } = input;
    const result = await changeApplicationStatus(applicationId, status, options);
    if (Object.keys(rest).length === 0) return result.application;
    return client.application.update({ where: { id: applicationId }, data: { ...rest } });
  }

  return client.application.update({
    where: { id: applicationId },
    data: { ...input, lastActivityAt: now },
  });
}

export async function addApplicationEvent(
  applicationId: string,
  event: { type: ApplicationEventType; title: string; notes?: string | null; eventAt?: Date | null },
  options: ApplicationServiceOptions = {},
) {
  const client = clientOf(options);
  const now = options.now ?? new Date();
  return client.$transaction(async (tx) => {
    const created = await tx.applicationEvent.create({
      data: {
        applicationId,
        type: event.type,
        title: event.title,
        notes: event.notes ?? null,
        eventAt: event.eventAt ?? now,
      },
    });
    await tx.application.update({ where: { id: applicationId }, data: { lastActivityAt: now } });
    return created;
  });
}

/** Marks a follow-up as done: logs the event and clears the follow-up date. */
export async function markFollowedUp(
  applicationId: string,
  options: ApplicationServiceOptions & { note?: string | null } = {},
) {
  const client = clientOf(options);
  const now = options.now ?? new Date();
  return client.$transaction(async (tx) => {
    const event = await tx.applicationEvent.create({
      data: {
        applicationId,
        type: "FOLLOW_UP",
        title: "Followed up",
        notes: options.note ?? null,
        eventAt: now,
      },
    });
    const application = await tx.application.update({
      where: { id: applicationId },
      data: { nextFollowUpAt: null, lastActivityAt: now },
    });
    return { application, event };
  });
}

export async function scheduleFollowUp(
  applicationId: string,
  nextFollowUpAt: Date | null,
  options: ApplicationServiceOptions & { note?: string | null } = {},
) {
  const client = clientOf(options);
  const now = options.now ?? new Date();
  return client.$transaction(async (tx) => {
    const application = await tx.application.update({
      where: { id: applicationId },
      data: { nextFollowUpAt, lastActivityAt: now },
    });
    let event = null;
    if (nextFollowUpAt) {
      event = await tx.applicationEvent.create({
        data: {
          applicationId,
          type: "FOLLOW_UP",
          title: `Follow-up scheduled for ${nextFollowUpAt.toISOString().slice(0, 10)}`,
          notes: options.note ?? null,
          eventAt: now,
        },
      });
    }
    return { application, event };
  });
}

export async function scheduleInterview(
  applicationId: string,
  interviewAt: Date | null,
  options: ApplicationServiceOptions & { note?: string | null } = {},
) {
  const client = clientOf(options);
  const now = options.now ?? new Date();
  return client.$transaction(async (tx) => {
    const application = await tx.application.update({
      where: { id: applicationId },
      data: { interviewAt, lastActivityAt: now },
    });
    let event = null;
    if (interviewAt) {
      event = await tx.applicationEvent.create({
        data: {
          applicationId,
          type: "CUSTOM",
          title: `Interview scheduled for ${interviewAt.toISOString().slice(0, 16).replace("T", " ")} UTC`,
          notes: options.note ?? null,
          eventAt: now,
        },
      });
    }
    return { application, event };
  });
}

export async function deleteApplication(applicationId: string, options: ApplicationServiceOptions = {}) {
  const client = clientOf(options);
  return client.$transaction(async (tx) => {
    await tx.applicationEvent.deleteMany({ where: { applicationId } });
    return tx.application.delete({ where: { id: applicationId } });
  });
}
