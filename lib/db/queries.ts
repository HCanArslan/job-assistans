import type { ApplicationStatus, Prisma } from "@/generated/prisma/client";

import {
  ACTIVE_STATUSES,
  CLOSED_STATUSES,
  EMPLOYEE_BUCKETS,
  KANBAN_GROUPS,
  STATUS_LABELS,
} from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { zonedDayBounds } from "@/lib/format";
import { computeMyStatus } from "@/lib/my-status";

export const COMPANIES_PAGE_SIZE = 50;

/* -------------------------------------------------------------------------- */
/* Companies                                                                  */
/* -------------------------------------------------------------------------- */

export const COMPANY_LIST_SELECT = {
  id: true,
  name: true,
  tagline: true,
  employees: true,
  employeesText: true,
  hqCountry: true,
  hqState: true,
  hqCity: true,
  remoteHiring: true,
  source: true,
  jobsUrl: true,
  websiteUrl: true,
  linkedinUrl: true,
  favorite: true,
  ignored: true,
  hiringFunctions: true,
  engineeringRoles: true,
  salesMarketingCsRoles: true,
  growthSignals: true,
  fundingSignals: true,
  stillHiringImportedAt: true,
  _count: { select: { jobs: true } },
} satisfies Prisma.CompanySelect;

export type CompanyListRecord = Prisma.CompanyGetPayload<{ select: typeof COMPANY_LIST_SELECT }>;

export interface CompanyFilters {
  q?: string;
  source?: "ALL" | "STILL_HIRING" | "MANUAL";
  remote?: "ALL" | "YES" | "NO" | "NOT_SURE" | "UNKNOWN";
  country?: string;
  state?: string;
  employees?: string;
  favorite?: boolean;
  showIgnored?: boolean;
  hasJobs?: boolean;
  hasApplication?: boolean;
  hiring?: string[];
  engineering?: string[];
  sales?: string[];
  growth?: string[];
  funding?: string[];
  sort?: "name" | "employees" | "updated";
  page: number;
}

type Params = Record<string, string | string[] | undefined>;

const asArray = (value: string | string[] | undefined): string[] =>
  value === undefined ? [] : Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);

