import { CheckCircle2, Download, Info, Terminal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getImportStats } from "@/lib/db/queries";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Import · Job Assist" };

export default async function ImportPage() {
  const stats = await getImportStats();

  return (
    <div className="flex max-w-3xl flex-col gap-3">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>StillHiring.today</CardTitle>
            <CardDescription>Public company hiring-signal list (Airtable shared view)</CardDescription>
          </div>
          <Badge variant="outline" className="rounded">
            <CheckCircle2 className="size-3 text-emerald-600" />
            {stats.importedCount > 0 ? "Imported" : "Not imported yet"}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Stat label="Imported companies" value={stats.importedCount.toLocaleString("en-GB")} />
          <Stat label="Manual companies" value={stats.manualCount.toLocaleString("en-GB")} />
          <Stat
            label="Last sync"
            value={stats.lastSyncAt ? formatDateTime(stats.lastSyncAt) : "never"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sync from the command line</CardTitle>
          <CardDescription>
            The importer drives a headless browser locally, so it runs on your machine - not on Vercel.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="rounded-md border border-border bg-muted/50 p-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Terminal className="size-3.5" />
              Run locally (once, if browser is missing):
            </div>
            <div className="mt-1">npx playwright install chromium</div>
            <div className="mt-3 flex items-center gap-2 text-muted-foreground">
              <Terminal className="size-3.5" />
              Then, as often as you like:
            </div>
            <div className="mt-1">npm run stillhiring:sync</div>
          </div>

          <div className="flex items-start gap-2 rounded-md border border-border bg-card p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <div className="flex flex-col gap-1">
              <span>
                The sync captures the public <code>readSharedViewData</code> response (no Airtable account, no API
                key), normalizes every row and upserts companies by their Airtable record id.
              </span>
              <span>
                It only updates StillHiring-owned fields. Your notes, favorites, ignored flags, jobs, applications,
                interview history and follow-ups are never modified.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button size="sm" disabled>
                      <Download className="size-3.5" />
                      Sync now
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Server-side Chromium is intentionally not deployed. Run <code>npm run stillhiring:sync</code>{" "}
                  locally instead.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-xs text-muted-foreground">
              CLI-based in v1: no browser runs inside the deployed app.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-medium tabular-nums">{value}</div>
    </div>
  );
}
