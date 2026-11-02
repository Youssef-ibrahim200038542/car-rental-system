import type {
  Booking,
  BookingStatus,
  CarStatus,
  PaymentStatus,
  Role,
} from "@/lib/types";

export type Tone =
  | "success"
  | "warning"
  | "info"
  | "gold"
  | "orange"
  | "danger"
  | "purple"
  | "sage"
  | "neutral";

export const TONE_CLASSES: Record<Tone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  gold: "border-[#e7dcc4] bg-[#f8f0df] text-[#806331]",
  orange: "border-orange-200 bg-orange-50 text-orange-800",
  danger: "border-red-200 bg-red-50 text-red-800",
  purple: "border-purple-200 bg-purple-50 text-purple-800",
  sage: "border-[#d6e2d6] bg-[#edf1e9] text-[#405e48]",
  neutral: "border-[#e4e2dc] bg-[#f2f1ed] text-[#73766e]",
};

export const BOOKING_STATUSES: readonly BookingStatus[] = [
  "pending",
  "confirmed",
  "active",
  "completed",
  "cancelled",
];

export const PAYMENT_STATUSES: readonly PaymentStatus[] = [
  "pending",
  "paid",
  "failed",
  "refunded",
];

/**
 * Derived from a booking's payments; see bookingPaymentState. Humanized, the
 * keys read as the labels the staff desk uses ("Cash due", "Payment failed").
 */
export type BookingPaymentState =
  | "paid"
  | "cash_due"
  | "payment_pending"
  | "payment_failed"
  | "refunded"
  | "unpaid";

export const BOOKING_PAYMENT_STATES: readonly BookingPaymentState[] = [
  "paid",
  "cash_due",
  "payment_pending",
  "payment_failed",
  "refunded",
  "unpaid",
];

/**
 * Status changes the API accepts from staff (it answers 422 to the rest).
 * Cancelling goes through POST /bookings/{id}/cancel so paid money is refunded.
 */
export const BOOKING_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["active", "cancelled"],
  active: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

/** Payment status changes the API accepts; failed and refunded are final. */
export const PAYMENT_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  pending: ["paid", "failed"],
  paid: ["refunded"],
  failed: [],
  refunded: [],
};

/** Which status vocabulary a badge is showing; each maps statuses to tones. */
export const STATUS_TONES = {
  car: {
    available: "success",
    reserved: "gold",
    rented: "warning",
    maintenance: "orange",
    inactive: "neutral",
  } satisfies Record<CarStatus, Tone>,
  booking: {
    pending: "warning",
    confirmed: "info",
    active: "success",
    completed: "gold",
    cancelled: "danger",
  } satisfies Record<BookingStatus, Tone>,
  payment: {
    paid: "success",
    pending: "gold",
    failed: "danger",
    refunded: "purple",
  } satisfies Record<PaymentStatus, Tone>,
  bookingPayment: {
    paid: "success",
    cash_due: "warning",
    payment_pending: "warning",
    payment_failed: "danger",
    refunded: "purple",
    unpaid: "neutral",
  } satisfies Record<BookingPaymentState, Tone>,
  role: {
    admin: "gold",
    staff: "sage",
    customer: "success",
  } satisfies Record<Role, Tone>,
};

export type StatusKind = keyof typeof STATUS_TONES;

export function statusTone(kind: StatusKind, status: string): Tone {
  const tones: Record<string, Tone> = STATUS_TONES[kind];
  return Object.hasOwn(tones, status) ? tones[status] : "neutral";
}

/**
 * Same rule as the staff desk (app/staff/staff-bookings.ts paymentLabel): a
 * paid record wins, otherwise the newest record decides; no records = unpaid.
 */
export function bookingPaymentState(booking: Booking): BookingPaymentState {
  const payments = booking.payments ?? [];
  const payment =
    payments.find((item) => item.payment_status === "paid") ?? payments[payments.length - 1];

  if (!payment) return "unpaid";

  switch (payment.payment_status) {
    case "paid":
      return "paid";
    case "pending":
      return payment.payment_method === "cash" ? "cash_due" : "payment_pending";
    case "failed":
      return "payment_failed";
    case "refunded":
      return "refunded";
    default: {
      const unhandled: never = payment.payment_status;
      return unhandled;
    }
  }
}
