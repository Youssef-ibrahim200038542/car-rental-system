"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, errorMessage } from "@/lib/api";
import { redirectIfUnauthorized } from "@/lib/auth";
import type {
  AdminStats,
  Booking,
  Branch,
  Car,
  CarCategory,
  Payment,
  PaymentStatus,
  Review,
  User,
} from "@/lib/types";
import { useAdminList, useListRemoval } from "./useAdminList";
import { useAdminRecord } from "./useAdminRecord";

/** One hook per admin resource, so every page loads data the same way. */

export function useAdminCars() {
  const list = useAdminList<Car>("/cars", "Failed to load cars.");
  const removal = useListRemoval(list, (id) => `/cars/${id}`, "Failed to delete car.");
  return { ...list, ...removal };
}

export function useAdminBranches() {
  const list = useAdminList<Branch>("/branches", "Failed to load branches.");
  const removal = useListRemoval(
    list,
    (id) => `/branches/${id}`,
    "Failed to delete branch."
  );
  return { ...list, ...removal };
}

export function useAdminUsers() {
  const list = useAdminList<User>("/users", "Failed to load users.");
  const removal = useListRemoval(list, (id) => `/users/${id}`, "Failed to delete user.");
  return { ...list, ...removal };
}

export function useAdminReviews() {
  const list = useAdminList<Review>("/reviews", "Failed to load reviews.");
  const removal = useListRemoval(
    list,
    (id) => `/reviews/${id}`,
    "Failed to delete review."
  );
  return { ...list, ...removal };
}

export function useAdminBookings() {
  return useAdminList<Booking>("/bookings", "Failed to load bookings.");
}

export function useAdminPayments() {
  const router = useRouter();
  const list = useAdminList<Payment>("/payments", "Failed to load payments.");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const { setItems, setActionError } = list;

  const updateStatus = async (payment: Payment, status: PaymentStatus) => {
    if (payment.payment_status === status) return;

    setUpdatingId(payment.id);
    setActionError("");

    try {
      const updated = await apiFetch<Payment>(`/payments/${payment.id}`, {
        method: "PUT",
        body: {
          payment_status: status,
          paid_at: status === "paid" ? new Date().toISOString() : null,
        },
      });

      // The update response may carry a booking without user/car loaded, so
      // merge it over the list's copy instead of replacing it.
      setItems((current) =>
        current.map((item) =>
          item.id === payment.id
            ? {
                ...item,
                ...updated,
                booking:
                  item.booking && updated.booking
                    ? { ...item.booking, ...updated.booking }
                    : (updated.booking ?? item.booking),
              }
            : item
        )
      );
    } catch (err) {
      if (redirectIfUnauthorized(err, router)) return;
      setActionError(errorMessage(err, "Failed to update payment."));
    } finally {
      setUpdatingId(null);
    }
  };

  return { ...list, updatingId, updateStatus };
}

export function useAdminStats() {
  return useAdminRecord<AdminStats>("/admin/stats", "Unable to load dashboard.");
}

/** Categories and branches for the car create/edit selects. */
export function useCarFormOptions() {
  const categories = useAdminList<CarCategory>(
    "/car-categories",
    "Failed to load categories or branches."
  );
  const branches = useAdminList<Branch>(
    "/branches",
    "Failed to load categories or branches."
  );

  return {
    categories: categories.items,
    branches: branches.items,
    loading: categories.loading || branches.loading,
    loadError: categories.loadError || branches.loadError,
    reload: () => {
      categories.reload();
      branches.reload();
    },
  };
}
