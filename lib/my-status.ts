import type { ApplicationStatus } from "@/generated/prisma/client";

import { ACTIVE_STATUSES, CLOSED_STATUSES, type MyCompanyStatus } from "@/lib/constants";

/**
 * Personal status of a company, derived from the application statuses of its jobs.
 * Never persisted - always computed.
 */
export function computeMyStatus(statuses: ApplicationStatus[]): MyCompanyStatus {
  if (statuses.length === 0) return "No Action";

  if (statuses.includes("OFFER")) return "Offer";

  const interviewing = statuses.filter((status) => !CLOSED_STATUSES.includes(status));
  if (interviewing.some((status) => status in INTERVIEW_STATUS_SET)) return "Interviewing";

  if (interviewing.some((status) => status === "APPLIED" || status === "WAITING_REPLY")) {
    return "Applied";
  }
  if (interviewing.includes("TO_APPLY")) return "To Apply";
  if (interviewing.includes("INTERESTED")) return "Interested";

  if (statuses.includes("REJECTED")) return "Rejected";
  return "Mixed";
}

const INTERVIEW_STATUS_SET: Record<string, true> = {
  RECRUITER_SCREEN: true,
  HR_INTERVIEW: true,
  TECHNICAL_INTERVIEW: true,
  TAKE_HOME: true,
  LIVE_CODING: true,
  HIRING_MANAGER: true,
  FINAL_INTERVIEW: true,
};

export const isActiveStatus = (status: ApplicationStatus) => ACTIVE_STATUSES.includes(status);
