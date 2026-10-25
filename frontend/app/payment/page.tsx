
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Booking = {
  id: number;
  car_id: number;
  pickup_branch_id: number;
  dropoff_branch_id: number;
  pickup_date: string;
  return_date: string;
  daily_rate: number;
  total_days: number;
  subtotal: number;
  discount: number;
  total_amount: number;
  status: string;
  car?: {
    id: number;
    brand?: string;
    model?: string;
    name?: string;
    year?: number;
    image?: string;
  };
  pickup_branch?: {
    id: number;
    name: string;
  };
  dropoff_branch?: {
    id: number;
    name: string;
  };
};

type PaymentMethod = "card" | "online" | "cash";

type BookingResponse = {
  success?: boolean;
  message?: string;
  data?: Booking;
};

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking_id");

  const [booking, setBooking] = useState<Booking | null>(null);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("card");
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      router.push("/login");
      return;
    }

    if (!bookingId) {
      setError("Booking not found. Please select a booking first.");
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          "http://127.0.0.1:8000/api";

        const response = await fetch(
          `${apiUrl}/bookings/${bookingId}`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data: BookingResponse = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load booking."
          );
        }

        if (!data.data) {
          throw new Error("Booking information could not be found.");
        }

        setBooking(data.data);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load booking."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, router]);

  const handlePayment = async () => {
    if (paymentLoading) return;

    setError("");

    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!booking) {
      setError("Booking information is missing.");
      return;
    }

    try {
      setPaymentLoading(true);

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://127.0.0.1:8000/api";

      const isCashPayment = paymentMethod === "cash";

      const transactionReference =
        "TXN-" +
        Date.now() +
        "-" +
        Math.floor(Math.random() * 10000);

      const paymentPayload = {
        booking_id: booking.id,
        amount: Number(booking.total_amount),
        payment_method: paymentMethod,
        payment_status: isCashPayment ? "pending" : "paid",
        transaction_reference: transactionReference,
        paid_at: isCashPayment
          ? null
          : new Date().toISOString(),
      };

      const paymentResponse = await fetch(`${apiUrl}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentPayload),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok) {
        throw new Error(
          paymentData.message || "Payment failed."
        );
      }

      // Cash bookings remain pending until payment is collected.
      // Card and online payments confirm the booking in demo mode.
      if (!isCashPayment) {
        const bookingResponse = await fetch(
          `${apiUrl}/bookings/${booking.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              status: "confirmed",
            }),
          }
        );

        const bookingData = await bookingResponse.json();

        if (!bookingResponse.ok) {
          throw new Error(
            bookingData.message ||
              "Payment was recorded, but booking confirmation failed. Please check your booking before trying again."
          );
        }
      }

      const successUrl =
        `/payment/success?booking_id=${booking.id}` +
        `&payment_method=${paymentMethod}`;

      router.push(successUrl);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatMoney = (amount: number | string) =>
    Number(amount).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    });

  const getCarImage = () => {
    if (!booking?.car?.image) {
      return null;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const backendUrl = apiUrl.replace(/\/api\/?$/, "");

    let imagePath = booking.car.image;

    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://")
    ) {
      return imagePath;
    }

    imagePath = imagePath.replace(/^\/+/, "");

    if (imagePath.startsWith("public/")) {
      imagePath = imagePath.replace(/^public\//, "");
    }

    if (!imagePath.startsWith("images/")) {
      imagePath = `images/cars/${imagePath}`;
    }

    return `${backendUrl}/${imagePath}`;
  };

  const carName =
    booking?.car?.name ||
    `${booking?.car?.brand || ""} ${booking?.car?.model || ""}`.trim() ||
    "Rental Car";

  const carImage = getCarImage();
  const isCashPayment = paymentMethod === "cash";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f8f7] px-6 pt-28 text-[#0a1411]">
        <div className="text-center">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-[#e8e4db] border-t-[#c6a15b]" />
          <h2 className="text-lg font-semibold">
            Loading payment information
          </h2>
          <p className="mt-2 text-sm text-[#77776f]">
            Please wait while we retrieve your reservation.
          </p>
        </div>
      </main>
    );
  }

  if (error && !booking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f8f7] px-5 py-28 text-[#0a1411]">
        <div className="w-full max-w-lg rounded-3xl border border-[#e8e4db] bg-white p-8 text-center shadow-[0_18px_55px_rgba(10,20,17,0.07)] sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl">
            !
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-[#9a783c]">
            Checkout
          </p>

          <h1 className="mt-3 text-2xl font-bold">
            Payment Unavailable
          </h1>

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

  if (!booking) return null;

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
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  aria-hidden="true"
                >
                  <rect x="5" y="10" width="14" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  <path d="m10 15 1.5 1.5L14.5 13" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold">Secure Checkout</p>
                <p className="mt-0.5 text-xs text-[#77776f]">
                  Booking #{booking.id}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid max-w-md grid-cols-3 gap-2">
            <div>
              <div className="h-1 rounded-full bg-[#c6a15b]" />
              <p className="mt-2 text-xs font-semibold text-[#343830]">
                Reservation
              </p>
            </div>
            <div>
              <div className="h-1 rounded-full bg-[#c6a15b]" />
              <p className="mt-2 text-xs font-semibold text-[#343830]">
                Payment
              </p>
            </div>
            <div>
              <div className="h-1 rounded-full bg-[#e8e4db]" />
              <p className="mt-2 text-xs text-[#898981]">
                Confirmation
              </p>
            </div>
          </div>
        </div>

        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_370px] lg:gap-8">
          <section className="min-w-0 rounded-3xl border border-[#e8e4db] bg-white p-5 shadow-[0_12px_40px_rgba(10,20,17,0.04)] sm:p-7 md:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f6f0e3] text-[#9a783c]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-6 w-6"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="14" rx="3" />
                  <path d="M3 10h18M7 15h3" />
                </svg>
              </div>

              <div>
                <h2 className="text-xl font-bold sm:text-2xl">
                  Payment Method
                </h2>
                <p className="mt-1 text-sm text-[#77776f]">
                  Choose how you would like to pay.
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-3">
              <button
                type="button"
                aria-pressed={paymentMethod === "card"}
                onClick={() => setPaymentMethod("card")}
                className={`w-full rounded-2xl border p-4 text-left transition duration-200 sm:p-5 ${
                  paymentMethod === "card"
                    ? "border-[#c6a15b] bg-[#fbf8f0] shadow-[0_0_0_1px_rgba(198,161,91,0.15)]"
                    : "border-[#e8e4db] bg-white hover:border-[#c6a15b]/60 hover:bg-[#fcfbf8]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${
                        paymentMethod === "card"
                          ? "bg-[#0a1411] text-[#e0c48b]"
                          : "bg-[#f2f1ec] text-[#55594f]"
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-6 w-6"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        aria-hidden="true"
                      >
                        <rect x="3" y="5" width="18" height="14" rx="2.5" />
                        <path d="M3 10h18M7 15h4" />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold">Credit / Debit Card</p>
                      <p className="mt-1 text-sm leading-5 text-[#77776f]">
                        Card payment simulation
                      </p>
                    </div>
                  </div>

                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      paymentMethod === "card"
                        ? "border-[#9a783c] bg-[#9a783c] text-xs text-white"
                        : "border-[#d8d5cb]"
                    }`}
                  >
                    {paymentMethod === "card" && "✓"}
                  </span>
                </div>
              </button>

              <button
                type="button"
                aria-pressed={paymentMethod === "online"}
                onClick={() => setPaymentMethod("online")}
                className={`w-full rounded-2xl border p-4 text-left transition duration-200 sm:p-5 ${
                  paymentMethod === "online"
                    ? "border-[#c6a15b] bg-[#fbf8f0] shadow-[0_0_0_1px_rgba(198,161,91,0.15)]"
                    : "border-[#e8e4db] bg-white hover:border-[#c6a15b]/60 hover:bg-[#fcfbf8]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                        paymentMethod === "online"
                          ? "bg-[#0a1411] text-[#e0c48b]"
                          : "bg-[#f2f1ec] text-[#55594f]"
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-6 w-6"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold">Online Payment</p>
                      <p className="mt-1 text-sm leading-5 text-[#77776f]">
                        Online payment simulation
                      </p>
                    </div>
                  </div>

                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      paymentMethod === "online"
                        ? "border-[#9a783c] bg-[#9a783c] text-xs text-white"
                        : "border-[#d8d5cb]"
                    }`}
                  >
                    {paymentMethod === "online" && "✓"}
                  </span>
                </div>
              </button>

              <button
                type="button"
                aria-pressed={paymentMethod === "cash"}
                onClick={() => setPaymentMethod("cash")}
                className={`w-full rounded-2xl border p-4 text-left transition duration-200 sm:p-5 ${
                  paymentMethod === "cash"
                    ? "border-[#c6a15b] bg-[#fbf8f0] shadow-[0_0_0_1px_rgba(198,161,91,0.15)]"
                    : "border-[#e8e4db] bg-white hover:border-[#c6a15b]/60 hover:bg-[#fcfbf8]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                        paymentMethod === "cash"
                          ? "bg-[#0a1411] text-[#e0c48b]"
                          : "bg-[#f2f1ec] text-[#55594f]"
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-6 w-6"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        aria-hidden="true"
                      >
                        <rect x="3" y="6" width="18" height="12" rx="2" />
                        <circle cx="12" cy="12" r="3" />
                        <path d="M6 9h.01M18 15h.01" />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold">Cash at Branch</p>
                      <p className="mt-1 text-sm leading-5 text-[#77776f]">
                        Pay when you collect the car.
                      </p>
                    </div>
                  </div>

                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      paymentMethod === "cash"
                        ? "border-[#9a783c] bg-[#9a783c] text-xs text-white"
                        : "border-[#d8d5cb]"
                    }`}
                  >
                    {paymentMethod === "cash" && "✓"}
                  </span>
                </div>
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
              >
                {error}
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-[#e8e4db] bg-[#f8f8f7] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0e8d7] text-[#9a783c]">
                  {isCashPayment ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-5 w-5"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      aria-hidden="true"
                    >
                      <rect x="3" y="6" width="18" height="12" rx="2" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-5 w-5"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      aria-hidden="true"
                    >
                      <rect x="5" y="10" width="14" height="11" rx="2" />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    </svg>
                  )}
                </div>

                <div>
                  <p className="font-semibold text-[#343830]">
                    {isCashPayment
                      ? "Pay at the Branch"
                      : "Demo Payment"}
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
          </section>

          <aside className="h-fit min-w-0 rounded-3xl border border-[#e8e4db] bg-white p-5 shadow-[0_12px_40px_rgba(10,20,17,0.04)] sm:p-6 lg:sticky lg:top-28">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#9a783c]">
              <span className="h-px w-6 bg-[#c6a15b]" />
              Reservation Summary
            </p>

            <div className="mt-5 h-48 overflow-hidden rounded-2xl bg-[#f2f1ec] sm:h-44">
              {carImage ? (
                <img
                  src={carImage}
                  alt={carName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[#9a783c]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-20 w-20"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    aria-hidden="true"
                  >
                    <path d="m3 13 1.5-5A3 3 0 0 1 7.4 6h9.2a3 3 0 0 1 2.9 2l1.5 5v5h-2v-2H5v2H3z" />
                    <path d="M4.5 12h15M7 16h.01M17 16h.01" />
                    <circle cx="7" cy="13" r="1.5" />
                    <circle cx="17" cy="13" r="1.5" />
                  </svg>
                </div>
              )}
            </div>

            <h2 className="mt-5 text-2xl font-bold tracking-tight">
              {carName}
            </h2>

            {booking.car?.year && (
              <p className="mt-1 text-sm text-[#77776f]">
                {booking.car.year}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {booking.pickup_branch?.name && (
                <span className="rounded-lg bg-[#f8f8f7] px-3 py-2 text-xs font-medium text-[#55594f]">
                  Pickup: {booking.pickup_branch.name}
                </span>
              )}

              {booking.dropoff_branch?.name && (
                <span className="rounded-lg bg-[#f8f8f7] px-3 py-2 text-xs font-medium text-[#55594f]">
                  Return: {booking.dropoff_branch.name}
                </span>
              )}
            </div>

            <div className="my-6 h-px bg-[#e8e4db]" />

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm text-[#77776f]">Pickup Date</span>
                <span className="text-right text-sm font-semibold">
                  {formatDate(booking.pickup_date)}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="text-sm text-[#77776f]">Return Date</span>
                <span className="text-right text-sm font-semibold">
                  {formatDate(booking.return_date)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-[#77776f]">Duration</span>
                <span className="text-sm font-semibold">
                  {booking.total_days}{" "}
                  {booking.total_days === 1 ? "Day" : "Days"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-[#77776f]">Daily Rate</span>
                <span className="text-sm font-semibold">
                  {formatMoney(booking.daily_rate)} EGP
                </span>
              </div>

              {Number(booking.discount) > 0 && (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-[#77776f]">Subtotal</span>
                    <span className="text-sm font-medium">
                      {formatMoney(booking.subtotal)} EGP
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-[#77776f]">Discount</span>
                    <span className="text-sm font-semibold text-[#497354]">
                      −{formatMoney(booking.discount)} EGP
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="my-6 h-px bg-[#e8e4db]" />

            <div className="rounded-2xl bg-[#0a1411] p-5 text-white">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/60">
                Total Amount
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight text-[#e0c48b]">
                {formatMoney(booking.total_amount)}
                <span className="ml-2 text-sm font-semibold text-white/70">
                  EGP
                </span>
              </p>

              <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-white/60">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4 shrink-0 text-[#e0c48b]"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  aria-hidden="true"
                >
                  <path d="m12 3 8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>Booking #{booking.id}</span>
              </div>
            </div>

            <p className="mt-4 text-center text-xs leading-5 text-[#898981]">
              Please review your dates and total before confirming.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
