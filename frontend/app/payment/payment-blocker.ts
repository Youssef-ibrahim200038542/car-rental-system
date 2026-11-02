import type { Booking, Payment } from "@/lib/types";

/** Why this booking cannot be paid now, or null when the form should show. */
export function paymentBlocker(booking: Booking): { title: string; message: string } | null {
  const payments: Payment[] = booking.payments ?? [];

  if (payments.some((payment) => payment.payment_status === "paid")) {
    return {
      title: "Already Paid",
      message: "This booking has already been paid. No further payment is needed.",
    };
  }

  if (
    payments.some(
      (payment) =>
        payment.payment_method === "cash" && payment.payment_status === "pending"
    )
  ) {
    return {
      title: "Cash Payment Pending",
      message: "You chose to pay cash at the branch. Payment will be collected when you pick up the car.",
    };
  }

  if (booking.status === "cancelled") {
    return {
      title: "Booking Cancelled",
      message: "This booking was cancelled and can no longer be paid.",
    };
  }

  if (booking.status === "completed") {
    return {
      title: "Booking Completed",
      message: "This rental is already completed.",
    };
  }

  return null;
}
