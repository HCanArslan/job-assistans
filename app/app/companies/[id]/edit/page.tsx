import { notFound } from "next/navigation";

import { CompanyForm } from "@/components/companies/company-form";
import { getCompanyById } from "@/lib/db/queries";

export const metadata = { title: "Edit company · Job Assist" };

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await getCompanyById(id);
  if (!company) notFound();

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold">Edit {company.name}</h2>
        <p className="text-xs text-muted-foreground">
          {company.source === "STILL_HIRING"
            ? "Imported fields are refreshed by the StillHiring sync; notes, favorite and ignored are yours to keep."
            : "Manual company"}
        </p>
      </div>
      <CompanyForm
        company={{
          id: company.id,
          name: company.name,
          websiteUrl: company.websiteUrl,
          jobsUrl: company.jobsUrl,
          linkedinUrl: company.linkedinUrl,
          employees: company.employees,
          hqCountry: company.hqCountry,
          hqState: company.hqState,
          hqCity: company.hqCity,
          remoteHiring: company.remoteHiring,
          tagline: company.tagline,
          notes: company.notes,
        }}
      />
    </div>
  );
}
