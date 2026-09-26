import Link from "next/link";
import { Building2, Download, Plus } from "lucide-react";

import { CompanyFilters } from "@/components/companies/company-filters";
import { CompanyTable } from "@/components/companies/company-table";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getCompanyFacets, listCompanies, parseCompanyFilters } from "@/lib/db/queries";

export const metadata = { title: "Companies · Job Assist" };

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters = parseCompanyFilters(params);

  const [result, facets] = await Promise.all([listCompanies(filters), getCompanyFacets()]);

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) for (const item of value) search.append(key, item);
    else if (value !== undefined) search.set(key, value);
  }
  search.delete("page");

  return (
    <div className="flex flex-col gap-2">
      <CompanyFilters facets={facets} total={result.total} />

      {result.rows.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies match these filters"
          description="Adjust the filters, or import the StillHiring list / add a company manually."
          action={
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/app/import">
                  <Download className="size-3.5" />
                  Import page
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/app/companies/new">
                  <Plus className="size-3.5" />
                  Add company
                </Link>
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <CompanyTable rows={result.rows} />
          <Pagination
            basePath="/app/companies"
            params={search}
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            label="companies"
          />
        </>
      )}
    </div>
  );
}
