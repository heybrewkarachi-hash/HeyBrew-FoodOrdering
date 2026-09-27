import { formatPkr as sharedFormatPkr, fromMinor, toMinor } from "@heybrew/shared";

export { fromMinor, toMinor };

export function formatPkr(minor: number | null | undefined): string {
  if (minor == null || !Number.isFinite(minor)) return "Rs 0";
  try {
    return sharedFormatPkr(Math.trunc(minor));
  } catch {
    return `Rs ${(minor / 100).toLocaleString("en-PK")}`;
  }
}

/** Parse a rupee string/number into paisa. */
export function parseRupeesToMinor(value: string | number): number {
  const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0) return 0;
  return toMinor(n);
}
