"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuthForAction } from "@/lib/auth/guard";
import {
  createCompany,
  deleteCompany,
  setCompanyFavorite,
  setCompanyIgnored,
  updateCompany,
  updateCompanyNotes,
} from "@/lib/services/companies";
import {
  companyInputSchema,
  firstFieldError,
  formDataToObject,
  optionalText,
} from "@/lib/validation/schemas";

export interface FormState {
  ok: boolean;
  error?: string;
  message?: string;
}

function messageOf(error: unknown): string {
  if (error instanceof z.ZodError) return firstFieldError(error);
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export async function saveCompanyAction(_prev: FormState | null, formData: FormData): Promise<FormState> {
  await requireAuthForAction();
  try {
    const raw = formDataToObject(formData);
    const id = typeof raw.id === "string" && raw.id ? raw.id : null;
    const parsed = companyInputSchema.parse(raw);

    if (id) {
      await updateCompany(id, parsed);
      revalidatePath("/app/companies");
      revalidatePath(`/app/companies/${id}`);
      revalidatePath("/app");
      redirect(`/app/companies/${id}`);
    }

    const company = await createCompany(parsed);
    revalidatePath("/app/companies");
    revalidatePath("/app");
    redirect(`/app/companies/${company.id}`);
  } catch (error) {
    // redirect() throws; let it bubble.
    if (error && typeof error === "object" && "digest" in error) throw error;
    return { ok: false, error: messageOf(error) };
  }
}

export async function deleteCompanyAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAuthForAction();
  try {
    await deleteCompany(id);
    revalidatePath("/app/companies");
    revalidatePath("/app");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

export async function toggleFavoriteAction(id: string, favorite: boolean) {
  await requireAuthForAction();
  await setCompanyFavorite(id, favorite);
  revalidatePath("/app/companies");
  revalidatePath(`/app/companies/${id}`);
  return { ok: true };
}

export async function toggleIgnoredAction(id: string, ignored: boolean) {
  await requireAuthForAction();
  await setCompanyIgnored(id, ignored);
  revalidatePath("/app/companies");
  revalidatePath(`/app/companies/${id}`);
  return { ok: true };
}

export async function updateCompanyNotesAction(id: string, notes: string) {
  await requireAuthForAction();
  const parsed = optionalText(20_000).parse(notes);
  await updateCompanyNotes(id, parsed);
  revalidatePath(`/app/companies/${id}`);
  return { ok: true };
}
