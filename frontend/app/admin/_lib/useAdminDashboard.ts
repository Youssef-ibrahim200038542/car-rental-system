"use client";

import type { Booking, Payment, Review } from "@/lib/types";
import { useAdminStats } from "./resources";
import { useAdminList } from "./useAdminList";

/**
 * Everything the overview needs. Counts come from /admin/stats; the three
 * lists only feed the recent-activity panels.
 */
export function useAdminDashboard() {
  const stats = useAdminStats();
  const bookings = useAdminList<Booking>("/bookings", "Unable to load dashboard.");
  const payments = useAdminList<Payment>("/payments", "Unable to load dashboard.");
  const reviews = useAdminList<Review>("/reviews", "Unable to load dashboard.");
  const lists = [bookings, payments, reviews];

  return {
    stats: stats.data,
    bookings: bookings.items,
    payments: payments.items,
    reviews: reviews.items,
    loading: stats.loading || lists.some((list) => list.loading),
    refreshing: lists.some((list) => list.refreshing),
    error: stats.error || lists.map((list) => list.loadError).find(Boolean) || "",
    reload: () => {
      stats.reload();
      lists.forEach((list) => list.reload());
    },
  };
}
