import {
  StillHiringStructureError,
  type InvalidRow,
  type NormalizeResult,
  type NormalizedCompany,
  type RemoteHiringValue,
  type SharedViewColumn,
  type SharedViewPayload,
  type SharedViewRow,
  type SharedViewTable,
} from "./types";

/** Column names as they appear in the StillHiring shared view. */
export const COLUMN_SPEC = {
  companyName: { name: "Company Name", fallbackFieldId: "fldekrsjTIcqFNlgA" },
  jobsUrl: { name: "Jobs Page", fallbackFieldId: "fldGCLdaFPaVoUGNa" },
  employees: { name: "Employees", fallbackFieldId: "fld2uBkEnCJlWJh4Q" },
  hiringFunctions: { name: "Open Roles Found by Function", fallbackFieldId: "fldRHOXbozzQmP96S" },
  growthSignals: { name: "Keyplay Growth Signals", fallbackFieldId: "fldVd9oe4yRCUDuK0" },
  fundingSignals: { name: "Funding", fallbackFieldId: "fldznxiyBr1SrhMms" },
  hqCountry: { name: "HQ Country", fallbackFieldId: "fldF4Zl4TjyURN6uT" },
  hqState: { name: "HQ State", fallbackFieldId: "fldS9muQ0Ku3DApqy" },
  hqCity: { name: "HQ City", fallbackFieldId: "fldbMzTGRHlOGk6kj" },
  tagline: { name: "Tagline", fallbackFieldId: "fldkvZ1oX1bRficKI" },
  salesMarketingCsRoles: {
    name: "Sales, Marketing, CS Open Roles Found",
    fallbackFieldId: "fldanMFDPmhc8KzMI",
  },
  engineeringRoles: {
    name: "Engineering, Product, Design Open Roles Found",
    fallbackFieldId: "fld6mppkd6IhszvHp",
  },
  remoteHiring: { name: "Remote Hiring?", fallbackFieldId: "fldom25Esjr0mos9E" },
} as const;

/** Optional columns - used only when the shared view happens to include them. */
const OPTIONAL_COLUMN_SPEC = {
  websiteUrl: { names: ["Website", "Company Website", "Homepage", "Website URL"] },
  linkedinUrl: { names: ["LinkedIn", "LinkedIn URL", "Linkedin"] },
} as const;

export type ColumnKey = keyof typeof COLUMN_SPEC;

type ChoiceMap = Map<string, string>;

interface ColumnIndex {
  byName: Map<string, SharedViewColumn>;
  byId: Map<string, SharedViewColumn>;
  choicesByColumnId: Map<string, ChoiceMap>;
}

interface ResolvedColumn {
  id: string | null;
  choices: ChoiceMap;
}

const normalizeKey = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

/** Validates the captured payload and returns the shared-view table. */
export function extractStillHiringTable(payload: unknown): SharedViewTable {
  if (!payload || typeof payload !== "object") {
    throw new StillHiringStructureError(
      "Captured payload is not an object - the readSharedViewData response was empty or invalid.",
    );
  }
  const maybePayload = payload as SharedViewPayload;
  const table = maybePayload.data?.table;
  if (!table) {
    throw new StillHiringStructureError(
      "Unexpected shared view structure: `data.table` is missing from the captured response.",
    );
  }
  if (!Array.isArray(table.columns)) {
    throw new StillHiringStructureError(
      "Unexpected shared view structure: `data.table.columns` is missing or not an array.",
    );
  }
  if (!Array.isArray(table.rows)) {
    throw new StillHiringStructureError(
      "Unexpected shared view structure: `data.table.rows` is missing or not an array.",
    );
  }
  if (table.columns.length === 0) {
    throw new StillHiringStructureError(
      "Shared view returned no columns - the view is probably not public any more.",
    );
  }
  return table;
}

