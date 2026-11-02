"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BookingCard, { BookingActionLink, bookingActionClass } from "@/app/components/BookingCard";
import { InlineError, StateCard } from "@/app/components/StateViews";
import Icon from "@/app/components/icons";
import { apiFetch, errorMessage, getToken } from "@/lib/api";
import { redirectIfUnauthorized } from "@/lib/auth";
import type { Booking } from "@/lib/types";
import BookingFilterBar, { type BookingFilter } from "./BookingFilterBar";
import BookingStats from "./BookingStats";
import {
  canReview,
  filterBookings,
  hasPayment,
  isActiveBooking,
  isCancellable,
  totalPaid,
} from "./booking-rules";

const ctaClass =
  "inline-flex w-fit shrink-0 items-center justify-center gap-3 rounded-xl bg-[#365747] px-6 py-3.5 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#c6a15b] hover:text-[#0a1411] hover:shadow-lg hover:shadow-[#c6a15b]/20 focus:outline-none focus:ring-2 focus:ring-[#c6a15b] focus:ring-offset-2";

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<BookingFilter>("all");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // The API returns only the signed-in customer's bookings.
        const data = await apiFetch<Booking[]>("/bookings");
        if (cancelled) return;
        setBookings(Array.isArray(data) ? data : []);
        setError("");
      } catch (err) {
        if (cancelled || redirectIfUnauthorized(err, router)) return;
        console.error("Error fetching bookings:", err);
        setError("Unable to load your bookings. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, reloadKey]);

  const retry = () => {
    setLoading(true);
    setError("");
    setReloadKey((key) => key + 1);
  };

  const cancelBooking = async (booking: Booking) => {
    if (!window.confirm(`Cancel booking #${booking.id}? This cannot be undone.`)) return;

    setCancellingId(booking.id);
    setActionError("");

    try {
      const updated = await apiFetch<Booking>(`/bookings/${booking.id}/cancel`, { method: "POST" });
      setBookings((current) =>
        current.map((item) =>
          item.id === booking.id ? { ...item, status: updated?.status ?? "cancelled" } : item
        )
      );
    } catch (err) {
      if (redirectIfUnauthorized(err, router)) return;
      setActionError(errorMessage(err, "Failed to cancel booking."));
    } finally {
      setCancellingId(null);
    }
  };

  const filteredBookings = useMemo(() => filterBookings(bookings, filter), [bookings, filter]);
  const ready = !loading && !error;

  return (
    <main className="min-h-screen bg-[#f8f8f7] px-4 pb-20 pt-28 text-[#0a1411] sm:px-6 sm:pt-32">
      <div className="mx-auto max-w-7xl">
        <section className="relative mb-8 overflow-hidden rounded-[2rem] border border-[#e8e4db] bg-white px-6 py-9 shadow-[0_12px_40px_rgba(10,20,17,0.04)] sm:px-9 md:py-11">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#c6a15b]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-16 h-64 w-64 rounded-full bg-[#1a3027]/[0.06] blur-3xl" />

          <div className="relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#c6a15b]" />
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#9a783c] sm:text-sm">
                  Your Journey
                </p>
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#0a1411] sm:text-5xl md:text-6xl">
                My <span className="text-[#9a783c]">Bookings</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#77776f] sm:text-base">
                Manage your reservations, keep track of your rental schedule, and revisit every
                journey in one place.
              </p>
            </div>

            <Link href="/cars" className={ctaClass}>
              Browse Cars <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        {ready && bookings.length > 0 && (
          <>
            <BookingStats
              total={bookings.length}
              active={bookings.filter((booking) => isActiveBooking(booking.status)).length}
              spent={totalPaid(bookings)}
            />
            <BookingFilterBar filter={filter} count={filteredBookings.length} onChange={setFilter} />
          </>
        )}

        {loading && <BookingListSkeleton />}

        {!loading && error && (
          <StateCard
            tone="error"
            title="Something went wrong"
            message={error}
            action={{ label: "Try Again", onClick: retry }}
          />
        )}

        {ready && bookings.length === 0 && (
          <div className="relative overflow-hidden rounded-[2rem] border border-[#e8e4db] bg-white px-6 py-16 text-center shadow-[0_12px_40px_rgba(10,20,17,0.04)] sm:py-20">
            <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-[#c6a15b]/10 blur-3xl" />
            <div className="relative z-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#f6f0e3] text-[#9a783c]">
                <Icon name="calendar" className="h-10 w-10" strokeWidth={1.4} />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-[#0a1411]">Your journey starts here</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#77776f]">
                You haven&apos;t made any reservations yet. Explore our fleet and find a car for
                your next journey.
              </p>
              <Link href="/cars" className={`mt-8 ${ctaClass}`}>
                Explore Our Fleet <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        )}

        {ready && bookings.length > 0 && filteredBookings.length === 0 && (
          <StateCard
            tone="empty"
            title="No reservations found"
            message="There are no bookings in this category."
            action={{ label: "View All Bookings", onClick: () => setFilter("all") }}
          />
        )}

        {actionError && <InlineError message={actionError} className="mb-6" />}

        {ready && filteredBookings.length > 0 && (
          <div className="space-y-6">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                actions={
                  <>
                    {booking.status.toLowerCase() === "pending" && !hasPayment(booking) && (
                      <BookingActionLink href={`/payment?booking_id=${booking.id}`} tone="gold">
                        Complete Payment
                      </BookingActionLink>
                    )}

                    {isCancellable(booking.status) && (
                      <button
                        type="button"
                        onClick={() => void cancelBooking(booking)}
                        disabled={cancellingId === booking.id}
                        className={bookingActionClass.danger}
                      >
                        {cancellingId === booking.id ? "Cancelling..." : "Cancel Booking"}
                      </button>
                    )}

                    {canReview(booking) && (
                      <BookingActionLink href={`/reviews/create?booking_id=${booking.id}`} tone="gold">
                        Leave a Review
                      </BookingActionLink>
                    )}

                    <BookingActionLink href={`/cars/${booking.car_id}`} tone="green">
                      View Car
                    </BookingActionLink>
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function BookingListSkeleton() {
  return (
    <div className="grid gap-6" role="status" aria-label="Loading bookings">
      {[1, 2, 3].map((item) => (
        <div key={item} className="overflow-hidden rounded-3xl border border-[#e8e4db] bg-white">
          <div className="flex flex-col md:flex-row">
            <div className="h-64 animate-pulse bg-[#eeede8] md:w-72" />
            <div className="flex-1 space-y-5 p-6">
              <div className="h-4 w-32 animate-pulse rounded bg-[#eeede8]" />
              <div className="h-8 w-56 animate-pulse rounded bg-[#eeede8]" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((box) => (
                  <div key={box} className="h-20 animate-pulse rounded-xl bg-[#f1f0ec]" />
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
