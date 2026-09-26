"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Building2, Eye, ExternalLink, MoreHorizontal, Plus, Star, StarOff, Ban, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toggleFavoriteAction, toggleIgnoredAction } from "@/lib/actions/companies";

export function CompanyRowActions({
  companyId,
  companyName,
  jobsUrl,
  favorite,
  ignored,
}: {
  companyId: string;
  companyName: string;
  jobsUrl: string | null;
  favorite: boolean;
  ignored: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const toggleFavorite = () => {
    startTransition(async () => {
      await toggleFavoriteAction(companyId, !favorite);
      toast.success(favorite ? "Removed from favorites" : "Added to favorites");
    });
  };

  const toggleIgnored = () => {
    startTransition(async () => {
      await toggleIgnoredAction(companyId, !ignored);
      toast.success(ignored ? `${companyName} restored` : `${companyName} ignored`);
    });
  };

  return (
    <div className="flex items-center justify-end gap-0.5">
      {jobsUrl ? (
        <Button asChild variant="ghost" size="icon-sm" title="Open careers page">
          <a href={jobsUrl} target="_blank" rel="noreferrer noopener">
            <ExternalLink className="size-3.5" />
          </a>
        </Button>
      ) : null}
      <Button
        variant="ghost"
        size="icon-sm"
        title={favorite ? "Remove favorite" : "Favorite"}
        onClick={toggleFavorite}
        disabled={pending}
      >
        {favorite ? <Star className="size-3.5 text-amber-500" /> : <StarOff className="size-3.5 opacity-60" />}
      </Button>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" title="Actions">
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem asChild>
            <Link href={`/app/companies/${companyId}`}>
              <Eye />
              View
            </Link>
          </DropdownMenuItem>
          {jobsUrl ? (
            <DropdownMenuItem asChild>
              <a href={jobsUrl} target="_blank" rel="noreferrer noopener">
                <ExternalLink />
                Open Jobs
              </a>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild>
            <Link href={`/app/jobs/new?company=${companyId}`}>
              <Plus />
              Add Job
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/app/companies/${companyId}/edit`}>
              <Building2 />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(event) => { event.preventDefault(); toggleFavorite(); }}>
            {favorite ? <StarOff /> : <Star />}
            {favorite ? "Unfavorite" : "Favorite"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(event) => { event.preventDefault(); toggleIgnored(); }}>
            {ignored ? <Undo2 /> : <Ban />}
            {ignored ? "Unignore" : "Ignore"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
