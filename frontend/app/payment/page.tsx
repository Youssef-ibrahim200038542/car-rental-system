"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { InlineError, PageLoading, PageState, primaryButtonClass } from "@/app/components/StateViews";
import { apiFetch, errorMessage, getToken, isApiError } from "@/lib/api";
import { redirectIfUnauthorized } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import type { Booking, PayBookingResult, PaymentMethod } from "@/lib/types";
import PaymentMethodPicker from "./PaymentMethodPicker";
import ReservationSummary from "./ReservationSummary";
import { paymentBlocker } from "./payment-blocker";

const lockIcon = (
  <>
    <rect x="5" y="10" width="14" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </>
);

const STEPS = [
  { label: "Reservation", done: true },
  { label: "Payment", done: true },
  { label: "Confirmation", done: false },
];

export default function PaymentPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PaymentCheckout />
    </Suspense>
  );
}

function PaymentCheckout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking_id");

  const [booking, setBooking] = useState<Booking | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      const returnTo = bookingId ? `/payment?booking_id=${bookingId}` : "/bookings";
      router.replace(`/login?redirect=${encodeURIComponent(returnTo)}`);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        if (!bookingId) throw new Error("Booking not found. Please select a booking first.");
        const data = await apiFetch<Booking>(`/bookings/${bookingId}`);
        if (!data) throw new Error("Booking information could not be found.");
        if (!cancelled) setBooking(data);
      } catch (err) {
        if (cancelled || redirectIfUnauthorized(err, router)) return;
        console.error(err);
        setError(
          isApiError(err, 403)
            ? "This booking belongs to another account."
            : isApiError(err, 404)
              ? "Booking not found."
              : errorMessage(err, "Unable to load booking.")
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bookingId, router]);

  const handlePayment = async () => {
    if (paymentLoading || !booking) return;
    setError("");
    setPaymentLoading(true);

    try {
      // One request: the server records the payment and confirms the booking.
      await apiFetch<PayBookingResult>(`/bookings/${booking.id}/pay`, {
        method: "POST",
        body: { payment_method: paymentMethod },
      });
      router.push(`/payment/success?booking_id=${booking.id}`);
    } catch (err) {
      if (redirectIfUnauthorized(err, router)) return;
      console.error(err);
      setError(errorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) return <PageLoading message="Loading payment information..." />;

  if (!booking) {
    return (
      <PageState
        tone="error"
        title="Payment Unavailable"
        message={error || "Booking not found."}
        action={{ label: "Back to My Bookings", href: "/bookings" }}
      />
    );
  }

  const isCashPayment = paymentMethod === "cash";
  const blocker = paymentBlocker(booking);

  return (
    <main className="min-h-screen bg-[#f8f8f7] px-4 pb-16 pt-28 text-[#0a1411] sm:px-6 sm:pb-20 sm:pt-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-9 sm:mb-12">
          <Link
            href="/cars"
            className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-[#77776f] transition hover:text-[#9a783c]"
          >
            <span aria-hidden="true">←</span>
            Back to cars
          </Link>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#9a783c]">
                <span className="h-px w-7 bg-[#c6a15b]" />
                Secure Checkout
              </p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Complete Your Payment
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#77776f] sm:text-base">
                Review your reservation and select your preferred payment method.
              </p>
            </div>

            <div className="flex w-fit items-center gap-3 rounded-2xl border border-[#e8e4db] bg-white px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f6f0e3] text-[#9a783c]">
                <SvgIcon>{lockIcon}<path d="m10 15 1.5 1.5L14.5 13" /></SvgIcon>
              </div>
              <div>
                <p className="text-sm font-semibold">Secure Checkout</p>
                <p className="mt-0.5 text-xs text-[#77776f]">Booking #{booking.id}</p>
              </div>
            </div>
          </div>

          <ol className="mt-8 grid max-w-md grid-cols-3 gap-2">
            {STEPS.map((step) => (
              <li key={step.label}>
                <div className={`h-1 rounded-full ${step.done ? "bg-[#c6a15b]" : "bg-[#e8e4db]"}`} />
                <p className={`mt-2 text-xs ${step.done ? "font-semibold text-[#343830]" : "text-[#898981]"}`}>
                  {step.label}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_370px] lg:gap-8">
          <section className="min-w-0 rounded-3xl border border-[#e8e4db] bg-white p-5 shadow-[0_12px_40px_rgba(10,20,17,0.04)] sm:p-7 md:p-8">
            {blocker ? (
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f6f0e3] text-2xl text-[#9a783c]">
                  {booking.status === "cancelled" ? "!" : "✓"}
                </div>
                <h2 className="mt-5 text-xl font-bold sm:text-2xl">{blocker.title}</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#77776f]">{blocker.message}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#9a783c]">
                  Booking status: {booking.status}
                </p>
                <Link href="/bookings" className={`mt-7 ${primaryButtonClass}`}>
                  Back to My Bookings
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f6f0e3] text-[#9a783c]">
                    <SvgIcon className="h-6 w-6">
                      <rect x="3" y="5" width="18" height="14" rx="3" />
                      <path d="M3 10h18M7 15h3" />
                    </SvgIcon>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold sm:text-2xl">Payment Method</h2>
                    <p className="mt-1 text-sm text-[#77776f]">Choose how you would like to pay.</p>
                  </div>
                </div>

                <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} />

                {error && <InlineError message={error} />}

                <div className="mt-6 rounded-2xl border border-[#e8e4db] bg-[#f8f8f7] p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0e8d7] text-[#9a783c]">
                      <SvgIcon>
                        {isCashPayment ? (
                          <>
                            <rect x="3" y="6" width="18" height="12" rx="2" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        ) : (
                          lockIcon
                        )}
                      </SvgIcon>
                    </div>
                    <div>
                      <p className="font-semibold text-[#343830]">
                        {isCashPayment ? "Pay at the Branch" : "Demo Payment"}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[#77776f]">
                        {isCashPayment
                          ? "Your booking will remain pending until the branch collects and confirms your payment."
                          : "This is a demo checkout. No real card details are collected and no payment gateway is connected."}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={paymentLoading}
                  className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#0a1411] px-5 py-4 font-semibold text-white shadow-[0_8px_20px_rgba(10,20,17,0.12)] transition duration-200 hover:bg-[#1a3027] focus:outline-none focus:ring-2 focus:ring-[#c6a15b] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {paymentLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {isCashPayment
                        ? "Confirm Cash Booking"
                        : `Pay ${formatMoney(booking.total_amount)} EGP`}
                      <span aria-hidden="true">→</span>
                    </>
                  )}
                </button>

                <Link
                  href="/bookings"
                  className="mt-5 block text-center text-sm font-medium text-[#77776f] transition hover:text-[#9a783c]"
                >
                  ← Back to My Bookings
                </Link>

                <p className="mt-5 text-center text-xs leading-5 text-[#898981]">
                  Demo checkout only. Card and online selections do not process a real payment.
                </p>
              </>
            )}
          </section>

          <ReservationSummary booking={booking} />
        </div>
      </div>
    </main>
  );
}

function SvgIcon({ children, className = "h-5 w-5" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      {children}
    </svg>
  );
}
