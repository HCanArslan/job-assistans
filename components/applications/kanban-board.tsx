"use client";

import Link from "next/link";
import { CalendarClock, ExternalLink, Video } from "lucide-react";

import type { ApplicationListRow } from "@/lib/db/queries";
import { ScheduleDialog } from "@/components/applications/schedule-dialog";
import { StatusSelect } from "@/components/applications/status-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { daysSince, formatDateTime, isSameZonedDay } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface BoardGroup {
  id: string;
  label: string;
  items: ApplicationListRow[];
}

export function KanbanBoard({ groups }: { groups: BoardGroup[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
      {groups.map((group) => (
        <section key={group.id} className="flex w-[19rem] shrink-0 flex-col gap-2">
          <header className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-2 py-1.5">
            <span className="text-xs font-medium">{group.label}</span>
            <Badge variant="muted" className="rounded">
              {group.items.length}
            </Badge>
          </header>
          <div className="flex flex-col gap-2">
            {group.items.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-2 py-3 text-center text-[11px] text-muted-foreground">
                Nothing here
              </p>
            ) : null}
            {group.items.map((item) => (
              <Card key={item.id} className="p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/app/applications/${item.id}`}
                      className="block truncate text-[13px] font-medium hover:underline"
                      title={item.job.title}
                    >
                      {item.job.title}
                    </Link>
                    <Link
                      href={`/app/companies/${item.job.company.id}`}
                      className="block truncate text-[11px] text-muted-foreground hover:underline"
                    >
                      {item.job.company.name}
                    </Link>
                  </div>
                  {item.job.jobUrl ? (
                    <Button asChild variant="ghost" size="icon-sm">
                      <a href={item.job.jobUrl} target="_blank" rel="noreferrer noopener" title="Open job posting">
                        <ExternalLink className="size-3.5" />
                      </a>
                    </Button>
                  ) : null}
                </div>

                <div className="mt-2 flex items-center gap-1.5">
                  <StatusSelect applicationId={item.id} status={item.status} compact />
                  <span className="text-[11px] text-muted-foreground">
                    {daysSince(item.lastActivityAt) === 0
                      ? "active today"
                      : `${daysSince(item.lastActivityAt)}d since activity`}
                  </span>
                </div>

                <div className="mt-2 flex flex-col gap-1">
                  {item.nextFollowUpAt ? (
                    <div className="flex items-center gap-1.5">
                      <CalendarClock className="size-3 text-muted-foreground" />
                      <span
                        className={cn(
                          "text-[11px]",
                          item.nextFollowUpAt.getTime() < Date.now() && !isSameZonedDay(item.nextFollowUpAt, new Date())
                            ? "font-medium text-red-600 dark:text-red-400"
                            : "text-muted-foreground",
                        )}
                      >
                        Follow-up {formatDateTime(item.nextFollowUpAt)}
                      </span>
                      <ScheduleDialog
                        applicationId={item.id}
                        mode="followup"
                        currentValue={item.nextFollowUpAt}
                        trigger={
                          <button type="button" className="text-[11px] text-muted-foreground underline">
                            edit
                          </button>
                        }
                      />
                    </div>
                  ) : null}
                  {item.interviewAt ? (
                    <div className="flex items-center gap-1.5">
                      <Video className="size-3 text-purple-600 dark:text-purple-400" />
                      <span className="text-[11px] font-medium text-purple-700 dark:text-purple-300">
                        Interview {formatDateTime(item.interviewAt)}
                      </span>
                      <ScheduleDialog
                        applicationId={item.id}
                        mode="interview"
                        currentValue={item.interviewAt}
                        trigger={
                          <button type="button" className="text-[11px] text-muted-foreground underline">
                            edit
                          </button>
                        }
                      />
                    </div>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
