import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function buildHref(basePath: string, params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params);
  if (page <= 1) next.delete("page");
  else next.set("page", String(page));
  const qs = next.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({
  basePath,
  params,
  page,
  pageCount,
  total,
  label,
  className,
}: {
  basePath: string;
  params: URLSearchParams;
  page: number;
  pageCount: number;
  total: number;
  label: string;
  className?: string;
}) {
  if (pageCount <= 1) {
    return (
      <div className={cn("flex items-center justify-between px-1 py-2 text-xs text-muted-foreground", className)}>
        <span>{total.toLocaleString("en-GB")} {label}</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-between gap-3 px-1 py-2 text-xs text-muted-foreground", className)}>
      <span>
        {total.toLocaleString("en-GB")} {label} · page {page} of {pageCount}
      </span>
      <div className="flex items-center gap-1.5">
        <Button asChild={page > 1} variant="outline" size="xs" disabled={page <= 1}>
          {page > 1 ? (
            <Link href={buildHref(basePath, params, page - 1)} prefetch={false}>
              <ChevronLeft className="size-3.5" />
              Previous
            </Link>
          ) : (
            <span>
              <ChevronLeft className="size-3.5" />
              Previous
            </span>
          )}
        </Button>
        <Button asChild={page < pageCount} variant="outline" size="xs" disabled={page >= pageCount}>
          {page < pageCount ? (
            <Link href={buildHref(basePath, params, page + 1)} prefetch={false}>
              Next
              <ChevronRight className="size-3.5" />
            </Link>
          ) : (
            <span>
              Next
              <ChevronRight className="size-3.5" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
