import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, ExternalLink, Pencil } from "lucide-react";

import { JobDeleteButton } from "@/components/jobs/job-delete-button";
import { StartApplicationButton } from "@/components/applications/start-application-button";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { REMOTE_TYPE_LABELS } from "@/lib/constants";
import { getJobById } from "@/lib/db/queries";
import { formatDate, formatDateTime, relativeDays } from "@/lib/format";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();

  const application = job.application;

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/app/companies/${job.company.id}`}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                >
                  <Building2 className="size-3.5" />
                  {job.company.name}
                </Link>
                <Badge variant="outline" className="rounded font-normal text-muted-foreground">
                  {job.remoteType === "UNKNOWN" ? "Remote: unknown" : REMOTE_TYPE_LABELS[job.remoteType]}
                </Badge>
              </div>
              <h2 className="mt-1 text-base font-semibold tracking-tight">{job.title}</h2>
              {job.location ? <p className="text-xs text-muted-foreground">{job.location}</p> : null}
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
              <Button asChild variant="outline" size="sm">
                <Link href={`/app/jobs/${job.id}/edit`}>
                  <Pencil className="size-3.5" />
                  Edit
                </Link>
              </Button>
              {application ? (
                <Button asChild size="sm">
                  <Link href={`/app/applications/${application.id}`}>Open application</Link>
                </Button>
              ) : (
                <StartApplicationButton jobId={job.id} />
              )}
              <JobDeleteButton
                jobId={job.id}
                jobTitle={job.title}
                hasApplication={Boolean(application)}
                events={application?.events.length ?? 0}
              />
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Salary</dt>
              <dd>{job.salaryText ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Discovered</dt>
              <dd>{formatDate(job.discoveredAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Added</dt>
              <dd>{formatDate(job.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Company jobs page</dt>
              <dd className="truncate">
                {job.company.jobsUrl ? (
                  <a
                    href={job.company.jobsUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="hover:underline"
                  >
                    Open
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {application ? (
        <Card>
          <CardHeader>
            <CardTitle>Application status</CardTitle>
            <CardDescription>
              In process {relativeDays(application.createdAt)} · started {formatDate(application.createdAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4 text-xs">
            <StatusBadge status={application.status} />
            <span className="text-muted-foreground">
              Applied: {application.appliedAt ? formatDate(application.appliedAt) : "—"}
            </span>
            <span className="text-muted-foreground">
              Next follow-up: {application.nextFollowUpAt ? formatDateTime(application.nextFollowUpAt) : "—"}
            </span>
            <span className="text-muted-foreground">
              Interview: {application.interviewAt ? formatDateTime(application.interviewAt) : "—"}
            </span>
            <Button asChild variant="outline" size="xs">
              <Link href={`/app/applications/${application.id}`}>Open application</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {job.notes ? (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-[13px] text-foreground/90">{job.notes}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
