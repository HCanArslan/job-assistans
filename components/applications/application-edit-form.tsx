"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateApplicationAction, type ApplicationFormState } from "@/lib/actions/applications";
import { toZonedDateTimeInput } from "@/lib/format";

export interface ApplicationEditValues {
  id: string;
  appliedAt: Date | null;
  nextFollowUpAt: Date | null;
  interviewAt: Date | null;
  salaryExpectation: string | null;
  recruiterName: string | null;
  recruiterEmail: string | null;
  referralName: string | null;
  rejectionReason: string | null;
  notes: string | null;
}

export function ApplicationEditForm({ application }: { application: ApplicationEditValues }) {
  const [state, formAction, pending] = useActionState<ApplicationFormState | null, FormData>(
    updateApplicationAction,
    null,
  );

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <input type="hidden" name="id" value={application.id} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Applied at" name="appliedAt" type="datetime-local" defaultValue={toZonedDateTimeInput(application.appliedAt)} />
        <Field
          label="Next follow-up"
          name="nextFollowUpAt"
          type="datetime-local"
          defaultValue={toZonedDateTimeInput(application.nextFollowUpAt)}
        />
        <Field
          label="Interview at"
          name="interviewAt"
          type="datetime-local"
          defaultValue={toZonedDateTimeInput(application.interviewAt)}
        />
        <Field label="Salary expectation" name="salaryExpectation" defaultValue={application.salaryExpectation} />
        <Field label="Recruiter name" name="recruiterName" defaultValue={application.recruiterName} />
        <Field label="Recruiter email" name="recruiterEmail" defaultValue={application.recruiterEmail} type="email" />
        <Field label="Referral name" name="referralName" defaultValue={application.referralName} />
        <Field label="Rejection reason" name="rejectionReason" defaultValue={application.rejectionReason} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={8} defaultValue={application.notes ?? ""} />
      </div>

      {state && !state.ok && state.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1.5 text-xs text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
          Save changes
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/app/applications/${application.id}`}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} />
    </div>
  );
}
