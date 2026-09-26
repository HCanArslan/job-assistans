import type { ApplicationEventType, ApplicationStatus } from "@/generated/prisma/client";

import { STATUS_LABELS } from "@/lib/constants";

/** Event type produced when an application moves into a given status. */
const STATUS_EVENT_TYPE: Partial<Record<ApplicationStatus, ApplicationEventType>> = {
  APPLIED: "APPLIED",
  HR_INTERVIEW: "HR_INTERVIEW",
  TECHNICAL_INTERVIEW: "TECHNICAL_INTERVIEW",
  TAKE_HOME: "TAKE_HOME_RECEIVED",
  LIVE_CODING: "LIVE_CODING",
  HIRING_MANAGER: "HIRING_MANAGER",
  FINAL_INTERVIEW: "FINAL_INTERVIEW",
  OFFER: "OFFER",
  REJECTED: "REJECTION",
};

export interface StatusEventDraft {
  type: ApplicationEventType;
  title: string;
  notes: string | null;
  eventAt: Date;
}

/** Builds the timeline event that is written whenever the status changes. */
export function eventForStatusChange(
  from: ApplicationStatus | null,
  to: ApplicationStatus,
  note: string | null,
  at: Date = new Date(),
): StatusEventDraft {
  const mapped = STATUS_EVENT_TYPE[to];
  const title = from
    ? `Status changed: ${STATUS_LABELS[from]} → ${STATUS_LABELS[to]}`
    : `Status set to ${STATUS_LABELS[to]}`;
  return {
    type: mapped ?? "STATUS_CHANGE",
    title,
    notes: note && note.trim() ? note.trim() : null,
    eventAt: at,
  };
}
