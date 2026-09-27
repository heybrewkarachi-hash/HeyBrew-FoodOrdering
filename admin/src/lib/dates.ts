import { formatInTimeZone } from "date-fns-tz";
import { format, parseISO } from "date-fns";

export const BUSINESS_TZ = "Asia/Karachi";

export function formatKarachi(
  value: string | Date | null | undefined,
  pattern = "dd MMM yyyy, hh:mm a"
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? parseISO(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return formatInTimeZone(date, BUSINESS_TZ, pattern);
}

export function formatKarachiDate(value: string | Date | null | undefined): string {
  return formatKarachi(value, "dd MMM yyyy");
}

export function formatKarachiTime(value: string | Date | null | undefined): string {
  return formatKarachi(value, "hh:mm a");
}

/** Calendar date (YYYY-MM-DD) as Asia/Karachi business-day bounds → UTC ISO. */
export function karachiDayBoundsIso(dateYmd: string): { from: string; to: string } {
  // Pakistan is UTC+5 year-round (no DST)
  const from = new Date(`${dateYmd}T00:00:00+05:00`).toISOString();
  const to = new Date(`${dateYmd}T23:59:59.999+05:00`).toISOString();
  return { from, to };
}

export function todayKarachiYmd(): string {
  return formatInTimeZone(new Date(), BUSINESS_TZ, "yyyy-MM-dd");
}

export function labelWithTz(label: string): string {
  return `${label} (Asia/Karachi)`;
}

export function formatDisplayDate(ymd: string): string {
  try {
    return format(parseISO(`${ymd}T12:00:00`), "dd MMM yyyy");
  } catch {
    return ymd;
  }
}
