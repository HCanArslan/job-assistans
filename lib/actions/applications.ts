"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { ApplicationStatus } from "@/generated/prisma/client";
import { requireAuthForAction } from "@/lib/auth/guard";
import {
  addApplicationEvent,
  changeApplicationStatus,
  deleteApplication,
  markFollowedUp,
  scheduleFollowUp,
  scheduleInterview,
  startApplication,
  updateApplication,
} from "@/lib/services/applications";
import {
  applicationStatusSchema,
  applicationUpdateSchema,
  eventInputSchema,
  firstFieldError,
  formDataToObject,
} from "@/lib/validation/schemas";

export interface ApplicationFormState {
  ok: boolean;
  error?: string;
  message?: string;
}

function messageOf(error: unknown): string {
  if (error instanceof z.ZodError) return firstFieldError(error);
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

function revalidateApplication(applicationId?: string) {
  revalidatePath("/app");
  revalidatePath("/app/applications");
  if (applicationId) revalidatePath(`/app/applications/${applicationId}`);
}

export async function changeStatusAction(
  applicationId: string,
  status: string,
  note?: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAuthForAction();
  try {
    const parsedStatus = applicationStatusSchema.parse(status) as ApplicationStatus;
    await changeApplicationStatus(applicationId, parsedStatus, { note: note ?? null });
    revalidateApplication(applicationId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

export async function updateApplicationAction(
  _prev: ApplicationFormState | null,
  formData: FormData,
): Promise<ApplicationFormState> {
  await requireAuthForAction();
  try {
    const raw = formDataToObject(formData);
    const id = String(raw.id ?? "");
    if (!id) return { ok: false, error: "Missing application id" };
    const parsed = applicationUpdateSchema.parse(raw);
    await updateApplication(id, parsed);
    revalidateApplication(id);
    redirect(`/app/applications/${id}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return { ok: false, error: messageOf(error) };
  }
}

export async function addEventAction(
  _prev: ApplicationFormState | null,
  formData: FormData,
): Promise<ApplicationFormState> {
  await requireAuthForAction();
  try {
    const raw = formDataToObject(formData);
    const applicationId = String(raw.applicationId ?? "");
    if (!applicationId) return { ok: false, error: "Missing application id" };
    const parsed = eventInputSchema.parse(raw);
    await addApplicationEvent(applicationId, {
      type: parsed.type,
      title: parsed.title,
      notes: parsed.notes,
      eventAt: parsed.eventAt,
    });
    revalidateApplication(applicationId);
    return { ok: true, message: "Activity added" };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

export async function scheduleFollowUpAction(
  applicationId: string,
  dateValue: string,
  note?: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAuthForAction();
  try {
    const parsed = applicationUpdateSchema.shape.nextFollowUpAt.parse(dateValue);
    await scheduleFollowUp(applicationId, parsed, { note: note ?? null });
    revalidateApplication(applicationId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

export async function scheduleInterviewAction(
  applicationId: string,
  dateValue: string,
  note?: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAuthForAction();
  try {
    const parsed = applicationUpdateSchema.shape.interviewAt.parse(dateValue);
    await scheduleInterview(applicationId, parsed, { note: note ?? null });
    revalidateApplication(applicationId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

export async function markFollowedUpAction(
  applicationId: string,
  note?: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAuthForAction();
  try {
    await markFollowedUp(applicationId, { note: note ?? null });
    revalidateApplication(applicationId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

export async function startApplicationFromJobAction(
  jobId: string,
  status: ApplicationStatus = "INTERESTED",
): Promise<{ ok: boolean; error?: string; applicationId?: string }> {
  await requireAuthForAction();
  try {
    const application = await startApplication(jobId, { status });
    revalidateApplication(application.id);
    revalidatePath(`/app/jobs/${jobId}`);
    return { ok: true, applicationId: application.id };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

export async function deleteApplicationAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAuthForAction();
  try {
    await deleteApplication(id);
    revalidateApplication();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

export async function globalSearchAction(query: string) {
  await requireAuthForAction();
  const { globalSearch } = await import("@/lib/db/queries");
  return globalSearch(query);
}
