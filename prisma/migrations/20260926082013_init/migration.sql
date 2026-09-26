-- CreateEnum
CREATE TYPE "CompanySource" AS ENUM ('STILL_HIRING', 'MANUAL');

-- CreateEnum
CREATE TYPE "RemoteHiring" AS ENUM ('YES', 'NO', 'NOT_SURE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "RemoteType" AS ENUM ('REMOTE', 'HYBRID', 'ONSITE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('INTERESTED', 'TO_APPLY', 'APPLIED', 'WAITING_REPLY', 'RECRUITER_SCREEN', 'HR_INTERVIEW', 'TECHNICAL_INTERVIEW', 'TAKE_HOME', 'LIVE_CODING', 'HIRING_MANAGER', 'FINAL_INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN', 'GHOSTED');

-- CreateEnum
CREATE TYPE "ApplicationEventType" AS ENUM ('STATUS_CHANGE', 'APPLIED', 'RECRUITER_CONTACT', 'HR_INTERVIEW', 'TECHNICAL_INTERVIEW', 'TAKE_HOME_RECEIVED', 'TAKE_HOME_SUBMITTED', 'LIVE_CODING', 'HIRING_MANAGER', 'FINAL_INTERVIEW', 'FOLLOW_UP', 'OFFER', 'REJECTION', 'NOTE', 'CUSTOM');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "jobsUrl" TEXT,
    "linkedinUrl" TEXT,
    "employees" INTEGER,
    "employeesText" TEXT,
    "hqCountry" TEXT,
    "hqState" TEXT,
    "hqCity" TEXT,
    "tagline" TEXT,
    "remoteHiring" "RemoteHiring" NOT NULL DEFAULT 'UNKNOWN',
    "source" "CompanySource" NOT NULL DEFAULT 'MANUAL',
    "sourceId" TEXT,
    "stillHiringImportedAt" TIMESTAMP(3),
    "hiringFunctions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "engineeringRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "salesMarketingCsRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "growthSignals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fundingSignals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "ignored" BOOLEAN NOT NULL DEFAULT false,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "jobUrl" TEXT,
    "location" TEXT,
    "remoteType" "RemoteType" NOT NULL DEFAULT 'UNKNOWN',
    "salaryText" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'INTERESTED',
    "appliedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextFollowUpAt" TIMESTAMP(3),
    "interviewAt" TIMESTAMP(3),
    "salaryExpectation" TEXT,
    "recruiterName" TEXT,
    "recruiterEmail" TEXT,
    "referralName" TEXT,
    "notes" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" "ApplicationEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "eventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Company_name_idx" ON "Company"("name");

-- CreateIndex
CREATE INDEX "Company_source_idx" ON "Company"("source");

-- CreateIndex
CREATE INDEX "Company_sourceId_idx" ON "Company"("sourceId");

-- CreateIndex
CREATE INDEX "Company_hqCountry_idx" ON "Company"("hqCountry");

-- CreateIndex
CREATE INDEX "Company_remoteHiring_idx" ON "Company"("remoteHiring");

-- CreateIndex
CREATE UNIQUE INDEX "Company_source_sourceId_key" ON "Company"("source", "sourceId");

-- CreateIndex
CREATE INDEX "Job_companyId_idx" ON "Job"("companyId");

-- CreateIndex
CREATE INDEX "Job_title_idx" ON "Job"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Application_jobId_key" ON "Application"("jobId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Application_nextFollowUpAt_idx" ON "Application"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "Application_interviewAt_idx" ON "Application"("interviewAt");

-- CreateIndex
CREATE INDEX "Application_updatedAt_idx" ON "Application"("updatedAt");

-- CreateIndex
CREATE INDEX "ApplicationEvent_applicationId_idx" ON "ApplicationEvent"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationEvent_eventAt_idx" ON "ApplicationEvent"("eventAt");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationEvent" ADD CONSTRAINT "ApplicationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
