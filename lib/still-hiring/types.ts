/**
 * Types for the public Airtable shared-view payload that StillHiring exposes.
 * Nothing in the running application depends on these at request time -
 * they are only used by the CLI sync (`npm run stillhiring:sync`).
 */

export interface SharedViewChoice {
  id: string;
  name: string;
  color?: string | null;
}

export interface SharedViewColumn {
  id: string;
  name: string;
  type?: string | null;
  typeOptions?: {
    /**
     * Airtable sends choices either as an array (older JSON responses) or as a
     * map keyed by select id (current msgpack responses) - both are supported.
     */
    choices?: SharedViewChoice[] | Record<string, SharedViewChoice> | null;
    choiceOrder?: string[] | null;
    [key: string]: unknown;
  } | null;
}

export interface SharedViewRow {
  id: string;
  createdTime?: string | null;
  cellValuesByColumnId?: Record<string, unknown> | null;
}

export interface SharedViewTable {
  id?: string | null;
  name?: string | null;
  columns?: SharedViewColumn[] | null;
  rows?: SharedViewRow[] | null;
}

export interface SharedViewPayload {
  data?: {
    table?: SharedViewTable | null;
  } | null;
}

export type RemoteHiringValue = "YES" | "NO" | "NOT_SURE" | "UNKNOWN";

export interface NormalizedCompany {
  /** Airtable record id, e.g. `recRm2wApwyDqDwpl`. */
  sourceId: string;
  name: string;
  websiteUrl: string | null;
  jobsUrl: string | null;
  linkedinUrl: string | null;
  employees: number | null;
  /** Original employee value when it is a range such as `11-50`. */
  employeesText: string | null;
  hqCountry: string | null;
  hqState: string | null;
  hqCity: string | null;
  tagline: string | null;
  remoteHiring: RemoteHiringValue;
  hiringFunctions: string[];
  engineeringRoles: string[];
  salesMarketingCsRoles: string[];
  growthSignals: string[];
  fundingSignals: string[];
}

export interface InvalidRow {
  rowId: string;
  reason: string;
}

export interface NormalizeResult {
  companies: NormalizedCompany[];
  invalid: InvalidRow[];
  totalRows: number;
  columnCount: number;
  resolvedColumns: Record<string, string>;
}

/** Thrown when the captured payload is not a readable shared view response. */
export class StillHiringStructureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StillHiringStructureError";
  }
}
