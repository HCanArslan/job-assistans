import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  Clock,
  FileText,
  Plus,
  Sparkles,
} from "lucide-react";

import { MarkFollowedUpButton } from "@/components/applications/mark-followed-up-button";
import { ScheduleDialog } from "@/components/applications/schedule-dialog";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import { getDashboardData } from "@/lib/db/queries";
import { formatDateTime, relativeDays } from "@/lib/format";

export const metadata = { title: "Dashboard · Job Assist" };

export default async function DashboardPage() {
  const data = await getDashboardData();

  const stats: { label: string; value: number; href: string; tone?: string }[] = [
    { label: "To Apply", value: data.stats.toApply, href: "/app/applications?status=TO_APPLY" },
    { label: "Applied", value: data.stats.applied, href: "/app/applications?status=APPLIED" },
    { label: "Waiting Reply", value: data.stats.waitingReply, href: "/app/applications?status=WAITING_REPLY" },
    {
      label: "Interviewing",
      value: data.stats.interviewing,
      href: "/app/applications?status=RECRUITER_SCREEN&status=HR_INTERVIEW&status=TECHNICAL_INTERVIEW&status=TAKE_HOME&status=LIVE_CODING&status=HIRING_MANAGER&status=FINAL_INTERVIEW",
    },
    { label: "Offers", value: data.stats.offers, href: "/app/applications?status=OFFER" },
    { label: "Rejected", value: data.stats.rejected, href: "/app/applications?status=REJECTED" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border border-border bg-card px-3 py-2 transition-colors hover:bg-accent/40"
          >
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{stat.label}</div>
            <div className="text-lg font-semibold tabular-nums">{stat.value}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Needs attention</CardTitle>
              <CardDescription>Overdue follow-ups, upcoming interviews and stalled processes</CardDescription>
            </div>
            <AlertTriangle className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-0">
            {data.attention.length === 0 ? (
              <div className="p-3">
                <EmptyState
                  icon={ClipboardList}
                  title="Nothing urgent"
                  description="No overdue follow-ups and no interviews scheduled in the next two weeks."
                />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {data.attention.map((item) => (
                  <li key={item.applicationId} className="flex flex-wrap items-center gap-2 px-3 py-2">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/app/applications/${item.applicationId}`}
                          className="truncate text-[13px] font-medium hover:underline"
                        >
                          {item.jobTitle}
                        </Link>
                        <span className="truncate text-xs text-muted-foreground">{item.companyName}</span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <StatusBadge status={item.status} />
                        <span>{reasonLabel(item.reason)}</span>
                        {item.nextFollowUpAt ? <span>· follow-up {formatDateTime(item.nextFollowUpAt)}</span> : null}
                        {item.interviewAt ? <span>· interview {formatDateTime(item.interviewAt)}</span> : null}
                        <span>· {relativeDays(item.lastActivityAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.reason !== "interview" ? (
                        <MarkFollowedUpButton applicationId={item.applicationId} />
                      ) : null}
                      <ScheduleDialog
                        applicationId={item.applicationId}
                        mode={item.reason === "interview" ? "interview" : "followup"}
                        currentValue={item.reason === "interview" ? item.interviewAt : item.nextFollowUpAt}
                        compact
                        trigger={
                          <Button variant="ghost" size="xs">
                            <CalendarClock className="size-3.5" />
                            Reschedule
                          </Button>
                        }
                      />
                      <Button asChild variant="ghost" size="xs">
                        <Link href={`/app/applications/${item.applicationId}`}>Open</Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline</CardTitle>
            <CardDescription>Applications by stage</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.pipeline.map((group) => {
              const max = Math.max(1, ...data.pipeline.map((item) => item.count));
              return (
                <div key={group.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{group.label}</span>
                    <span className="tabular-nums text-muted-foreground">{group.count}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${Math.round((group.count / max) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
              <span>Closed (rejected / withdrawn / ghosted)</span>
              <span className="tabular-nums">{data.closedCount}</span>
            </div>
            <Button asChild variant="outline" size="xs" className="mt-1 justify-center">
              <Link href="/app/applications">
                <ClipboardList className="size-3" />
                Open applications
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest timeline events</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentEvents.length === 0 ? (
              <p className="px-3 pb-3 text-xs text-muted-foreground">
                No activity yet. Add a job and mark it applied.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {data.recentEvents.map((event) => (
                  <li key={event.id} className="flex flex-col gap-0.5 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-medium">{event.title}</span>
                      <Badge variant="muted" className="rounded">
                        {EVENT_TYPE_LABELS[event.type]}
                      </Badge>
                      <span className="ml-auto text-[11px] text-muted-foreground">
                        {relativeDays(event.eventAt)}
                      </span>
                    </div>
                    <Link
                      href={`/app/applications/${event.application.id}`}
                      className="truncate text-[11px] text-muted-foreground hover:underline"
                    >
                      {event.application.job.title} · {event.application.job.company.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Recent applications</CardTitle>
              <CardDescription>Most recently updated processes</CardDescription>
            </div>
            <Button asChild size="xs" variant="outline">
              <Link href="/app/jobs/new">
                <Plus className="size-3" />
                Add job
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentApplications.length === 0 ? (
              <div className="p-3">
                <EmptyState
                  icon={FileText}
                  title="No applications yet"
                  description="Add a job from your pipeline and mark it To Apply or Applied."
                  action={
                    <Button asChild size="sm">
                      <Link href="/app/jobs/new">
                        <Plus className="size-3.5" />
                        Add job
                      </Link>
                    </Button>
                  }
                />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {data.recentApplications.map((application) => (
                  <li key={application.id} className="flex items-center gap-2 px-3 py-2">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <Link
                        href={`/app/applications/${application.id}`}
                        className="truncate text-[13px] font-medium hover:underline"
                      >
                        {application.job.title}
                      </Link>
                      <span className="truncate text-[11px] text-muted-foreground">
                        {application.job.company.name}
                      </span>
                    </div>
                    {application.interviewAt ? (
                      <Badge variant="outline" className="rounded border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300">
                        <Clock className="size-3" />
                        {formatDateTime(application.interviewAt)}
                      </Badge>
                    ) : null}
                    <StatusBadge status={application.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {data.counts.TO_APPLY === 0 && data.counts.APPLIED === 0 && data.counts.INTERESTED === 0 ? (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Sparkles className="size-4 text-muted-foreground" />
            <p className="flex-1 text-xs text-muted-foreground">
              New here? Import the StillHiring company list, then filter for remote companies hiring engineers.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/app/import">Import</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/app/companies">Browse companies</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function reasonLabel(reason: "overdue" | "due_today" | "interview" | "stale"): string {
  switch (reason) {
    case "overdue":
      return "Follow-up overdue";
    case "due_today":
      return "Follow-up due today";
    case "interview":
      return "Interview scheduled";
    default:
      return "No activity for a while";
  }
}
