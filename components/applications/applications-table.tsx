"use client";

import Link from "next/link";
import { ExternalLink, MoreHorizontal } from "lucide-react";

import type { ApplicationListRow } from "@/lib/db/queries";
import { MarkFollowedUpButton } from "@/components/applications/mark-followed-up-button";
import { ScheduleDialog } from "@/components/applications/schedule-dialog";
import { StatusSelect } from "@/components/applications/status-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { REMOTE_TYPE_LABELS } from "@/lib/constants";
import { followUpState, interviewState } from "@/lib/application-state";
import { daysSince, formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ApplicationsTable({ rows }: { rows: ApplicationListRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="min-w-[12rem]">Company</TableHead>
            <TableHead className="min-w-[14rem]">Job</TableHead>
            <TableHead className="w-40">Status</TableHead>
            <TableHead className="w-24">Applied</TableHead>
            <TableHead className="w-28">Last activity</TableHead>
            <TableHead className="w-36">Next follow-up</TableHead>
            <TableHead className="w-36">Interview</TableHead>
            <TableHead className="w-28">Location</TableHead>
            <TableHead className="w-28 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const followUp = followUpState(row.nextFollowUpAt);
            const interview = interviewState(row.interviewAt);
            return (
              <TableRow key={row.id}>
                <TableCell className="max-w-[14rem]">
                  <Link
                    href={`/app/companies/${row.job.company.id}`}
                    className="block truncate font-medium hover:underline"
                  >
                    {row.job.company.name}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[18rem]">
                  <Link href={`/app/applications/${row.id}`} className="block truncate hover:underline">
                    {row.job.title}
                  </Link>
                  <span className="text-[11px] text-muted-foreground">
                    {row.job.remoteType === "UNKNOWN" ? "Remote unknown" : REMOTE_TYPE_LABELS[row.job.remoteType]}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusSelect applicationId={row.id} status={row.status} compact />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {row.appliedAt ? formatDate(row.appliedAt) : "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {daysSince(row.lastActivityAt) === 0 ? "today" : `${daysSince(row.lastActivityAt)}d ago`}
                </TableCell>
                <TableCell>
                  {row.nextFollowUpAt ? (
                    <div className="flex flex-col">
                      <span className="text-xs">{formatDateTime(row.nextFollowUpAt)}</span>
                      {followUp === "overdue" ? (
                        <Badge variant="outline" className="mt-0.5 w-fit rounded border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                          Overdue
                        </Badge>
                      ) : followUp === "today" ? (
                        <Badge variant="outline" className="mt-0.5 w-fit rounded border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                          Due today
                        </Badge>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/60">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {row.interviewAt ? (
                    <div className="flex flex-col">
                      <span className="text-xs">{formatDateTime(row.interviewAt)}</span>
                      {interview === "today" || interview === "soon" ? (
                        <Badge variant="outline" className="mt-0.5 w-fit rounded border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300">
                          {interview === "today" ? "Today" : "Upcoming"}
                        </Badge>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/60">—</span>
                  )}
                </TableCell>
                <TableCell className="max-w-[10rem]">
                  <span className="block truncate text-xs text-muted-foreground">{row.job.location ?? "—"}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <MarkFollowedUpButton applicationId={row.id} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <Link href={`/app/applications/${row.id}`}>Open application</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/app/companies/${row.job.company.id}`}>Open company</Link>
                        </DropdownMenuItem>
                        {row.job.jobUrl ? (
                          <DropdownMenuItem asChild>
                            <a href={row.job.jobUrl} target="_blank" rel="noreferrer noopener">
                              <ExternalLink />
                              Open job posting
                            </a>
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem asChild>
                          <ScheduleDialog
                            applicationId={row.id}
                            mode="followup"
                            currentValue={row.nextFollowUpAt}
                            trigger={
                              <span className={cn("flex w-full cursor-default items-center")}>
                                Schedule follow-up…
                              </span>
                            }
                          />
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <ScheduleDialog
                            applicationId={row.id}
                            mode="interview"
                            currentValue={row.interviewAt}
                            trigger={<span className="flex w-full cursor-default">Schedule interview…</span>}
                          />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