export function buildColumnIndex(columns: SharedViewColumn[]): ColumnIndex {
  const byName = new Map<string, SharedViewColumn>();
  const byId = new Map<string, SharedViewColumn>();
  const choicesByColumnId = new Map<string, ChoiceMap>();
  for (const column of columns) {
    if (!column || typeof column.id !== "string" || typeof column.name !== "string") continue;
    byName.set(normalizeKey(column.name), column);
    byId.set(column.id, column);
    const choices = column.typeOptions?.choices;
    if (Array.isArray(choices)) {
      const map: ChoiceMap = new Map();
      for (const choice of choices) {
        if (choice && typeof choice.id === "string" && typeof choice.name === "string") {
          map.set(choice.id, choice.name);
        }
      }
      choicesByColumnId.set(column.id, map);
    } else if (choices && typeof choices === "object") {
      // Current shared-view responses send choices as `{ [selectId]: choice }`.
      const map: ChoiceMap = new Map();
      for (const [selectId, choice] of Object.entries(choices)) {
        if (choice && typeof choice.name === "string") {
          map.set(choice.id ?? selectId, choice.name);
        }
      }
      choicesByColumnId.set(column.id, map);
    }
  }
  return { byName, byId, choicesByColumnId };
}

/**
 * Resolves a column by its current name (dynamic mapping) and falls back to the
 * known Airtable field id when the name is not found.
 */
function resolveColumn(index: ColumnIndex, key: ColumnKey): ResolvedColumn {
  const spec = COLUMN_SPEC[key];
  const byName = index.byName.get(normalizeKey(spec.name));
  const byId = index.byId.get(spec.fallbackFieldId) ?? null;
  const column = byName ?? byId;
  if (!column) return { id: null, choices: new Map() };
  return { id: column.id, choices: index.choicesByColumnId.get(column.id) ?? new Map() };
}

function resolveOptionalColumn(index: ColumnIndex, names: readonly string[]): string | null {
  for (const name of names) {
    const column = index.byName.get(normalizeKey(name));
    if (column) return column.id;
  }
  return null;
}

/** Recursively flattens Airtable cell values (lookups arrive nested). */
export function flattenCellValue(value: unknown, out: unknown[] = []): unknown[] {
  if (value === null || value === undefined) return out;
  if (Array.isArray(value)) {
    for (const item of value) flattenCellValue(item, out);
    return out;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.name === "string") {
      out.push(record.name);
      return out;
    }
    if (typeof record.id === "string") {
      out.push(record.id);
      return out;
    }
    for (const nested of Object.values(record)) flattenCellValue(nested, out);
    return out;
  }
  out.push(value);
  return out;
}

/** Turns one raw cell value into a human-readable string (choice ids resolved). */
export function resolveChoice(value: unknown, choices: ChoiceMap): string | null {
  const flat = flattenCellValue(value);
  for (const item of flat) {
    if (item === null || item === undefined) continue;
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (!trimmed) continue;
      const mapped = choices.get(trimmed);
      return mapped ?? trimmed;
    }
    if (typeof item === "number" || typeof item === "boolean") return String(item);
  }
  return null;
}

/** Multi-select / lookup-wrapper cell -> deduped array of human-readable names. */
export function resolveMultiSelect(value: unknown, choices: ChoiceMap): string[] {
  const flat = flattenCellValue(value);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of flat) {
    if (item === null || item === undefined) continue;
    let label: string | null = null;
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (!trimmed) continue;
      label = choices.get(trimmed) ?? trimmed;
    } else if (typeof item === "number" || typeof item === "boolean") {
      label = String(item);
    }
    if (label && !seen.has(label)) {
      seen.add(label);
      result.push(label);
    }
  }
  return result;
}

/** Single-value lookup (e.g. "Remote Hiring?") -> first resolved value. */
export function resolveLookupSelect(value: unknown, choices: ChoiceMap): string | null {
  // Lookup cells look like { valuesByForeignRowId: { recId: [selectId] }, foreignRowIdOrder: [...] }.
  // Prefer that map (in foreign-row order) so the foreign record ids are never
  // mistaken for select values.
  const lookup = extractLookupValuesByForeignRowId(value);
  if (lookup) {
    for (const item of lookup) {
      const resolved = resolveChoice(item, choices);
      if (resolved) return resolved;
    }
    return null;
  }
  return resolveChoice(value, choices);
}

