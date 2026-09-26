/**
 * Follow-up / interview state helpers. Kept in a plain module so both server
 * components and client components can use identical rules.
 */
import { isSameZonedDay } from "@/lib/format";

export type FollowUpState = "none" | "overdue" | "today" | "future";
export type InterviewState = "none" | "past" | "today" | "soon" | "future";

export function followUpState(date: Date | null, now: Date = new Date()): FollowUpState {
  if (!date) return "none";
  if (isSameZonedDay(date, now)) return "today";
  return date.getTime() < now.getTime() ? "overdue" : "future";
}

const SOON_DAYS = 7;

export function interviewState(date: Date | null, now: Date = new Date()): InterviewState {
  if (!date) return "none";
  if (isSameZonedDay(date, now)) return "today";
  if (date.getTime() < now.getTime()) return "past";
  const days = Math.ceil((date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  return days <= SOON_DAYS ? "soon" : "future";
}

export function isInterviewSoon(date: Date | null, now: Date = new Date(), withinDays = SOON_DAYS): boolean {
  if (!date) return false;
  return date.getTime() >= now.getTime() && date.getTime() <= now.getTime() + withinDays * 24 * 60 * 60 * 1000;
}

export function isFollowUpOverdue(date: Date | null, now: Date = new Date()): boolean {
  return followUpState(date, now) === "overdue";
}
