"use client";

import { useTransition } from "react";
import { CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { markFollowedUpAction } from "@/lib/actions/applications";

export function MarkFollowedUpButton({
  applicationId,
  size = "xs",
}: {
  applicationId: string;
  size?: "xs" | "sm";
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size={size}
      disabled={pending}
      title="Log a follow-up and clear the reminder"
      onClick={() =>
        startTransition(async () => {
          const result = await markFollowedUpAction(applicationId);
          if (result.ok) toast.success("Follow-up logged");
          else toast.error(result.error ?? "Could not log the follow-up");
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <CheckCheck className="size-3.5" />}
      Mark Followed Up
    </Button>
  );
}
