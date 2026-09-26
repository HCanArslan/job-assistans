"use client";

import { useActionState, useState } from "react";
import { Loader2, Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addEventAction, type ApplicationFormState } from "@/lib/actions/applications";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import { toZonedDateTimeInput } from "@/lib/format";

export function AddEventDialog({ applicationId }: { applicationId: string }) {
  const [open, setOpen] = useState(false);
  const [, formAction, pending] = useActionState<ApplicationFormState | null, FormData>(
    async (previous, formData) => {
      const result = await addEventAction(previous, formData);
      if (result.ok) {
        toast.success("Activity added");
        setOpen(false);
      } else {
        toast.error(result.error ?? "Could not add the activity");
      }
      return result;
    },
    null,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="size-3.5" />
          Add Activity
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form action={formAction} className="flex flex-col gap-3">
          <DialogHeader>
            <DialogTitle>Add activity</DialogTitle>
            <DialogDescription>Logged on the application timeline.</DialogDescription>
          </DialogHeader>

          <input type="hidden" name="applicationId" value={applicationId} />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-type">Type</Label>
              <Select name="type" defaultValue="NOTE">
                <SelectTrigger id="event-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-at">When</Label>
              <Input id="event-at" type="datetime-local" name="eventAt" defaultValue={toZonedDateTimeInput(new Date())} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-title">Title</Label>
            <Input id="event-title" name="title" placeholder="Recruiter called about salary" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-notes">Notes</Label>
            <Textarea id="event-notes" name="notes" rows={3} placeholder="What was said, next steps…" />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Add activity
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
