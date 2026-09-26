"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";

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
import { saveCompanyAction, type FormState } from "@/lib/actions/companies";
import { REMOTE_HIRING_LABELS } from "@/lib/constants";

export interface CompanyFormValues {
  id?: string;
  name?: string | null;
  websiteUrl?: string | null;
  jobsUrl?: string | null;
  linkedinUrl?: string | null;
  employees?: number | null;
  hqCountry?: string | null;
  hqState?: string | null;
  hqCity?: string | null;
  remoteHiring?: string | null;
  tagline?: string | null;
  notes?: string | null;
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
  className,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  type?: string;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <Label htmlFor={name}>
        {label}
        {required ? " *" : ""}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

export function CompanyForm({ company }: { company?: CompanyFormValues }) {
  const [state, formAction, pending] = useActionState<FormState | null, FormData>(
    saveCompanyAction,
    null,
  );
  const isEdit = Boolean(company?.id);

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-4 rounded-lg border border-border bg-card p-4">
      {company?.id ? <input type="hidden" name="id" value={company.id} /> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Company name" name="name" defaultValue={company?.name} required className="sm:col-span-2" />
        <Field label="Website" name="websiteUrl" defaultValue={company?.websiteUrl} placeholder="https://" />
        <Field label="Jobs / careers URL" name="jobsUrl" defaultValue={company?.jobsUrl} placeholder="https://" />
        <Field label="LinkedIn URL" name="linkedinUrl" defaultValue={company?.linkedinUrl} placeholder="https://" />
        <Field
          label="Employees"
          name="employees"
          type="number"
          defaultValue={company?.employees ?? undefined}
          placeholder="e.g. 120"
        />
        <Field label="HQ country" name="hqCountry" defaultValue={company?.hqCountry} />
        <Field label="HQ state" name="hqState" defaultValue={company?.hqState} />
        <Field label="HQ city" name="hqCity" defaultValue={company?.hqCity} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="remoteHiring">Remote hiring</Label>
          <Select name="remoteHiring" defaultValue={company?.remoteHiring ?? "UNKNOWN"}>
            <SelectTrigger id="remoteHiring" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(REMOTE_HIRING_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Field
          label="Tagline"
          name="tagline"
          defaultValue={company?.tagline}
          className="sm:col-span-2"
          placeholder="One-line description"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={5}
          defaultValue={company?.notes ?? ""}
          placeholder="Why this company, contacts, referrals, anything useful…"
        />
      </div>

      {state && !state.ok && state.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1.5 text-xs text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
          {isEdit ? "Save changes" : "Create company"}
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={company?.id ? `/app/companies/${company.id}` : "/app/companies"}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
