
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type User = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
};

type Car = {
  id: number;
  brand: string;
  model: string;
  year: number;
  color?: string | null;
  daily_rate: number;
  status: string;
};

type Branch = {
  id: number;
  name: string;
  address?: string | null;
};

type Payment = {
  id: number;
  amount: number;
  payment_method: string;
  payment_status: string;
  transaction_reference?: string | null;
  paid_at?: string | null;
};

type Booking = {
  id: number;
  user_id: number;
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
  notes?: string | null;
  user?: User;
  car?: Car;
  pickup_branch?: Branch;
  dropoff_branch?: Branch;
  payments?: Payment[];
};

type AuthUser = {
  id: number;
  role: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

const formatMoney = (amount: number | string | null | undefined) =>
  `${Number(amount || 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })} EGP`;

const formatDate = (date: string) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return date;

  return parsedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateTime = (date?: string | null) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return date;

  return parsedDate.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "confirmed":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "completed":
      return "border-[#c6a15b]/40 bg-[#c6a15b]/10 text-[#80612d]";
    case "cancelled":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-gray-200 bg-gray-100 text-gray-600";
  }
};

const cardClass =
  "rounded-3xl border border-[#e9e6df] bg-white p-6 shadow-sm md:p-8";

const labelClass =
  "text-xs font-semibold uppercase tracking-[0.13em] text-gray-500";

const valueClass = "mt-2 break-words text-sm font-medium text-[#17251e]";

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h2 className="mb-6 text-xl font-bold tracking-tight text-[#0a1411]">
      {children}
    </h2>
  );
}

function InfoItem({
  label,
  value,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className={labelClass}>{label}</p>
      <div className={valueClass}>{value || "—"}</div>
    </div>
  );
}

