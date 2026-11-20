import { describe, expect, it } from "vitest";

import {
  dhakaInputToUtcIso,
  formatDhakaDateTime,
  formatUtcDateTime,
  offsetDateToDhakaInput,
  utcIsoToDhakaInput,
} from "./dhaka-time";

describe("Bangladesh timezone (Asia/Dhaka, UTC+6) conversions", () => {
  it("converts 10:00 AM Bangladesh time to 04:00 UTC on the same date", () => {
    expect(dhakaInputToUtcIso("2026-11-20T10:00")).toBe(
      "2026-11-20T04:00:00.000Z",
    );
    expect(utcIsoToDhakaInput("2026-11-20T04:00:00.000Z")).toBe(
      "2026-11-20T10:00",
    );
  });

  it("handles late-evening and midnight date boundaries accurately without off-by-one drift", () => {
    // 11:30 PM Bangladesh time (UTC+6) = 17:30 UTC same date
    expect(dhakaInputToUtcIso("2026-11-20T23:30")).toBe(
      "2026-11-20T17:30:00.000Z",
    );
    expect(utcIsoToDhakaInput("2026-11-20T17:30:00.000Z")).toBe(
      "2026-11-20T23:30",
    );

    // 02:30 AM Bangladesh time on Nov 21 = 20:30 UTC on previous UTC date (Nov 20)
    expect(dhakaInputToUtcIso("2026-11-21T02:30")).toBe(
      "2026-11-20T20:30:00.000Z",
    );
    expect(utcIsoToDhakaInput("2026-11-20T20:30:00.000Z")).toBe(
      "2026-11-21T02:30",
    );

    // 23:30 UTC on Nov 20 = 05:30 AM Bangladesh time on the following BD date (Nov 21)
    expect(utcIsoToDhakaInput("2026-11-20T23:30:00.000Z")).toBe(
      "2026-11-21T05:30",
    );
    expect(dhakaInputToUtcIso("2026-11-21T05:30")).toBe(
      "2026-11-20T23:30:00.000Z",
    );

    // Month/year boundary crossing (Jan 1 01:00 BD -> Dec 31 19:00 UTC)
    expect(dhakaInputToUtcIso("2027-01-01T01:00")).toBe(
      "2026-12-31T19:00:00.000Z",
    );
    expect(utcIsoToDhakaInput("2026-12-31T19:00:00.000Z")).toBe(
      "2027-01-01T01:00",
    );
  });

  it("round-trips editing and reloading without shifting displayed local time", () => {
    const samples = [
      "2026-11-20T00:00",
      "2026-11-20T05:59",
      "2026-11-20T06:00",
      "2026-11-20T14:15",
      "2026-11-20T23:59",
    ];
    for (const local of samples) {
      const utc = dhakaInputToUtcIso(local);
      expect(utc).not.toBeNull();
      expect(utcIsoToDhakaInput(utc)).toBe(local);
    }
  });

  it("offsets base UTC date into Bangladesh local input independently", () => {
    const base = new Date("2026-11-20T09:00:00.000Z"); // 15:00 BD
    expect(offsetDateToDhakaInput(base, 180)).toBe("2026-11-20T18:00");
    expect(offsetDateToDhakaInput(base, 1_440)).toBe("2026-11-21T15:00");
  });

  it("rejects empty, malformed, and impossible calendar dates", () => {
    expect(dhakaInputToUtcIso("")).toBeNull();
    expect(dhakaInputToUtcIso("not-a-date")).toBeNull();
    expect(dhakaInputToUtcIso("2026-02-30T10:00")).toBeNull();
    expect(utcIsoToDhakaInput(null)).toBe("");
    expect(utcIsoToDhakaInput("")).toBe("");
  });

  it("formats display timestamps clearly in Bangladesh time (UTC+6) and UTC", () => {
    const iso = "2026-11-20T04:00:00.000Z";
    expect(formatDhakaDateTime(iso)).toMatch(/10:00/i);
    expect(formatDhakaDateTime(iso)).toContain("(UTC+6)");
    expect(formatUtcDateTime(iso)).toContain("04:00 UTC");
  });
});
