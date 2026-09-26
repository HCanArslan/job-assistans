import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Briefcase,
  Globe,
  Link2,
  Pencil,
  Plus,
  Star,
} from "lucide-react";

import { CompanyDeleteButton } from "@/components/companies/company-delete-button";
import { CompanyNotes } from "@/components/companies/company-notes";
import { CompanyFavoriteToggle } from "@/components/companies/company-favorite-toggle";
import { JobRowActions } from "@/components/jobs/job-row-actions";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { REMOTE_HIRING_LABELS, REMOTE_TYPE_LABELS } from "@/lib/constants";
import { getCompanyById, getCompanyDeleteImpact } from "@/lib/db/queries-extra";
import { formatDateTime } from "@/lib/format";

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await getCompanyById(id);
  if (!company) notFound();

  const impact = await getCompanyDeleteImpact(id);
  const applications = company.jobs
    .filter((job) => job.application)
    .map((job) => ({ job, application: job.application! }));

  const location = [company.hqCity, company.hqState, company.hqCountry].filter(Boolean).join(", ") || "—";
  const employees =
    company.employeesText && company.employeesText !== String(company.employees)
      ? company.employeesText
      : company.employees !== null
        ? company.employees.toLocaleString("en-GB")
        : "—";
  const recruitingVelocity = company.growthSignals.filter((signal) => /recruiting velocity/i.test(signal));
  const otherGrowth = company.growthSignals.filter((signal) => !/recruiting velocity/i.test(signal));

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight">{company.name}</h2>
                <Badge variant="outline" className="rounded font-normal text-muted-foreground">
                  {company.source === "STILL_HIRING" ? "StillHiring" : "Manual"}
                </Badge>
                {company.favorite ? <Star className="size-3.5 text-amber-500" /> : null}
                {company.ignored ? (
                  <Badge variant="muted" className="rounded">
                    Ignored
                  </Badge>
                ) : null}
              </div>
              {company.tagline ? (
                <p className="mt-0.5 max-w-3xl text-xs text-muted-foreground">{company.tagline}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
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
                    Jobs
                  </a>
                </Button>
              ) : null}
              {company.linkedinUrl ? (
                <Button asChild variant="outline" size="sm">
                  <a href={company.linkedinUrl} target="_blank" rel="noreferrer noopener">
                    <Link2 className="size-3.5" />
                    LinkedIn
                  </a>
                </Button>
              ) : null}
              <Button asChild variant="outline" size="sm">
                <Link href={`/app/jobs/new?company=${company.id}`}>
                  <Plus className="size-3.5" />
                  Add Job
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/app/companies/${company.id}/edit`}>
                  <Pencil className="size-3.5" />
                  Edit
                </Link>
              </Button>
              <CompanyFavoriteToggle
                companyId={company.id}
                favorite={company.favorite}
                ignored={company.ignored}
              />
              {impact ? (
                <CompanyDeleteButton
                  companyId={company.id}
                  companyName={company.name}
                  jobs={impact.jobs}
                  applications={impact.applications}
                  events={impact.events}
                  applicationTitles={impact.applicationTitles}
                />
              ) : null}
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3 text-xs sm:grid-cols-5">
            <div>
              <dt className="text-muted-foreground">Employees</dt>
              <dd className="tabular-nums">{employees}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">HQ</dt>
              <dd className="truncate" title={location}>
                {location}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Remote hiring</dt>
              <dd>{REMOTE_HIRING_LABELS[company.remoteHiring]}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Source</dt>
              <dd>{company.source === "STILL_HIRING" ? "StillHiring import" : "Manual"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last StillHiring sync</dt>
              <dd>{company.stillHiringImportedAt ? formatDateTime(company.stillHiringImportedAt) : "—"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Hiring signals</CardTitle>
            <CardDescription>StillHiring open-role signals by function</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <SignalGroup label="Broad functions" values={company.hiringFunctions} />
            <SignalGroup label="Engineering / Product / Design" values={company.engineeringRoles} />
            <SignalGroup label="Sales / Marketing / CS" values={company.salesMarketingCsRoles} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          <Card>
            <CardHeader>
              <CardTitle>Growth</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <SignalGroup label="Recruiting velocity" values={recruitingVelocity} />
              <SignalGroup label="Headcount signals" values={otherGrowth} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Funding</CardTitle>
            </CardHeader>
            <CardContent>
              <SignalGroup label="Funding signals" values={company.fundingSignals} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My notes</CardTitle>
          <CardDescription>Only you can change this - the StillHiring sync never touches it</CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyNotes companyId={company.id} notes={company.notes} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Jobs ({company.jobs.length})</CardTitle>
            <CardDescription>Roles you added for this company</CardDescription>
          </div>
          <Button asChild variant="outline" size="xs">
            <Link href={`/app/jobs/new?company=${company.id}`}>
              <Plus className="size-3" />
              Add job
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {company.jobs.length === 0 ? (
            <div className="p-3">
              <EmptyState
                icon={Briefcase}
                title="No jobs yet"
                description="Open the company careers page and add the roles you want to track."
                action={
                  <Button asChild size="sm">
                    <Link href={`/app/jobs/new?company=${company.id}`}>
                      <Plus className="size-3.5" />
                      Add job
                    </Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Job</TableHead>
                  <TableHead className="w-40">Location</TableHead>
                  <TableHead className="w-24">Remote</TableHead>
                  <TableHead className="w-28">Salary</TableHead>
                  <TableHead className="w-40">Application</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Link href={`/app/jobs/${job.id}`} className="font-medium hover:underline">
                        {job.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{job.location ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {job.remoteType === "UNKNOWN" ? "—" : REMOTE_TYPE_LABELS[job.remoteType]}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{job.salaryText ?? "—"}</TableCell>
                    <TableCell>
                      {job.application ? (
                        <Link href={`/app/applications/${job.application.id}`} className="hover:underline">
                          <StatusBadge status={job.application.status} />
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not tracked</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <JobRowActions
                        jobId={job.id}
                        jobTitle={job.title}
                        jobUrl={job.jobUrl}
                        applicationId={job.application?.id ?? null}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {applications.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Applications ({applications.length})</CardTitle>
            <CardDescription>Your processes at {company.name}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Job</TableHead>
                  <TableHead className="w-40">Status</TableHead>
                  <TableHead className="w-40">Next follow-up</TableHead>
                  <TableHead className="w-40">Interview</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map(({ job, application }) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <Link href={`/app/applications/${application.id}`} className="font-medium hover:underline">
                        {job.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={application.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {application.nextFollowUpAt ? formatDateTime(application.nextFollowUpAt) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {application.interviewAt ? formatDateTime(application.interviewAt) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function SignalGroup({
  label,
  values,
}: {
  label: string;
  values: string[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {values.length === 0 ? (
        <span className="text-xs text-muted-foreground/70">—</span>
      ) : (
        <div className="flex flex-wrap gap-1">
          {values.map((value) => (
            <Badge key={value} variant="outline" className="rounded font-normal">
              {value}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
