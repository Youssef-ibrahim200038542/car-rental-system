import type { Booking } from "@/lib/types";
import { StatusBadge } from "../../_components/StatusBadge";
import { formatDateTime, formatEGP, humanize } from "../../_lib/format";
import { DetailCard } from "./BookingDetailCards";

/** Sum of the booking's payments with status "paid". */
export function paidAmount(booking: Booking): number {
  return (booking.payments ?? []).reduce(
    (total, payment) =>
      payment.payment_status.toLowerCase() === "paid" ? total + Number(payment.amount) : total,
    0
  );
}

export function BookingPaymentsCard({ booking }: { booking: Booking }) {
  const payments = booking.payments ?? [];
  const recorded = payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);

  return (
    <DetailCard
      title="Payment Information"
      aside={
        <span className="w-fit shrink-0 rounded-full bg-[#f3ead7] px-3 py-1 text-xs font-semibold text-[#806331]">
          {payments.length} {payments.length === 1 ? "Transaction" : "Transactions"}
        </span>
      }
    >
      {payments.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-800">No payment recorded</p>
          <p className="mt-1 text-sm leading-6 text-amber-700">
            No payment transactions have been recorded for this booking yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="rounded-2xl border border-[#e9e5dc] bg-[#fcfbf8] p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <p className="font-bold text-[#0a1411]">{humanize(payment.payment_method)}</p>
                  <p className="mt-2 break-all text-xs leading-5 text-[#85867c]">
                    Transaction reference: {payment.transaction_reference || "—"}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <p className="text-lg font-bold text-[#0a1411]">{formatEGP(payment.amount)}</p>
                  <StatusBadge kind="payment" status={payment.payment_status} />
                </div>
              </div>
              <p className="mt-4 border-t border-[#e9e5dc] pt-3 text-xs text-[#85867c]">
                Paid at: {formatDateTime(payment.paid_at)}
              </p>
            </div>
          ))}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#f3ead7] p-4">
              <p className="text-xs font-medium text-[#73786f]">Total Recorded Payments</p>
              <p className="mt-1 text-lg font-bold text-[#0a1411]">{formatEGP(recorded)}</p>
            </div>
            <div className="rounded-2xl bg-[#edf5ef] p-4">
              <p className="text-xs font-medium text-[#73786f]">Confirmed Paid Amount</p>
              <p className="mt-1 text-lg font-bold text-emerald-800">
                {formatEGP(paidAmount(booking))}
              </p>
            </div>
          </div>
        </div>
      )}
    </DetailCard>
  );
}

function SummaryLine({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-[#73786f]">{label}</span>
      <span className={`text-right font-semibold ${className}`}>{value}</span>
    </div>
  );
}

export function BookingSummaryCard({ booking }: { booking: Booking }) {
  const paid = paidAmount(booking);
  const remaining = Math.max(0, Number(booking.total_amount) - paid);

  return (
    <DetailCard eyebrow="Financial Overview" title="Booking Summary">
      <div className="space-y-4">
        <SummaryLine label="Daily Rate" value={formatEGP(booking.daily_rate)} />
        <SummaryLine label="Total Days" value={String(booking.total_days)} />
        <SummaryLine label="Subtotal" value={formatEGP(booking.subtotal)} />
        <SummaryLine
          label="Discount"
          value={`− ${formatEGP(booking.discount)}`}
          className="text-emerald-700"
        />

        <div className="flex items-start justify-between gap-4 border-t border-[#e9e5dc] pt-5">
          <span className="font-bold text-[#0a1411]">Total Amount</span>
          <span className="text-right text-xl font-bold text-[#9a783c]">
            {formatEGP(booking.total_amount)}
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Paid Amount
          </p>
          <p className="mt-2 text-xl font-bold text-emerald-800">{formatEGP(paid)}</p>
        </div>

        {remaining > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Remaining Balance
            </p>
            <p className="mt-2 text-lg font-bold text-amber-800">{formatEGP(remaining)}</p>
          </div>
        )}
      </div>
    </DetailCard>
  );
}
