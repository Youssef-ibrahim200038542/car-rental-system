"use client";

import { useState } from "react";
import { AdminPage } from "../_components/AdminPage";
import { ListPanel } from "../_components/ListPanel";
import { PageHeader } from "../_components/PageHeader";
import { RefreshButton } from "../_components/RefreshButton";
import { SearchFilterBar } from "../_components/SearchFilterBar";
import { StatCard, StatGrid } from "../_components/StatCard";
import {
  ClearFiltersButton,
  EmptyState,
  ErrorState,
  LoadingState,
} from "../_components/states";
import {
  BOOKING_PAYMENT_OPTIONS,
  BOOKING_STATUS_OPTIONS,
  bookedValue,
  countBookings,
  filterBookings,
} from "../_lib/bookings";
import { formatEGP } from "../_lib/format";
import { useAdminBookings } from "../_lib/resources";
import { useWorkspace } from "../_lib/useWorkspace";
import { BookingsTable } from "./_components/BookingsTable";

function BookingValueBanner({ value }: { value: number }) {
  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-[#25392f] bg-[#0a1411] text-white shadow-sm">
      <div className="flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center md:p-8">
        <div>
          <p className="text-sm font-medium text-white/60">Total Booking Value</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#d8b979] md:text-4xl">
            {formatEGP(value)}
          </p>
          <p className="mt-3 max-w-xl text-xs leading-5 text-white/45">
            Total value of listed bookings, excluding cancelled ones. This is not
            necessarily the amount actually collected.
          </p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#c6a15b]/30 bg-[#c6a15b]/10 text-sm font-bold text-[#d8b979]">
          EGP
        </div>
      </div>
    </section>
  );
}

export default function AdminBookingsPage() {
  const bookings = useAdminBookings();
  const workspace = useWorkspace();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const back = { href: workspace.dashboardHref, label: "Back to Dashboard" };

  if (bookings.loading) {
    return <LoadingState message="Loading bookings..." />;
  }

  if (bookings.loadError) {
    return (
      <ErrorState
        title="Unable to load bookings"
        message={bookings.loadError}
        onRetry={bookings.reload}
        retrying={bookings.refreshing}
        back={back}
      />
    );
  }

  const all = bookings.items;
  const filteredBookings = filterBookings(all, search, statusFilter, paymentFilter);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPaymentFilter("all");
  };

  return (
    <AdminPage>
      <PageHeader
        back={back}
        eyebrow={workspace.label}
        title="Manage Bookings"
        description="Monitor reservations, review payment status, and access booking details from one place."
        actions={<RefreshButton onClick={bookings.reload} refreshing={bookings.refreshing} />}
      />

      <StatGrid>
        <StatCard label="Total Bookings" value={all.length} detail="All listed reservations" icon="calendar" />
        <StatCard
          label="Pending"
          value={countBookings(all, "pending")}
          detail="Awaiting confirmation"
          icon="clock"
          tone="gold"
        />
        <StatCard
          label="Confirmed"
          value={countBookings(all, "confirmed")}
          detail="Approved reservations"
          icon="checkCircle"
          tone="sage"
        />
        <StatCard
          label="Active"
          value={countBookings(all, "active")}
          detail="Currently in progress"
          icon="car"
          tone="success"
        />
      </StatGrid>

      <BookingValueBanner value={bookedValue(all)} />

      <ListPanel
        title="All Bookings"
        shown={filteredBookings.length}
        total={all.length}
        noun="bookings"
        footerNote="All amounts are displayed in EGP"
        filters={
          <SearchFilterBar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search booking, customer, car..."
            searchLabel="Search bookings"
            filters={[
              {
                label: "Filter by booking status",
                value: statusFilter,
                onChange: setStatusFilter,
                options: BOOKING_STATUS_OPTIONS,
              },
              {
                label: "Filter by payment status",
                value: paymentFilter,
                onChange: setPaymentFilter,
                options: BOOKING_PAYMENT_OPTIONS,
              },
            ]}
          />
        }
      >
        {all.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No bookings yet"
            message="Reservations will appear here once customers book a car."
          />
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            icon="search"
            title="No bookings found"
            message="Try changing your search or filters."
            action={<ClearFiltersButton onClick={clearFilters} />}
          />
        ) : (
          <BookingsTable bookings={filteredBookings} />
        )}
      </ListPanel>
    </AdminPage>
  );
}
