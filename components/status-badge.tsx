import type { ApplicationStatus } from "@/generated/prisma/client";

import { Badge } from "@/components/ui/badge";
import { STATUS_CLASSES, STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: ApplicationStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded font-medium", STATUS_CLASSES[status], className)}
      title={STATUS_LABELS[status]}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function MyStatusBadge({ status, className }: { status: string; className?: string }) {
  if (status === "No Action") {
    return <span className={cn("text-xs text-muted-foreground/70", className)}>No action</span>;
  }
  return (
    <Badge variant="outline" className={cn("rounded", className)}>
      {status}
    </Badge>
  );
}
