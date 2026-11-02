"use client";

import Link from "next/link";
import { useSessionUser } from "@/lib/auth";
import { AdminPage } from "./_components/AdminPage";
import { PageHeader } from "./_components/PageHeader";
import { RefreshButton } from "./_components/RefreshButton";
import { StatCard, StatGrid } from "./_components/StatCard";
import { ErrorState, LoadingState } from "./_components/states";
import { LatestReviewsPanel, PaymentSummaryPanel } from "./_components/dashboard/ActivityPanels";
import { QuickActions, WelcomeBanner } from "./_components/dashboard/DashboardChrome";
import { BookingOverviewPanel, FleetPanel } from "./_components/dashboard/OverviewPanels";
import { RecentBookingsPanel } from "./_components/dashboard/RecentBookingsPanel";
import { bookedValue } from "./_lib/bookings";
import { formatEGP } from "./_lib/format";
import { buttonClass } from "./_lib/ui";
import { useAdminDashboard } from "./_lib/useAdminDashboard";

export default function AdminDashboardPage() {
  const user = useSessionUser();
  const dashboard = useAdminDashboard();

  if (dashboard.loading) {
    return <LoadingState message="Loading dashboard..." width="wide" />;
  }

  if (dashboard.error || !dashboard.stats) {
    return (
      <ErrorState
        title="Dashboard unavailable"
        message={dashboard.error || "Unable to load dashboard."}
        onRetry={dashboard.reload}
        width="wide"
      />
    );
  }

  const { stats, bookings, payments, reviews } = dashboard;
  const paidCount = payments.filter((payment) => payment.payment_status === "paid").length;

  return (
    <AdminPage width="wide">
      <PageHeader
        eyebrow="Overview"
        title={
          <>
            Dashboard<span className="text-[#c6a15b]">.</span>
          </>
        }
        description="Here's what's happening with your rental business."
        actions={
          <>
            <Link href="/" className={buttonClass.secondary}>
              View website ↗
            </Link>
            <RefreshButton
              onClick={dashboard.reload}
              refreshing={dashboard.refreshing}
              label="Refresh data"
            />
          </>
        }
      />

      <WelcomeBanner firstName={user?.name?.split(" ")[0]} />

      <StatGrid>
        <StatCard
          label="Total vehicles"
          value={stats.cars.total}
          detail={`${stats.cars.available} available · ${stats.bookings.active} in use`}
          icon="car"
        />
        <StatCard
          label="Total bookings"
          value={stats.bookings.total}
          detail={`${stats.bookings.pending} awaiting review`}
          icon="calendar"
        />
        <StatCard
          label="Collected revenue"
          value={formatEGP(stats.revenue.paid_total)}
          detail={`${paidCount} paid transactions`}
          icon="wallet"
          tone="success"
        />
        <StatCard
          label="Customer rating"
          value={stats.reviews.total ? `${stats.reviews.average_rating.toFixed(1)} / 5` : "—"}
          detail={`${stats.reviews.total} customer reviews`}
          icon="star"
          tone="gold"
        />
      </StatGrid>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <BookingOverviewPanel bookings={stats.bookings} bookedValue={bookedValue(bookings)} />
        <FleetPanel stats={stats} />
      </div>

      <div className="mt-6">
        <RecentBookingsPanel bookings={bookings} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <PaymentSummaryPanel revenue={stats.revenue.paid_total} payments={payments} />
        <LatestReviewsPanel
          reviews={reviews}
          total={stats.reviews.total}
          averageRating={stats.reviews.average_rating}
        />
      </div>

      <QuickActions />

      <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-[#e2e3db] pt-5 text-xs text-[#929990] sm:flex-row">
        <p>DriveX Administration</p>
        <p>Business overview · Live data from your API</p>
      </footer>
    </AdminPage>
  );
}
