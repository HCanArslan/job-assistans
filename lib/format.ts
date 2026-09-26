/**
 * Date handling: dates are stored in UTC and rendered in Europe/Istanbul.
 * Datetime-local form values are interpreted as Istanbul wall-clock time.
 */
export const APP_TIME_ZONE = "Europe/Istanbul";

const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: APP_TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const DATE_ONLY = new Intl.DateTimeFormat("en-GB", {
  timeZone: APP_TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const SHORT_DATE = new Intl.DateTimeFormat("en-GB", {
  timeZone: APP_TIME_ZONE,
  day: "2-digit",
  month: "short",
});

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return DATE_TIME.format(d).replace(",", "");
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return DATE_ONLY.format(d).replace(",", "");
}

export function formatShortDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return SHORT_DATE.format(d);
}

/** Timezone offset (ms) of `tz` at the given instant. */
function tzOffsetMs(date: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) parts[part.type] = part.value;
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - date.getTime();
}

/** UTC bounds [start, end] of the calendar day that `reference` falls on in `tz`. */
export function zonedDayBounds(
  reference: Date = new Date(),
  tz: string = APP_TIME_ZONE,
): { start: Date; end: Date } {
  const offset = tzOffsetMs(reference, tz);
  const local = new Date(reference.getTime() + offset);
  const startLocalMs = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate(),
  );
  const start = new Date(startLocalMs - offset);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { start, end };
}

/** "2026-09-26" for the Istanbul calendar day of `date`. */
export function toZonedDateKey(date: Date | string, tz: string = APP_TIME_ZONE): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const parts: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d)) {
    parts[part.type] = part.value;
  }
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function isSameZonedDay(a: Date, b: Date, tz: string = APP_TIME_ZONE): boolean {
  return toZonedDateKey(a, tz) === toZonedDateKey(b, tz);
}

/** Formats a Date as `YYYY-MM-DDTHH:mm` in Istanbul time (for <input type="datetime-local">). */
export function toZonedDateTimeInput(date: Date | null | undefined, tz: string = APP_TIME_ZONE): string {
  if (!date) return "";
  const offset = tzOffsetMs(date, tz);
  const local = new Date(date.getTime() + offset);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
}

/** Parses a `datetime-local` / `date` value as Istanbul wall-clock time into a UTC Date. */
export function fromZonedInput(value: string | null | undefined, tz: string = APP_TIME_ZONE): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(trimmed);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match;
  const guessUtc = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h ?? "0"), Number(mi ?? "0"));
  const offset = tzOffsetMs(new Date(guessUtc), tz);
  return new Date(guessUtc - offset);
}

export function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

/** Whole days since `date` (Istanbul calendar days), as a non-negative number. */
export function daysSince(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  const today = zonedDayBounds(new Date()).start;
  const then = zonedDayBounds(d).start;
  return Math.max(0, Math.round((today.getTime() - then.getTime()) / (24 * 60 * 60 * 1000)));
}

export function relativeDays(date: Date | string | null | undefined): string {
  const days = daysSince(date);
  if (days === null) return "—";
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
