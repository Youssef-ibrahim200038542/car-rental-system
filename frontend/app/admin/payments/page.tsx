
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  name: string;
  email: string;
};

type Car = {
  id: number;
  brand: string;
  model: string;
};

type Booking = {
  id: number;
  user?: User;
  car?: Car;
  total_amount: number;
};

type Payment = {
  id: number;
  booking_id: number;
  amount: number;
  payment_method: string;
  payment_status: string;
  transaction_reference?: string | null;
  paid_at?: string | null;
  booking?: Booking;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

const statusStyles: Record<string, string> = {
  paid: "border-emerald-200 bg-emerald-50 text-emerald-800",
  pending: "border-[#e7dcc4] bg-[#f8f0df] text-[#806331]",
  failed: "border-red-200 bg-red-50 text-red-800",
  refunded: "border-purple-200 bg-purple-50 text-purple-800",
};

const statusLabels: Record<string, string> = {
  paid: "Paid",
  pending: "Pending",
  failed: "Failed",
  refunded: "Refunded",
};

function PaymentIcon() {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f3ead7] text-[#96743b]">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
        <path d="M2.5 10h19M6 15h3" />
      </svg>
    </div>
  );
}

function StatIcon({ type }: { type: "total" | "paid" | "pending" | "revenue" }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f3ead7] text-[#96743b]">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        {type === "total" && (
          <>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M7 8h10M7 12h10M7 16h5" />
          </>
        )}
        {type === "paid" && (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12 2.5 2.5L16 9" />
          </>
        )}
        {type === "pending" && (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </>
        )}
        {type === "revenue" && (
          <>
            <path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </>
        )}
      </svg>
    </div>
  );
}

