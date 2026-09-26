"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteCompanyAction } from "@/lib/actions/companies";

export function CompanyDeleteButton({
  companyId,
  companyName,
  jobs,
  applications,
  events,
  applicationTitles,
}: {
  companyId: string;
  companyName: string;
  jobs: number;
  applications: number;
  events: number;
  applicationTitles: string[];
}) {
  const router = useRouter();

  return (
    <ConfirmDialog
      title={`Delete ${companyName}?`}
      description={
        <span>
          This permanently removes the company and everything attached to it.
        </span>
      }
      warning={
        jobs > 0 || applications > 0 ? (
          <div className="flex flex-col gap-1">
            <span className="font-medium">This will delete:</span>
            <span>
              {jobs} job{jobs === 1 ? "" : "s"}
              {applications > 0 ? `, ${applications} application${applications === 1 ? "" : "s"}` : ""}
              {events > 0 ? ` and ${events} timeline event${events === 1 ? "" : "s"}` : ""}.
            </span>
            {applicationTitles.length > 0 ? (
              <span className="text-destructive/80">Includes: {applicationTitles.join(", ")}</span>
            ) : null}
          </div>
        ) : (
          <span>This company has no jobs or applications.</span>
        )
      }
      confirmLabel="Delete company"
      successMessage="Company deleted"
      onConfirm={() => deleteCompanyAction(companyId)}
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
