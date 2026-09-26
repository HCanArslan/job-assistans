import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Briefcase, ExternalLink, Globe, Pencil } from "lucide-react";

import { AddEventDialog } from "@/components/applications/add-event-dialog";
import { ApplicationDeleteButton } from "@/components/applications/application-delete-button";
import { MarkFollowedUpButton } from "@/components/applications/mark-followed-up-button";
import { ScheduleDialog } from "@/components/applications/schedule-dialog";
import { StatusSelect } from "@/components/applications/status-select";
import { Timeline } from "@/components/applications/timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isFollowUpOverdue, interviewState, followUpState } from "@/lib/application-state";
import { REMOTE_TYPE_LABELS, STATUS_LABELS } from "@/lib/constants";
import { getApplicationById } from "@/lib/db/queries";
import { daysSince, formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = await getApplicationById(id);
  if (!application) notFound();

  const { job } = application;
  const company = job.company;
  const daysInProcess = application.appliedAt ? daysSince(application.appliedAt) : daysSince(application.createdAt);
  const followUpOverdue = isFollowUpOverdue(application.nextFollowUpAt);
  const followUpToday = followUpState(application.nextFollowUpAt) === "today";
  const interviewNext = interviewState(application.interviewAt);
  const interviewSoon = interviewNext === "today" || interviewNext === "soon";

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/app/companies/${company.id}`}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                >
                  <Building2 className="size-3.5" />
                  {company.name}
                </Link>
                <Badge variant="outline" className="rounded font-normal text-muted-foreground">
                  {job.remoteType === "UNKNOWN" ? "Remote unknown" : REMOTE_TYPE_LABELS[job.remoteType]}
                </Badge>
                {job.location ? (
                  <span className="text-xs text-muted-foreground">{job.location}</span>
                ) : null}
              </div>
              <h2 className="mt-1 text-base font-semibold tracking-tight">
                <Link href={`/app/jobs/${job.id}`} className="hover:underline">
                  {job.title}
                </Link>
              </h2>
              <div className="mt-2 flex items-center gap-2">
                <StatusSelect applicationId={application.id} status={application.status} compact />
                <span className="text-xs text-muted-foreground">
                  {STATUS_LABELS[application.status]} · {daysInProcess} day{daysInProcess === 1 ? "" : "s"} in process
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {job.jobUrl ? (
                <Button asChild variant="outline" size="sm">
                  <a href={job.jobUrl} target="_blank" rel="noreferrer noopener">
                    <ExternalLink className="size-3.5" />
                    Open Job
                  </a>
                </Button>
              ) : null}
              {company.websiteUrl ? (
                <Button asChild variant="outline" size="sm">
                  <a href={company.websiteUrl} target="_blank" rel="noreferrer noopener">
                    <Globe className="size-3.5" />
                    Website
                  </a>
                </Button>
              ) : null}
              {company.jobsUrl ? (
                <Button asChild variant="outline" size="sm">
                  <a href={company.jobsUrl} target="_blank" rel="noreferrer noopener">
                    <Briefcase className="size-3.5" />
                    Jobs Page
                  </a>
                </Button>
              ) : null}
              <Button asChild variant="outline" size="sm">
                <Link href={`/app/applications/${application.id}/edit`}>
                  <Pencil className="size-3.5" />
                  Edit
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
            <ScheduleDialog
              applicationId={application.id}
              mode="followup"
              currentValue={application.nextFollowUpAt}
            />
            <ScheduleDialog
              applicationId={application.id}
              mode="interview"
              currentValue={application.interviewAt}
            />
            <AddEventDialog applicationId={application.id} />
            {application.nextFollowUpAt ? (
              <MarkFollowedUpButton applicationId={application.id} size="sm" />
            ) : null}
            {followUpOverdue ? (
              <Badge variant="outline" className="rounded border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                Follow-up overdue
              </Badge>
            ) : followUpToday ? (
              <Badge variant="outline" className="rounded border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                Follow-up due today
              </Badge>
            ) : null}
            {interviewSoon && application.interviewAt ? (
              <Badge variant="outline" className="rounded border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300">
                {interviewNext === "today" ? "Interview today" : "Interview soon"}
              </Badge>
            ) : null}
            <span className="ml-auto">
              <ApplicationDeleteButton
                applicationId={application.id}
                jobTitle={job.title}
                events={application.events.length}
              />
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Key dates and contacts for this process</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs sm:grid-cols-4">
              <Detail label="Applied" value={application.appliedAt ? formatDate(application.appliedAt) : "—"} />
              <Detail label="Days in process" value={`${daysInProcess}`} />
              <Detail label="Last activity" value={formatDateTime(application.lastActivityAt)} />
              <Detail
                label="Next follow-up"
                value={application.nextFollowUpAt ? formatDateTime(application.nextFollowUpAt) : "—"}
                tone={followUpOverdue ? "danger" : followUpToday ? "warning" : undefined}
              />
              <Detail
                label="Interview"
                value={application.interviewAt ? formatDateTime(application.interviewAt) : "—"}
                tone={interviewSoon && application.interviewAt ? "info" : undefined}
              />
              <Detail label="Salary expectation" value={application.salaryExpectation ?? "—"} />
              <Detail
                label="Recruiter"
                value={
                  application.recruiterName || application.recruiterEmail
                    ? [application.recruiterName, application.recruiterEmail].filter(Boolean).join(" · ")
                    : "—"
                }
              />
              <Detail label="Referral" value={application.referralName ?? "—"} />
              <Detail label="Job salary" value={job.salaryText ?? "—"} />
              <Detail label="Rejection reason" value={application.rejectionReason ?? "—"} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Interview prep, questions to ask, feedback</CardDescription>
          </CardHeader>
          <CardContent>
            {application.notes ? (
              <p className="max-h-80 overflow-y-auto whitespace-pre-wrap text-[13px] text-foreground/90 scrollbar-thin">
                {application.notes}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                No notes yet.{" "}
                <Link href={`/app/applications/${application.id}/edit`} className="underline">
                  Add notes
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timeline ({application.events.length})</CardTitle>
          <CardDescription>Every status change and logged activity, newest first</CardDescription>
        </CardHeader>
        <CardContent>
          <Timeline events={application.events} />
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "danger" | "warning" | "info";
}) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "truncate",
          tone === "danger" && "font-medium text-red-600 dark:text-red-400",
          tone === "warning" && "font-medium text-amber-600 dark:text-amber-400",
          tone === "info" && "font-medium text-purple-600 dark:text-purple-400",
        )}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}
