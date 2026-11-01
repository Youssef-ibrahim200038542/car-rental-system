    "use client";

    import { Suspense, useEffect, useState } from "react";
    import Link from "next/link";
    import { useRouter, useSearchParams } from "next/navigation";
    import { apiFetch, errorMessage, getToken, isApiError } from "@/lib/api";
    import { redirectIfUnauthorized } from "@/lib/auth";
    import type { Booking, Payment } from "@/lib/types";

    const loadingScreen = (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f8f7] px-6 pt-28 text-[#0a1411]">
        <div className="text-center">
        <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-[#e8e4db] border-t-[#c6a15b]" />
        <p className="text-sm text-[#77776f]">Loading your booking...</p>
        </div>
    </main>
    );

    export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={loadingScreen}>
        <PaymentResult />
        </Suspense>
    );
    }

    /** The most relevant payment: a paid one, else the newest. */
    function latestPayment(booking: Booking): Payment | null {
    const payments = booking.payments ?? [];
    return (
        payments.find((payment) => payment.payment_status === "paid") ??
        payments[payments.length - 1] ??
        null
    );
    }

    function PaymentResult() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookingId = searchParams.get("booking_id");

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // The page reflects the server's record, never the query string.
    useEffect(() => {
        if (!getToken()) {
        router.replace("/login");
        return;
        }

        let cancelled = false;

        (async () => {
        try {
            if (!bookingId) throw new Error("No booking was specified.");
            const data = await apiFetch<Booking>(`/bookings/${bookingId}`);
            if (!cancelled) setBooking(data);
        } catch (err) {
            if (cancelled || redirectIfUnauthorized(err, router)) return;
            setError(
            isApiError(err, 403)
                ? "This booking belongs to another account."
                : errorMessage(err, "Unable to load your booking.")
            );
        } finally {
            if (!cancelled) setLoading(false);
        }
        })();

        return () => {
        cancelled = true;
        };
    }, [bookingId, router]);

    if (loading) return loadingScreen;

    if (!booking) {
        return (
        <main className="flex min-h-screen items-center justify-center bg-[#f8f8f7] px-5 py-28 text-[#0a1411]">
            <div className="w-full max-w-lg rounded-3xl border border-[#e8e4db] bg-white p-8 text-center shadow-[0_18px_55px_rgba(10,20,17,0.07)] sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl">
                !
            </div>
            <h1 className="mt-6 text-2xl font-bold">Booking Unavailable</h1>
            <p className="mt-3 text-sm leading-6 text-[#77776f]">
                {error || "Booking not found."}
            </p>
            <Link
                href="/bookings"
                className="mt-7 inline-flex items-center justify-center rounded-xl bg-[#0a1411] px-6 py-3 font-semibold text-white transition hover:bg-[#1a3027]"
            >
                Back to My Bookings
            </Link>
            </div>
        </main>
        );
    }

    const payment = latestPayment(booking);
    const paymentMethod = payment?.payment_method ?? null;
    const isPaid = payment?.payment_status === "paid";
    const isCashPayment = paymentMethod === "cash" && !isPaid;
    const isDemoPayment =
        isPaid && (paymentMethod === "card" || paymentMethod === "online");
    const isConfirmed = booking.status === "confirmed" || booking.status === "active";

    const title = !payment
        ? "Payment Not Recorded"
        : isPaid && isConfirmed
        ? "Booking Confirmed!"
        : isCashPayment
            ? "Booking Received!"
            : "Booking Updated";

    const statusLabel = isPaid
        ? `Paid · ${booking.status}`
        : payment
        ? `Payment ${payment.payment_status} · ${booking.status}`
        : `No payment · ${booking.status}`;

    const description = !payment
        ? "We could not find a payment for this booking. You can complete payment from your bookings page."
        : isCashPayment
        ? "Your reservation has been recorded. Please pay at the branch when you collect your car."
        : isPaid
            ? "Your payment was recorded and your booking is confirmed. You can review your reservation details from your bookings page."
            : "Your booking has been updated. You can review its current status from your bookings page.";

    return (
        <main className="min-h-screen bg-[#f8f8f7] px-4 pb-16 pt-28 text-[#0a1411] sm:px-6 sm:pb-20 sm:pt-32">
        <div className="mx-auto flex min-h-[650px] max-w-4xl items-center justify-center">
            <div className="w-full rounded-3xl border border-[#e8e4db] bg-white p-6 text-center shadow-[0_18px_55px_rgba(10,20,17,0.07)] sm:p-10 md:p-12">
            <Link
                href="/"
                className="inline-block text-2xl font-bold tracking-tight text-[#0a1411]"
            >
                Drive<span className="text-[#b18b49]">X</span>
            </Link>

            <div className="mx-auto mt-9 flex h-20 w-20 items-center justify-center rounded-full border border-[#c6a15b]/30 bg-[#f6f0e3] sm:h-24 sm:w-24">
                {isCashPayment ? (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-10 w-10 text-[#9a783c] sm:h-12 sm:w-12"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    aria-hidden="true"
                >
                    <rect x="3" y="6" width="18" height="12" rx="2" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M6 9h.01M18 15h.01" />
                </svg>
                ) : (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-10 w-10 text-[#9a783c] sm:h-12 sm:w-12"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    aria-hidden="true"
                >
                    <path
                    d="M20 7 10 17l-5-5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12" r="10" />
                </svg>
                )}
            </div>

            <p className="mt-8 text-xs font-bold uppercase tracking-[0.25em] text-[#9a783c]">
                {isCashPayment ? "Reservation Received" : "Checkout Complete"}
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                {title}
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#77776f] sm:text-base">
                {description}
            </p>

            {booking && (
                <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-[#e8e4db] bg-[#f8f8f7] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#898981]">
                    Booking ID
                </p>

                <p className="mt-2 font-mono text-2xl font-bold text-[#0a1411]">
                    #{booking.id}
                </p>

                <div
                    className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${
                    !isPaid
                        ? "bg-[#f6f0e3] text-[#87662f]"
                        : "bg-[#eaf3eb] text-[#356847]"
                    }`}
                >
                    <span
                    className={`h-2 w-2 rounded-full ${
                        !isPaid ? "bg-[#c6a15b]" : "bg-[#4d8b5e]"
                    }`}
                    />
                    <span className="capitalize">{statusLabel}</span>
                </div>
                {payment?.transaction_reference && (
                    <p className="mt-3 font-mono text-xs text-[#898981]">
                    Ref {payment.transaction_reference}
                    </p>
                )}
                </div>
            )}

            {isDemoPayment && (
                <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-[#e8e4db] bg-[#fbf8f0] p-4 text-left sm:p-5">
                <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f0e8d7] text-[#9a783c]">
                    i
                    </span>

                    <div>
                    <p className="font-semibold text-[#343830]">Demo Payment</p>
                    <p className="mt-1 text-sm leading-6 text-[#77776f]">
                        This project uses simulated card and online payments. No
                        real payment gateway has processed a transaction.
                    </p>
                    </div>
                </div>
                </div>
            )}

            <div className="mt-9 grid gap-4 text-left sm:grid-cols-3">
                <div className="rounded-2xl border border-[#e8e4db] bg-white p-4 transition hover:border-[#c6a15b]/60 sm:p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f6f0e3] text-[#9a783c]">
                    <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-6 w-6"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    aria-hidden="true"
                    >
                    <path d="M12 3 20 6v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
                    <path d="m9 12 2 2 4-4" />
                    </svg>
                </div>

                <p className="mt-4 text-sm font-semibold">
                    {isCashPayment ? "Reservation Saved" : "Booking Recorded"}
                </p>

                <p className="mt-2 text-xs leading-5 text-[#77776f]">
                    Your booking details have been submitted to the system.
                </p>
                </div>

                <div className="rounded-2xl border border-[#e8e4db] bg-white p-4 transition hover:border-[#c6a15b]/60 sm:p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f6f0e3] text-[#9a783c]">
                    <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-6 w-6"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    aria-hidden="true"
                    >
                    <path d="m3 13 1.5-5A3 3 0 0 1 7.4 6h9.2a3 3 0 0 1 2.9 2l1.5 5v5h-2v-2H5v2H3z" />
                    <path d="M4.5 12h15" />
                    <circle cx="7" cy="13" r="1.5" />
                    <circle cx="17" cy="13" r="1.5" />
                    </svg>
                </div>

                <p className="mt-4 text-sm font-semibold">Car Reservation</p>

                <p className="mt-2 text-xs leading-5 text-[#77776f]">
                    Review your selected vehicle and reservation dates in your
                    bookings.
                </p>
                </div>

                <div className="rounded-2xl border border-[#e8e4db] bg-white p-4 transition hover:border-[#c6a15b]/60 sm:p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f6f0e3] text-[#9a783c]">
                    <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-6 w-6"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    aria-hidden="true"
                    >
                    <rect x="5" y="3" width="14" height="18" rx="2" />
                    <path d="M9 8h6M9 12h6M9 16h3" />
                    </svg>
                </div>

                <p className="mt-4 text-sm font-semibold">
                    {isCashPayment ? "Payment Pending" : "Booking Details"}
                </p>

                <p className="mt-2 text-xs leading-5 text-[#77776f]">
                    {isCashPayment
                    ? "Complete your cash payment at the branch to finalize the payment process."
                    : "You can view your reservation details from your bookings page."}
                </p>
                </div>
            </div>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
               <Link
  href="/bookings"
  className="inline-flex items-center justify-center rounded-xl bg-[#365747] px-7 py-3.5 font-semibold text-white transition-all duration-200 hover:bg-[#c6a15b] hover:text-[#0a1411] hover:shadow-lg hover:shadow-[#c6a15b]/20 focus:outline-none focus:ring-2 focus:ring-[#c6a15b] focus:ring-offset-2"
>
  View My Bookings
  <span className="ml-2" aria-hidden="true">
    →
  </span>
</Link>

                <Link
                href="/cars"
                className="inline-flex items-center justify-center rounded-xl border border-[#e8e4db] bg-white px-7 py-3.5 font-semibold text-[#343830] transition hover:border-[#c6a15b] hover:bg-[#fbf8f0]"
                >
                Browse More Cars
                </Link>
            </div>

            <p className="mt-8 text-xs text-[#898981]">
                Thank you for choosing DriveX.
            </p>
            </div>
        </div>
        </main>
    );
    }