export default function AdminBookingDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const bookingId = params.id;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [dashboardPath, setDashboardPath] = useState("/admin");

  useEffect(() => {
    let cancelled = false;

    const loadBooking = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const meResponse = await fetch(`${API_URL}/me`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (meResponse.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }

        if (!meResponse.ok) {
          throw new Error("Could not verify your account permissions.");
        }

        const meData = await meResponse.json();
        const user: AuthUser | undefined =
          meData.data?.user ?? meData.user ?? meData.data;

        if (!user || !["admin", "staff"].includes(user.role)) {
          router.replace("/");
          return;
        }

        if (cancelled) return;

        const roleDashboard =
          user.role === "staff" ? "/staff" : "/admin";

        setDashboardPath(roleDashboard);

        const bookingResponse = await fetch(
          `${API_URL}/bookings/${bookingId}`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const bookingData = await bookingResponse
          .json()
          .catch(() => null);

        if (!bookingResponse.ok) {
          if (bookingResponse.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.replace("/login");
            return;
          }

          if (bookingResponse.status === 403) {
            throw new Error(
              "Your account does not have permission to view this booking. Check the Laravel booking permissions."
            );
          }

          throw new Error(
            bookingData?.message || "Failed to load booking."
          );
        }

        const loadedBooking: Booking =
          bookingData?.data ?? bookingData;

        if (!loadedBooking?.id) {
          throw new Error(
            "The booking data returned by the server is invalid."
          );
        }

        if (!cancelled) {
          setBooking(loadedBooking);
          setSelectedStatus(loadedBooking.status);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load booking."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadBooking();

    return () => {
      cancelled = true;
    };
  }, [bookingId, router]);

  const updateStatus = async () => {
    if (!booking || selectedStatus === booking.status) return;

    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setUpdating(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/bookings/${booking.id}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: selectedStatus,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }

        if (response.status === 403) {
          throw new Error(
            "Your account does not have permission to update bookings. Check the Laravel booking permissions."
          );
        }

        throw new Error(
          data?.message || "Failed to update booking status."
        );
      }

      const updatedBooking: Booking = data?.data ?? data;

      setBooking((current) =>
        current
          ? {
              ...current,
              status: updatedBooking?.status || selectedStatus,
            }
          : current
      );

      setSelectedStatus(
        updatedBooking?.status || selectedStatus
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update booking status."
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f8f7] px-4 pb-16 pt-28 text-[#0a1411] md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-[#e9e6df] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#e8e3d8] border-t-[#c6a15b]" />
            <p className="font-medium text-gray-500">
              Loading booking details...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="min-h-screen bg-[#f8f8f7] px-4 pb-16 pt-28 text-[#0a1411] md:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm md:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-600">
              !
            </div>

            <h1 className="mt-5 text-2xl font-bold">
              Booking unavailable
            </h1>

            <p className="mt-3 text-sm leading-6 text-red-600">
              {error || "Booking not found."}
            </p>

            <Link
              href={`${dashboardPath}/bookings`}
              className="mt-7 inline-flex items-center justify-center rounded-xl bg-[#0a1411] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1a3027]"
            >
              Back to Bookings
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const paidAmount =
    booking.payments?.reduce(
      (total, payment) =>
        payment.payment_status.toLowerCase() === "paid"
          ? total + Number(payment.amount)
          : total,
      0
    ) || 0;

  const totalPayments =
    booking.payments?.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0
    ) || 0;

  return (
    <main className="min-h-screen bg-[#f8f8f7] px-4 pb-16 pt-28 text-[#0a1411] md:px-6 md:pt-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link
            href={`${dashboardPath}/bookings`}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#9a783c]"
          >
            <span aria-hidden="true">←</span>
            Back to Bookings
          </Link>

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c6a15b]/40 bg-[#c6a15b]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#80612d]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c6a15b]" />
                Booking #{booking.id}
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                Booking Details
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500 md:text-base">
                Review the customer, vehicle, rental period, payment
                history, and booking status.
              </p>
            </div>

            <span
              className={`inline-flex w-fit items-center rounded-full border px-4 py-2 text-sm font-semibold capitalize ${getStatusStyle(
                booking.status
              )}`}
            >
              {booking.status}
            </span>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            <span className="font-bold">!</span>
            <p>{error}</p>
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className={cardClass}>
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Customer Information
                  </p>
                  <h2 className="mt-1 text-xl font-bold">
                    {booking.user?.name || "Unknown Customer"}
                  </h2>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0a1411] text-lg font-bold text-[#d8b979]">
                  {booking.user?.name
                    ? booking.user.name.charAt(0).toUpperCase()
                    : "?"}
                </div>
              </div>

              <div className="grid gap-5 border-t border-[#eeeae2] pt-5 sm:grid-cols-2">
                <InfoItem
                  label="Email Address"
                  value={booking.user?.email}
                />
                <InfoItem
                  label="Phone Number"
                  value={booking.user?.phone}
                />
                <InfoItem label="Customer ID" value={`#${booking.user_id}`} />
              </div>
            </section>

            <section className={cardClass}>
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f4f0e7] text-2xl">
                  🚘
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-500">
                    Reserved Vehicle
                  </p>
                  <h2 className="mt-1 text-xl font-bold">
                    {booking.car?.brand || "Unknown"}{" "}
                    {booking.car?.model || ""}
                  </h2>
                  {booking.car?.status && (
                    <p className="mt-1 text-xs capitalize text-gray-500">
                      Vehicle status: {booking.car.status}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-5 border-t border-[#eeeae2] pt-5 sm:grid-cols-3">
                <InfoItem label="Model Year" value={booking.car?.year} />
                <InfoItem label="Color" value={booking.car?.color} />
                <InfoItem label="Vehicle ID" value={`#${booking.car_id}`} />
              </div>

              <Link
                href={`/cars/${booking.car_id}`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#9a783c] transition hover:text-[#0a1411]"
              >
                View Vehicle
                <span aria-hidden="true">→</span>
              </Link>
            </section>

            <section className={cardClass}>
              <SectionTitle>Rental Period</SectionTitle>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#e9e6df] bg-[#fbfaf7] p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#9a783c]">
                    <span>↗</span>
                    Pick-up
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Pick-up Date
                  </p>
                  <p className="mt-2 text-lg font-bold">
                    {formatDate(booking.pickup_date)}
                  </p>
                  <p className="mt-3 text-sm text-gray-500">
                    {booking.pickup_branch?.name || "Pickup Branch"}
                  </p>
                  {booking.pickup_branch?.address && (
                    <p className="mt-1 text-xs leading-5 text-gray-400">
                      {booking.pickup_branch.address}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-[#e9e6df] bg-[#fbfaf7] p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#9a783c]">
                    <span>↙</span>
                    Drop-off
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Return Date
                  </p>
                  <p className="mt-2 text-lg font-bold">
                    {formatDate(booking.return_date)}
                  </p>
                  <p className="mt-3 text-sm text-gray-500">
                    {booking.dropoff_branch?.name || "Drop-off Branch"}
                  </p>
                  {booking.dropoff_branch?.address && (
                    <p className="mt-1 text-xs leading-5 text-gray-400">
                      {booking.dropoff_branch.address}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-5 border-t border-[#eeeae2] pt-5 sm:grid-cols-3">
                <InfoItem
                  label="Duration"
                  value={`${booking.total_days} ${
                    booking.total_days === 1 ? "day" : "days"
                  }`}
                />
                <InfoItem
                  label="Pickup Branch"
                  value={booking.pickup_branch?.name}
                />
                <InfoItem
                  label="Drop-off Branch"
                  value={booking.dropoff_branch?.name}
                />
              </div>
            </section>

            <section className={cardClass}>
              <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <SectionTitle>Payment Information</SectionTitle>
                <span className="w-fit rounded-full bg-[#f4f0e7] px-3 py-1 text-xs font-semibold text-[#80612d]">
                  {booking.payments?.length || 0}{" "}
                  {(booking.payments?.length || 0) === 1
                    ? "Transaction"
                    : "Transactions"}
                </span>
              </div>

              {booking.payments && booking.payments.length > 0 ? (
                <div className="space-y-4">
                  {booking.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-2xl border border-[#e9e6df] bg-[#fbfaf7] p-5"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="min-w-0">
                          <p className="font-bold capitalize text-[#17251e]">
                            {payment.payment_method.replaceAll("_", " ")}
                          </p>
                          <p className="mt-2 break-all text-xs leading-5 text-gray-500">
                            Transaction reference:{" "}
                            {payment.transaction_reference || "—"}
                          </p>
                        </div>

                        <div className="sm:text-right">
                          <p className="text-lg font-bold text-[#0a1411]">
                            {formatMoney(payment.amount)}
                          </p>
                          <span
                            className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
                              payment.payment_status.toLowerCase() === "paid"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }`}
                          >
                            {payment.payment_status.replaceAll("_", " ")}
                          </span>
                        </div>
                      </div>

                      <p className="mt-4 border-t border-[#e9e6df] pt-3 text-xs text-gray-500">
                        Paid at: {formatDateTime(payment.paid_at)}
                      </p>
                    </div>
                  ))}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-[#f4f0e7] p-4">
                      <p className="text-xs font-medium text-gray-500">
                        Total Recorded Payments
                      </p>
                      <p className="mt-1 text-lg font-bold text-[#17251e]">
                        {formatMoney(totalPayments)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#edf5ef] p-4">
                      <p className="text-xs font-medium text-gray-500">
                        Confirmed Paid Amount
                      </p>
                      <p className="mt-1 text-lg font-bold text-emerald-800">
                        {formatMoney(paidAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-sm font-semibold text-amber-800">
                    No payment recorded
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-700">
                    No payment transactions have been recorded for this booking yet.
                  </p>
                </div>
              )}
            </section>

            {booking.notes && (
              <section className={cardClass}>
                <SectionTitle>Booking Notes</SectionTitle>
                <p className="whitespace-pre-wrap text-sm leading-7 text-gray-600">
                  {booking.notes}
                </p>
              </section>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28">
            <section className={cardClass}>
              <p className="text-sm font-medium text-gray-500">
                Financial Overview
              </p>
              <h2 className="mt-1 text-xl font-bold">Booking Summary</h2>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-gray-500">Daily Rate</span>
                  <span className="text-right font-semibold">
                    {formatMoney(booking.daily_rate)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-gray-500">Total Days</span>
                  <span className="font-semibold">{booking.total_days}</span>
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-right font-semibold">
                    {formatMoney(booking.subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-gray-500">Discount</span>
                  <span className="text-right font-semibold text-emerald-700">
                    − {formatMoney(booking.discount)}
                  </span>
                </div>

                <div className="border-t border-[#e9e6df] pt-5">
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-bold text-[#17251e]">
                      Total Amount
                    </span>
                    <span className="text-right text-xl font-bold text-[#9a783c]">
                      {formatMoney(booking.total_amount)}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                    Paid Amount
                  </p>
                  <p className="mt-2 text-xl font-bold text-emerald-800">
                    {formatMoney(paidAmount)}
                  </p>
                </div>

                {Number(booking.total_amount) > paidAmount && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                      Remaining Balance
                    </p>
                    <p className="mt-2 text-lg font-bold text-amber-800">
                      {formatMoney(
                        Math.max(
                          0,
                          Number(booking.total_amount) - paidAmount
                        )
                      )}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className={cardClass}>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f4f0e7] text-lg text-[#9a783c]">
                ↻
              </div>

              <h2 className="mt-4 text-xl font-bold">Update Status</h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Change the current status of this booking.
              </p>

              <label
                htmlFor="booking-status"
                className="mt-5 block text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Booking Status
              </label>

              <select
                id="booking-status"
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-[#dedbd3] bg-[#fbfaf7] px-4 py-3 text-sm font-medium text-[#17251e] outline-none transition focus:border-[#c6a15b] focus:ring-2 focus:ring-[#c6a15b]/20"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button
                type="button"
                onClick={updateStatus}
                disabled={
                  updating || selectedStatus === booking.status
                }
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#c6a15b] px-5 py-3.5 text-sm font-bold text-[#0a1411] shadow-sm transition hover:bg-[#b58e48] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updating && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a1411]/30 border-t-[#0a1411]" />
                )}
                {updating ? "Updating..." : "Save Changes"}
              </button>

              <p className="mt-3 text-center text-xs leading-5 text-gray-400">
                Status changes depend on your account permissions.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
