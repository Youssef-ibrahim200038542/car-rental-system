import type { Money } from "./types";

/** Whole-number price, e.g. "1,500". */
export function formatPrice(value: Money): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Number(value) || 0
  );
}

/** Money with up to two decimals, e.g. "1,500.5". */
export function formatMoney(value: Money): string {
  return Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** "02 Nov 2026"; an unparseable value is returned as-is. */
export function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function pluralise(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}
