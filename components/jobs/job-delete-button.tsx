"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteJobAction } from "@/lib/actions/jobs";

export function JobDeleteButton({
  jobId,
  jobTitle,
  hasApplication,
  events,
}: {
  jobId: string;
  jobTitle: string;
  hasApplication: boolean;
  events: number;
}) {
  const router = useRouter();

  return (
    <ConfirmDialog
      title={`Delete "${jobTitle}"?`}
      description="The job is removed from your workspace."
      warning={
        hasApplication
          ? `The linked application and its ${events} timeline event${events === 1 ? "" : "s"} will be deleted as well. Mark it with a final status instead if you want to keep the history.`
          : "This job has no application yet."
      }
      confirmLabel="Delete job"
      successMessage="Job deleted"
      onConfirm={() => deleteJobAction(jobId)}
      onDone={() => router.push("/app/companies")}
      trigger={
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="size-3.5" />
          Delete
        </Button>
      }
    />
  );
}
