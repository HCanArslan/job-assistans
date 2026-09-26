"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2, Loader2, Save, Send } from "lucide-react";

import { CompanyCombobox, type CompanyOption } from "@/components/jobs/company-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveJobAction, updateJobAction, type JobFormState } from "@/lib/actions/jobs";
import { REMOTE_TYPE_LABELS } from "@/lib/constants";

export interface JobFormValues {
  id?: string;
  companyId?: string;
  title?: string | null;
  jobUrl?: string | null;
  location?: string | null;
  remoteType?: string | null;
  salaryText?: string | null;
  notes?: string | null;
}

export function JobForm({
  job,
  initialCompany,
}: {
  job?: JobFormValues;
  initialCompany?: CompanyOption | null;
}) {
  const isEdit = Boolean(job?.id);
  const [state, formAction, pending] = useActionState<JobFormState | null, FormData>(
    isEdit ? updateJobAction : saveJobAction,
    null,
  );

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4 rounded-lg border border-border bg-card p-4">
      {job?.id ? <input type="hidden" name="id" value={job.id} /> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label>
            Company <span className="text-destructive">*</span>
          </Label>
          {isEdit && initialCompany ? (
            <>
              <div className="flex h-8 items-center rounded-md border border-input bg-muted/40 px-2 text-[13px]">
                {initialCompany.name}
              </div>
              <input type="hidden" name="companyId" value={initialCompany.id} />
            </>
          ) : (
            <CompanyCombobox initial={initialCompany ?? null} autoFocus />
          )}
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="title">
            Job title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            name="title"
            defaultValue={job?.title ?? ""}
            placeholder="Senior Backend Engineer"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="jobUrl">Job URL</Label>
          <Input id="jobUrl" name="jobUrl" defaultValue={job?.jobUrl ?? ""} placeholder="https://" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" defaultValue={job?.location ?? ""} placeholder="Berlin, Germany" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="remoteType">Remote type</Label>
          <Select name="remoteType" defaultValue={job?.remoteType ?? "UNKNOWN"}>
            <SelectTrigger id="remoteType" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(REMOTE_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="salaryText">Salary</Label>
          <Input id="salaryText" name="salaryText" defaultValue={job?.salaryText ?? ""} placeholder="€80-95k" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={job?.notes ?? ""}
          placeholder="Requirements, recruiter, source of the lead…"
        />
      </div>

      {state && !state.ok && state.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1.5 text-xs text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {isEdit ? (
          <Button type="submit" size="sm" name="intent" value="save" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Save />}
            Save changes
          </Button>
        ) : (
          <>
            <Button type="submit" size="sm" name="intent" value="save" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Save />}
              Save
            </Button>
            <Button type="submit" size="sm" variant="secondary" name="intent" value="save_to_apply" disabled={pending}>
              <CheckCircle2 />
              Save &amp; Mark To Apply
            </Button>
            <Button type="submit" size="sm" variant="secondary" name="intent" value="save_applied" disabled={pending}>
              <Send />
              Save &amp; Mark Applied
            </Button>
          </>
        )}
        <Button asChild variant="outline" size="sm">
          <Link href={job?.id ? `/app/jobs/${job.id}` : "/app/companies"}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
