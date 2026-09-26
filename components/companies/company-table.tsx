import Link from "next/link";
import { Star } from "lucide-react";

import { CompanyRowActions } from "@/components/companies/company-row-actions";
import { MyStatusBadge } from "@/components/status-badge";
import { SignalBadges } from "@/components/signal-badges";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { REMOTE_HIRING_LABELS } from "@/lib/constants";
import type { CompanyListRow } from "@/lib/db/queries";
import { cn, truncate } from "@/lib/utils";

function employeeLabel(row: CompanyListRow): string {
  if (row.employeesText && row.employeesText !== String(row.employees)) return row.employeesText;
  if (row.employees !== null) return row.employees.toLocaleString("en-GB");
  return "—";
}

function locationLabel(row: CompanyListRow): string {
  const parts = [row.hqCity, row.hqState, row.hqCountry].filter(Boolean);
  if (parts.length === 0) return "—";
  return parts.join(", ");
}

export function CompanyTable({ rows }: { rows: CompanyListRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="min-w-[18rem]">Company</TableHead>
            <TableHead className="w-20">Employees</TableHead>
            <TableHead className="w-40">HQ</TableHead>
            <TableHead className="w-20">Remote</TableHead>
            <TableHead className="w-40">Hiring areas</TableHead>
            <TableHead className="w-48">Engineering / Product</TableHead>
            <TableHead className="w-40">Growth</TableHead>
            <TableHead className="w-36">Funding</TableHead>
            <TableHead className="w-24">My status</TableHead>
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} className={cn(row.ignored && "opacity-55")}>
              <TableCell className="max-w-[24rem]">
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/app/companies/${row.id}`}
                    className="truncate font-medium hover:underline"
                    title={row.name}
                  >
                    {row.name}
                  </Link>
                  {row.favorite ? <Star className="size-3 shrink-0 text-amber-500" /> : null}
                  {row.ignored ? (
                    <Badge variant="muted" className="rounded">
                      Ignored
                    </Badge>
                  ) : null}
                  {row._count.jobs > 0 ? (
                    <Badge variant="outline" className="rounded font-normal text-muted-foreground">
                      {row._count.jobs} job{row._count.jobs === 1 ? "" : "s"}
                    </Badge>
                  ) : null}
                </div>
                {row.tagline ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="max-w-[22rem] truncate text-xs text-muted-foreground">{row.tagline}</p>
                    </TooltipTrigger>
                    <TooltipContent>{truncate(row.tagline, 280)}</TooltipContent>
                  </Tooltip>
                ) : null}
              </TableCell>
              <TableCell className="text-xs tabular-nums text-muted-foreground">{employeeLabel(row)}</TableCell>
              <TableCell className="text-xs text-muted-foreground" title={locationLabel(row)}>
                <span className="block max-w-[10rem] truncate">{locationLabel(row)}</span>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded font-normal",
                    row.remoteHiring === "YES" &&
                      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
                    row.remoteHiring === "NO" && "text-muted-foreground",
                  )}
                >
                  {row.remoteHiring === "UNKNOWN" ? "—" : REMOTE_HIRING_LABELS[row.remoteHiring]}
                </Badge>
              </TableCell>
              <TableCell>
                <SignalBadges values={row.hiringFunctions} max={2} tone="default" />
              </TableCell>
              <TableCell>
                <SignalBadges values={row.engineeringRoles} max={2} tone="default" />
              </TableCell>
              <TableCell>
                <SignalBadges values={row.growthSignals} max={1} />
              </TableCell>
              <TableCell>
                <SignalBadges values={row.fundingSignals} max={1} tone="default" />
              </TableCell>
              <TableCell>
                {row.applicationCount > 0 ? (
                  <Link href={`/app/applications?company=${row.id}`} className="hover:underline">
                    <MyStatusBadge status={row.myStatus} />
                  </Link>
                ) : (
                  <MyStatusBadge status={row.myStatus} />
                )}
              </TableCell>
              <TableCell>
                <CompanyRowActions
                  companyId={row.id}
                  companyName={row.name}
                  jobsUrl={row.jobsUrl}
                  favorite={row.favorite}
                  ignored={row.ignored}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
