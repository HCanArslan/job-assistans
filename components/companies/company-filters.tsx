"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, Search, X } from "lucide-react";

import { MultiSelectFilter } from "@/components/companies/multi-select-filter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EMPLOYEE_BUCKETS } from "@/lib/constants";
import type { CompanyFacets } from "@/lib/db/queries";

const TOGGLES: { key: string; label: string }[] = [
  { key: "favorite", label: "Favorite" },
  { key: "ignored", label: "Show ignored" },
  { key: "hasJobs", label: "Has jobs" },
  { key: "hasApp", label: "Has application" },
];

export function CompanyFilters({
  facets,
  total,
}: {
  facets: CompanyFacets;
  total: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const update = (patch: Record<string, string | string[] | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
        next.delete(key);
      } else if (Array.isArray(value)) {
        next.delete(key);
        for (const item of value) next.append(key, item);
      } else {
        next.set(key, value);
      }
    }
    next.delete("page");
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `/app/companies?${qs}` : "/app/companies");
    });
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

  const selectedFor = (key: string) => searchParams.getAll(key);
  const hasAnyFilter = searchParams.toString().length > 0;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name or tagline…"
            className="h-7 w-full rounded-md border border-input bg-background pr-2 pl-7 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>

        <Select
          value={searchParams.get("source") ?? "ALL"}
          onValueChange={(value) => update({ source: value === "ALL" ? null : value })}
        >
          <SelectTrigger size="sm" className="w-32">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All sources</SelectItem>
            <SelectItem value="STILL_HIRING">StillHiring</SelectItem>
            <SelectItem value="MANUAL">Manual</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("remote") ?? "ALL"}
          onValueChange={(value) => update({ remote: value === "ALL" ? null : value })}
        >
          <SelectTrigger size="sm" className="w-32">
            <SelectValue placeholder="Remote" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Any remote</SelectItem>
            <SelectItem value="YES">Remote: Yes</SelectItem>
            <SelectItem value="NO">Remote: No</SelectItem>
            <SelectItem value="NOT_SURE">Remote: Not sure</SelectItem>
            <SelectItem value="UNKNOWN">Remote: Unknown</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("employees") ?? "ALL"}
          onValueChange={(value) => update({ employees: value === "ALL" ? null : value })}
        >
          <SelectTrigger size="sm" className="w-32">
            <SelectValue placeholder="Employees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Any size</SelectItem>
            {EMPLOYEE_BUCKETS.map((bucket) => (
              <SelectItem key={bucket.id} value={bucket.id}>
                {bucket.label} employees
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("country") ?? "ALL"}
          onValueChange={(value) => update({ country: value === "ALL" ? null : value })}
        >
          <SelectTrigger size="sm" className="w-36">
            <SelectValue placeholder="HQ country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Any country</SelectItem>
            {facets.countries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("state") ?? "ALL"}
          onValueChange={(value) => update({ state: value === "ALL" ? null : value })}
        >
          <SelectTrigger size="sm" className="w-32">
            <SelectValue placeholder="HQ state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Any state</SelectItem>
            {facets.states.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("sort") ?? "name"}
          onValueChange={(value) => update({ sort: value === "name" ? null : value })}
        >
          <SelectTrigger size="sm" className="w-32">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name A-Z</SelectItem>
            <SelectItem value="employees">Most employees</SelectItem>
            <SelectItem value="updated">Recently updated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="size-3.5 text-muted-foreground" />
        <MultiSelectFilter
          label="Hiring functions"
          options={facets.hiringFunctions}
          selected={selectedFor("hiring")}
          onChange={(values) => update({ hiring: values })}
        />
        <MultiSelectFilter
          label="Engineering roles"
          options={facets.engineeringRoles}
          selected={selectedFor("engineering")}
          onChange={(values) => update({ engineering: values })}
          width="w-80"
        />
        <MultiSelectFilter
          label="Sales/Marketing/CS"
          options={facets.salesRoles}
          selected={selectedFor("sales")}
          onChange={(values) => update({ sales: values })}
          width="w-80"
        />
        <MultiSelectFilter
          label="Growth"
          options={facets.growthSignals}
          selected={selectedFor("growth")}
          onChange={(values) => update({ growth: values })}
        />
        <MultiSelectFilter
          label="Funding"
          options={facets.fundingSignals}
          selected={selectedFor("funding")}
          onChange={(values) => update({ funding: values })}
        />

        {TOGGLES.map((toggle) => {
          const checked = searchParams.get(toggle.key) === "1";
          return (
            <label
              key={toggle.key}
              className="flex cursor-pointer items-center gap-1.5 rounded-md border border-input px-2 py-1 text-xs hover:bg-accent"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(value) => update({ [toggle.key]: value ? "1" : null })}
              />
              {toggle.label}
            </label>
          );
        })}

        <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          {total.toLocaleString("en-GB")} companies
          {hasAnyFilter ? (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                setQuery("");
                router.replace("/app/companies");
              }}
            >
              <X className="size-3" />
              Reset
            </Button>
          ) : null}
        </span>
      </div>
    </div>
  );
}
