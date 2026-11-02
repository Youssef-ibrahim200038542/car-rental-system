import { dateKey } from "@/lib/dates";
import type { Booking } from "@/lib/types";

export type StaffQueues = {
  pickupsToday: Booking[];
  returnsToday: Booking[];
  pending: Booking[];
  active: Booking[];
};

const byPickup = (a: Booking, b: Booking) => a.pickup_date.localeCompare(b.pickup_date);
const byReturn = (a: Booking, b: Booking) => a.return_date.localeCompare(b.return_date);

/** Split every booking into the work queues the front desk handles today. */
export function staffQueues(bookings: Booking[], today: string): StaffQueues {
  return {
    // Confirmed (or still pending) cars that leave a branch today.
    pickupsToday: bookings
      .filter((b) => dateKey(b.pickup_date) === today && ["pending", "confirmed"].includes(b.status))
      .sort(byPickup),
    // Cars on the road that are due back today.
    returnsToday: bookings
      .filter((b) => dateKey(b.return_date) === today && b.status === "active")
      .sort(byReturn),
    pending: bookings.filter((b) => b.status === "pending").sort(byPickup),
    active: bookings.filter((b) => b.status === "active").sort(byReturn),
  };
}

/** Payment state for a booking row: the paid one wins, else the newest record. */
export function paymentLabel(booking: Booking): { label: string; tone: "paid" | "open" | "problem" } {
  const payments = booking.payments ?? [];
  const payment =
    payments.find((item) => item.payment_status === "paid") ?? payments[payments.length - 1];

  if (!payment) return { label: "Unpaid", tone: "open" };

  switch (payment.payment_status) {
    case "paid":
      return { label: "Paid", tone: "paid" };
    case "pending":
      return { label: payment.payment_method === "cash" ? "Cash due" : "Payment pending", tone: "open" };
    case "failed":
      return { label: "Payment failed", tone: "problem" };
    case "refunded":
      return { label: "Refunded", tone: "problem" };
    default: {
      const unhandled: never = payment.payment_status;
      return { label: String(unhandled), tone: "open" };
    }
  }
}
