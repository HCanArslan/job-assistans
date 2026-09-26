"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { MultiSelectFilter } from "@/components/companies/multi-select-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/lib/constants";

export function ApplicationFilters({
  companies,
  total,
}: {
  companies: { id: string; name: string }[];
  total: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const update = (patch: Record<string, string | string[] | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      next.delete(key);
      if (value === null || value === "") continue;
      if (Array.isArray(value)) for (const item of value) next.append(key, item);
      else next.set(key, value);
    }
    next.delete("page");
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `/app/applications?${qs}` : "/app/applications"));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const current = searchParams.get("q") ?? "";
      if (query.trim() === current) return;
      update({ q: query.trim() || null });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const selectedStatuses = searchParams.getAll("status");
  const companyId = searchParams.get("company");
  const companyName = companies.find((company) => company.id === companyId)?.name;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search job title, company, recruiter, notes…"
            className="h-7 w-full rounded-md border border-input bg-background pr-2 pl-7 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>

        <MultiSelectFilter
          label="Status"
          options={APPLICATION_STATUSES.map((status) => status)}
          selected={selectedStatuses}
          onChange={(values) => update({ status: values })}
          width="w-64"
          searchable={false}
          renderOption={(value) => STATUS_LABELS[value as keyof typeof STATUS_LABELS] ?? value}
        />

        <Select
          value={companyId ?? "ALL"}
          onValueChange={(value) => update({ company: value === "ALL" ? null : value })}
        >
          <SelectTrigger size="sm" className="w-48">
            <SelectValue placeholder="Company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All companies</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-input px-2 py-1 text-xs hover:bg-accent">
          <Checkbox
            checked={searchParams.get("followUp") === "1"}
            onCheckedChange={(checked) => update({ followUp: checked ? "1" : null })}
          />
          Follow-up due
        </label>

        <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-input px-2 py-1 text-xs hover:bg-accent">
          <Checkbox
            checked={searchParams.get("interview") === "1"}
            onCheckedChange={(checked) => update({ interview: checked ? "1" : null })}
          />
          Interview upcoming
        </label>

        {companyName ? (
          <Badge variant="secondary" className="gap-1 rounded">
            {companyName}
            <button type="button" onClick={() => update({ company: null })} title="Clear company filter">
              <X className="size-3" />
            </button>
          </Badge>
        ) : null}

        <span className="ml-auto text-xs text-muted-foreground">{total.toLocaleString("en-GB")} applications</span>
        {searchParams.toString() ? (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              setQuery("");
              router.replace("/app/applications");
            }}
          >
            <X className="size-3" />
            Reset
          </Button>
        ) : null}
      </div>
    </div>
  );
}
