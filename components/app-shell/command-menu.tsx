"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  ClipboardList,
  Loader2,
  Plus,
  Search,
  SquareStack,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { globalSearchAction } from "@/lib/actions/search";
import type { GlobalSearchResults } from "@/lib/db/queries";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  href: string;
  icon: LucideIcon;
  badge?: React.ReactNode;
}

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const setOpenState = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery("");
      setResults(null);
      setLoading(false);
      setActiveIndex(0);
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpenState(!open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpenState]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(timer);
  }, [open]);

  const trimmedQuery = query.trim();
  const canSearch = trimmedQuery.length >= 2;
  const visibleResults = canSearch ? results : null;

  useEffect(() => {
    if (!open || !canSearch) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await globalSearchAction(trimmedQuery);
        if (cancelled) return;
        setResults(data);
        setActiveIndex(0);
      } catch {
        if (!cancelled) setResults(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [canSearch, open, trimmedQuery]);

  const items: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [];
    if (visibleResults) {
      for (const company of visibleResults.companies) {
        list.push({
          id: `company-${company.id}`,
          label: company.name,
          hint: company.tagline ?? undefined,
          href: `/app/companies/${company.id}`,
          icon: Building2,
        });
      }
      for (const job of visibleResults.jobs) {
        list.push({
          id: `job-${job.id}`,
          label: job.title,
          hint: job.companyName,
          href: `/app/jobs/${job.id}`,
          icon: SquareStack,
        });
      }
      for (const application of visibleResults.applications) {
        list.push({
          id: `application-${application.id}`,
          label: `${application.jobTitle} · ${application.companyName}`,
          href: `/app/applications/${application.id}`,
          icon: ClipboardList,
          badge: <StatusBadge status={application.status} />,
        });
      }
    }
    list.push(
      {
        id: "action-add-job",
        label: "Add job",
        hint: "Track a new role",
        href: "/app/jobs/new",
        icon: Plus,
      },
      {
        id: "action-add-company",
        label: "Add company",
        hint: "Manual company entry",
        href: "/app/companies/new",
        icon: Building2,
      },
    );
    return list;
  }, [visibleResults]);

  const go = (item: CommandItem) => {
    setOpenState(false);
    router.push(item.href);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, items.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = items[activeIndex];
      if (item) go(item);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpenState(true)}
        className="h-7 w-full justify-start gap-2 px-2 text-xs text-muted-foreground sm:w-64"
      >
        <Search className="size-3.5" />
        <span className="flex-1 text-left">Search companies, jobs, notes…</span>
        <kbd className="hidden rounded border border-border bg-muted px-1 text-[10px] text-muted-foreground sm:inline">
          ⌘K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpenState}>
        <DialogContent className="top-[8%] max-w-xl gap-0 p-0" showCloseButton={false}>
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Search companies, jobs, applications, notes…"
              className="h-6 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/70"
            />
            {canSearch && loading ? (
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            ) : null}
          </div>

          <div className="max-h-[22rem] overflow-y-auto p-1 scrollbar-thin">
            {items.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => go(item)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px]",
                    index === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
                  )}
                >
                  <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.badge ?? null}
                  {item.hint ? (
                    <span className="max-w-[45%] truncate text-[11px] text-muted-foreground">{item.hint}</span>
                  ) : null}
                </button>
              );
            })}
            {canSearch && !loading && visibleResults && items.length === 2 ? (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">No matches</p>
            ) : null}
            {!canSearch ? (
              <p className="px-2 py-2 text-[11px] text-muted-foreground">
                Type at least 2 characters to search. Use ↑ ↓ then ⏎ to open.
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