export function parseCompanyFilters(params: Params): CompanyFilters {
  const page = Number(Array.isArray(params.page) ? params.page[0] : params.page ?? "1");
  const employeeBucket = EMPLOYEE_BUCKETS.find(
    (bucket) => bucket.id === (Array.isArray(params.employees) ? params.employees[0] : params.employees),
  );
  const sortRaw = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  const sourceRaw = Array.isArray(params.source) ? params.source[0] : params.source;
  const remoteRaw = Array.isArray(params.remote) ? params.remote[0] : params.remote;

  return {
    q: (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() || undefined,
    source: sourceRaw === "STILL_HIRING" || sourceRaw === "MANUAL" ? sourceRaw : "ALL",
    remote:
      remoteRaw === "YES" || remoteRaw === "NO" || remoteRaw === "NOT_SURE" || remoteRaw === "UNKNOWN"
        ? remoteRaw
        : "ALL",
    country: (Array.isArray(params.country) ? params.country[0] : params.country)?.trim() || undefined,
    state: (Array.isArray(params.state) ? params.state[0] : params.state)?.trim() || undefined,
    employees: employeeBucket?.id,
    favorite: params.favorite === "1",
    showIgnored: params.ignored === "1",
    hasJobs: params.hasJobs === "1",
    hasApplication: params.hasApp === "1",
    hiring: asArray(params.hiring),
    engineering: asArray(params.engineering),
    sales: asArray(params.sales),
    growth: asArray(params.growth),
    funding: asArray(params.funding),
    sort: sortRaw === "employees" || sortRaw === "updated" ? sortRaw : "name",
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
  };
}

function buildCompanyWhere(filters: CompanyFilters): Prisma.CompanyWhereInput {
  const where: Prisma.CompanyWhereInput = {};
  const and: Prisma.CompanyWhereInput[] = [];

  if (filters.q) {
    and.push({
      OR: [
        { name: { contains: filters.q, mode: "insensitive" } },
        { tagline: { contains: filters.q, mode: "insensitive" } },
      ],
    });
  }
  if (filters.source && filters.source !== "ALL") where.source = filters.source;
  if (filters.remote && filters.remote !== "ALL") where.remoteHiring = filters.remote;
  if (filters.country) where.hqCountry = filters.country;
  if (filters.state) where.hqState = filters.state;
  if (filters.employees) {
    const bucket = EMPLOYEE_BUCKETS.find((item) => item.id === filters.employees);
    if (bucket) {
      where.employees = {
        gte: bucket.min,
        ...(bucket.max === null ? {} : { lte: bucket.max }),
      };
    }
  }
  if (!filters.showIgnored) where.ignored = false;
  if (filters.favorite) where.favorite = true;
  if (filters.hasJobs) and.push({ jobs: { some: {} } });
  if (filters.hasApplication) and.push({ jobs: { some: { application: { isNot: null } } } });
  if (filters.hiring?.length) where.hiringFunctions = { hasSome: filters.hiring };
  if (filters.engineering?.length) where.engineeringRoles = { hasSome: filters.engineering };
  if (filters.sales?.length) where.salesMarketingCsRoles = { hasSome: filters.sales };
  if (filters.growth?.length) where.growthSignals = { hasSome: filters.growth };
  if (filters.funding?.length) where.fundingSignals = { hasSome: filters.funding };

  if (and.length > 0) where.AND = and;
  return where;
}

export interface CompanyListRow extends CompanyListRecord {
  myStatus: ReturnType<typeof computeMyStatus>;
  applicationCount: number;
  applicationStatuses: ApplicationStatus[];
}

export interface CompanyListResult {
  rows: CompanyListRow[];
  total: number;
  page: number;
  pageCount: number;
}

export async function listCompanies(filters: CompanyFilters): Promise<CompanyListResult> {
  const where = buildCompanyWhere(filters);
  const orderBy: Prisma.CompanyOrderByWithRelationInput[] =
    filters.sort === "employees"
      ? [{ employees: { sort: "desc", nulls: "last" } }, { name: "asc" }]
      : filters.sort === "updated"
        ? [{ updatedAt: "desc" }]
        : [{ name: "asc" }];

  const [total, companies] = await Promise.all([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      orderBy,
      select: COMPANY_LIST_SELECT,
      skip: (filters.page - 1) * COMPANIES_PAGE_SIZE,
      take: COMPANIES_PAGE_SIZE,
    }),
  ]);

  const ids = companies.map((company) => company.id);
  const applications = ids.length
    ? await prisma.application.findMany({
        where: { job: { companyId: { in: ids } } },
        select: { status: true, job: { select: { companyId: true } } },
      })
    : [];

  const byCompany = new Map<string, ApplicationStatus[]>();
  for (const application of applications) {
    const list = byCompany.get(application.job.companyId) ?? [];
    list.push(application.status);
    byCompany.set(application.job.companyId, list);
  }

  const rows: CompanyListRow[] = companies.map((company) => {
    const statuses = byCompany.get(company.id) ?? [];
    return {
      ...company,
      myStatus: computeMyStatus(statuses),
      applicationCount: statuses.length,
      applicationStatuses: statuses,
    };
  });

  return {
    rows,
    total,
    page: filters.page,
    pageCount: Math.max(1, Math.ceil(total / COMPANIES_PAGE_SIZE)),
  };
}

export interface CompanyFacets {
  countries: string[];
  states: string[];
  engineeringRoles: string[];
  hiringFunctions: string[];
  salesRoles: string[];
  growthSignals: string[];
  fundingSignals: string[];
}

