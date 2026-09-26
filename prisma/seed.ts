/**
 * Development seed: 10 fictional companies, 12 jobs, 8 applications with
 * several statuses and timeline events. Idempotent - running it twice does
 * not duplicate anything. No real StillHiring companies are used.
 *
 *   npm run db:seed
 */
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

import type { ApplicationStatus, ApplicationEventType, RemoteHiring, RemoteType } from "@/generated/prisma/client";

interface SeedCompany {
  name: string;
  tagline: string;
  websiteUrl: string;
  jobsUrl: string;
  employees: number;
  hqCountry: string;
  hqState: string;
  hqCity: string;
  remoteHiring: RemoteHiring;
  notes?: string;
  favorite?: boolean;
  ignored?: boolean;
  hiringFunctions: string[];
  engineeringRoles: string[];
  salesMarketingCsRoles: string[];
  growthSignals: string[];
  fundingSignals: string[];
}

const COMPANIES: SeedCompany[] = [
  {
    name: "Northwind Analytics",
    tagline: "Event pipelines and warehouses for product teams",
    websiteUrl: "https://northwind-analytics.example.com",
    jobsUrl: "https://northwind-analytics.example.com/careers",
    employees: 240,
    hqCountry: "Germany",
    hqState: "Berlin",
    hqCity: "Berlin",
    remoteHiring: "YES",
    notes: "Referred by Deniz - data platform team is growing fast.",
    favorite: true,
    hiringFunctions: ["Hiring Engineering", "Hiring Product", "Hiring Design"],
    engineeringRoles: [
      "Hiring Software Engineering",
      "Hiring Dev Ops",
      "Hiring Data Science",
      "Hiring Product Management",
    ],
    salesMarketingCsRoles: ["Hiring Sales", "Hiring Customer Success"],
    growthSignals: [
      "6-mo Headcount Growth: 20%+",
      "Recruiting Velocity: Very High",
      "1-mo Headcount Growth: Positive",
    ],
    fundingSignals: ["Funding: $50M to $100M", "Last Funding: 4 to 12 Mos"],
  },
  {
    name: "Bluewave Logistics",
    tagline: "Freight visibility platform for mid-size carriers",
    websiteUrl: "https://bluewave-logistics.example.com",
    jobsUrl: "https://bluewave-logistics.example.com/jobs",
    employees: 620,
    hqCountry: "Netherlands",
    hqState: "North Holland",
    hqCity: "Amsterdam",
    remoteHiring: "YES",
    hiringFunctions: ["Hiring Engineering", "Hiring Support"],
    engineeringRoles: ["Hiring Software Engineering", "Hiring QA", "Hiring Mobile Engineering"],
    salesMarketingCsRoles: ["Hiring Marketing"],
    growthSignals: ["6-mo Headcount Growth: 10% to 20%", "Recruiting Velocity: High"],
    fundingSignals: ["Funding: $100M+", "Last Funding: 0-3 Mos"],
  },
  {
    name: "Cobalt Health",
    tagline: "Clinical scheduling software for outpatient clinics",
    websiteUrl: "https://cobalt-health.example.com",
    jobsUrl: "https://cobalt-health.example.com/careers",
    employees: 130,
    hqCountry: "United States",
    hqState: "California",
    hqCity: "San Francisco",
    remoteHiring: "NOT_SURE",
    hiringFunctions: ["Hiring Engineering", "Hiring HR"],
    engineeringRoles: ["Hiring Software Engineering", "Hiring Engineering Management"],
    salesMarketingCsRoles: ["Hiring Sales"],
    growthSignals: ["6-mo Headcount Growth: 1% to 10%", "Recruiting Velocity: Moderate"],
    fundingSignals: ["Funding: $10M to $50M", "Last Funding: 13 to 24 Mos"],
  },
  {
    name: "Fjord Robotics",
    tagline: "Autonomous warehouse picking for cold storage",
    websiteUrl: "https://fjord-robotics.example.com",
    jobsUrl: "https://fjord-robotics.example.com/open-roles",
    employees: 75,
    hqCountry: "Norway",
    hqState: "Oslo",
    hqCity: "Oslo",
    remoteHiring: "NO",
    hiringFunctions: ["Hiring Engineering", "Hiring Design"],
    engineeringRoles: ["Hiring Software Engineering", "Hiring Security Engineering", "Hiring Design Leader"],
    salesMarketingCsRoles: [],
    growthSignals: ["6-mo Headcount Growth: 20%+", "Recruiting Velocity: High"],
    fundingSignals: ["Funding: $10M to $50M", "Last Funding: 4 to 12 Mos"],
  },
  {
    name: "Helio Payments",
    tagline: "Payout infrastructure for marketplaces",
    websiteUrl: "https://helio-payments.example.com",
    jobsUrl: "https://helio-payments.example.com/careers",
    employees: 310,
    hqCountry: "United Kingdom",
    hqState: "England",
    hqCity: "London",
    remoteHiring: "YES",
    hiringFunctions: ["Hiring Engineering", "Hiring Finance", "Hiring Product"],
    engineeringRoles: [
      "Hiring Software Engineering",
      "Hiring Engineering Leader",
      "Hiring Product Management",
      "Hiring Technical PM",
    ],
    salesMarketingCsRoles: ["Hiring Sales", "Hiring Marketing"],
    growthSignals: ["6-mo Headcount Growth: 10% to 20%", "Recruiting Velocity: Moderate"],
    fundingSignals: ["Funding: $50M to $100M", "Last Funding: 4 to 12 Mos"],
  },
  {
    name: "Kestrel Security",
    tagline: "Runtime threat detection for Kubernetes",
    websiteUrl: "https://kestrel-security.example.com",
    jobsUrl: "https://kestrel-security.example.com/jobs",
    employees: 95,
    hqCountry: "Canada",
    hqState: "Ontario",
    hqCity: "Toronto",
    remoteHiring: "YES",
    favorite: true,
    hiringFunctions: ["Hiring Engineering", "Hiring Customer Success"],
    engineeringRoles: ["Hiring Security Engineering", "Hiring Software Engineering", "Hiring Dev Ops"],
    salesMarketingCsRoles: ["Hiring Customer Success"],
    growthSignals: ["6-mo Headcount Growth: 20%+", "Recruiting Velocity: Very High"],
    fundingSignals: ["Funding: $10M to $50M", "Last Funding: 0-3 Mos"],
  },
  {
    name: "Lumen Field Systems",
    tagline: "Service scheduling for utility contractors",
    websiteUrl: "https://lumen-field.example.com",
    jobsUrl: "https://lumen-field.example.com/careers",
    employees: 48,
    hqCountry: "United States",
    hqState: "Texas",
    hqCity: "Austin",
    remoteHiring: "NOT_SURE",
    hiringFunctions: ["Hiring Engineering"],
    engineeringRoles: ["Hiring Software Engineering", "Hiring QA"],
    salesMarketingCsRoles: [],
    growthSignals: ["6-mo Headcount Growth: Neutral", "Recruiting Velocity: Low"],
    fundingSignals: ["Funding: $1M to $10M", "Last Funding: 25+ Mos"],
  },
  {
    name: "Mira Retail Cloud",
    tagline: "Unified commerce backend for mid-market retailers",
    websiteUrl: "https://mira-retail.example.com",
    jobsUrl: "https://mira-retail.example.com/jobs",
    employees: 1500,
    hqCountry: "Türkiye",
    hqState: "Istanbul",
    hqCity: "Istanbul",
    remoteHiring: "YES",
    ignored: true,
    hiringFunctions: ["Hiring Engineering", "Hiring Sales", "Hiring Support"],
    engineeringRoles: ["Hiring Software Engineering", "Hiring Engineering Management", "Hiring Mobile Engineering"],
    salesMarketingCsRoles: ["Hiring Sales", "Hiring Marketing", "Hiring Customer Success"],
    growthSignals: ["6-mo Headcount Growth: 1% to 10%", "Recruiting Velocity: Moderate"],
    fundingSignals: ["Funding: $100M+", "Last Funding: 13 to 24 Mos"],
  },
  {
    name: "Orchid Learning",
    tagline: "Cohort-based training platform for enterprises",
    websiteUrl: "https://orchid-learning.example.com",
    jobsUrl: "https://orchid-learning.example.com/careers",
    employees: 60,
    hqCountry: "Spain",
    hqState: "Catalonia",
    hqCity: "Barcelona",
    remoteHiring: "YES",
    hiringFunctions: ["Hiring Design", "Hiring Product", "Hiring Marketing"],
    engineeringRoles: ["Hiring Product Design", "Hiring Product Management", "Hiring Software Engineering"],
    salesMarketingCsRoles: ["Hiring Marketing"],
    growthSignals: ["6-mo Headcount Growth: 20%+", "Recruiting Velocity: Very High"],
    fundingSignals: ["Funding: $10M to $50M", "Last Funding: 4 to 12 Mos"],
  },
  {
    name: "Tessera Fintech Lab",
    tagline: "Embedded credit scoring for B2B lenders",
    websiteUrl: "https://tessera-lab.example.com",
    jobsUrl: "https://tessera-lab.example.com/roles",
    employees: 22,
    hqCountry: "Germany",
    hqState: "Bavaria",
    hqCity: "Munich",
    remoteHiring: "NO",
    hiringFunctions: ["Hiring Engineering", "Hiring Finance"],
    engineeringRoles: ["Hiring Data Science", "Hiring Software Engineering"],
    salesMarketingCsRoles: ["Hiring Finance"],
    growthSignals: ["6-mo Headcount Growth: 1% to 10%", "Recruiting Velocity: Moderate"],
    fundingSignals: ["Funding: $1M to $10M", "Last Funding: 0-3 Mos"],
  },
];

