import { JobForm } from "@/components/jobs/job-form";
import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Add job · Job Assist" };

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>;
}) {
  const params = await searchParams;
  const initialCompany = params.company
    ? await prisma.company.findUnique({
        where: { id: params.company },
        select: { id: true, name: true, source: true, ignored: true },
      })
    : null;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold">Add a job</h2>
        <p className="text-xs text-muted-foreground">
          Pick the company (or create it inline), then save. Marking it To Apply or Applied starts the
          application timeline for you.
        </p>
      </div>
      <JobForm initialCompany={initialCompany} />
    </div>
  );
}
