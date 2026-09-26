"use client";

import { useState, useTransition } from "react";
import { CalendarClock, Loader2, Video } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { scheduleFollowUpAction, scheduleInterviewAction } from "@/lib/actions/applications";
import { toZonedDateTimeInput } from "@/lib/format";

/**
 * Schedules a follow-up or an interview. Times are entered in Europe/Istanbul
 * wall-clock time and stored as UTC.
 */
export function ScheduleDialog({
  applicationId,
  mode,
  currentValue,
  trigger,
  compact,
}: {
  applicationId: string;
  mode: "followup" | "interview";
  currentValue: Date | null;
  trigger?: React.ReactNode;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(
    toZonedDateTimeInput(currentValue ?? defaultFor(mode)),
  );
  const [note, setNote] = useState("");

  const isFollowUp = mode === "followup";
  const title = isFollowUp ? "Schedule follow-up" : "Schedule interview";

  const submit = () => {
    startTransition(async () => {
      const result = isFollowUp
        ? await scheduleFollowUpAction(applicationId, value, note || undefined)
        : await scheduleInterviewAction(applicationId, value, note || undefined);
      if (result.ok) {
        toast.success(isFollowUp ? "Follow-up scheduled" : "Interview scheduled");
        setOpen(false);
        setNote("");
      } else {
        toast.error(result.error ?? "Could not save");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size={compact ? "xs" : "sm"}>
            {isFollowUp ? <CalendarClock className="size-3.5" /> : <Video className="size-3.5" />}
            {isFollowUp ? "Schedule Follow-up" : "Schedule Interview"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Times are entered in Europe/Istanbul and stored in UTC.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="schedule-at">Date &amp; time</Label>
            <Input
              id="schedule-at"
              type="datetime-local"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="schedule-note">Note (optional)</Label>
            <Input
              id="schedule-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={isFollowUp ? "Email the recruiter" : "Google Meet link…"}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={pending}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function defaultFor(mode: "followup" | "interview"): Date {
  const now = new Date();
  const days = mode === "followup" ? 3 : 1;
  const date = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  return date;
}