interface SeedJob {
  company: string;
  title: string;
  location: string;
  remoteType: RemoteType;
  salaryText: string;
  jobUrl: string;
  notes?: string;
  application?: {
    status: ApplicationStatus;
    appliedDaysAgo?: number;
    nextFollowUpInDays?: number;
    interviewInDays?: number;
    salaryExpectation?: string;
    recruiterName?: string;
    recruiterEmail?: string;
    referralName?: string;
    notes?: string;
    rejectionReason?: string;
    events?: { type: ApplicationEventType; title: string; notes?: string; daysAgo: number }[];
  };
}

const JOB_SPECS: SeedJob[] = [
  {
    company: "Northwind Analytics",
    title: "Senior Backend Engineer (Data Platform)",
    location: "Berlin, Germany",
    remoteType: "HYBRID",
    salaryText: "€85-100k",
    jobUrl: "https://northwind-analytics.example.com/careers/senior-backend",
    notes: "Kafka, Flink, Iceberg. Team of 6, reports to Head of Platform.",
    application: {
      status: "TECHNICAL_INTERVIEW",
      appliedDaysAgo: 18,
      nextFollowUpInDays: -2,
      interviewInDays: 3,
      salaryExpectation: "€95k",
      recruiterName: "Anna Weber",
      recruiterEmail: "anna.weber@northwind-analytics.example.com",
      referralName: "Deniz K.",
      notes: "Take-home reviewed; system design round next. Prepare streaming backpressure example.",
      events: [
        { type: "APPLIED", title: "Status changed: To Apply → Applied", daysAgo: 18 },
        { type: "RECRUITER_CONTACT", title: "Recruiter screen call", notes: "30 min, salary range confirmed.", daysAgo: 14 },
        { type: "TECHNICAL_INTERVIEW", title: "Take-home reviewed with engineer", notes: "Went well, one question on exactly-once semantics.", daysAgo: 6 },
        { type: "FOLLOW_UP", title: "Sent thank-you email", daysAgo: 5 },
      ],
    },
  },
  {
    company: "Northwind Analytics",
    title: "Staff Platform Engineer",
    location: "Remote (EU)",
    remoteType: "REMOTE",
    salaryText: "€100-120k",
    jobUrl: "https://northwind-analytics.example.com/careers/staff-platform",
    notes: "Same team as the backend role - mentioned in the recruiter call.",
    application: {
      status: "TO_APPLY",
      salaryExpectation: "€110k",
      nextFollowUpInDays: 1,
      notes: "Tailor the CV around platform migrations before applying.",
      events: [{ type: "STATUS_CHANGE", title: "Status set to To Apply", daysAgo: 4 }],
    },
  },
  {
    company: "Kestrel Security",
    title: "Security Engineer (Kubernetes Runtime)",
    location: "Remote (Canada/EU)",
    remoteType: "REMOTE",
    salaryText: "CAD 140-170k",
    jobUrl: "https://kestrel-security.example.com/jobs/security-engineer",
    application: {
      status: "FINAL_INTERVIEW",
      appliedDaysAgo: 30,
      interviewInDays: 1,
      nextFollowUpInDays: 2,
      salaryExpectation: "CAD 165k",
      recruiterName: "Marc Tremblay",
      recruiterEmail: "marc.tremblay@kestrel-security.example.com",
      notes: "Final loop: 1h with CTO + 1h with VP Eng. Review eBPF basics.",
      events: [
        { type: "APPLIED", title: "Status changed: To Apply → Applied", daysAgo: 30 },
        { type: "HR_INTERVIEW", title: "HR interview", notes: "Benefits and remote policy explained.", daysAgo: 24 },
        { type: "TECHNICAL_INTERVIEW", title: "Technical deep dive", notes: "Threat modelling exercise.", daysAgo: 15 },
        { type: "LIVE_CODING", title: "Live coding: log parser", notes: "Go, 45 min.", daysAgo: 9 },
        { type: "FINAL_INTERVIEW", title: "Final loop scheduled", daysAgo: 3 },
      ],
    },
  },
  {
    company: "Helio Payments",
    title: "Senior Software Engineer, Payouts",
    location: "London, UK",
    remoteType: "HYBRID",
    salaryText: "£85-95k",
    jobUrl: "https://helio-payments.example.com/careers/payouts-engineer",
    application: {
      status: "WAITING_REPLY",
      appliedDaysAgo: 11,
      nextFollowUpInDays: 0,
      recruiterName: "Priya Nair",
      notes: "Applied via referral link; recruiter said feedback within 2 weeks.",
      events: [
        { type: "APPLIED", title: "Status changed: To Apply → Applied", daysAgo: 11 },
        { type: "RECRUITER_CONTACT", title: "Recruiter acknowledged application", daysAgo: 8 },
      ],
    },
  },
  {
    company: "Bluewave Logistics",
    title: "Full-Stack Engineer (Tracking)",
    location: "Amsterdam, Netherlands",
    remoteType: "HYBRID",
    salaryText: "€70-85k",
    jobUrl: "https://bluewave-logistics.example.com/jobs/full-stack",
    application: {
      status: "RECRUITER_SCREEN",
      appliedDaysAgo: 7,
      interviewInDays: 4,
      recruiterName: "Sanne de Vries",
      events: [
        { type: "APPLIED", title: "Status changed: To Apply → Applied", daysAgo: 7 },
        { type: "RECRUITER_CONTACT", title: "Recruiter screen booked", daysAgo: 2 },
      ],
    },
  },
  {
    company: "Cobalt Health",
    title: "Backend Engineer, Scheduling",
    location: "San Francisco, CA (US)",
    remoteType: "ONSITE",
    salaryText: "$150-180k",
    jobUrl: "https://cobalt-health.example.com/careers/backend",
    application: {
      status: "REJECTED",
      appliedDaysAgo: 40,
      rejectionReason: "They needed on-site 4 days/week, relocation not possible.",
      notes: "Good process, wrong location fit. Revisit if they open a remote req.",
      events: [
        { type: "APPLIED", title: "Status changed: To Apply → Applied", daysAgo: 40 },
        { type: "REJECTION", title: "Rejected after recruiter screen", daysAgo: 33 },
      ],
    },
  },
  {
    company: "Fjord Robotics",
    title: "Robotics Software Engineer",
    location: "Oslo, Norway",
    remoteType: "ONSITE",
    salaryText: "NOK 800-950k",
    jobUrl: "https://fjord-robotics.example.com/open-roles/robotics-software",
    application: {
      status: "GHOSTED",
      appliedDaysAgo: 55,
      notes: "Recruiter went quiet after the first call. Keeping for reference.",
      events: [
        { type: "APPLIED", title: "Status changed: To Apply → Applied", daysAgo: 55 },
        { type: "NOTE", title: "Marked as ghosted", notes: "No reply to two follow-ups.", daysAgo: 20 },
      ],
    },
  },
  {
    company: "Orchid Learning",
    title: "Product Engineer",
    location: "Remote (EU)",
    remoteType: "REMOTE",
    salaryText: "€65-80k",
    jobUrl: "https://orchid-learning.example.com/careers/product-engineer",
    application: {
      status: "OFFER",
      appliedDaysAgo: 26,
      nextFollowUpInDays: 1,
      salaryExpectation: "€78k",
      recruiterName: "Núria Serra",
      recruiterEmail: "nuria.serra@orchid-learning.example.com",
      notes: "Offer received: €76k + 4% equity. Decide by Friday.",
      events: [
        { type: "APPLIED", title: "Status changed: To Apply → Applied", daysAgo: 26 },
        { type: "HR_INTERVIEW", title: "HR interview", daysAgo: 20 },
        { type: "TECHNICAL_INTERVIEW", title: "Pairing session", notes: "React + Node.", daysAgo: 12 },
        { type: "OFFER", title: "Offer received", notes: "Details sent by email.", daysAgo: 2 },
      ],
    },
  },
  {
    company: "Lumen Field Systems",
    title: "Software Engineer (Field Ops)",
    location: "Austin, TX (US)",
    remoteType: "HYBRID",
    salaryText: "$120-140k",
    jobUrl: "https://lumen-field.example.com/careers/software-engineer",
    application: {
      status: "INTERESTED",
      notes: "Small team, unclear remote policy. Verify before applying.",
      events: [{ type: "STATUS_CHANGE", title: "Status set to Interested", daysAgo: 3 }],
    },
  },
  {
    company: "Tessera Fintech Lab",
    title: "Data Scientist (Credit Risk)",
    location: "Munich, Germany",
    remoteType: "HYBRID",
    salaryText: "€75-90k",
    jobUrl: "https://tessera-lab.example.com/roles/data-scientist",
    application: {
      status: "WITHDRAWN",
      appliedDaysAgo: 21,
      notes: "Withdrew - role needed German C1 and I am not there yet.",
      events: [
        { type: "APPLIED", title: "Status changed: To Apply → Applied", daysAgo: 21 },
        { type: "STATUS_CHANGE", title: "Status changed: Applied → Withdrawn", daysAgo: 12 },
      ],
    },
  },
  {
    company: "Mira Retail Cloud",
    title: "Senior Mobile Engineer",
    location: "Istanbul, Türkiye",
    remoteType: "HYBRID",
    salaryText: "TRY 2.4-3.0M",
    jobUrl: "https://mira-retail.example.com/jobs/senior-mobile",
    application: {
      status: "HR_INTERVIEW",
      appliedDaysAgo: 9,
      interviewInDays: 2,
      nextFollowUpInDays: 3,
      recruiterName: "Elif Demir",
      events: [
        { type: "APPLIED", title: "Status changed: To Apply → Applied", daysAgo: 9 },
        { type: "HR_INTERVIEW", title: "HR interview booked", daysAgo: 1 },
      ],
    },
  },
  {
    company: "Kestrel Security",
    title: "Developer Experience Engineer",
    location: "Remote (Global)",
    remoteType: "REMOTE",
    salaryText: "USD 110-140k",
    jobUrl: "https://kestrel-security.example.com/jobs/dx-engineer",
    notes: "No application yet - decide after the final interview for the security role.",
  },
];

