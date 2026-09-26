import { describe, expect, it } from "vitest";

import {
  STILL_HIRING_OWNED_FIELDS,
  buildStillHiringCreateData,
  buildStillHiringUpdateData,
} from "@/lib/still-hiring/import";
import type { NormalizedCompany } from "@/lib/still-hiring/types";

const company: NormalizedCompany = {
  sourceId: "recABC123",
  name: "Acme Cloud",
  websiteUrl: "https://acme-cloud.example.com",
  jobsUrl: "https://acme-cloud.example.com/careers",
  linkedinUrl: null,
  employees: 51,
  employeesText: "51-200",
  hqCountry: "Germany",
  hqState: "Berlin",
  hqCity: "Berlin",
  tagline: "Cloud infrastructure for data teams",
  remoteHiring: "YES",
  hiringFunctions: ["Hiring Engineering"],
  engineeringRoles: ["Hiring Software Engineering"],
  salesMarketingCsRoles: ["Hiring Sales"],
  growthSignals: ["Recruiting Velocity: High"],
  fundingSignals: ["Funding: $10M to $50M"],
};

const importedAt = new Date("2026-09-26T10:12:00.000Z");

describe("StillHiring update payload (preservation rules)", () => {
  it("only ever writes StillHiring-owned fields", () => {
    const data = buildStillHiringUpdateData(company, importedAt);
    expect(Object.keys(data).sort()).toEqual([...STILL_HIRING_OWNED_FIELDS, "websiteUrl"].sort());
  });

  it("never touches user-owned fields", () => {
    const data = buildStillHiringUpdateData(company, importedAt);
    for (const field of [
      "notes",
      "favorite",
      "ignored",
      "source",
      "sourceId",
      "jobs",
      "applications",
      "events",
      "recruiterName",
      "interviewAt",
      "nextFollowUpAt",
    ]) {
      expect(data).not.toHaveProperty(field);
    }
  });

  it("marks new companies as STILL_HIRING with their Airtable record id", () => {
    const data = buildStillHiringCreateData(company, importedAt);
    expect(data.source).toBe("STILL_HIRING");
    expect(data.sourceId).toBe("recABC123");
    expect(data.stillHiringImportedAt).toEqual(importedAt);
  });

  it("carries the normalized signals and remote hiring value", () => {
    const data = buildStillHiringUpdateData(company, importedAt);
    expect(data.remoteHiring).toBe("YES");
    expect(data.engineeringRoles).toEqual(["Hiring Software Engineering"]);
    expect(data.employees).toBe(51);
    expect(data.employeesText).toBe("51-200");
  });
});