/** Returns every lookup value in foreign-row order, or null when not a lookup cell. */
export function extractLookupValuesByForeignRowId(value: unknown): unknown[] | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const byForeignRow = record.valuesByForeignRowId;
  if (!byForeignRow || typeof byForeignRow !== "object" || Array.isArray(byForeignRow)) return null;
  const order = Array.isArray(record.foreignRowIdOrder)
    ? record.foreignRowIdOrder.filter((id): id is string => typeof id === "string")
    : [];
  const keys = order.length > 0 ? order : Object.keys(byForeignRow as Record<string, unknown>);
  const values: unknown[] = [];
  for (const key of keys) {
    const cell = (byForeignRow as Record<string, unknown>)[key];
    if (cell === undefined || cell === null) continue;
    values.push(cell);
  }
  return values;
}

export function parseEmployees(value: unknown): { employees: number | null; employeesText: string | null } {
  const flat = flattenCellValue(value);
  for (const item of flat) {
    if (item === null || item === undefined) continue;
    if (typeof item === "number" && Number.isFinite(item)) {
      const rounded = Math.max(0, Math.round(item));
      return { employees: rounded, employeesText: String(rounded) };
    }
    if (typeof item === "string") {
      const raw = item.trim().replace(/[\u2013\u2014]/g, "-");
      if (!raw) continue;
      const digits = raw.replace(/[^0-9-]/g, "");
      if (/^\d+$/.test(digits)) {
        return { employees: Number(digits), employeesText: raw };
      }
      // Ranges such as "11-50", "201 - 500", "1,000+" -> keep the lower bound.
      const rangeMatch = digits.match(/^(\d+)\s*-\s*(\d+)$/);
      if (rangeMatch) {
        const lower = Number(rangeMatch[1]);
        return { employees: lower, employeesText: raw };
      }
      const plusMatch = raw.replace(/,/g, "").match(/(\d+)\s*\+/);
      if (plusMatch) {
        return { employees: Number(plusMatch[1]), employeesText: raw };
      }
    }
  }
  return { employees: null, employeesText: null };
}

/** Classifies one resolved string as a remote-hiring flag. */
function classifyRemoteHiringFlag(value: string): RemoteHiringValue {
  const normalized = value.trim().toLowerCase();
  if (/^(yes|y|true|remote)$/.test(normalized)) return "YES";
  if (/^(no|n|false|onsite|on-site|in[- ]?office)$/.test(normalized)) return "NO";
  if (/^(not sure|not-sure|unsure|maybe|unknown|n\/a)$/.test(normalized)) return "NOT_SURE";
  return "UNKNOWN";
}

/**
 * "Yes" / "No" / "Not sure" (whatever the underlying lookup holds) -> RemoteHiringValue.
 * The lookup holds one entry per open role, so all entries are classified: a single
 * "Yes" anywhere means the company does hire remotely; conflicting answers without a
 * "Yes" fall back to NOT_SURE.
 */
export function resolveRemoteHiring(value: unknown, choices: ChoiceMap): RemoteHiringValue {
  const lookupValues = extractLookupValuesByForeignRowId(value);
  const resolved = lookupValues
    ? lookupValues.flatMap((item) => resolveMultiSelect(item, choices))
    : resolveMultiSelect(value, choices);

  const flags = new Set(resolved.map(classifyRemoteHiringFlag));
  flags.delete("UNKNOWN");
  if (flags.size === 0) return "UNKNOWN";
  if (flags.size === 1) return [...flags][0] as RemoteHiringValue;
  return flags.has("YES") ? "YES" : "NOT_SURE";
}

/**
 * URL cells (Airtable "button" fields arrive as `{ label: "Open", url: "https://..." }`)
 * or plain url/text fields -> the first usable URL, or null.
 */
export function resolveUrl(value: unknown): string | null {
  for (const item of flattenCellValue(value)) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) return trimmed;
    if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  }
  return null;
}

function cleanString(value: unknown): string | null {
  const flat = flattenCellValue(value);
  for (const item of flat) {
    if (item === null || item === undefined) continue;
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (trimmed) return trimmed;
    }
    if (typeof item === "number") return String(item);
  }
  return null;
}

