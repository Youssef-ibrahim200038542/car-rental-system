"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatTile from "@/app/components/StatTile";
import { PageLoading, PageState, StateCard } from "@/app/components/StateViews";
import Icon, { type IconName } from "@/app/components/icons";
import { apiFetch, errorMessage, isApiError } from "@/lib/api";
import { redirectIfUnauthorized, useRequireRole } from "@/lib/auth";
import { getLocalToday } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import type { Booking, Role } from "@/lib/types";
import StaffBookingList from "./StaffBookingList";
import { staffQueues } from "./staff-bookings";

const STAFF_ROLES: Role[] = ["staff", "admin"];

const QUICK_LINKS: { href: string; label: string; note: string; icon: IconName }[] = [
  { href: "/admin/bookings", label: "All bookings", note: "Search, confirm and update", icon: "calendar" },
  { href: "/admin/payments", label: "Payments", note: "Record and review payments", icon: "wallet" },
];

export default function StaffDashboardPage() {
  const router = useRouter();
  const auth = useRequireRole(STAFF_ROLES);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (auth.status !== "allowed") return;
    let cancelled = false;

    (async () => {
      try {
        // Staff see every booking, not only their own.
        const data = await apiFetch<Booking[]>("/bookings");
        if (cancelled) return;
        setBookings(Array.isArray(data) ? data : []);
        setError("");
      } catch (err) {
        if (cancelled || redirectIfUnauthorized(err, router)) return;
        setError(
          isApiError(err, 403)
            ? "Your account does not have permission to view bookings."
            : errorMessage(err, "Something went wrong while loading the dashboard.")
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth.status, router, reloadKey]);

  const today = getLocalToday();
  const queues = useMemo(() => staffQueues(bookings, today), [bookings, today]);

  if (auth.status === "error") {
    return (
      <PageState
        tone="error"
        title="We couldn't open the staff dashboard"
        message={auth.message}
        action={{ label: "Try Again", onClick: auth.retry }}
      />
    );
  }

  if (auth.status === "loading") return <PageLoading message="Checking your access..." />;

  const retry = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  return (
    <main className="min-h-screen bg-[#f8f8f7] px-4 pb-20 pt-28 text-[#0a1411] sm:px-6 sm:pt-32">
      <div className="mx-auto max-w-7xl">
        <section className="relative mb-8 overflow-hidden rounded-[2rem] border border-[#e8e4db] bg-white px-6 py-9 shadow-[0_12px_40px_rgba(10,20,17,0.04)] sm:px-9 md:py-11">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#c6a15b]/10 blur-3xl" />

          <div className="relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#c6a15b]" />
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#9a783c] sm:text-sm">
                  Front desk, {formatDate(today)}
                </p>
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#0a1411] sm:text-5xl">
                Welcome back, {auth.user.name}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#77776f] sm:text-base">
                Today&apos;s handovers, bookings waiting for confirmation and the cars currently on
                the road.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[440px]">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-2xl border border-[#e8e4db] bg-[#f8f8f7] p-4 transition hover:border-[#c6a15b] hover:bg-[#fbf8f0] focus:outline-none focus:ring-2 focus:ring-[#c6a15b] focus:ring-offset-2"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f6f0e3] text-[#9a783c]">
                    <Icon name={link.icon} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-[#0a1411]">{link.label}</span>
                    <span className="block text-xs text-[#898981]">{link.note}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {loading && <DashboardSkeleton />}

        {!loading && error && (
          <StateCard
            tone="error"
            title="Unable to load dashboard data"
            message={error}
            action={{ label: "Try Again", onClick: retry }}
          />
        )}

        {!loading && !error && (
          <>
            <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatTile label="Pickups today" value={queues.pickupsToday.length} note="Cars leaving a branch" icon={<TileIcon name="key" />} />
              <StatTile label="Returns today" value={queues.returnsToday.length} note="Cars due back" icon={<TileIcon name="car" />} />
              <StatTile
                label="To confirm"
                value={queues.pending.length}
                valueClass="text-[#9a783c]"
                note="Pending bookings"
                icon={<TileIcon name="clock" />}
              />
              <StatTile
                label="Active rentals"
                value={queues.active.length}
                valueClass="text-[#356847]"
                note="Cars on the road"
                hoverClass="hover:border-[#b9d8c0]"
                icon={<TileIcon name="calendar" />}
              />
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <StaffBookingList
                title="Pickups today"
                description="Hand over the car and set the booking to active."
                bookings={queues.pickupsToday}
                emptyMessage="No pickups scheduled for today."
                dateField="pickup_date"
              />
              <StaffBookingList
                title="Returns today"
                description="Check the car in and complete the booking."
                bookings={queues.returnsToday}
                emptyMessage="No returns due today."
                dateField="return_date"
              />
              <StaffBookingList
                title="Waiting for confirmation"
                description="New bookings, soonest pickup first."
                bookings={queues.pending}
                emptyMessage="Every booking has been confirmed."
                dateField="pickup_date"
              />
              <StaffBookingList
                title="Active rentals"
                description="Cars currently with customers, soonest return first."
                bookings={queues.active}
                emptyMessage="No cars are out right now."
                dateField="return_date"
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function TileIcon({ name }: { name: IconName }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f6f0e3] text-[#9a783c]">
      <Icon name={name} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading dashboard">
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-[118px] animate-pulse rounded-2xl border border-[#e8e4db] bg-white" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2].map((item) => (
          <div key={item} className="h-64 animate-pulse rounded-3xl border border-[#e8e4db] bg-white" />
        ))}
      </div>
    </div>
  );
}