async function main() {
  const { prisma } = await import("@/lib/db/prisma");

  console.log("Seeding development data…\n");

  const companyIds = new Map<string, string>();
  let createdCompanies = 0;
  let createdJobs = 0;
  let createdApplications = 0;
  let createdEvents = 0;

  for (const spec of COMPANIES) {
    const existing = await prisma.company.findFirst({
      where: { name: spec.name, source: "MANUAL" },
      select: { id: true },
    });
    if (existing) {
      companyIds.set(spec.name, existing.id);
      continue;
    }
    const company = await prisma.company.create({
      data: {
        name: spec.name,
        tagline: spec.tagline,
        websiteUrl: spec.websiteUrl,
        jobsUrl: spec.jobsUrl,
        employees: spec.employees,
        hqCountry: spec.hqCountry,
        hqState: spec.hqState,
        hqCity: spec.hqCity,
        remoteHiring: spec.remoteHiring,
        source: "MANUAL",
        hiringFunctions: spec.hiringFunctions,
        engineeringRoles: spec.engineeringRoles,
        salesMarketingCsRoles: spec.salesMarketingCsRoles,
        growthSignals: spec.growthSignals,
        fundingSignals: spec.fundingSignals,
        notes: spec.notes ?? null,
        favorite: spec.favorite ?? false,
        ignored: spec.ignored ?? false,
      },
      select: { id: true },
    });
    companyIds.set(spec.name, company.id);
    createdCompanies += 1;
  }

  const now = Date.now();
  const daysAgo = (days: number) => new Date(now - days * 24 * 60 * 60 * 1000);
  const daysAhead = (days: number) => new Date(now + days * 24 * 60 * 60 * 1000);

  for (const spec of JOB_SPECS) {
    const companyId = companyIds.get(spec.company);
    if (!companyId) continue;

    const existingJob = await prisma.job.findFirst({
      where: { companyId, title: spec.title },
      select: { id: true, application: { select: { id: true } } },
    });
    if (existingJob) {
      if (existingJob.application) continue;
      if (!spec.application) continue;
    }

    const job =
      existingJob ??
      (await prisma.job.create({
        data: {
          companyId,
          title: spec.title,
          jobUrl: spec.jobUrl,
          location: spec.location,
          remoteType: spec.remoteType,
          salaryText: spec.salaryText,
          notes: spec.notes ?? null,
          discoveredAt: daysAgo(spec.application?.appliedDaysAgo ?? 5),
        },
        select: { id: true },
      }));

    if (!existingJob) createdJobs += 1;
    if (!spec.application) continue;

    const appliedAt =
      spec.application.appliedDaysAgo !== undefined ? daysAgo(spec.application.appliedDaysAgo) : null;
    const lastActivityAt =
      spec.application.events && spec.application.events.length > 0
        ? daysAgo(Math.min(...spec.application.events.map((event) => event.daysAgo)))
        : (appliedAt ?? daysAgo(3));

    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        status: spec.application.status,
        appliedAt,
        lastActivityAt,
        nextFollowUpAt:
          spec.application.nextFollowUpInDays !== undefined
            ? daysAhead(spec.application.nextFollowUpInDays)
            : null,
        interviewAt:
          spec.application.interviewInDays !== undefined ? daysAhead(spec.application.interviewInDays) : null,
        salaryExpectation: spec.application.salaryExpectation ?? null,
        recruiterName: spec.application.recruiterName ?? null,
        recruiterEmail: spec.application.recruiterEmail ?? null,
        referralName: spec.application.referralName ?? null,
        notes: spec.application.notes ?? null,
        rejectionReason: spec.application.rejectionReason ?? null,
        createdAt: appliedAt ?? daysAgo(5),
      },
      select: { id: true },
    });
    createdApplications += 1;

    const events = spec.application.events ?? [
      { type: "STATUS_CHANGE" as ApplicationEventType, title: `Status set to ${spec.application.status}`, daysAgo: 2 },
    ];
    for (const event of events) {
      await prisma.applicationEvent.create({
        data: {
          applicationId: application.id,
          type: event.type,
          title: event.title,
          notes: event.notes ?? null,
          eventAt: daysAgo(event.daysAgo),
          createdAt: daysAgo(event.daysAgo),
        },
      });
      createdEvents += 1;
    }
  }

  console.log(`Companies:    ${createdCompanies} created (${COMPANIES.length - createdCompanies} already present)`);
  console.log(`Jobs:         ${createdJobs} created`);
  console.log(`Applications: ${createdApplications} created`);
  console.log(`Events:       ${createdEvents} created`);
  const [companyCount, jobCount, applicationCount] = await Promise.all([
    prisma.company.count(),
    prisma.job.count(),
    prisma.application.count(),
  ]);
  console.log(`\nTotals in database: ${companyCount} companies, ${jobCount} jobs, ${applicationCount} applications`);
  console.log("\nSeed complete.");
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