function formatDate(date?: string | null) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(amount: number) {
  return Number(amount).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

function getStatusStyle(status: string) {
  return (
    statusStyles[status] ||
    "border-[#e4e2dc] bg-[#f2f1ed] text-[#73766e]"
  );
}

export default function AdminPaymentsPage() {
  const router = useRouter();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayments = useCallback(
    async (showRefresh = false) => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!token || !storedUser) {
        router.replace("/login");
        return;
      }

      try {
        const user = JSON.parse(storedUser);

        if (user.role !== "admin") {
          router.replace("/");
          return;
        }
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await fetch(`${API_URL}/payments`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Failed to load payments.");
        }

        setPayments(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load payments."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router]
  );

  useEffect(() => {
    void fetchPayments();
  }, [fetchPayments]);

  const updatePaymentStatus = async (
    payment: Payment,
    status: string
  ) => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    const previousStatus = payment.payment_status;

    if (previousStatus === status) return;

    setUpdatingId(payment.id);
    setError("");

    try {
      const response = await fetch(`${API_URL}/payments/${payment.id}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payment_status: status,
          paid_at: status === "paid" ? new Date().toISOString() : null,
        }),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace("/login");
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to update payment.");
      }

      setPayments((currentPayments) =>
        currentPayments.map((item) =>
          item.id === payment.id
            ? {
                ...item,
                payment_status: status,
                paid_at:
                  status === "paid"
                    ? new Date().toISOString()
                    : null,
              }
            : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update payment."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const totalPayments = payments.length;

  const paidPayments = payments.filter(
    (payment) => payment.payment_status === "paid"
  );

  const pendingPayments = payments.filter(
    (payment) => payment.payment_status === "pending"
  );

  const totalRevenue = paidPayments.reduce(
    (total, payment) => total + Number(payment.amount || 0),
    0
  );

  const filteredPayments = payments.filter((payment) => {
    const searchValue = search.trim().toLowerCase();

    const customerName = payment.booking?.user?.name || "";
    const customerEmail = payment.booking?.user?.email || "";
    const carName = `${payment.booking?.car?.brand || ""} ${
      payment.booking?.car?.model || ""
    }`;

    const matchesSearch =
      !searchValue ||
      String(payment.id).includes(searchValue) ||
      String(payment.booking_id).includes(searchValue) ||
      customerName.toLowerCase().includes(searchValue) ||
      customerEmail.toLowerCase().includes(searchValue) ||
      carName.toLowerCase().includes(searchValue) ||
      (payment.transaction_reference || "")
        .toLowerCase()
        .includes(searchValue);

    const matchesStatus =
      statusFilter === "all" || payment.payment_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f8f7] px-4 pb-16 pt-28 text-[#0a1411] sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-[#e9e5dc] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-[#e9e5dc] border-t-[#c6a15b]" />
            <p className="font-medium text-[#59645c]">
              Loading payment records...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f8f7] px-4 pb-16 pt-28 text-[#0a1411] sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link
            href="/admin"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#687269] transition hover:text-[#9a783c]"
          >
            <span aria-hidden="true">←</span>
            Back to Dashboard
          </Link>

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#e7dcc4] bg-[#f3ead7] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#806331]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c6a15b]" />
                Finance Overview
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-[#0a1411] sm:text-4xl">
                Manage Payments
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#73786f] sm:text-base">
                Track transactions, review payment statuses, and monitor collected revenue.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchPayments(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dedbd2] bg-white px-5 py-3 text-sm font-semibold text-[#34443b] transition hover:bg-[#f3f1eb] disabled:opacity-60"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                aria-hidden="true"
              >
                <path d="M20 7v5h-5M4 17v-5h5" />
                <path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3" />
              </svg>
              Refresh Payments
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800"
          >
            <div className="flex gap-3">
              <span className="font-bold">!</span>
              <p>{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setError("")}
              className="font-bold text-red-700 hover:text-red-900"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#e9e5dc] bg-white p-5 shadow-[0_4px_20px_rgba(10,20,17,0.025)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[#73786f]">
                Total Payments
              </p>
              <StatIcon type="total" />
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-[#0a1411]">
              {totalPayments}
            </p>
            <p className="mt-1 text-xs text-[#85867c]">
              All recorded transactions
            </p>
          </div>

          <div className="rounded-2xl border border-[#e9e5dc] bg-white p-5 shadow-[0_4px_20px_rgba(10,20,17,0.025)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[#73786f]">
                Successful Payments
              </p>
              <StatIcon type="paid" />
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-[#23764c]">
              {paidPayments.length}
            </p>
            <p className="mt-1 text-xs text-[#85867c]">
              Transactions marked as paid
            </p>
          </div>

          <div className="rounded-2xl border border-[#e9e5dc] bg-white p-5 shadow-[0_4px_20px_rgba(10,20,17,0.025)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[#73786f]">
                Pending Payments
              </p>
              <StatIcon type="pending" />
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-[#9a783c]">
              {pendingPayments.length}
            </p>
            <p className="mt-1 text-xs text-[#85867c]">
              Awaiting payment confirmation
            </p>
          </div>

          <div className="rounded-2xl border border-[#e9e5dc] bg-white p-5 shadow-[0_4px_20px_rgba(10,20,17,0.025)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[#73786f]">
                Total Revenue
              </p>
              <StatIcon type="revenue" />
            </div>
            <p className="mt-4 break-words text-2xl font-bold tracking-tight text-[#0a1411] sm:text-3xl">
              {formatAmount(totalRevenue)}{" "}
              <span className="text-base font-semibold text-[#73786f]">
                EGP
              </span>
            </p>
            <p className="mt-1 text-xs text-[#85867c]">
              Sum of payments marked as paid
            </p>
          </div>
        </div>

        <section className="overflow-hidden rounded-3xl border border-[#e9e5dc] bg-white shadow-[0_8px_35px_rgba(10,20,17,0.035)]">
          <div className="flex flex-col gap-4 border-b border-[#e9e5dc] px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#0a1411]">
                Payment Transactions
              </h2>
              <p className="mt-1 text-sm text-[#85867c]">
                Showing {filteredPayments.length} of {payments.length} payments
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative sm:min-w-[260px]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#85867c]"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m16 16 4 4" />
                </svg>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search customer, booking..."
                  aria-label="Search payments"
                  className="w-full rounded-xl border border-[#dedbd2] bg-[#fcfbf8] py-3 pl-10 pr-4 text-sm text-[#0a1411] outline-none transition placeholder:text-[#9b9a91] focus:border-[#c6a15b] focus:ring-2 focus:ring-[#c6a15b]/15"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter payment status"
                className="rounded-xl border border-[#dedbd2] bg-[#fcfbf8] px-4 py-3 text-sm text-[#34443b] outline-none focus:border-[#c6a15b] sm:min-w-[155px]"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="px-6 py-16 text-center sm:py-20">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f3ead7] text-[#96743b]">
                <PaymentIcon />
              </div>
              <h3 className="text-lg font-bold text-[#0a1411]">
                {payments.length === 0
                  ? "No payments yet"
                  : "No payments found"}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#73786f]">
                {payments.length === 0
                  ? "Payment records will appear here when transactions are created."
                  : "Try another search term or change the payment status filter."}
              </p>
              {payments.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                  className="mt-5 text-sm font-bold text-[#96743b] hover:text-[#806331]"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1100px] text-left">
                  <thead className="border-b border-[#e9e5dc] bg-[#fcfbf8]">
                    <tr>
                      {[
                        "Payment",
                        "Customer",
                        "Booking",
                        "Method",
                        "Amount",
                        "Status",
                        "Actions",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className={`px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#73786f] ${
                            heading === "Actions" ? "text-right" : ""
                          }`}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#eeeae2]">
                    {filteredPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="transition hover:bg-[#fcfbf8]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <PaymentIcon />
                            <div>
                              <p className="font-bold text-[#0a1411]">
                                Payment #{payment.id}
                              </p>
                              <p className="mt-1 text-xs text-[#85867c]">
                                {formatDate(payment.paid_at)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#0a1411]">
                            {payment.booking?.user?.name || "Unknown"}
                          </p>
                          <p className="mt-1 text-xs text-[#85867c]">
                            {payment.booking?.user?.email || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#0a1411]">
                            #{payment.booking_id}
                          </p>
                          <p className="mt-1 text-xs text-[#85867c]">
                            {payment.booking?.car
                              ? `${payment.booking.car.brand} ${payment.booking.car.model}`
                              : "Vehicle unavailable"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm capitalize text-[#59645c]">
                            {(payment.payment_method || "—").replaceAll(
                              "_",
                              " "
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-bold text-[#0a1411]">
                            {formatAmount(payment.amount)} EGP
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusStyle(
                              payment.payment_status
                            )}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {statusLabels[payment.payment_status] ||
                              payment.payment_status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/bookings/${payment.booking_id}`}
                              className="rounded-lg border border-[#dedbd2] bg-white px-3 py-2 text-xs font-bold text-[#59645c] transition hover:border-[#c6a15b] hover:text-[#806331]"
                            >
                              Booking
                            </Link>

                            <select
                              aria-label={`Update status for payment ${payment.id}`}
                              value={payment.payment_status}
                              disabled={updatingId === payment.id}
                              onChange={(event) =>
                                void updatePaymentStatus(
                                  payment,
                                  event.target.value
                                )
                              }
                              className="max-w-[130px] rounded-lg border border-[#dedbd2] bg-white px-2 py-2 text-xs text-[#34443b] outline-none focus:border-[#c6a15b] disabled:opacity-50"
                            >
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                              <option value="failed">Failed</option>
                              <option value="refunded">Refunded</option>
                            </select>
                            {updatingId === payment.id && (
                              <span className="text-xs text-[#85867c]">
                                Saving...
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 p-4 md:hidden">
                {filteredPayments.map((payment) => (
                  <article
                    key={payment.id}
                    className="rounded-2xl border border-[#e9e5dc] bg-white p-4"
                  >
                    <div className="flex items-start gap-3">
                      <PaymentIcon />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-bold text-[#0a1411]">
                            Payment #{payment.id}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${getStatusStyle(
                              payment.payment_status
                            )}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {statusLabels[payment.payment_status] ||
                              payment.payment_status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#85867c]">
                          {formatDate(payment.paid_at)}
                        </p>
                        <p className="mt-3 text-xl font-bold text-[#0a1411]">
                          {formatAmount(payment.amount)} EGP
                        </p>
                      </div>
                    </div>

                    <div className="my-4 space-y-3 rounded-xl bg-[#fcfbf8] p-3">
                      <div>
                        <p className="text-xs text-[#85867c]">Customer</p>
                        <p className="mt-1 break-words text-sm font-semibold text-[#34443b]">
                          {payment.booking?.user?.name || "Unknown"}
                        </p>
                        <p className="mt-1 break-all text-xs text-[#85867c]">
                          {payment.booking?.user?.email || "—"}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 border-t border-[#e9e5dc] pt-3">
                        <div>
                          <p className="text-xs text-[#85867c]">Booking</p>
                          <p className="mt-1 text-sm font-semibold text-[#34443b]">
                            #{payment.booking_id}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#85867c]">Method</p>
                          <p className="mt-1 text-sm font-semibold capitalize text-[#34443b]">
                            {(payment.payment_method || "—").replaceAll(
                              "_",
                              " "
                            )}
                          </p>
                        </div>
                      </div>

                      {payment.booking?.car && (
                        <div className="border-t border-[#e9e5dc] pt-3">
                          <p className="text-xs text-[#85867c]">Vehicle</p>
                          <p className="mt-1 text-sm font-semibold text-[#34443b]">
                            {payment.booking.car.brand}{" "}
                            {payment.booking.car.model}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/admin/bookings/${payment.booking_id}`}
                        className="inline-flex items-center justify-center rounded-lg border border-[#dedbd2] bg-white px-3 py-2.5 text-xs font-bold text-[#59645c] transition hover:bg-[#f8f8f7]"
                      >
                        View Booking
                      </Link>

                      <select
                        aria-label={`Update status for payment ${payment.id}`}
                        value={payment.payment_status}
                        disabled={updatingId === payment.id}
                        onChange={(event) =>
                          void updatePaymentStatus(
                            payment,
                            event.target.value
                          )
                        }
                        className="min-w-0 rounded-lg border border-[#dedbd2] bg-white px-2 py-2.5 text-xs font-semibold text-[#34443b] outline-none focus:border-[#c6a15b] disabled:opacity-50"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>

                    {updatingId === payment.id && (
                      <p className="mt-2 text-center text-xs text-[#85867c]">
                        Updating payment status...
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}

          {filteredPayments.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-[#e9e5dc] bg-[#fcfbf8] px-5 py-4 text-xs text-[#85867c] sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {filteredPayments.length} of {payments.length} payments
              </span>
              <span>DriveX · Payment Management</span>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
