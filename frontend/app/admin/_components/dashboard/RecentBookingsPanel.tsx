"use client";

import { useState } from "react";
import Link from "next/link";
import type { Booking } from "@/lib/types";
import { formatDate, formatEGP } from "../../_lib/format";
import { cellClass } from "../../_lib/ui";
import { DataRow, DataTable } from "../DataTable";
import { SearchFilterBar } from "../SearchFilterBar";
import { StatusBadge } from "../StatusBadge";
import { ClearFiltersButton, EmptyState } from "../states";
import { DashboardPanel, panelLinkClass } from "./DashboardChrome";

const RECENT_COUNT = 6;

function newestFirst(bookings: Booking[]): Booking[] {
  const createdAt = (booking: Booking) =>
    new Date(booking.created_at || booking.pickup_date).getTime();
  return [...bookings].sort((a, b) => createdAt(b) - createdAt(a)).slice(0, RECENT_COUNT);
}

export function RecentBookingsPanel({ bookings }: { bookings: Booking[] }) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();

  const recent = newestFirst(bookings).filter((booking) =>
    [
      String(booking.id),
      booking.user?.name ?? "",
      `${booking.car?.brand ?? ""} ${booking.car?.model ?? ""}`,
    ].some((value) => value.toLowerCase().includes(query))
  );

  return (
    <DashboardPanel
      eyebrow="Latest activity"
      title="Recent bookings"
      action={
        <Link href="/admin/bookings" className={panelLinkClass}>
          All bookings ↗
        </Link>
      }
    >
      <div className="mb-4">
        <SearchFilterBar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search booking, customer or car..."
          searchLabel="Search recent bookings"
        />
      </div>

      {recent.length === 0 ? (
        <EmptyState
          icon="search"
          title={bookings.length === 0 ? "No bookings yet" : "No matching bookings"}
          message={
            bookings.length === 0
              ? "New reservations will show up here."
              : "Try another search term."
          }
          action={
            bookings.length > 0 && <ClearFiltersButton onClick={() => setSearch("")} />
          }
        />
      ) : (
        <DataTable
          columns={["Booking", "Customer", "Vehicle", "Pickup date", "Status", "Amount"]}
          minWidth="min-w-[720px]"
        >
          {recent.map((booking) => (
            <DataRow key={booking.id}>
              <td className={cellClass}>
                <Link
                  href={`/admin/bookings/${booking.id}`}
                  className="font-bold text-[#765b2d] hover:text-[#17251e]"
                >
                  #{booking.id}
                </Link>
                <p className="mt-1 text-[11px] text-[#929990]">{formatDate(booking.created_at)}</p>
              </td>
              <td className={`${cellClass} text-sm font-semibold text-[#17251e]`}>
                {booking.user?.name || "Unknown customer"}
              </td>
              <td className={`${cellClass} text-sm font-medium text-[#536157]`}>
                {booking.car ? `${booking.car.brand} ${booking.car.model}` : "Unknown vehicle"}
              </td>
              <td className={`${cellClass} text-sm text-[#788078]`}>
                {formatDate(booking.pickup_date)}
              </td>
              <td className={cellClass}>
                <StatusBadge kind="booking" status={booking.status} />
              </td>
              <td className={`${cellClass} text-right text-sm font-bold text-[#17251e]`}>
                {formatEGP(booking.total_amount)}
              </td>
            </DataRow>
          ))}
        </DataTable>
      )}
    </DashboardPanel>
  );
}
