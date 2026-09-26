"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ChevronDown, Loader2, PlayCircle } from "lucide-react";
import { toast } from "sonner";

import type { ApplicationStatus } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { startApplicationAction } from "@/lib/actions/jobs";

const OPTIONS: { status: ApplicationStatus; label: string }[] = [
  { status: "INTERESTED", label: "Interested" },
  { status: "TO_APPLY", label: "To Apply" },
  { status: "APPLIED", label: "Applied (now)" },
];

export function StartApplicationButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const start = (status: ApplicationStatus) => {
    startTransition(async () => {
      const result = await startApplicationAction(jobId, status);
      if (result.ok && result.applicationId) {
        toast.success("Application started");
        router.push(`/app/applications/${result.applicationId}`);
      } else {
        toast.error(result.error ?? "Could not start the application");
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <PlayCircle />}
          Start Application
          <ChevronDown className="size-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {OPTIONS.map((option) => (
          <DropdownMenuItem key={option.status} onSelect={() => start(option.status)}>
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
