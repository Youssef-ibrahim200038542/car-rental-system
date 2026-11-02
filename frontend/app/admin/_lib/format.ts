import type { Money } from "@/lib/types";

/**
 * 1234.5 → "1,234.5". Missing, non-numeric and negative-zero values render
 * as "0" (Number(-0) || 0 is 0, so no "-0" ever reaches the screen).
 */
export function formatAmount(value: Money | null | undefined): string {
  const amount = Number(value) || 0;
  return amount.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** 1234.5 → "1,234.5 EGP". */
export function formatEGP(value: Money | null | undefined): string {
  return `${formatAmount(value)} EGP`;
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** "Jan 5, 2026", or "—" when the value is missing or unparseable. */
export function formatDate(value?: string | null): string {
  const parsed = parseDate(value);
  if (!parsed) return "—";

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** "Jan 5, 2026, 02:30 PM", or "—" when the value is missing or unparseable. */
export function formatDateTime(value?: string | null): string {
  const parsed = parseDate(value);
  if (!parsed) return "—";

  return parsed.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 1 → "1 day", 3 → "3 days". */
export function formatDays(days: number): string {
  return `${days} ${days === 1 ? "day" : "days"}`;
}

/** "in_progress" → "In progress". */
export function humanize(value: string): string {
  const text = value.replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** First letter of a name, upper-cased, for avatar circles. */
export function initial(name: string | null | undefined, fallback = "U"): string {
  return name?.charAt(0).toUpperCase() || fallback;
}