export function normalizeCompanyRow(
  row: SharedViewRow,
  index: ColumnIndex,
  resolved: Record<ColumnKey, ResolvedColumn>,
  optional: { websiteUrl: string | null; linkedinUrl: string | null },
): { company: NormalizedCompany | null; invalid: InvalidRow | null } {
  const cells = row.cellValuesByColumnId ?? {};
  const read = (key: ColumnKey): unknown => {
    const column = resolved[key];
    return column.id ? cells[column.id] : undefined;
  };
  const readChoices = (key: ColumnKey): ChoiceMap => resolved[key].choices;

  const name = cleanString(read("companyName"));
  if (!name) {
    return { company: null, invalid: { rowId: row.id, reason: "Missing Company Name" } };
  }

  const { employees, employeesText } = parseEmployees(read("employees"));

  const company: NormalizedCompany = {
    sourceId: row.id,
    name,
    websiteUrl: optional.websiteUrl ? resolveUrl(cells[optional.websiteUrl]) : null,
    jobsUrl: resolveUrl(read("jobsUrl")),
    linkedinUrl: optional.linkedinUrl ? resolveUrl(cells[optional.linkedinUrl]) : null,
    employees,
    employeesText,
    hqCountry: cleanString(read("hqCountry")),
    hqState: cleanString(read("hqState")),
    hqCity: cleanString(read("hqCity")),
    tagline: cleanString(read("tagline")),
    remoteHiring: resolveRemoteHiring(read("remoteHiring"), readChoices("remoteHiring")),
    hiringFunctions: resolveMultiSelect(read("hiringFunctions"), readChoices("hiringFunctions")),
    engineeringRoles: resolveMultiSelect(read("engineeringRoles"), readChoices("engineeringRoles")),
    salesMarketingCsRoles: resolveMultiSelect(
      read("salesMarketingCsRoles"),
      readChoices("salesMarketingCsRoles"),
    ),
    growthSignals: resolveMultiSelect(read("growthSignals"), readChoices("growthSignals")),
    fundingSignals: resolveMultiSelect(read("fundingSignals"), readChoices("fundingSignals")),
  };

  return { company, invalid: null };
}

/** Full payload -> normalized companies. */
export function normalizeSharedView(payload: unknown): NormalizeResult {
  const table = extractStillHiringTable(payload);
  const index = buildColumnIndex(table.columns ?? []);
  const resolved = Object.fromEntries(
    (Object.keys(COLUMN_SPEC) as ColumnKey[]).map((key) => [key, resolveColumn(index, key)]),
  ) as Record<ColumnKey, ResolvedColumn>;

  const missingRequired = (["companyName"] as ColumnKey[]).filter((key) => !resolved[key].id);
  if (missingRequired.length > 0) {
    throw new StillHiringStructureError(
      `Could not locate the required column "Company Name" (name or field id ${COLUMN_SPEC.companyName.fallbackFieldId}). The shared view schema may have changed.`,
    );
  }

  const optional = {
    websiteUrl: resolveOptionalColumn(index, OPTIONAL_COLUMN_SPEC.websiteUrl.names),
    linkedinUrl: resolveOptionalColumn(index, OPTIONAL_COLUMN_SPEC.linkedinUrl.names),
  };

  const companies: NormalizedCompany[] = [];
  const invalid: InvalidRow[] = [];
  const seenSourceIds = new Set<string>();

  for (const row of table.rows ?? []) {
    if (!row || typeof row.id !== "string") {
      invalid.push({ rowId: "(unknown)", reason: "Row without id" });
      continue;
    }
    if (seenSourceIds.has(row.id)) {
      invalid.push({ rowId: row.id, reason: "Duplicate row id in payload" });
      continue;
    }
    seenSourceIds.add(row.id);
    const { company, invalid: invalidRow } = normalizeCompanyRow(row, index, resolved, optional);
    if (company) companies.push(company);
    if (invalidRow) invalid.push(invalidRow);
  }

  const resolvedColumns: Record<string, string> = {};
  for (const [key, column] of Object.entries(resolved)) {
    if (column.id) resolvedColumns[key] = column.id;
  }

  return {
    companies,
    invalid,
    totalRows: (table.rows ?? []).length,
    columnCount: (table.columns ?? []).length,
    resolvedColumns,
  };
}
