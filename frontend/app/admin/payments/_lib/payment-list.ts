import { PAYMENT_METHODS } from "@/lib/types";
import type { Payment, PaymentStatus } from "@/lib/types";
import { formatEGP, humanize } from "../../_lib/format";
import { PAYMENT_STATUSES } from "../../_lib/status";
import type { FilterOption } from "../../_components/SearchFilterBar";

export const STATUS_OPTIONS: FilterOption[] = [
  { value: "all", label: "All statuses" },
  ...PAYMENT_STATUSES.map((status) => ({ value: status, label: humanize(status) })),
];

export const METHOD_OPTIONS: FilterOption[] = [
  { value: "all", label: "All methods" },
  ...PAYMENT_METHODS.map((method) => ({ value: method, label: humanize(method) })),
];

export const paymentMethodLabel = (payment: Payment) =>
  payment.payment_method ? humanize(payment.payment_method) : "—";

/** The booking's customer and car come eager-loaded with each payment. */
export const paymentCustomer = (payment: Payment) => payment.booking?.user ?? null;

export const paymentCarName = (payment: Payment) => {
  const car = payment.booking?.car;
  return car ? `${car.brand} ${car.model}` : "";
};

export function filterPayments(
  payments: Payment[],
  search: string,
  status: string,
  method: string
): Payment[] {
  const query = search.trim().toLowerCase();

  return payments.filter((payment) => {
    const customer = paymentCustomer(payment);
    const haystack = [
      String(payment.id),
      String(payment.booking_id),
      customer?.name ?? "",
      customer?.email ?? "",
      paymentCarName(payment),
      payment.transaction_reference ?? "",
    ];

    return (
      (!query || haystack.some((value) => value.toLowerCase().includes(query))) &&
      (status === "all" || payment.payment_status === status) &&
      (method === "all" || payment.payment_method === method)
    );
  });
}

/** Wording for the confirmation shown before a status change is saved. */
export function statusChangeCopy(payment: Payment, status: PaymentStatus) {
  const amount = formatEGP(payment.amount);
  const copy: Record<PaymentStatus, { title: string; message: string; confirm: string }> = {
    paid: {
      title: "Mark this payment as paid?",
      message: `Payment #${payment.id} (${amount}) will count towards collected revenue.`,
      confirm: "Mark as Paid",
    },
    failed: {
      title: "Mark this payment as failed?",
      message: `Payment #${payment.id} (${amount}) will be closed as failed. This cannot be undone.`,
      confirm: "Mark as Failed",
    },
    refunded: {
      title: "Refund this payment?",
      message: `Payment #${payment.id} (${amount}) will be recorded as refunded and removed from revenue. This cannot be undone.`,
      confirm: "Refund Payment",
    },
    pending: {
      title: "Move this payment back to pending?",
      message: `Payment #${payment.id} (${amount}) will wait for confirmation again.`,
      confirm: "Mark as Pending",
    },
  };

  return copy[status];
}
