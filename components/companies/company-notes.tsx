"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateCompanyNotesAction } from "@/lib/actions/companies";

export function CompanyNotes({
  companyId,
  notes,
}: {
  companyId: string;
  notes: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(notes ?? "");
  const [pending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const result = await updateCompanyNotesAction(companyId, value);
      if (result.ok) {
        toast.success("Notes saved");
        setEditing(false);
      } else {
        toast.error("Could not save notes");
      }
    });
  };

  if (!editing) {
    return (
      <div className="flex flex-col gap-2">
        {notes ? (
          <p className="whitespace-pre-wrap text-[13px] text-foreground/90">{notes}</p>
        ) : (
          <p className="text-xs text-muted-foreground">No notes yet.</p>
        )}
        <div>
          <Button variant="outline" size="xs" onClick={() => setEditing(true)}>
            <Pencil className="size-3" />
            {notes ? "Edit notes" : "Add notes"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Textarea value={value} onChange={(event) => setValue(event.target.value)} rows={6} autoFocus />
      <div className="flex items-center gap-2">
        <Button size="xs" onClick={save} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Check />}
          Save notes
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => {
            setValue(notes ?? "");
            setEditing(false);
          }}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
