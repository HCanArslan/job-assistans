"use client";

import { useTransition } from "react";
import { Ban, Star, StarOff, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { toggleFavoriteAction, toggleIgnoredAction } from "@/lib/actions/companies";

export function CompanyFavoriteToggle({
  companyId,
  favorite,
  ignored,
}: {
  companyId: string;
  favorite: boolean;
  ignored: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await toggleFavoriteAction(companyId, !favorite);
            toast.success(favorite ? "Removed from favorites" : "Added to favorites");
          })
        }
      >
        {favorite ? <Star className="size-3.5 text-amber-500" /> : <StarOff className="size-3.5" />}
        {favorite ? "Favorited" : "Favorite"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await toggleIgnoredAction(companyId, !ignored);
            toast.success(ignored ? "Company restored" : "Company ignored");
          })
        }
      >
        {ignored ? <Undo2 className="size-3.5" /> : <Ban className="size-3.5" />}
        {ignored ? "Unignore" : "Ignore"}
      </Button>
    </div>
  );
}
