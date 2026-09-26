import { ClipboardList } from "lucide-react";

import { ApplicationFilters } from "@/components/applications/application-filters";
import { ApplicationsView } from "@/components/applications/applications-view";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { listApplications, listApplicationsForBoard, parseApplicationFilters } from "@/lib/db/queries";
import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Applications · Job Assist" };

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters = parseApplicationFilters(params);

  const [table, board, companies] = await Promise.all([
    listApplications(filters),
    listApplicationsForBoard(filters),
    prisma.company.findMany({
      where: { jobs: { some: { application: { isNot: null } } } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const viewParam = Array.isArray(params.view) ? params.view[0] : params.view;
  const initialView = viewParam === "board" ? "board" : "table";

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) for (const item of value) search.append(key, item);
    else if (value !== undefined) search.set(key, value);
  }
  search.delete("page");

  return (
    <div className="flex flex-col gap-2">
      <ApplicationFilters companies={companies} total={table.total} />

      {table.rows.length === 0 && board.total === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No applications match these filters"
          description="Add a job and mark it as To Apply or Applied to start tracking a process."
        />
      ) : (
        <>
          <ApplicationsView tableRows={table.rows} groups={board.groups} initialView={initialView} />
          <Pagination
            basePath="/app/applications"
            params={search}
            page={table.page}
            pageCount={table.pageCount}
            total={table.total}
            label="applications"
          />
        </>
      )}
    </div>
  );
}
