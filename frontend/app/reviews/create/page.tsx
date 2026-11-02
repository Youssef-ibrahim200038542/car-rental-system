"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { InlineError, Spinner, StateCard } from "@/app/components/StateViews";
import { apiFetch, errorMessage, getStoredUser, getToken } from "@/lib/api";
import { redirectIfUnauthorized } from "@/lib/auth";
import type { Booking } from "@/lib/types";
import ReviewedBooking from "./ReviewedBooking";
import StarRatingInput from "./StarRatingInput";

/** Why this booking cannot be reviewed, or "" when the form should show. */
function reviewBlocker(booking: Booking, userId: number): string {
  if (Number(booking.user_id) !== Number(userId)) return "You can only review your own bookings.";
  if (booking.status !== "completed") return "You can only review a completed booking.";
  if (booking.review) return "You have already reviewed this booking.";
  return "";
}

export default function CreateReviewPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f8f8f7]" />}>
      <CreateReviewForm />
    </Suspense>
  );
}

function CreateReviewForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking_id");

  const [booking, setBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const user = getStoredUser();

    if (!getToken() || !user) {
      router.push("/login");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        if (!bookingId) throw new Error("Booking ID is missing.");

        const fetchedBooking = await apiFetch<Booking>(`/bookings/${bookingId}`);
        if (cancelled) return;

        const blocker = reviewBlocker(fetchedBooking, user.id);
        if (blocker) {
          setLoadError(blocker);
          return;
        }

        setBooking(fetchedBooking);
      } catch (err) {
        if (cancelled || redirectIfUnauthorized(err, router)) return;
        console.error(err);
        setLoadError(errorMessage(err, "Unable to load booking."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bookingId, router]);

  const handleSubmit = async () => {
    if (!booking) return;

    if (rating === 0) {
      setSubmitError("Please select a rating.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      await apiFetch("/reviews", {
        method: "POST",
        body: { booking_id: booking.id, rating, comment: comment.trim() || null },
      });
      router.push("/bookings");
    } catch (err) {
      if (redirectIfUnauthorized(err, router)) return;
      console.error(err);
      setSubmitError(errorMessage(err, "Unable to submit review."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f8f7] px-5 pb-20 pt-28 text-[#0a1411] sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10">
          <Link
            href="/bookings"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#68736d] transition-colors hover:text-[#9a783c]"
          >
            <span aria-hidden="true">←</span>
            Back to My Bookings
          </Link>

          <div className="mt-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c6a15b]/30 bg-[#c6a15b]/10 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-[#c6a15b]" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a783c]">
                Your Experience
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-[#0a1411] sm:text-5xl">
              Leave a Review<span className="text-[#c6a15b]">.</span>
            </h1>
            <p className="mt-4 max-w-xl leading-7 text-[#68736d]">
              Tell us about your rental experience and help other customers choose the right car.
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-[#e5e6e1] bg-white">
            <div className="text-center" role="status">
              <Spinner />
              <p className="mt-5 text-sm font-medium text-[#68736d]">Loading booking...</p>
            </div>
          </div>
        )}

        {!loading && loadError && (
          <StateCard
            tone="error"
            title="Unable to continue"
            message={loadError}
            action={{ label: "Back to My Bookings", href: "/bookings" }}
          />
        )}

        {!loading && !loadError && booking && (
          <div className="space-y-6">
            <ReviewedBooking booking={booking} />

            <section className="rounded-3xl border border-[#e5e6e1] bg-white p-6 shadow-sm sm:p-8">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c6a15b]/10 text-xl">
                  ★
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-[#0a1411]">
                  How was your experience?
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#68736d]">
                  Your feedback helps us improve our service.
                </p>
              </div>

              <StarRatingInput
                value={rating}
                onChange={(star) => {
                  setRating(star);
                  setSubmitError("");
                }}
              />

              <div className="mt-8">
                <label htmlFor="review-comment" className="mb-3 block text-sm font-semibold text-[#0a1411]">
                  Your Comment <span className="font-normal text-[#929a94]">(Optional)</span>
                </label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you liked about the car and your rental experience..."
                  rows={5}
                  className="w-full resize-y rounded-2xl border border-[#e1e3dc] bg-[#f8f8f7] px-5 py-4 text-sm leading-7 text-[#0a1411] outline-none transition placeholder:text-[#9ba29d] focus:border-[#c6a15b] focus:bg-white focus:ring-2 focus:ring-[#c6a15b]/15"
                />
                <p className="mt-2 text-right text-xs text-[#929a94]">{comment.length} characters</p>
              </div>

              {submitError && <InlineError message={submitError} className="mt-5" />}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0a1411] px-6 py-4 font-semibold text-white shadow-lg shadow-[#0a1411]/10 transition-all duration-200 hover:bg-[#c6a15b] hover:text-[#0a1411] hover:shadow-[#c6a15b]/20 focus:outline-none focus:ring-2 focus:ring-[#c6a15b] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#0a1411] disabled:hover:text-white"
              >
                {submitting ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Submitting Review...
                  </>
                ) : (
                  <>
                    Submit Review <span aria-hidden="true">→</span>
                  </>
                )}
              </button>

              <p className="mt-4 text-center text-xs leading-5 text-[#929a94]">
                Your honest feedback helps other customers make better choices.
              </p>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
