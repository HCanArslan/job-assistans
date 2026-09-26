"use client";

import { useTransition } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { ApplicationStatus } from "@/generated/prisma/client";
import { StatusBadge } from "@/components/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { changeStatusAction } from "@/lib/actions/applications";
import { APPLICATION_STATUSES, KANBAN_GROUPS, STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Compact inline status dropdown used in tables, cards and detail headers. */
export function StatusSelect({
  applicationId,
  status,
  compact = false,
  className,
}: {
  applicationId: string;
  status: ApplicationStatus;
  compact?: boolean;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  const change = (next: ApplicationStatus) => {
    if (next === status) return;
    startTransition(async () => {
      const result = await changeStatusAction(applicationId, next);
      if (result.ok) toast.success(`Status: ${STATUS_LABELS[next]}`);
      else toast.error(result.error ?? "Could not change status");
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={pending}
          className={cn(
            "inline-flex items-center gap-1 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            className,
          )}
          title="Change status"
        >
          <StatusBadge status={status} />
          {pending ? (
            <Loader2 className="size-3 animate-spin text-muted-foreground" />
          ) : compact ? (
            <ChevronDown className="size-3 text-muted-foreground" />
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[22rem] w-52 overflow-y-auto scrollbar-thin">
        {KANBAN_GROUPS.map((group, index) => (
          <div key={group.id}>
            {index > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
            {group.statuses.map((value) => (
              <DropdownMenuItem
                key={value}
                onSelect={() => change(value as ApplicationStatus)}
                className={cn(value === status && "bg-accent/60 font-medium")}
              >
                {STATUS_LABELS[value as ApplicationStatus]}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Other</DropdownMenuLabel>
        {APPLICATION_STATUSES.filter((value) => !KANBAN_GROUPS.some((g) => (g.statuses as readonly string[]).includes(value))).map(
          (value) => (
            <DropdownMenuItem key={value} onSelect={() => change(value)}>
              {STATUS_LABELS[value]}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
