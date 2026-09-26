"use client";

import { useSyncExternalStore } from "react";
import { KanbanSquare, List } from "lucide-react";

import type { ApplicationListRow } from "@/lib/db/queries";
import { ApplicationsTable } from "@/components/applications/applications-table";
import { KanbanBoard, type BoardGroup } from "@/components/applications/kanban-board";
import { Button } from "@/components/ui/button";

type ApplicationsViewMode = "table" | "board";

const STORAGE_KEY = "job-assist-applications-view";

/**
 * Tiny external store around localStorage so the preferred view survives
 * reloads without a state-setting effect, and without a hydration mismatch:
 * the server snapshot is `null` and falls back to the server-rendered view.
 */
let listeners: Array<() => void> = [];
let cached: ApplicationsViewMode | null = null;

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((entry) => entry !== listener);
  };
}

function getSnapshot(): ApplicationsViewMode {
  if (cached === null) {
    try {
      cached = localStorage.getItem(STORAGE_KEY) === "board" ? "board" : "table";
    } catch {
      cached = "table";
    }
  }
  return cached;
}

const getServerSnapshot = (): ApplicationsViewMode | null => null;

function setStoredView(next: ApplicationsViewMode) {
  cached = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore storage failures
  }
  for (const listener of listeners) listener();
}

export function ApplicationsView({
  tableRows,
  groups,
  initialView,
}: {
  tableRows: ApplicationListRow[];
  groups: BoardGroup[];
  initialView: ApplicationsViewMode;
}) {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const view = stored ?? initialView;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end gap-1">
        <Button
          variant={view === "table" ? "secondary" : "ghost"}
          size="xs"
          onClick={() => setStoredView("table")}
        >
          <List className="size-3.5" />
          Table
        </Button>
        <Button
          variant={view === "board" ? "secondary" : "ghost"}
          size="xs"
          onClick={() => setStoredView("board")}
        >
          <KanbanSquare className="size-3.5" />
          Kanban
        </Button>
      </div>

      {view === "table" ? <ApplicationsTable rows={tableRows} /> : <KanbanBoard groups={groups} />}
    </div>
  );
}
