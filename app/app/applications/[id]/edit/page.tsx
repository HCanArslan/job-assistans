import { notFound } from "next/navigation";

import { ApplicationEditForm } from "@/components/applications/application-edit-form";
import { getApplicationById } from "@/lib/db/queries";

export const metadata = { title: "Edit application · Job Assist" };

export default async function EditApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = await getApplicationById(id);
  if (!application) notFound();

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold">Edit application</h2>
        <p className="text-xs text-muted-foreground">
          {application.job.title} · {application.job.company.name}
        </p>
      </div>
      <ApplicationEditForm
        application={{
          id: application.id,
          appliedAt: application.appliedAt,
          nextFollowUpAt: application.nextFollowUpAt,
          interviewAt: application.interviewAt,
          salaryExpectation: application.salaryExpectation,
          recruiterName: application.recruiterName,
          recruiterEmail: application.recruiterEmail,
          referralName: application.referralName,
          rejectionReason: application.rejectionReason,
          notes: application.notes,
        }}
      />
    </div>
  );
}
