"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { ApplicationStatus } from "@/generated/prisma/client";
import { requireAuthForAction } from "@/lib/auth/guard";
import { createJob, deleteJob, getJobDeleteImpact, updateJob } from "@/lib/services/jobs";
import { startApplication } from "@/lib/services/applications";
import { companyInputSchema, firstFieldError, formDataToObject, jobInputSchema } from "@/lib/validation/schemas";
import { createCompany } from "@/lib/services/companies";

export interface JobFormState {
  ok: boolean;
  error?: string;
}

const INTENTS: Record<string, ApplicationStatus | null> = {
  save: null,
  save_to_apply: "TO_APPLY",
  save_applied: "APPLIED",
};

function messageOf(error: unknown): string {
  if (error instanceof z.ZodError) return firstFieldError(error);
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export async function saveJobAction(_prev: JobFormState | null, formData: FormData): Promise<JobFormState> {
  await requireAuthForAction();
  try {
    const raw = formDataToObject(formData);
    const intent = typeof raw.intent === "string" ? raw.intent : "save";
    const initialStatus = intent in INTENTS ? INTENTS[intent] : null;

    // The combobox can submit either an existing company or a new company name.
    let companyId = typeof raw.companyId === "string" ? raw.companyId.trim() : "";
    const newCompanyName = typeof raw.newCompanyName === "string" ? raw.newCompanyName.trim() : "";

    if (!companyId && newCompanyName) {
      const created = await createCompany(
        companyInputSchema.parse({ name: newCompanyName, remoteHiring: "UNKNOWN" }),
      );
      companyId = created.id;
    }

    const parsed = jobInputSchema.parse({ ...raw, companyId });
    const { job } = await createJob(parsed, { initialStatus });

    revalidatePath("/app");
    revalidatePath("/app/jobs");
    revalidatePath("/app/applications");
    revalidatePath(`/app/companies/${parsed.companyId}`);
    redirect(`/app/jobs/${job.id}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return { ok: false, error: messageOf(error) };
  }
}

export async function updateJobAction(_prev: JobFormState | null, formData: FormData): Promise<JobFormState> {
  await requireAuthForAction();
  try {
    const raw = formDataToObject(formData);
    const id = String(raw.id ?? "");
    if (!id) return { ok: false, error: "Missing job id" };
    const parsed = jobInputSchema.parse(raw);
    await updateJob(id, parsed);
    revalidatePath(`/app/jobs/${id}`);
    revalidatePath("/app/applications");
    redirect(`/app/jobs/${id}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return { ok: false, error: messageOf(error) };
  }
}

export async function deleteJobAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAuthForAction();
  try {
    await deleteJob(id);
    revalidatePath("/app/applications");
    revalidatePath("/app");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

export async function getJobDeleteImpactAction(id: string) {
  await requireAuthForAction();
  return getJobDeleteImpact(id);
}

export async function startApplicationAction(
  jobId: string,
  status: ApplicationStatus = "INTERESTED",
): Promise<{ ok: boolean; error?: string; applicationId?: string }> {
  await requireAuthForAction();
  try {
    const application = await startApplication(jobId, { status });
    revalidatePath(`/app/jobs/${jobId}`);
    revalidatePath("/app/applications");
    revalidatePath("/app");
    return { ok: true, applicationId: application.id };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}
