import type {
  ApplicationEventType,
  ApplicationStatus,
  RemoteHiring,
  RemoteType,
} from "@/generated/prisma/enums";

export const APPLICATION_STATUSES = [
  "INTERESTED",
  "TO_APPLY",
  "APPLIED",
  "WAITING_REPLY",
  "RECRUITER_SCREEN",
  "HR_INTERVIEW",
  "TECHNICAL_INTERVIEW",
  "TAKE_HOME",
  "LIVE_CODING",
  "HIRING_MANAGER",
  "FINAL_INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
  "GHOSTED",
] as const satisfies readonly ApplicationStatus[];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  INTERESTED: "Interested",
  TO_APPLY: "To Apply",
  APPLIED: "Applied",
  WAITING_REPLY: "Waiting Reply",
  RECRUITER_SCREEN: "Recruiter Screen",
  HR_INTERVIEW: "HR Interview",
  TECHNICAL_INTERVIEW: "Technical Interview",
  TAKE_HOME: "Take Home",
  LIVE_CODING: "Live Coding",
  HIRING_MANAGER: "Hiring Manager",
  FINAL_INTERVIEW: "Final Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  GHOSTED: "Ghosted",
};

/** Tailwind classes per status - muted, readable, consistent (see spec 52). */
export const STATUS_CLASSES: Record<ApplicationStatus, string> = {
  INTERESTED: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-300 dark:border-zinc-700",
  TO_APPLY: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900",
  APPLIED: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-900",
  WAITING_REPLY: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900",
  RECRUITER_SCREEN: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900",
  HR_INTERVIEW: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900",
  TECHNICAL_INTERVIEW: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900",
  TAKE_HOME: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900",
  LIVE_CODING: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900",
  HIRING_MANAGER: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900",
  FINAL_INTERVIEW: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-900",
  OFFER: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900",
  REJECTED: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900",
  WITHDRAWN: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700",
  GHOSTED: "bg-zinc-200/70 text-zinc-600 border-zinc-300 dark:bg-zinc-800/80 dark:text-zinc-500 dark:border-zinc-700",
};

export const ACTIVE_STATUSES: ApplicationStatus[] = [
  "INTERESTED",
  "TO_APPLY",
  "APPLIED",
  "WAITING_REPLY",
  "RECRUITER_SCREEN",
  "HR_INTERVIEW",
  "TECHNICAL_INTERVIEW",
  "TAKE_HOME",
  "LIVE_CODING",
  "HIRING_MANAGER",
  "FINAL_INTERVIEW",
];

export interface KanbanGroup {
  id: string;
  label: string;
  statuses: ApplicationStatus[];
}

/** Grouped pipeline stages (spec 28). */
export const KANBAN_GROUPS: KanbanGroup[] = [
  { id: "interested", label: "Interested", statuses: ["INTERESTED"] },
  { id: "to_apply", label: "To Apply", statuses: ["TO_APPLY"] },
  { id: "applied", label: "Applied / Waiting", statuses: ["APPLIED", "WAITING_REPLY"] },
  {
    id: "interviewing",
    label: "Interviewing",
    statuses: [
      "RECRUITER_SCREEN",
      "HR_INTERVIEW",
      "TECHNICAL_INTERVIEW",
      "TAKE_HOME",
      "LIVE_CODING",
      "HIRING_MANAGER",
      "FINAL_INTERVIEW",
    ],
  },
  { id: "offer", label: "Offer", statuses: ["OFFER"] },
  { id: "closed", label: "Closed", statuses: ["REJECTED", "WITHDRAWN", "GHOSTED"] },
];

export const INTERVIEWING_STATUSES: ApplicationStatus[] = KANBAN_GROUPS[3].statuses;
export const CLOSED_STATUSES: ApplicationStatus[] = ["REJECTED", "WITHDRAWN", "GHOSTED"];

