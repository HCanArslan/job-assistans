"use client";

import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  default: "border-border bg-muted/60 text-muted-foreground",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  muted: "border-border bg-background text-muted-foreground",
} as const;

function toneFor(value: string): keyof typeof TONE_CLASSES {
  if (/positive|20%\+|very high|high/i.test(value)) return "positive";
  if (/negative|low/i.test(value)) return "warning";
  return "muted";
}

/** Dense cell renderer: first few badges + "+N" popover (spec 50). */
export function SignalBadges({
  values,
  max = 2,
  emptyLabel = "—",
  tone = "auto",
  className,
}: {
  values: string[];
  max?: number;
  emptyLabel?: string;
  tone?: "auto" | "default";
  className?: string;
}) {
  if (!values || values.length === 0) {
    return <span className={cn("text-xs text-muted-foreground/60", className)}>{emptyLabel}</span>;
  }

  const shown = values.slice(0, max);
  const hidden = values.slice(max);

  const badgeClass = (value: string) =>
    tone === "auto" ? TONE_CLASSES[toneFor(value)] : TONE_CLASSES.default;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {shown.map((value) => (
        <Badge key={value} variant="outline" className={cn("rounded font-normal", badgeClass(value))} title={value}>
          <span className="max-w-[11rem] truncate">{shorten(value)}</span>
        </Badge>
      ))}
      {hidden.length > 0 ? (
        <Popover>
          <PopoverTrigger asChild>
            <Badge
              variant="outline"
              className="cursor-pointer rounded border-border bg-background font-normal text-muted-foreground hover:bg-accent"
            >
              +{hidden.length}
            </Badge>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64">
            <div className="flex flex-col gap-1">
              {hidden.map((value) => (
                <span key={value} className="text-xs text-muted-foreground">
                  {value}
                </span>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  );
}

function shorten(value: string): string {
  return value.replace(/^Hiring\s+/i, "").replace(/^Funding:\s*/i, "");
}
