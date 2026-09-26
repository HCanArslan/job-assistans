import { CompanyForm } from "@/components/companies/company-form";

export const metadata = { title: "New company · Job Assist" };

export default function NewCompanyPage() {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold">Add a company manually</h2>
        <p className="text-xs text-muted-foreground">
          For companies that are not in the StillHiring list. Imported companies can be edited the same way -
          the sync never overwrites your notes.
        </p>
      </div>
      <CompanyForm />
    </div>
  );
}
