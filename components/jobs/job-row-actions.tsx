"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ExternalLink, MoreHorizontal, PlayCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteJobAction, getJobDeleteImpactAction, startApplicationAction } from "@/lib/actions/jobs";

export function JobRowActions({
  jobId,
  jobTitle,
  jobUrl,
  applicationId,
}: {
  jobId: string;
  jobTitle: string;
  jobUrl: string | null;
  applicationId: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [impact, setImpact] = useState<{ hasApplication: boolean; events: number } | null>(null);

  const startApplication = () => {
    startTransition(async () => {
      const result = await startApplicationAction(jobId, "TO_APPLY");
      if (result.ok) toast.success("Application started");
      else toast.error(result.error ?? "Could not start application");
    });
  };

  return (
    <div className="flex items-center justify-end gap-0.5">
      {jobUrl ? (
        <Button asChild variant="ghost" size="icon-sm" title="Open job posting">
          <a href={jobUrl} target="_blank" rel="noreferrer noopener">
            <ExternalLink className="size-3.5" />
          </a>
        </Button>
      ) : null}
      {applicationId ? (
        <Button asChild variant="ghost" size="xs" title="Open application">
          <Link href={`/app/applications/${applicationId}`}>Application</Link>
        </Button>
      ) : (
        <Button variant="ghost" size="xs" onClick={startApplication} disabled={pending} title="Start application">
          <PlayCircle className="size-3.5" />
          Track
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" title="Actions">
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-44"
          onFocusCapture={async () => {
            if (!impact) {
              const result = await getJobDeleteImpactAction(jobId);
              if (result) setImpact({ hasApplication: result.hasApplication, events: result.events });
            }
          }}
        >
          <DropdownMenuItem asChild>
            <Link href={`/app/jobs/${jobId}`}>View job</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/app/jobs/${jobId}/edit`}>Edit job</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <ConfirmDialog
            title={`Delete "${jobTitle}"?`}
            description="This removes the job from your workspace."
            warning={
              impact?.hasApplication
                ? `Its application and ${impact.events} timeline event${impact.events === 1 ? "" : "s"} will also be deleted.`
                : "This job has no application yet."
            }
            confirmLabel="Delete job"
            successMessage="Job deleted"
            onConfirm={() => deleteJobAction(jobId)}
            trigger={
              <DropdownMenuItem variant="destructive" onSelect={(event) => event.preventDefault()}>
                <Trash2 />
                Delete
              </DropdownMenuItem>
            }
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
