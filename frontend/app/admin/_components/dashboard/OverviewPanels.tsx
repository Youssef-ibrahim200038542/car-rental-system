import Link from "next/link";
import type { AdminStats } from "@/lib/types";
import { formatEGP } from "../../_lib/format";
import { Icon } from "../icons";
import { DashboardPanel, panelFooterLinkClass, panelLinkClass } from "./DashboardChrome";

type Bar = { label: string; count: number; color: string };

const percent = (part: number, whole: number) =>
  whole ? Math.round((Math.min(part, whole) / whole) * 100) : 0;

export function BookingOverviewPanel({
  bookings,
  bookedValue,
}: {
  bookings: AdminStats["bookings"];
  bookedValue: number;
}) {
  const bars: Bar[] = [
    { label: "Pending", count: bookings.pending, color: "bg-[#c6a15b]" },
    { label: "Confirmed", count: bookings.confirmed, color: "bg-[#718675]" },
    { label: "Active", count: bookings.active, color: "bg-[#9a783c]" },
    { label: "Completed", count: bookings.completed, color: "bg-[#315b3c]" },
    { label: "Cancelled", count: bookings.cancelled, color: "bg-[#bd7770]" },
  ];
  const max = Math.max(...bars.map((bar) => bar.count), 1);

  return (
    <DashboardPanel
      eyebrow="Performance"
      title="Booking overview"
      action={
        <Link href="/admin/bookings" className={panelLinkClass}>
          View all ↗
        </Link>
      }
    >
      {/* Open work at a glance: Active, Confirmed, Pending. */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {bars.slice(0, 3).reverse().map((bar) => (
          <div key={bar.label} className="rounded-xl bg-[#f7f7f2] p-3">
            <p className="text-xs text-[#788078]">{bar.label}</p>
            <p className="mt-1 text-xl font-extrabold text-[#17251e]">{bar.count}</p>
          </div>
        ))}
      </div>

      <div className="space-y-5">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-[#536157]">{bar.label}</span>
              <span className="font-bold text-[#17251e]">{bar.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#efefe9]">
              <div
                className={`h-full rounded-full ${bar.color} transition-all duration-700`}
                style={{ width: `${(bar.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-7 flex flex-col justify-between gap-2 rounded-xl border border-[#e6deca] bg-[#faf7ef] p-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-medium text-[#536157]">Total booking value</p>
          <p className="mt-1 text-xs text-[#929990]">Booked value, excluding cancelled bookings</p>
        </div>
        <p className="text-xl font-extrabold text-[#765b2d]">{formatEGP(bookedValue)}</p>
      </div>
    </DashboardPanel>
  );
}

/**
 * Bookings no longer flip cars to reserved/rented, so "in use" is the number
 * of active bookings and "upcoming" the confirmed ones; the other bars are
 * fleet states set by an admin.
 */
export function FleetPanel({ stats }: { stats: AdminStats }) {
  const total = stats.cars.total;
  const bars: Bar[] = [
    { label: "Available", count: stats.cars.available, color: "bg-[#315b3c]" },
    { label: "In use", count: stats.bookings.active, color: "bg-[#c6a15b]" },
    { label: "Upcoming", count: stats.bookings.confirmed, color: "bg-[#6e806f]" },
    { label: "Maintenance", count: stats.cars.maintenance, color: "bg-[#c17b42]" },
  ];
  const max = Math.max(...bars.map((bar) => bar.count), 1);

  return (
    <DashboardPanel eyebrow="Fleet status" title="Vehicle availability">
      <div className="flex items-end justify-around gap-4 border-b border-[#eeeee8] pb-5 pt-3">
        {bars.map((bar) => (
          <div key={bar.label} className="flex min-w-0 flex-1 flex-col items-center">
            <span className="mb-2 text-sm font-extrabold text-[#17251e]">{bar.count}</span>
            <div className="flex h-36 w-full max-w-12 items-end overflow-hidden rounded-t-lg bg-[#efefe9]">
              <div
                className={`w-full rounded-t-lg ${bar.color} transition-all duration-700`}
                style={{
                  height: `${Math.max((bar.count / max) * 100, bar.count ? 8 : 0)}%`,
                }}
              />
            </div>
            <span className="mt-3 text-center text-[10px] font-medium text-[#788078] sm:text-xs">
              {bar.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#dce7dc] bg-[#f0f5ef] p-4">
          <p className="text-xs font-medium text-[#536157]">Available rate</p>
          <p className="mt-2 text-2xl font-extrabold text-[#315b3c]">
            {percent(stats.cars.available, total)}%
          </p>
        </div>
        <div className="rounded-xl border border-[#e6deca] bg-[#faf7ef] p-4">
          <p className="text-xs font-medium text-[#536157]">In use now</p>
          <p className="mt-2 text-2xl font-extrabold text-[#765b2d]">
            {percent(stats.bookings.active, total)}%
          </p>
          <p className="mt-1 text-[11px] text-[#929990]">
            {stats.bookings.confirmed} upcoming
          </p>
        </div>
      </div>

      <Link href="/admin/cars" className={panelFooterLinkClass}>
        Manage fleet <Icon name="arrow" className="h-4 w-4" />
      </Link>
    </DashboardPanel>
  );
}
