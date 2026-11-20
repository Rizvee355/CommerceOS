import {
  formatDhakaDateTime,
  formatUtcDateTime,
} from "../../../lib/dhaka-time";

/** Formats an RFC 3339 UTC timestamp for technical diagnostics, labeled as UTC. */
export const formatUtc = formatUtcDateTime;

/** Formats an RFC 3339 UTC timestamp for merchant display in Bangladesh time (UTC+6). */
export const formatDhaka = formatDhakaDateTime;
