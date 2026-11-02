import Link from "next/link";
import type { Booking } from "@/lib/types";
import { DataRow, DataTable } from "../../_components/DataTable";
import { StatusBadge } from "../../_components/StatusBadge";
import { formatDate, formatDays, formatEGP } from "../../_lib/format";
import { bookingPaymentState } from "../../_lib/status";
import { cellClass, rowActionClass } from "../../_lib/ui";

export function BookingsTable({ bookings }: { bookings: Booking[] }) {
  return (
    <DataTable
      columns={[
        "Booking",
        "Customer",
        "Vehicle",
        "Rental Dates",
        "Amount",
        "Payment",
        "Status",
        "Action",
      ]}
      minWidth="min-w-[1050px]"
    >
      {bookings.map((booking) => (
        <DataRow key={booking.id}>
          <td className={cellClass}>
            <p className="font-bold text-[#0a1411]">#{booking.id}</p>
            <p className="mt-1 text-xs text-[#85867c]">{formatDays(booking.total_days)}</p>
          </td>
          <td className={cellClass}>
            <p className="font-semibold text-[#0a1411]">
              {booking.user?.name || "Unknown Customer"}
            </p>
            <p className="mt-1 text-xs text-[#85867c]">{booking.user?.email || "—"}</p>
          </td>
          <td className={cellClass}>
            <p className="font-semibold text-[#0a1411]">
              {booking.car?.brand || "Unknown"} {booking.car?.model || ""}
            </p>
            <p className="mt-1 text-xs text-[#85867c]">Car ID #{booking.car_id}</p>
          </td>
          <td className={`${cellClass} whitespace-nowrap text-sm text-[#0a1411]`}>
            <p>{formatDate(booking.pickup_date)}</p>
            <p className="my-1 text-xs text-[#85867c]">to</p>
            <p>{formatDate(booking.return_date)}</p>
          </td>
          <td className={`${cellClass} whitespace-nowrap`}>
            <p className="font-bold text-[#0a1411]">{formatEGP(booking.total_amount)}</p>
            <p className="mt-1 text-xs text-[#85867c]">{formatEGP(booking.daily_rate)}/day</p>
          </td>
          <td className={cellClass}>
            <StatusBadge kind="bookingPayment" status={bookingPaymentState(booking)} />
          </td>
          <td className={cellClass}>
            <StatusBadge kind="booking" status={booking.status} />
          </td>
          <td className={`${cellClass} text-right`}>
            <Link href={`/admin/bookings/${booking.id}`} className={rowActionClass.view}>
              View Details
              <span aria-hidden="true">→</span>
            </Link>
          </td>
        </DataRow>
      ))}
    </DataTable>
  );
}