async function distinctArrayValues(column: string): Promise<string[]> {
  const rows = await prisma.$queryRawUnsafe<{ value: string }[]>(
    `SELECT DISTINCT unnest("${column}") AS value FROM "Company" WHERE array_length("${column}", 1) > 0 ORDER BY value`,
  );
  return rows.map((row) => row.value).filter(Boolean);
}

export async function getCompanyFacets(): Promise<CompanyFacets> {
  const [countries, states, engineeringRoles, hiringFunctions, salesRoles, growthSignals, fundingSignals] =
    await Promise.all([
      prisma.company.findMany({
        distinct: ["hqCountry"],
        where: { hqCountry: { not: null } },
        select: { hqCountry: true },
        orderBy: { hqCountry: "asc" },
      }),
      prisma.company.findMany({
        distinct: ["hqState"],
        where: { hqState: { not: null } },
        select: { hqState: true },
        orderBy: { hqState: "asc" },
      }),
      distinctArrayValues("engineeringRoles"),
      distinctArrayValues("hiringFunctions"),
      distinctArrayValues("salesMarketingCsRoles"),
      distinctArrayValues("growthSignals"),
      distinctArrayValues("fundingSignals"),
    ]);

  return {
    countries: countries.map((row) => row.hqCountry).filter((value): value is string => Boolean(value)),
    states: states.map((row) => row.hqState).filter((value): value is string => Boolean(value)),
    engineeringRoles,
    hiringFunctions,
    salesRoles,
    growthSignals,
    fundingSignals,
  };
}

export async function listCompanyOptions(query: string, limit = 20) {
  return prisma.company.findMany({
    where: query
      ? { name: { contains: query, mode: "insensitive" } }
      : undefined,
    orderBy: { name: "asc" },
    take: limit,
    select: { id: true, name: true, source: true, jobsUrl: true, ignored: true },
  });
}

