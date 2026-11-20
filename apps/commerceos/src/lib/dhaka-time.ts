/**
 * Bangladesh Standard Time (Asia/Dhaka, fixed UTC+06:00) conversion helpers.
 *
 * Bangladesh does not observe daylight saving time; Asia/Dhaka is fixed at
 * UTC+6 year-round. Conversions use explicit integer millisecond offsets so
 * results are deterministic regardless of the host machine or browser timezone.
 */

export const DHAKA_OFFSET_MINUTES = 360;
const DHAKA_OFFSET_MS = DHAKA_OFFSET_MINUTES * 60_000;

export const DHAKA_TIMEZONE_LABEL_EN = "Bangladesh time (UTC+6)";
export const DHAKA_TIMEZONE_LABEL_BN = "বাংলাদেশ সময় (UTC+6)";

const DATETIME_LOCAL_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

const pad2 = (value: number): string => String(value).padStart(2, "0");

/**
 * Converts an RFC 3339 UTC ISO timestamp (e.g. "2026-11-20T04:00:00.000Z")
 * into a `datetime-local` input string representing Bangladesh time (UTC+6),
 * e.g. "2026-11-20T10:00". Returns "" for null/empty/invalid inputs.
 */
export const utcIsoToDhakaInput = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const utcMs = Date.parse(iso);
  if (Number.isNaN(utcMs)) return "";
  const shifted = new Date(utcMs + DHAKA_OFFSET_MS);
  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}T${pad2(shifted.getUTCHours())}:${pad2(shifted.getUTCMinutes())}`;
};

/**
 * Adds `offsetMinutes` to a UTC base Date and formats the result as a
 * `datetime-local` input string in Bangladesh time (UTC+6).
 */
export const offsetDateToDhakaInput = (
  baseUtc: Date,
  offsetMinutes: number,
): string => {
  const targetUtcIso = new Date(
    baseUtc.getTime() + offsetMinutes * 60_000,
  ).toISOString();
  return utcIsoToDhakaInput(targetUtcIso);
};

/**
 * Converts a `datetime-local` string interpreted as Bangladesh time (UTC+6)
 * into a canonical RFC 3339 UTC ISO string (`...Z`).
 *
 * Strictly validates calendar date/time components (rejecting e.g. Feb 30)
 * and returns `null` if empty or invalid.
 */
export const dhakaInputToUtcIso = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = DATETIME_LOCAL_PATTERN.exec(trimmed);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = match[6] ? Number(match[6]) : 0;

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return null;
  }

  // Construct UTC ms corresponding to the wall-clock fields, verify no rollover
  const wallClockAsUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  const check = new Date(wallClockAsUtcMs);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day ||
    check.getUTCHours() !== hour ||
    check.getUTCMinutes() !== minute ||
    check.getUTCSeconds() !== second
  ) {
    return null;
  }

  // Bangladesh time is UTC+6, so UTC = Dhaka - 6 hours
  return new Date(wallClockAsUtcMs - DHAKA_OFFSET_MS).toISOString();
};

const dhakaDisplayFormatterEn = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dhaka",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const utcDisplayFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Formats an RFC 3339 UTC timestamp for merchant display in Bangladesh time (UTC+6). */
export const formatDhakaDateTime = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : `${dhakaDisplayFormatterEn.format(date)} (UTC+6)`;
};

/** Formats an RFC 3339 UTC timestamp for technical diagnostics in UTC. */
export const formatUtcDateTime = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : `${utcDisplayFormatter.format(date)} UTC`;
};
