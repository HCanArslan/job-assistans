import { notFound } from "next/navigation";

import { JobForm } from "@/components/jobs/job-form";
import { getJobById } from "@/lib/db/queries";

export const metadata = { title: "Edit job · Job Assist" };

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold">Edit job</h2>
        <p className="text-xs text-muted-foreground">{job.company.name}</p>
      </div>
      <JobForm
        job={{
          id: job.id,
          companyId: job.companyId,
          title: job.title,
          jobUrl: job.jobUrl,
          location: job.location,
          remoteType: job.remoteType,
          salaryText: job.salaryText,
          notes: job.notes,
        }}
        initialCompany={{ id: job.company.id, name: job.company.name, source: "MANUAL" }}
      />
    </div>
  );
}
