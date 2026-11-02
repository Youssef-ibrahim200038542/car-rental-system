/** Today's date in the browser's timezone, as YYYY-MM-DD. */
export function getLocalToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/** The YYYY-MM-DD part of an API date ("2026-11-02T00:00:00.000000Z"). */
export function dateKey(value: string): string {
  return value.slice(0, 10);
}

function calendarDaysBetween(startDate: string, endDate: string): number {
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);

  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const end = Date.UTC(endYear, endMonth - 1, endDay);

  return Math.round((end - start) / 86_400_000);
}

/**
 * Billable days, matching the server: same-day return counts as 1 day.
 * Returns 0 when the range is incomplete or reversed.
 */
export function rentalDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate || endDate < startDate) return 0;
  return Math.max(1, calendarDaysBetween(startDate, endDate));
}
