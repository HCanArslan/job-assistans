import type { ApplicationEventType } from "@/generated/prisma/client";

import { Badge } from "@/components/ui/badge";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import { daysSince, formatDateTime } from "@/lib/format";

export interface TimelineEvent {
  id: string;
  type: ApplicationEventType;
  title: string;
  notes: string | null;
  eventAt: Date;
}

export function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-xs text-muted-foreground">No activity yet.</p>;
  }

  return (
    <ol className="flex flex-col">
      {events.map((event, index) => (
        <li key={event.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="mt-1.5 size-2 shrink-0 rounded-full border border-border bg-background" />
            {index < events.length - 1 ? <span className="w-px flex-1 bg-border" /> : null}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-medium">{event.title}</span>
              <Badge variant="muted" className="rounded">
                {EVENT_TYPE_LABELS[event.type]}
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                {formatDateTime(event.eventAt)} · {daysSince(event.eventAt) === 0 ? "today" : `${daysSince(event.eventAt)}d ago`}
              </span>
            </div>
            {event.notes ? (
              <p className="whitespace-pre-wrap text-xs text-muted-foreground">{event.notes}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
