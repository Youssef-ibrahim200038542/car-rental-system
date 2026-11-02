import Link from "next/link";
import StatusBadge from "@/app/components/StatusBadge";
import { carDisplayName } from "@/lib/cars";
import { formatDate, formatPrice } from "@/lib/format";
import type { Booking } from "@/lib/types";
import { paymentLabel } from "./staff-bookings";

type StaffBookingListProps = {
  title: string;
  description: string;
  bookings: Booking[];
  emptyMessage: string;
  /** Which date the row leads with: the pickup or the return. */
  dateField: "pickup_date" | "return_date";
};

const PAYMENT_TONES = {
  paid: "text-[#356847]",
  open: "text-[#87662f]",
  problem: "text-[#a34444]",
};

/** One work queue: a card with a row per booking and a link to manage it. */
export default function StaffBookingList({
  title,
  description,
  bookings,
  emptyMessage,
  dateField,
}: StaffBookingListProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-[#e8e4db] bg-white shadow-[0_10px_35px_rgba(10,20,17,0.04)]">
      <div className="flex items-start justify-between gap-4 border-b border-[#e8e4db] px-5 py-5 sm:px-6">
        <div>
          <h2 className="text-lg font-bold text-[#0a1411]">{title}</h2>
          <p className="mt-1 text-sm text-[#77776f]">{description}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#f6f0e3] px-3 py-1 text-sm font-bold text-[#9a783c]">
          {bookings.length}
        </span>
      </div>

      {bookings.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-[#898981]">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-[#efeee9]">
          {bookings.map((booking) => (
            <BookingRow key={booking.id} booking={booking} dateField={dateField} />
          ))}
        </ul>
      )}
    </section>
  );
}

function BookingRow({ booking, dateField }: { booking: Booking; dateField: StaffBookingListProps["dateField"] }) {
  const payment = paymentLabel(booking);
  const branch = dateField === "pickup_date" ? booking.pickup_branch : booking.dropoff_branch;

  return (
    <li className="grid gap-3 px-5 py-4 transition hover:bg-[#fbf8f0] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-[#0a1411]">#{booking.id}</span>
          <StatusBadge status={booking.status} />
          <span className={`text-xs font-semibold ${PAYMENT_TONES[payment.tone]}`}>{payment.label}</span>
        </div>

        <p className="mt-2 truncate font-semibold text-[#0a1411]">
          {carDisplayName(booking.car, "Unknown vehicle")}
          <span className="font-normal text-[#77776f]"> for {booking.user?.name || "Unknown customer"}</span>
        </p>

        <p className="mt-1 text-xs text-[#898981]">
          {formatDate(booking.pickup_date)} to {formatDate(booking.return_date)}
          {branch?.name ? ` at ${branch.name}` : ""}
          {`, ${formatPrice(booking.total_amount)} EGP`}
        </p>
      </div>

      <Link
        href={`/admin/bookings/${booking.id}`}
        className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-[#d9e2db] bg-[#edf3ee] px-4 py-2 text-sm font-semibold text-[#365747] transition hover:border-[#c6a15b] hover:bg-[#c6a15b] hover:text-[#0a1411] focus:outline-none focus:ring-2 focus:ring-[#c6a15b] focus:ring-offset-2"
      >
        Open booking
      </Link>
    </li>
  );
}
