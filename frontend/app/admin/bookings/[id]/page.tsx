"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import type { Booking, BookingStatus } from "@/lib/types";
import { AdminPage } from "../../_components/AdminPage";
import { ConfirmDialog } from "../../_components/ConfirmDialog";
import { PageHeader } from "../../_components/PageHeader";
import { StatusBadge } from "../../_components/StatusBadge";
import { ErrorAlert, ErrorState, LoadingState } from "../../_components/states";
import { useAdminRecord } from "../../_lib/useAdminRecord";
import {
  CustomerCard,
  NotesCard,
  RentalPeriodCard,
  VehicleCard,
} from "../_components/BookingDetailCards";
import { BookingPaymentsCard, BookingSummaryCard } from "../_components/BookingMoneyCards";
import { BookingStatusCard } from "../_components/BookingStatusCard";
import { useBookingStatusUpdate } from "../_lib/useBookingStatusUpdate";

const BACK = { href: "/admin/bookings", label: "Back to Bookings" };

export default function AdminBookingDetailsPage() {
  const { id: bookingId } = useParams<{ id: string }>();
  const booking = useAdminRecord<Booking>(
    `/bookings/${bookingId}`,
    "Failed to load booking.",
    "Your account does not have permission to view this booking."
  );
  const status = useBookingStatusUpdate(booking.data, booking.setData);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  if (booking.loading) {
    return <LoadingState message="Loading booking details..." />;
  }

  if (booking.error || !booking.data) {
    return (
      <ErrorState
        title="Booking unavailable"
        message={booking.error || "Booking not found."}
        onRetry={booking.reload}
        back={BACK}
      />
    );
  }

  const data = booking.data;

  const saveStatus = (next: BookingStatus) => {
    if (next === "cancelled") {
      setConfirmingCancel(true);
      return;
    }
    void status.updateStatus(next);
  };

  const confirmCancel = async () => {
    await status.updateStatus("cancelled");
    setConfirmingCancel(false);
  };

  return (
    <AdminPage>
      <PageHeader
        back={BACK}
        eyebrow={`Booking #${data.id}`}
        title="Booking Details"
        description="Review the customer, vehicle, rental period, payment history, and booking status."
        actions={<StatusBadge kind="booking" status={data.status} size="lg" />}
      />

      <ErrorAlert message={status.error} onDismiss={() => status.setError("")} />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CustomerCard booking={data} />
          <VehicleCard booking={data} />
          <RentalPeriodCard booking={data} />
          <BookingPaymentsCard booking={data} />
          {data.notes && <NotesCard notes={data.notes} />}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-28">
          <BookingSummaryCard booking={data} />
          <BookingStatusCard
            key={data.status}
            status={data.status}
            updating={status.updating}
            onSave={saveStatus}
          />
        </aside>
      </div>

      <ConfirmDialog
        open={confirmingCancel}
        title="Cancel this booking?"
        message="The booking will be cancelled, paid payments will be marked refunded and pending ones failed. This cannot be undone."
        confirmLabel="Cancel Booking"
        busyLabel="Cancelling..."
        busy={status.updating}
        onConfirm={() => void confirmCancel()}
        onCancel={() => setConfirmingCancel(false)}
      />
    </AdminPage>
  );
}
