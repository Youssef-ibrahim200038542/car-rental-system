import type { Booking, BookingStatus } from "@/lib/types";
import { BOOKING_PAYMENT_STATES, BOOKING_STATUSES, bookingPaymentState } from "./status";
import { humanize } from "./format";
import type { FilterOption } from "../_components/SearchFilterBar";

/** Sum of total_amount over bookings that are not cancelled. */
export function bookedValue(bookings: Booking[]): number {
  return bookings
    .filter((booking) => booking.status !== "cancelled")
    .reduce((total, booking) => total + Number(booking.total_amount || 0), 0);
}

export const countBookings = (bookings: Booking[], status: BookingStatus) =>
  bookings.filter((booking) => booking.status.toLowerCase() === status).length;

export const BOOKING_STATUS_OPTIONS: FilterOption[] = [
  { value: "all", label: "All statuses" },
  ...BOOKING_STATUSES.map((status) => ({ value: status, label: humanize(status) })),
];

export const BOOKING_PAYMENT_OPTIONS: FilterOption[] = [
  { value: "all", label: "All payments" },
  ...BOOKING_PAYMENT_STATES.map((state) => ({ value: state, label: humanize(state) })),
];

export function filterBookings(
  bookings: Booking[],
  search: string,
  status: string,
  payment: string
): Booking[] {
  const query = search.trim().toLowerCase();

  return bookings.filter((booking) => {
    const haystack = [
      String(booking.id),
      booking.user?.name ?? "",
      booking.user?.email ?? "",
      `${booking.car?.brand ?? ""} ${booking.car?.model ?? ""}`,
    ];

    return (
      (!query || haystack.some((value) => value.toLowerCase().includes(query))) &&
      (status === "all" || booking.status.toLowerCase() === status) &&
      (payment === "all" || bookingPaymentState(booking) === payment)
    );
  });
}
