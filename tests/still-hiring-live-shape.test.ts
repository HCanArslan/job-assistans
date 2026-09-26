/**
 * Normalization against the current public shared-view shape:
 * button fields for URLs, numeric employees, choices sent as a map keyed by
 * select id, and lookup cells wrapped in `valuesByForeignRowId`.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { normalizeSharedView, resolveRemoteHiring, resolveUrl } from "@/lib/still-hiring/normalize";

const fixture = JSON.parse(
  readFileSync(path.join(__dirname, "fixtures", "shared-view.live-shape.json"), "utf8"),
);
const result = normalizeSharedView(fixture);

const byName = new Map(result.companies.map((company) => [company.name, company]));

describe("current shared-view shape", () => {
  it("reads every row and reports the one without a company name", () => {
    expect(result.totalRows).toBe(6);
    expect(result.companies).toHaveLength(5);
    expect(result.invalid).toEqual([
      { rowId: "recLive0000000006", reason: "Missing Company Name" },
    ]);
  });

  it("parses company name, HQ and tagline", () => {
    const nimbus = byName.get("Nimbus Analytics")!;
    expect(nimbus.sourceId).toBe("recLive0000000001");
    expect(nimbus.hqCountry).toBe("US");
    expect(nimbus.hqState).toBe("US-WA");
    expect(nimbus.hqCity).toBe("Seattle");
    expect(nimbus.tagline).toBe("Streaming analytics for product teams.");
    expect(byName.get("Orbit Health")!.tagline).toBeNull();
  });

  it("extracts the URL from Airtable button cells", () => {
    expect(byName.get("Nimbus Analytics")!.jobsUrl).toBe("https://nimbus.example.com/careers");
    expect(byName.get("Kite Interiors")!.jobsUrl).toBe("https://kite.example.com/jobs");
    // A button without a URL must not fall back to the button label ("Open").
    expect(byName.get("Vantage Logistics")!.jobsUrl).toBeNull();
  });

  it("parses numeric employee counts", () => {
    expect(byName.get("Nimbus Analytics")!.employees).toBe(320);
    expect(byName.get("Vantage Logistics")!.employees).toBe(4800);
    expect(byName.get("Kite Interiors")!.employees).toBeNull();
    expect(byName.get("Kite Interiors")!.employeesText).toBeNull();
  });

  it("resolves select ids through choices sent as a map", () => {
    const nimbus = byName.get("Nimbus Analytics")!;
    expect(nimbus.hiringFunctions).toEqual(["Hiring Engineering", "Hiring Product"]);
    expect(nimbus.engineeringRoles).toEqual(["Hiring Software Engineering", "Hiring Dev Ops"]);
    expect(nimbus.salesMarketingCsRoles).toEqual(["Hiring AE/AM"]);
    expect(nimbus.growthSignals).toEqual([
      "6-mo Headcount Growth: 20%+",
      "Recruiting Velocity: High",
    ]);
    expect(nimbus.fundingSignals).toEqual(["Funding: $10M to $50M", "Last Funding: 4 to 12 Mos"]);
    expect(byName.get("Vantage Logistics")!.engineeringRoles).toEqual(["Hiring QA"]);
  });

  it("normalizes lookup-based Remote Hiring, including mixed answers", () => {
    expect(byName.get("Nimbus Analytics")!.remoteHiring).toBe("YES");
    // One "Yes" among conflicting role rows still means remote hiring happens.
    expect(byName.get("Kite Interiors")!.remoteHiring).toBe("YES");
    expect(byName.get("Vantage Logistics")!.remoteHiring).toBe("NO");
    expect(byName.get("Orbit Health")!.remoteHiring).toBe("NOT_SURE");
    expect(byName.get("Ashgrove Robotics")!.remoteHiring).toBe("UNKNOWN");
  });

  it("never leaks raw Airtable ids or foreign row ids into stored arrays", () => {
    const values = result.companies.flatMap((company) => [
      ...company.hiringFunctions,
      ...company.engineeringRoles,
      ...company.salesMarketingCsRoles,
      ...company.growthSignals,
      ...company.fundingSignals,
    ]);
    expect(values.length).toBeGreaterThan(0);
    expect(values.filter((value) => value.startsWith("sel"))).toEqual([]);
    expect(values.filter((value) => value.startsWith("rec"))).toEqual([]);
  });
});

describe("URL and lookup helpers", () => {
  it("resolveUrl understands button cells, plain strings and objects", () => {
    expect(resolveUrl({ label: "Open", url: "https://example.com/a" })).toBe("https://example.com/a");
    expect(resolveUrl("https://example.com/b")).toBe("https://example.com/b");
    expect(resolveUrl("www.example.com")).toBe("https://www.example.com");
    expect(resolveUrl({ label: "Open" })).toBeNull();
    expect(resolveUrl(null)).toBeNull();
  });

  it("resolveRemoteHiring ignores foreign row ids when resolving the lookup", () => {
    const choices = new Map([
      ["selYes", "Yes"],
      ["selNo", "No"],
    ]);
    expect(
      resolveRemoteHiring(
        {
          valuesByForeignRowId: { recOne: ["selNo"], recTwo: ["selYes"] },
          foreignRowIdOrder: ["recOne", "recTwo"],
        },
        choices,
      ),
    ).toBe("YES");
    expect(resolveRemoteHiring({ valuesByForeignRowId: {}, foreignRowIdOrder: [] }, choices)).toBe(
      "UNKNOWN",
    );
  });
});
