/**
 * Exact integer minor-unit formatting for BDT (৳) and USD ($) without
 * floating-point arithmetic.
 */
export const formatMinorCurrency = (
  amountMinor: number,
  currency: string,
  options?: { signed?: boolean },
): string => {
  const negative = amountMinor < 0;
  const abs = Math.abs(amountMinor);
  const major = Math.floor(abs / 100);
  const minor = abs % 100;
  const formattedMajor = major.toLocaleString("en-US");
  const formattedMinor = String(minor).padStart(2, "0");
  const symbol =
    currency === "BDT" ? "৳" : currency === "USD" ? "$" : `${currency} `;
  const sign = negative ? "-" : options?.signed && amountMinor > 0 ? "+" : "";
  return `${sign}${symbol}${formattedMajor}.${formattedMinor}`;
};

/**
 * Converts a major-unit string input (e.g. "1450" or "1450.50") to exact integer
 * minor units without floating-point rounding drift. Returns null for empty input
 * (preserving missing evidence) or "invalid" for malformed values.
 */
export const parseMajorInputToMinor = (
  raw: string,
): number | null | "invalid" => {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const match = /^(\d{1,12})(?:\.(\d{1,2}))?$/.exec(trimmed);
  if (!match) return "invalid";
  const major = Number(match[1]);
  const minorStr = (match[2] ?? "").padEnd(2, "0");
  const minor = Number(minorStr);
  const total = major * 100 + minor;
  if (!Number.isSafeInteger(total)) return "invalid";
  return total;
};

export const minorToMajorInput = (amountMinor: number | null): string => {
  if (amountMinor === null) return "";
  const major = Math.floor(amountMinor / 100);
  const minor = amountMinor % 100;
  return minor === 0
    ? String(major)
    : `${major}.${String(minor).padStart(2, "0")}`;
};
