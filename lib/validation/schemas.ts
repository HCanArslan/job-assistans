import { z } from "zod";

import { fromZonedInput } from "@/lib/format";
import { normalizeUrl } from "@/lib/utils";

/**
 * Optional field normalizer: "" (blank), null and undefined all mean "no value".
 * Missing keys must reach the same branch as blank ones — payloads built in code
 * (e.g. the inline create-company path) simply omit the key instead of sending "".
 */
const emptyToNull = (value: unknown) =>
  value === undefined || (typeof value === "string" && value.trim() === "") ? null : value;

/** Optional text field: "" / null / undefined -> null. */
export const optionalText = (max = 5000) =>
  z.preprocess(emptyToNull, z.string().trim().max(max).nullable());

/** Optional URL field: normalized to an absolute https URL when a host is given. */
export const optionalUrl = z.preprocess(
  emptyToNull,
  z
    .string()
    .trim()
    .max(1000)
    .nullable()
    .transform((value) => normalizeUrl(value)),
);

export const optionalInt = z.preprocess(
  emptyToNull,
  z.coerce.number().int().min(0).max(10_000_000).nullable(),
);

const zonedDateTime = z.preprocess(
  emptyToNull,
  z
    .string()
    .trim()
    .nullable()
    .transform((value) => fromZonedInput(value))
    .refine((value) => value === null || !Number.isNaN(value.getTime()), {
      message: "Invalid date/time",
    }),
);

export const remoteHiringSchema = z.enum(["YES", "NO", "NOT_SURE", "UNKNOWN"]);
export const companySourceSchema = z.enum(["STILL_HIRING", "MANUAL"]);
export const remoteTypeSchema = z.enum(["REMOTE", "HYBRID", "ONSITE", "UNKNOWN"]);

export const applicationStatusSchema = z.enum([
  "INTERESTED",
  "TO_APPLY",
  "APPLIED",
  "WAITING_REPLY",
  "RECRUITER_SCREEN",
  "HR_INTERVIEW",
  "TECHNICAL_INTERVIEW",
  "TAKE_HOME",
  "LIVE_CODING",
  "HIRING_MANAGER",
  "FINAL_INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
  "GHOSTED",
]);

export const applicationEventTypeSchema = z.enum([
  "STATUS_CHANGE",
  "APPLIED",
  "RECRUITER_CONTACT",
  "HR_INTERVIEW",
  "TECHNICAL_INTERVIEW",
  "TAKE_HOME_RECEIVED",
  "TAKE_HOME_SUBMITTED",
  "LIVE_CODING",
  "HIRING_MANAGER",
  "FINAL_INTERVIEW",
  "FOLLOW_UP",
  "OFFER",
  "REJECTION",
  "NOTE",
  "CUSTOM",
]);

export const companyInputSchema = z.object({
  name: z.string().trim().min(1, "Company name is required").max(200),
  websiteUrl: optionalUrl,
  jobsUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  employees: optionalInt,
  hqCountry: optionalText(120),
  hqState: optionalText(120),
  hqCity: optionalText(120),
  remoteHiring: remoteHiringSchema.default("UNKNOWN"),
  tagline: optionalText(500),
  notes: optionalText(10_000),
});

export type CompanyInput = z.infer<typeof companyInputSchema>;

export const jobInputSchema = z.object({
  companyId: z.string().trim().min(1, "Company is required"),
  title: z.string().trim().min(1, "Job title is required").max(200),
  jobUrl: optionalUrl,
  location: optionalText(200),
  remoteType: remoteTypeSchema.default("UNKNOWN"),
  salaryText: optionalText(200),
  notes: optionalText(10_000),
});

export type JobInput = z.infer<typeof jobInputSchema>;

export const applicationUpdateSchema = z.object({
  salaryExpectation: optionalText(200),
  recruiterName: optionalText(200),
  recruiterEmail: z.preprocess(
    emptyToNull,
    z
      .string()
      .trim()
      .max(320)
      .refine((value) => value === null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value), {
        message: "Enter a valid email address",
      })
      .nullable(),
  ),
  referralName: optionalText(200),
  appliedAt: zonedDateTime,
  nextFollowUpAt: zonedDateTime,
  interviewAt: zonedDateTime,
  salaryText: optionalText(200),
  notes: optionalText(20_000),
  rejectionReason: optionalText(2000),
});

export type ApplicationUpdateInput = z.infer<typeof applicationUpdateSchema>;

export const eventInputSchema = z.object({
  type: applicationEventTypeSchema.default("NOTE"),
  title: z.string().trim().min(1, "Title is required").max(200),
  notes: optionalText(10_000),
  eventAt: zonedDateTime,
});

export type EventInput = z.infer<typeof eventInputSchema>;

/** Converts a FormData instance into a plain object (single values only). */
export function formDataToObject(formData: FormData): Record<string, unknown> {
  const entries: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") entries[key] = value;
  }
  return entries;
}

export function firstFieldError(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid input";
  const path = issue.path.join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}
