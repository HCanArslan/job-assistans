"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteApplicationAction } from "@/lib/actions/applications";

export function ApplicationDeleteButton({
  applicationId,
  jobTitle,
  events,
}: {
  applicationId: string;
  jobTitle: string;
  events: number;
}) {
  const router = useRouter();

  return (
    <ConfirmDialog
      title={`Delete the application for "${jobTitle}"?`}
      description="The application and its timeline are permanently removed. The job itself stays in your workspace."
      warning={
        events > 0
          ? `${events} timeline event${events === 1 ? "" : "s"} will be deleted. Prefer marking it Rejected / Withdrawn / Ghosted to keep the history.`
          : "This application has no timeline events yet."
      }
      confirmLabel="Delete application"
      successMessage="Application deleted"
      onConfirm={() => deleteApplicationAction(applicationId)}
      onDone={() => router.push("/app/applications")}
      trigger={
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="size-3.5" />
          Delete
        </Button>
      }
    />
  );
}
