import type { Booking } from "@/lib/types";
import type { BookingFilter } from "./BookingFilterBar";

/** Customers may cancel only before the rental starts (backend rule). */
export const isCancellable = (status: string) =>
  ["pending", "confirmed"].includes(status.toLowerCase());

export const hasPayment = (booking: Booking) =>
  (booking.payments ?? []).some((payment) =>
    ["paid", "pending"].includes(payment.payment_status)
  );

export const isActiveBooking = (status: string) =>
  ["active", "confirmed", "pending"].includes(status.toLowerCase());

/** Money actually paid: paid payments only, never a cancelled booking. */
export function totalPaid(bookings: Booking[]): number {
  return bookings
    .filter((booking) => booking.status.toLowerCase() !== "cancelled")
    .flatMap((booking) => booking.payments ?? [])
    .filter((payment) => payment.payment_status === "paid")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
}

/** A completed booking that has no review yet. */
export const canReview = (booking: Booking) =>
  booking.status.toLowerCase() === "completed" && !booking.review;

export function filterBookings(bookings: Booking[], filter: BookingFilter): Booking[] {
  switch (filter) {
    case "active":
      return bookings.filter((booking) => isActiveBooking(booking.status));
    case "completed":
    case "cancelled":
      return bookings.filter((booking) => booking.status.toLowerCase() === filter);
    case "all":
      return bookings;
    default: {
      const unhandled: never = filter;
      return unhandled;
    }
  }
}
