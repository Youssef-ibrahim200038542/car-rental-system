"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, errorMessage, isApiError } from "@/lib/api";
import { redirectIfUnauthorized } from "@/lib/auth";
import type { Booking, BookingStatus } from "@/lib/types";

/**
 * Move a booking to its next status. Cancelling goes through
 * POST /bookings/{id}/cancel, which also refunds paid and fails pending
 * payments; every other move is a PUT. Both return the refreshed booking.
 */
export function useBookingStatusUpdate(
  booking: Booking | null,
  setBooking: Dispatch<SetStateAction<Booking | null>>
) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const updateStatus = async (status: BookingStatus) => {
    if (!booking || status === booking.status) return;

    setUpdating(true);
    setError("");

    try {
      const updated =
        status === "cancelled"
          ? await apiFetch<Booking>(`/bookings/${booking.id}/cancel`, { method: "POST" })
          : await apiFetch<Booking>(`/bookings/${booking.id}`, {
              method: "PUT",
              body: { status },
            });

      setBooking((current) =>
        current ? { ...current, ...updated, status: updated?.status || status } : current
      );
    } catch (err) {
      if (redirectIfUnauthorized(err, router)) return;
      setError(
        isApiError(err, 403)
          ? "Your account does not have permission to update bookings."
          : errorMessage(err, "Failed to update booking status.")
      );
    } finally {
      setUpdating(false);
    }
  };

  return { updating, error, setError, updateStatus };
}
