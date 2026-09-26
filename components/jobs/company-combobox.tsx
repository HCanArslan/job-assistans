"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Check, ChevronsUpDown, Loader2, Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { searchCompaniesAction } from "@/lib/actions/search";
import { cn } from "@/lib/utils";

export interface CompanyOption {
  id: string;
  name: string;
  source: string;
  ignored?: boolean;
}

/**
 * Searchable company picker. Submits either `companyId` (existing company)
 * or `newCompanyName` (created on save) as hidden form fields.
 */
export function CompanyCombobox({
  initial,
  autoFocus,
}: {
  initial?: CompanyOption | null;
  autoFocus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<CompanyOption | null>(initial ?? null);
  const [newCompanyName, setNewCompanyName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const rows = await searchCompaniesAction(query.trim());
        if (!cancelled) setOptions(rows);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 160);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const trimmedQuery = query.trim();
  const showCreate = trimmedQuery.length > 1 && !options.some(
    (option) => option.name.toLowerCase() === trimmedQuery.toLowerCase(),
  );

  const value = useMemo(() => selected?.name ?? newCompanyName ?? "", [selected, newCompanyName]);

  return (
    <div>
      <input type="hidden" name="companyId" value={selected?.id ?? ""} />
      <input type="hidden" name="newCompanyName" value={newCompanyName ?? ""} />

      {value ? (
        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-2 py-1.5">
          <Building2 className="size-3.5 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-[13px]">{value}</span>
          {selected ? (
            <Badge variant="muted" className="rounded">
              {selected.source === "STILL_HIRING" ? "StillHiring" : "Manual"}
            </Badge>
          ) : (
            <Badge variant="secondary" className="rounded">
              New company
            </Badge>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setSelected(null);
              setNewCompanyName(null);
            }}
            title="Change company"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between font-normal"
              autoFocus={autoFocus}
            >
              <span className="text-muted-foreground">Search for a company…</span>
              <ChevronsUpDown className="size-3.5 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[22rem] p-0">
            <div className="border-b border-border p-2">
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Start typing a company name…"
                className="h-6 w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/70"
              />
            </div>
            <div className="max-h-64 overflow-y-auto p-1 scrollbar-thin">
              {loading ? (
                <p className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  Searching…
                </p>
              ) : null}
              {!loading && options.length === 0 && !showCreate ? (
                <p className="px-2 py-3 text-center text-xs text-muted-foreground">No companies found</p>
              ) : null}
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setSelected(option);
                    setNewCompanyName(null);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] hover:bg-accent"
                >
                  <Check className={cn("size-3.5", selected?.id === option.id ? "opacity-100" : "opacity-0")} />
                  <span className="min-w-0 flex-1 truncate">{option.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {option.source === "STILL_HIRING" ? "StillHiring" : "Manual"}
                  </span>
                </button>
              ))}
              {showCreate ? (
                <button
                  type="button"
                  onClick={() => {
                    setNewCompanyName(trimmedQuery);
                    setSelected(null);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] text-primary hover:bg-accent"
                >
                  <Plus className="size-3.5" />
                  Create company “{trimmedQuery}”
                </button>
              ) : null}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