export async function getCompanyById(id: string) {
  return prisma.company.findUnique({
    where: { id },
    include: {
      jobs: {
        orderBy: { createdAt: "desc" },
        include: {
          application: {
            select: { id: true, status: true, appliedAt: true, nextFollowUpAt: true, interviewAt: true },
          },
        },
      },
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Jobs                                                                       */
/* -------------------------------------------------------------------------- */

export async function getJobById(id: string) {
  return prisma.job.findUnique({
    where: { id },
    include: {
      company: {
        select: { id: true, name: true, websiteUrl: true, jobsUrl: true, tagline: true },
      },
      application: {
        include: {
          events: { orderBy: { eventAt: "desc" }, take: 30 },
        },
      },
    },
  });
}

export async function listJobOptions(query: string, limit = 20) {
  return prisma.job.findMany({
    where: query ? { title: { contains: query, mode: "insensitive" } } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      company: { select: { id: true, name: true } },
      application: { select: { id: true } },
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Applications                                                               */
/* -------------------------------------------------------------------------- */

export const APPLICATION_SELECT = {
  id: true,
  status: true,
  appliedAt: true,
  lastActivityAt: true,
  nextFollowUpAt: true,
  interviewAt: true,
  salaryExpectation: true,
  recruiterName: true,
  job: {
    select: {
      id: true,
      title: true,
      location: true,
      remoteType: true,
      jobUrl: true,
      company: {
        select: { id: true, name: true, websiteUrl: true, jobsUrl: true },
      },
    },
  },
} satisfies Prisma.ApplicationSelect;

export type ApplicationListRow = Prisma.ApplicationGetPayload<{ select: typeof APPLICATION_SELECT }>;

export interface ApplicationFilters {
  q?: string;
  statuses: ApplicationStatus[];
  companyId?: string;
  followUpDue?: boolean;
  interviewUpcoming?: boolean;
  sort?: "activity" | "applied" | "followup" | "interview" | "company";
  page: number;
  pageSize: number;
}

export function parseApplicationFilters(params: Params, defaults?: Partial<ApplicationFilters>): ApplicationFilters {
  const statusValues = asArray(params.status).filter((value): value is ApplicationStatus =>
    value in STATUS_LABELS,
  );
  const page = Number(Array.isArray(params.page) ? params.page[0] : params.page ?? "1");
  const sortRaw = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  const first = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  return {
    q: first("q")?.trim() || undefined,
    statuses: statusValues.length > 0 ? statusValues : (defaults?.statuses ?? []),
    companyId: first("company") || undefined,
    followUpDue: first("followUp") === "1",
    interviewUpcoming: first("interview") === "1",
    sort:
      sortRaw === "applied" || sortRaw === "followup" || sortRaw === "interview" || sortRaw === "company"
        ? sortRaw
        : "activity",
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
    pageSize: defaults?.pageSize ?? 50,
  };
}

function buildApplicationWhere(filters: ApplicationFilters): Prisma.ApplicationWhereInput {
  const where: Prisma.ApplicationWhereInput = {};
  const and: Prisma.ApplicationWhereInput[] = [];
  const now = new Date();

  if (filters.statuses.length > 0) where.status = { in: filters.statuses };
  if (filters.companyId) and.push({ job: { companyId: filters.companyId } });
  if (filters.q) {
    and.push({
      OR: [
        { job: { title: { contains: filters.q, mode: "insensitive" } } },
        { job: { company: { name: { contains: filters.q, mode: "insensitive" } } } },
        { notes: { contains: filters.q, mode: "insensitive" } },
        { recruiterName: { contains: filters.q, mode: "insensitive" } },
      ],
    });
  }
  if (filters.followUpDue) {
    and.push({ nextFollowUpAt: { lte: zonedDayBounds(now).end } });
  }
  if (filters.interviewUpcoming) {
    and.push({ interviewAt: { gte: now } });
  }
  if (and.length > 0) where.AND = and;
  return where;
}

export async function listApplications(filters: ApplicationFilters) {
  const where = buildApplicationWhere(filters);
  const orderBy: Prisma.ApplicationOrderByWithRelationInput[] =
    filters.sort === "applied"
      ? [{ appliedAt: { sort: "desc", nulls: "last" } }]
      : filters.sort === "followup"
        ? [{ nextFollowUpAt: { sort: "asc", nulls: "last" } }]
        : filters.sort === "interview"
          ? [{ interviewAt: { sort: "asc", nulls: "last" } }]
          : filters.sort === "company"
            ? [{ job: { company: { name: "asc" } } }]
            : [{ lastActivityAt: "desc" }];

  const [total, rows] = await Promise.all([
    prisma.application.count({ where }),
    prisma.application.findMany({
      where,
      orderBy,
      select: APPLICATION_SELECT,
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
  ]);

  return {
    rows,
    total,
    page: filters.page,
    pageCount: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
}

export interface KanbanGroupData {
  id: string;
  label: string;
  items: ApplicationListRow[];
}

export async function listApplicationsForBoard(filters: ApplicationFilters, limit = 400) {
  const where = buildApplicationWhere(filters);
  const rows = await prisma.application.findMany({
    where,
    orderBy: [{ lastActivityAt: "desc" }],
    select: APPLICATION_SELECT,
    take: limit,
  });
  const groups: KanbanGroupData[] = KANBAN_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    items: rows.filter((row) => (group.statuses as ApplicationStatus[]).includes(row.status)),
  }));
  return { groups, total: rows.length };
}

export async function getApplicationById(id: string) {
  return prisma.application.findUnique({
    where: { id },
    include: {
      job: {
        include: {
          company: { select: { id: true, name: true, websiteUrl: true, jobsUrl: true, linkedinUrl: true } },
        },
      },
      events: { orderBy: { eventAt: "desc" } },
    },
  });
}

export async function getApplicationStatusCounts(where?: Prisma.ApplicationWhereInput) {
  const grouped = await prisma.application.groupBy({
    by: ["status"],
    _count: { _all: true },
    where,
  });
  const counts: Record<ApplicationStatus, number> = {
    INTERESTED: 0,
    TO_APPLY: 0,
    APPLIED: 0,
    WAITING_REPLY: 0,
    RECRUITER_SCREEN: 0,
    HR_INTERVIEW: 0,
    TECHNICAL_INTERVIEW: 0,
    TAKE_HOME: 0,
    LIVE_CODING: 0,
    HIRING_MANAGER: 0,
    FINAL_INTERVIEW: 0,
    OFFER: 0,
    REJECTED: 0,
    WITHDRAWN: 0,
    GHOSTED: 0,
  };
  for (const group of grouped) counts[group.status] = group._count._all;
  return counts;
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

export type AttentionReason = "overdue" | "due_today" | "interview" | "stale";

export interface AttentionItem {
  applicationId: string;
  status: ApplicationStatus;
  companyId: string;
  companyName: string;
  jobTitle: string;
  nextFollowUpAt: Date | null;
  interviewAt: Date | null;
  lastActivityAt: Date;
  reason: AttentionReason;
  daysSinceActivity: number;
}

const STALE_AFTER_DAYS = 14;

export async function getDashboardData() {
  const now = new Date();
  const { end: endOfToday } = zonedDayBounds(now);
  const staleBefore = new Date(now.getTime() - STALE_AFTER_DAYS * 24 * 60 * 60 * 1000);
  const interviewWindowEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const attentionSelect = {
    id: true,
    status: true,
    nextFollowUpAt: true,
    interviewAt: true,
    lastActivityAt: true,
    job: { select: { title: true, company: { select: { id: true, name: true } } } },
  } satisfies Prisma.ApplicationSelect;

  const [counts, followUps, interviews, stale, recentEvents, recentApplications] = await Promise.all([
    getApplicationStatusCounts(),
    prisma.application.findMany({
      where: { nextFollowUpAt: { lte: endOfToday }, status: { in: ACTIVE_STATUSES } },
      orderBy: { nextFollowUpAt: "asc" },
      take: 12,
      select: attentionSelect,
    }),
    prisma.application.findMany({
      where: { interviewAt: { gte: now, lte: interviewWindowEnd }, status: { in: ACTIVE_STATUSES } },
      orderBy: { interviewAt: "asc" },
      take: 8,
      select: attentionSelect,
    }),
    prisma.application.findMany({
      where: { lastActivityAt: { lt: staleBefore }, status: { in: ACTIVE_STATUSES } },
      orderBy: { lastActivityAt: "asc" },
      take: 8,
      select: attentionSelect,
    }),
    prisma.applicationEvent.findMany({
      orderBy: { eventAt: "desc" },
      take: 8,
      include: {
        application: {
          select: {
            id: true,
            status: true,
            job: { select: { title: true, company: { select: { id: true, name: true } } } },
          },
        },
      },
    }),
    prisma.application.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        status: true,
        updatedAt: true,
        lastActivityAt: true,
        nextFollowUpAt: true,
        interviewAt: true,
        job: { select: { title: true, company: { select: { id: true, name: true } } } },
      },
    }),
  ]);

  const todayKey = endOfToday.getTime() - 24 * 60 * 60 * 1000 + 1; // start of today (inclusive)
  const items = new Map<string, AttentionItem>();

  const push = (
    row: (typeof followUps)[number],
    reason: AttentionReason,
  ) => {
    const existing = items.get(row.id);
    const daysSinceActivity = Math.max(
      0,
      Math.floor((now.getTime() - row.lastActivityAt.getTime()) / (24 * 60 * 60 * 1000)),
    );
    const item: AttentionItem = {
      applicationId: row.id,
      status: row.status,
      companyId: row.job.company.id,
      companyName: row.job.company.name,
      jobTitle: row.job.title,
      nextFollowUpAt: row.nextFollowUpAt,
      interviewAt: row.interviewAt,
      lastActivityAt: row.lastActivityAt,
      reason,
      daysSinceActivity,
    };
    if (!existing || reasonPriority(reason) < reasonPriority(existing.reason)) {
      items.set(row.id, item);
    }
  };

  for (const row of followUps) {
    const dueAt = row.nextFollowUpAt?.getTime() ?? 0;
    push(row, dueAt < todayKey ? "overdue" : "due_today");
  }
  for (const row of interviews) push(row, "interview");
  for (const row of stale) push(row, "stale");

  const attention = [...items.values()].sort((a, b) => {
    const byReason = reasonPriority(a.reason) - reasonPriority(b.reason);
    if (byReason !== 0) return byReason;
    return b.daysSinceActivity - a.daysSinceActivity;
  });

  const pipeline = KANBAN_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    count: group.statuses.reduce(
      (total, status) => total + (counts[status as ApplicationStatus] ?? 0),
      0,
    ),
  }));

  return {
    counts,
    stats: {
      toApply: counts.TO_APPLY,
      applied: counts.APPLIED,
      waitingReply: counts.WAITING_REPLY,
      interviewing: KANBAN_GROUPS[3].statuses.reduce(
        (total, status) => total + (counts[status as ApplicationStatus] ?? 0),
        0,
      ),
      offers: counts.OFFER,
      rejected: counts.REJECTED,
    },
    attention,
    recentEvents,
    recentApplications,
    pipeline,
    closedCount: CLOSED_STATUSES.reduce((total, status) => total + (counts[status] ?? 0), 0),
  };
}

function reasonPriority(reason: AttentionReason): number {
  switch (reason) {
    case "overdue":
      return 0;
    case "due_today":
      return 1;
    case "interview":
      return 2;
    default:
      return 3;
  }
}

/* -------------------------------------------------------------------------- */
/* Global search (Cmd/Ctrl + K)                                               */
/* -------------------------------------------------------------------------- */

export interface GlobalSearchResults {
  companies: { id: string; name: string; tagline: string | null; source: string }[];
  jobs: { id: string; title: string; companyId: string; companyName: string; hasApplication: boolean }[];
  applications: { id: string; status: ApplicationStatus; jobTitle: string; companyName: string }[];
}

export async function globalSearch(query: string): Promise<GlobalSearchResults> {
  const q = query.trim();
  if (q.length < 2) return { companies: [], jobs: [], applications: [] };

  const [companies, jobs, applications] = await Promise.all([
    prisma.company.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { tagline: { contains: q, mode: "insensitive" } },
          { notes: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
      take: 6,
      select: { id: true, name: true, tagline: true, source: true },
    }),
    prisma.job.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { notes: { contains: q, mode: "insensitive" } },
          { company: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        companyId: true,
        company: { select: { name: true } },
        application: { select: { id: true } },
      },
    }),
    prisma.application.findMany({
      where: {
        OR: [
          { notes: { contains: q, mode: "insensitive" } },
          { job: { title: { contains: q, mode: "insensitive" } } },
          { job: { company: { name: { contains: q, mode: "insensitive" } } } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        status: true,
        job: { select: { title: true, company: { select: { name: true } } } },
      },
    }),
  ]);

  return {
    companies,
    jobs: jobs.map((job) => ({
      id: job.id,
      title: job.title,
      companyId: job.companyId,
      companyName: job.company.name,
      hasApplication: Boolean(job.application),
    })),
    applications: applications.map((application) => ({
      id: application.id,
      status: application.status,
      jobTitle: application.job.title,
      companyName: application.job.company.name,
    })),
  };
}

export async function getImportStats() {
  const [importedCount, lastSync, manualCount] = await Promise.all([
    prisma.company.count({ where: { source: "STILL_HIRING" } }),
    prisma.company.aggregate({
      where: { source: "STILL_HIRING" },
      _max: { stillHiringImportedAt: true },
    }),
    prisma.company.count({ where: { source: "MANUAL" } }),
  ]);
  return {
    importedCount,
    manualCount,
    lastSyncAt: lastSync._max.stillHiringImportedAt ?? null,
  };
}
