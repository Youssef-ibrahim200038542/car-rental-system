import type { Payment, PaymentStatus } from "@/lib/types";
import { humanize } from "../../_lib/format";
import { PAYMENT_TRANSITIONS } from "../../_lib/status";
import { rowActionClass } from "../../_lib/ui";

/**
 * "Change status" select offering only the moves the API allows. Picking one
 * does not save: it asks the page to confirm first. Final statuses get no select.
 */
export function PaymentStatusControl({
  payment,
  saving,
  onRequestChange,
  className = "",
}: {
  payment: Payment;
  saving: boolean;
  onRequestChange: (payment: Payment, status: PaymentStatus) => void;
  className?: string;
}) {
  const next = PAYMENT_TRANSITIONS[payment.payment_status] ?? [];

  if (next.length === 0) {
    return <span className="text-xs text-[#85867c]">No further changes</span>;
  }

  return (
    <select
      aria-label={`Change status of payment ${payment.id}`}
      value=""
      disabled={saving}
      onChange={(event) =>
        onRequestChange(payment, event.target.value as PaymentStatus)
      }
      className={`${rowActionClass.select} ${className}`}
    >
      <option value="" disabled>
        {saving ? "Saving..." : "Change status"}
      </option>
      {next.map((status) => (
        <option key={status} value={status}>
          {status === "refunded" ? "Refund" : `Mark ${humanize(status).toLowerCase()}`}
        </option>
      ))}
    </select>
  );
}
