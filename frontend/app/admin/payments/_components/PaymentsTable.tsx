import Link from "next/link";
import type { Payment, PaymentStatus } from "@/lib/types";
import { DataRow, DataTable } from "../../_components/DataTable";
import { Icon } from "../../_components/icons";
import { StatusBadge } from "../../_components/StatusBadge";
import { formatDateTime, formatEGP } from "../../_lib/format";
import { cellClass, rowActionClass } from "../../_lib/ui";
import { paymentCarName, paymentCustomer, paymentMethodLabel } from "../_lib/payment-list";
import { PaymentStatusControl } from "./PaymentStatusControl";

type RowProps = {
  payment: Payment;
  saving: boolean;
  onRequestChange: (payment: Payment, status: PaymentStatus) => void;
};

function PaymentIcon() {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f3ead7] text-[#96743b]">
      <Icon name="card" />
    </div>
  );
}

function PaymentRow({ payment, saving, onRequestChange }: RowProps) {
  const customer = paymentCustomer(payment);

  return (
    <DataRow>
      <td className={cellClass}>
        <div className="flex items-center gap-3">
          <PaymentIcon />
          <div>
            <p className="font-bold text-[#0a1411]">Payment #{payment.id}</p>
            <p className="mt-1 text-xs text-[#85867c]">{formatDateTime(payment.paid_at)}</p>
          </div>
        </div>
      </td>
      <td className={cellClass}>
        <p className="font-semibold text-[#0a1411]">{customer?.name || "Unknown"}</p>
        <p className="mt-1 text-xs text-[#85867c]">{customer?.email || "—"}</p>
      </td>
      <td className={cellClass}>
        <p className="font-semibold text-[#0a1411]">#{payment.booking_id}</p>
        <p className="mt-1 text-xs text-[#85867c]">
          {paymentCarName(payment) || "Vehicle unavailable"}
        </p>
      </td>
      <td className={`${cellClass} text-sm text-[#59645c]`}>{paymentMethodLabel(payment)}</td>
      <td className={`${cellClass} font-bold text-[#0a1411]`}>{formatEGP(payment.amount)}</td>
      <td className={cellClass}>
        <StatusBadge kind="payment" status={payment.payment_status} />
      </td>
      <td className={cellClass}>
        <div className="flex items-center justify-end gap-2">
          <Link href={`/admin/bookings/${payment.booking_id}`} className={rowActionClass.view}>
            Booking
          </Link>
          <PaymentStatusControl
            payment={payment}
            saving={saving}
            onRequestChange={onRequestChange}
            className="max-w-[140px]"
          />
        </div>
      </td>
    </DataRow>
  );
}

function PaymentCard({ payment, saving, onRequestChange }: RowProps) {
  const customer = paymentCustomer(payment);
  const carName = paymentCarName(payment);

  return (
    <article className="rounded-2xl border border-[#e9e5dc] bg-white p-4">
      <div className="flex items-start gap-3">
        <PaymentIcon />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-[#0a1411]">Payment #{payment.id}</h3>
            <StatusBadge kind="payment" status={payment.payment_status} />
          </div>
          <p className="mt-1 text-xs text-[#85867c]">{formatDateTime(payment.paid_at)}</p>
          <p className="mt-3 text-xl font-bold text-[#0a1411]">{formatEGP(payment.amount)}</p>
        </div>
      </div>

      <dl className="my-4 space-y-3 rounded-xl bg-[#fcfbf8] p-3 text-sm">
        <div>
          <dt className="text-xs text-[#85867c]">Customer</dt>
          <dd className="mt-1 break-words font-semibold text-[#34443b]">
            {customer?.name || "Unknown"}
          </dd>
          <dd className="mt-1 break-all text-xs text-[#85867c]">{customer?.email || "—"}</dd>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-[#e9e5dc] pt-3">
          <div>
            <dt className="text-xs text-[#85867c]">Booking</dt>
            <dd className="mt-1 font-semibold text-[#34443b]">#{payment.booking_id}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#85867c]">Method</dt>
            <dd className="mt-1 font-semibold text-[#34443b]">{paymentMethodLabel(payment)}</dd>
          </div>
        </div>
        {carName && (
          <div className="border-t border-[#e9e5dc] pt-3">
            <dt className="text-xs text-[#85867c]">Vehicle</dt>
            <dd className="mt-1 font-semibold text-[#34443b]">{carName}</dd>
          </div>
        )}
      </dl>

      <div className="grid grid-cols-2 items-center gap-2">
        <Link href={`/admin/bookings/${payment.booking_id}`} className={rowActionClass.view}>
          View Booking
        </Link>
        <PaymentStatusControl
          payment={payment}
          saving={saving}
          onRequestChange={onRequestChange}
          className="min-w-0"
        />
      </div>
    </article>
  );
}

export function PaymentsTable({
  payments,
  updatingId,
  onRequestChange,
}: {
  payments: Payment[];
  updatingId: number | null;
  onRequestChange: (payment: Payment, status: PaymentStatus) => void;
}) {
  const rowProps = (payment: Payment) => ({
    payment,
    saving: updatingId === payment.id,
    onRequestChange,
  });

  return (
    <DataTable
      columns={["Payment", "Customer", "Booking", "Method", "Amount", "Status", "Actions"]}
      minWidth="min-w-[1100px]"
      mobile={payments.map((payment) => (
        <PaymentCard key={payment.id} {...rowProps(payment)} />
      ))}
    >
      {payments.map((payment) => (
        <PaymentRow key={payment.id} {...rowProps(payment)} />
      ))}
    </DataTable>
  );
}
