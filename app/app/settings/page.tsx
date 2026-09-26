import { Database, HardDrive, Timer, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_VERSION } from "@/lib/constants";
import { requireAuth } from "@/lib/auth/guard";
import { getImportStats } from "@/lib/db/queries";
import { prisma } from "@/lib/db/prisma";
import { APP_TIME_ZONE, formatDateTime } from "@/lib/format";

export const metadata = { title: "Settings · Job Assist" };

async function databaseStatus(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - start };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}

export default async function SettingsPage() {
  const session = await requireAuth();
  const [status, stats, companyCount, applicationCount, eventCount] = await Promise.all([
    databaseStatus(),
    getImportStats(),
    prisma.company.count(),
    prisma.application.count(),
    prisma.applicationEvent.count(),
  ]);

  return (
    <div className="flex max-w-3xl flex-col gap-3">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Single-user workspace configured through environment variables</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Row icon={User} label="Admin email" value={session.sub} />
          <Row icon={Timer} label="Display timezone" value={APP_TIME_ZONE} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Database</CardTitle>
          <CardDescription>PostgreSQL via Prisma (Neon in production)</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Status</span>
            <span className="flex items-center gap-2 text-[13px]">
              <Database className="size-3.5 text-muted-foreground" />
              {status.ok ? (
                <>
                  Connected
                  <Badge variant="outline" className="rounded text-emerald-700 dark:text-emerald-300">
                    {status.latencyMs} ms
                  </Badge>
                </>
              ) : (
                <Badge variant="outline" className="rounded border-destructive/40 text-destructive">
                  Unavailable
                </Badge>
              )}
            </span>
            {status.error ? <span className="text-xs text-destructive">{status.error}</span> : null}
          </div>
          <Row
            icon={HardDrive}
            label="Records"
            value={`${companyCount.toLocaleString("en-GB")} companies · ${applicationCount.toLocaleString("en-GB")} applications · ${eventCount.toLocaleString("en-GB")} events`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>StillHiring</CardTitle>
          <CardDescription>Company list imported from the public shared view</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Row label="Imported companies" value={stats.importedCount.toLocaleString("en-GB")} />
          <Row label="Manual companies" value={stats.manualCount.toLocaleString("en-GB")} />
          <Row
            label="Last imported"
            value={stats.lastSyncAt ? formatDateTime(stats.lastSyncAt) : "never"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Application</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Row label="Version" value={APP_VERSION} />
          <Row label="Runtime" value={`Node ${process.version}`} />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 text-[13px]">
        {Icon ? <Icon className="size-3.5 text-muted-foreground" /> : null}
        <span className="truncate" title={value}>
          {value}
        </span>
      </span>
    </div>
  );
}