export const EVENT_TYPE_LABELS: Record<ApplicationEventType, string> = {
  STATUS_CHANGE: "Status change",
  APPLIED: "Applied",
  RECRUITER_CONTACT: "Recruiter contact",
  HR_INTERVIEW: "HR interview",
  TECHNICAL_INTERVIEW: "Technical interview",
  TAKE_HOME_RECEIVED: "Take-home received",
  TAKE_HOME_SUBMITTED: "Take-home submitted",
  LIVE_CODING: "Live coding",
  HIRING_MANAGER: "Hiring manager",
  FINAL_INTERVIEW: "Final interview",
  FOLLOW_UP: "Follow-up",
  OFFER: "Offer",
  REJECTION: "Rejection",
  NOTE: "Note",
  CUSTOM: "Custom",
};

export const REMOTE_TYPE_LABELS: Record<RemoteType, string> = {
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  ONSITE: "On-site",
  UNKNOWN: "Unknown",
};

export const REMOTE_HIRING_LABELS: Record<RemoteHiring, string> = {
  YES: "Yes",
  NO: "No",
  NOT_SURE: "Not sure",
  UNKNOWN: "Unknown",
};

export const EMPLOYEE_BUCKETS = [
  { id: "0-10", label: "0-10", min: 0, max: 10 },
  { id: "11-50", label: "11-50", min: 11, max: 50 },
  { id: "51-200", label: "51-200", min: 51, max: 200 },
  { id: "201-500", label: "201-500", min: 201, max: 500 },
  { id: "501-1000", label: "501-1000", min: 501, max: 1000 },
  { id: "1001+", label: "1000+", min: 1001, max: null },
] as const;

/** Engineering / product / design role signals (spec 10). */
export const ENGINEERING_ROLE_OPTIONS = [
  "Hiring Software Engineering",
  "Hiring Dev Ops",
  "Hiring Security Engineering",
  "Hiring Mobile Engineering",
  "Hiring QA",
  "Hiring Engineering Leader",
  "Hiring Engineering Management",
  "Hiring Data Science",
  "Hiring Product Management",
  "Hiring Product Leader",
  "Hiring Product Design",
  "Hiring Design Leader",
  "Hiring Technical PM",
] as const;

/** Broad hiring functions (spec 11). */
export const HIRING_FUNCTION_OPTIONS = [
  "Hiring Engineering",
  "Hiring Product",
  "Hiring Design",
  "Hiring Sales",
  "Hiring Marketing",
  "Hiring Customer Success",
  "Hiring Support",
  "Hiring Finance",
  "Hiring HR",
] as const;

export const GROWTH_SIGNAL_OPTIONS = [
  "1-mo Headcount Growth: Positive",
  "1-mo Headcount Growth: Neutral",
  "1-mo Headcount Growth: Negative",
  "6-mo Headcount Growth: 1% to 10%",
  "6-mo Headcount Growth: 10% to 20%",
  "6-mo Headcount Growth: 20%+",
  "6-mo Headcount Growth: Neutral",
  "6-mo Headcount Growth: Negative",
  "Recruiting Velocity: Low",
  "Recruiting Velocity: Moderate",
  "Recruiting Velocity: High",
  "Recruiting Velocity: Very High",
] as const;

export const FUNDING_SIGNAL_OPTIONS = [
  "Funding: $100K to $1M",
  "Funding: $1M to $10M",
  "Funding: $10M to $50M",
  "Funding: $50M to $100M",
  "Funding: $100M+",
  "Last Funding: 0-3 Mos",
  "Last Funding: 4 to 12 Mos",
  "Last Funding: 13 to 24 Mos",
  "Last Funding: 25+ Mos",
] as const;

/** Companies page - personal status derived from jobs/applications (spec 33). */
export type MyCompanyStatus =
  | "No Action"
  | "Interested"
  | "To Apply"
  | "Applied"
  | "Interviewing"
  | "Offer"
  | "Rejected"
  | "Mixed";

export const MY_STATUS_CLASSES: Record<MyCompanyStatus, string> = {
  "No Action": "text-muted-foreground",
  Interested: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-300 dark:border-zinc-700",
  "To Apply": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900",
  Applied: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-900",
  Interviewing: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900",
  Offer: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900",
  Rejected: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900",
  Mixed: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900",
};

export const APP_VERSION = "1.0.0";
