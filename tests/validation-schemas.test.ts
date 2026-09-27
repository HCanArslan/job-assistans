import { describe, expect, it } from "vitest";

import {
  companyInputSchema,
  eventInputSchema,
  jobInputSchema,
  optionalText,
  optionalUrl,
} from "@/lib/validation/schemas";

describe("optional field helpers", () => {
  it("treats a missing key the same as an empty string", () => {
    expect(optionalUrl.parse(undefined)).toBeNull();
    expect(optionalText().parse(undefined)).toBeNull();
  });

  it("normalizes a bare domain and passes through an absolute URL", () => {
    expect(optionalUrl.parse("acme.com")).toBe("https://acme.com");
    expect(optionalUrl.parse("https://acme.com/careers")).toBe("https://acme.com/careers");
  });
});

describe("companyInputSchema", () => {
  it("accepts the partial payload built by the inline create-on-save path", () => {
    // lib/actions/jobs.ts parses exactly this shape when the user picks
    // "Create company …" in the company combobox on the add-job page.
    const parsed = companyInputSchema.parse({ name: "Acme Cloud", remoteHiring: "UNKNOWN" });

    expect(parsed.name).toBe("Acme Cloud");
    expect(parsed.websiteUrl).toBeNull();
    expect(parsed.jobsUrl).toBeNull();
    expect(parsed.linkedinUrl).toBeNull();
    expect(parsed.employees).toBeNull();
    expect(parsed.hqCountry).toBeNull();
    expect(parsed.tagline).toBeNull();
    expect(parsed.notes).toBeNull();
  });

  it("parses a full company form submission", () => {
    const parsed = companyInputSchema.parse({
      name: "Acme Cloud",
      websiteUrl: "acme.com",
      jobsUrl: "",
      linkedinUrl: "https://linkedin.com/company/acme",
      employees: "120",
      hqCountry: "DE",
      hqState: "",
      hqCity: "Berlin",
      remoteHiring: "YES",
      tagline: "Cloud infra",
      notes: "",
    });

    expect(parsed.websiteUrl).toBe("https://acme.com");
    expect(parsed.jobsUrl).toBeNull();
    expect(parsed.employees).toBe(120);
    expect(parsed.hqState).toBeNull();
    expect(parsed.notes).toBeNull();
  });

  it("still requires a name", () => {
    expect(companyInputSchema.safeParse({ name: "   " }).success).toBe(false);
  });
});

describe("jobInputSchema", () => {
  it("accepts a job payload that omits the optional fields", () => {
    const parsed = jobInputSchema.parse({ companyId: "cmp_1", title: "Backend Engineer" });

    expect(parsed.jobUrl).toBeNull();
    expect(parsed.location).toBeNull();
    expect(parsed.remoteType).toBe("UNKNOWN");
  });

  it("still requires a company", () => {
    const result = jobInputSchema.safeParse({ companyId: "", title: "Backend Engineer" });
    expect(result.success).toBe(false);
  });
});

describe("eventInputSchema", () => {
  it("accepts an event without an optional event date", () => {
    const parsed = eventInputSchema.parse({ type: "NOTE", title: "Pinged recruiter" });
    expect(parsed.eventAt).toBeNull();
  });
});
