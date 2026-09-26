import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildColumnIndex,
  extractStillHiringTable,
  flattenCellValue,
  normalizeSharedView,
  parseEmployees,
  resolveChoice,
  resolveLookupSelect,
  resolveMultiSelect,
} from "@/lib/still-hiring/normalize";
import { StillHiringStructureError } from "@/lib/still-hiring/types";

const fixture = JSON.parse(
  readFileSync(path.join(__dirname, "fixtures", "shared-view.sample.json"), "utf8"),
);

describe("StillHiring shared view normalization", () => {
  const result = normalizeSharedView(fixture);

  it("captures every row and flags rows without a company name", () => {
    expect(result.totalRows).toBe(4);
    expect(result.companies).toHaveLength(3);
    expect(result.invalid).toEqual([{ rowId: "recNoName000000003", reason: "Missing Company Name" }]);
  });

  it("parses company name, jobs URL, HQ and tagline", () => {
    const acme = result.companies[0];
    expect(acme.name).toBe("Acme Cloud");
    expect(acme.jobsUrl).toBe("https://acme-cloud.example.com/careers");
    expect(acme.hqCountry).toBe("Germany");
    expect(acme.hqState).toBe("Berlin");
    expect(acme.hqCity).toBe("Berlin");
    expect(acme.tagline).toBe("Cloud infrastructure for data teams");
    expect(acme.sourceId).toBe("recFull00000000001");
  });

  it("parses employee ranges and plain numbers", () => {
    expect(result.companies[0].employees).toBe(51);
    expect(result.companies[0].employeesText).toBe("51-200");
    expect(result.companies[1].employees).toBe(42);
    expect(result.companies[2].employees).toBe(1000);
    expect(result.companies[2].employeesText).toBe("1,000+");
  });

  it("converts Airtable select ids into human-readable names", () => {
    expect(result.companies[0].engineeringRoles).toEqual([
      "Hiring Software Engineering",
      "Hiring Dev Ops",
    ]);
    expect(result.companies[0].hiringFunctions).toEqual(["Hiring Engineering", "Hiring Product"]);
    expect(result.companies[0].salesMarketingCsRoles).toEqual(["Hiring Sales"]);
    expect(result.companies[0].growthSignals).toEqual([
      "6-mo Headcount Growth: 20%+",
      "Recruiting Velocity: High",
    ]);
    expect(result.companies[0].fundingSignals).toEqual([
      "Funding: $10M to $50M",
      "Last Funding: 0-3 Mos",
    ]);
  });

  it("keeps plain-text values as-is and de-duplicates repeats", () => {
    expect(result.companies[1].engineeringRoles).toEqual([
      "Hiring Software Engineering",
      "Hiring Product Design",
    ]);
    expect(result.companies[2].engineeringRoles).toEqual(["Hiring Software Engineering"]);
    expect(result.companies[2].hqCountry).toBe("Austria");
  });

  it("normalizes Remote Hiring into YES / NO / NOT_SURE / UNKNOWN", () => {
    expect(result.companies[0].remoteHiring).toBe("YES");
    expect(result.companies[1].remoteHiring).toBe("NO");
    expect(result.companies[2].remoteHiring).toBe("NOT_SURE");
  });

  it("still resolves columns when Airtable field ids change (name-based mapping)", () => {
    const renamed = JSON.parse(JSON.stringify(fixture));
    renamed.data.table.columns = renamed.data.table.columns.map(
      (column: { id: string }, index: number) => ({ ...column, id: `fldRenamed${index}` }),
    );
    const rows = renamed.data.table.rows as {
      cellValuesByColumnId: Record<string, unknown>;
    }[];
    const oldIds = fixture.data.table.columns.map((column: { id: string }) => column.id);
    rows.forEach((row) => {
      const next: Record<string, unknown> = {};
      oldIds.forEach((oldId: string, index: number) => {
        if (oldId in row.cellValuesByColumnId) {
          next[`fldRenamed${index}`] = row.cellValuesByColumnId[oldId];
        }
      });
      row.cellValuesByColumnId = next;
    });

    const renamedResult = normalizeSharedView(renamed);
    expect(renamedResult.companies).toHaveLength(3);
    expect(renamedResult.companies[0].name).toBe("Acme Cloud");
    expect(renamedResult.companies[0].engineeringRoles).toEqual([
      "Hiring Software Engineering",
      "Hiring Dev Ops",
    ]);
    expect(renamedResult.companies[0].remoteHiring).toBe("YES");
  });

  it("rejects payloads that are not a shared view response", () => {
    expect(() => normalizeSharedView(null)).toThrow(StillHiringStructureError);
    expect(() => normalizeSharedView({ foo: "bar" })).toThrow(StillHiringStructureError);
    expect(() => normalizeSharedView({ data: { table: { columns: [], rows: [] } } })).toThrow(
      StillHiringStructureError,
    );
    expect(() =>
      normalizeSharedView({ data: { table: { columns: [{ id: "fldX", name: "Other" }], rows: [] } } }),
    ).toThrow(StillHiringStructureError);
  });
});

describe("normalization helpers", () => {
  const index = buildColumnIndex(fixture.data.table.columns as never[]);
  const choices = index.choicesByColumnId.get("fld6mppkd6IhszvHp")!;

  it("resolves single choices, multi selects and lookups", () => {
    expect(resolveChoice("selr7HWN7IyhlVNs5", choices)).toBe("Hiring Software Engineering");
    expect(resolveChoice("Unknown value", choices)).toBe("Unknown value");
    expect(resolveChoice(null, choices)).toBeNull();
    expect(resolveMultiSelect([["selDEVOPS"], ["selDEVOPS"]], choices)).toEqual(["Hiring Dev Ops"]);
    expect(resolveLookupSelect([["selRMYES"]], index.choicesByColumnId.get("fldom25Esjr0mos9E")!)).toBe("Yes");
  });

  it("flattens nested lookup values", () => {
    expect(flattenCellValue([[[["deep"]]], "shallow"])).toEqual(["deep", "shallow"]);
    expect(flattenCellValue([{ id: "rec1" }, { name: "Named record" }])).toEqual([
      "rec1",
      "Named record",
    ]);
  });

  it("parses employee values defensively", () => {
    expect(parseEmployees("201-500")).toEqual({ employees: 201, employeesText: "201-500" });
    expect(parseEmployees("50 - 100")).toEqual({ employees: 50, employeesText: "50 - 100" });
    expect(parseEmployees("1,000+")).toEqual({ employees: 1000, employeesText: "1,000+" });
    expect(parseEmployees(120)).toEqual({ employees: 120, employeesText: "120" });
    expect(parseEmployees("")).toEqual({ employees: null, employeesText: null });
    expect(parseEmployees(null)).toEqual({ employees: null, employeesText: null });
  });

  it("extracts the table or explains why it cannot", () => {
    const table = extractStillHiringTable(fixture);
    expect(table.rows).toHaveLength(4);
    expect(() => extractStillHiringTable({ data: { table: { columns: [] } } })).toThrow(
      /rows/,
    );
  });
});
