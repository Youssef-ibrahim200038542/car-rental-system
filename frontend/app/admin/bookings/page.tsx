
"use client";

import { useEffect, useState } from "react";
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

type Payment = {
  id: number;
  amount: number;
  payment_method: string;
  payment_status: string;
};

type Booking = {
  id: number;
  user_id: number;
  car_id: number;
  pickup_date: string;
  return_date: string;
  total_days: number;
  daily_rate: number;
  subtotal: number;
  discount: number;
  total_amount: number;
  status: string;
  user?: User;
  car?: Car;
  payments?: Payment[];
};

type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "customer" | "staff";
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

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
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

function StatCard({
  label,
  value,
  detail,
  accent = "gold",
}: {
  label: string;
  value: string | number;
  detail: string;
  accent?: "gold" | "amber" | "blue" | "green";
}) {
  const accentStyles = {
    gold: "bg-[#f4f0e7] text-[#9a783c]",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-sky-50 text-sky-700",
    green: "bg-emerald-50 text-emerald-700",
  };

  return (
    <div className="rounded-2xl border border-[#e9e6df] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${accentStyles[accent]}`}
        >
          {accent === "gold"
            ? "#"
            : accent === "amber"
              ? "!"
              : accent === "blue"
                ? "✓"
                : "↗"}
        </span>
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight text-[#0a1411]">
        {value}
      </p>

      <p className="mt-2 text-xs text-gray-400">{detail}</p>
    </div>
  );
}

export default function AdminBookingsPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboardPath, setDashboardPath] = useState("/admin");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;

    const loadBookings = async () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!token || !storedUser) {
        router.replace("/login");
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser) as AuthUser;

        if (!["admin", "staff"].includes(parsedUser.role)) {
          router.replace("/");
          return;
        }
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }

      try {
        const meResponse = await fetch(`${API_URL}/me`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (meResponse.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }

        if (!meResponse.ok) {
          throw new Error("Failed to verify your account.");
        }

        const meResult = await meResponse.json();

        const freshUser: AuthUser | undefined =
          meResult?.data?.user ??
          meResult?.user ??
          meResult?.data;

        if (!freshUser || !["admin", "staff"].includes(freshUser.role)) {
          router.replace("/");
          return;
        }

        if (cancelled) return;

        const currentDashboard =
          freshUser.role === "staff" ? "/staff" : "/admin";

        setDashboardPath(currentDashboard);
        localStorage.setItem("user", JSON.stringify(freshUser));

        const response = await fetch(`${API_URL}/bookings`, {
          method: "GET",
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

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.message ||
              (response.status === 403
                ? "You don't have permission to view bookings."
                : "Failed to load bookings.")
          );
        }

        const bookingList = Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result)
            ? result
            : [];

        if (!cancelled) {
          setBookings(bookingList);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load bookings."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadBookings();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const pendingBookings = bookings.filter(
    (booking) => booking.status.toLowerCase() === "pending"
  ).length;

  const confirmedBookings = bookings.filter(
    (booking) => booking.status.toLowerCase() === "confirmed"
  ).length;

  const activeBookings = bookings.filter(
    (booking) => booking.status.toLowerCase() === "active"
  ).length;

  const totalRevenue = bookings.reduce(
    (total, booking) =>
      total + Number(booking.total_amount || 0),
    0
  );

  const getPaymentStatus = (booking: Booking) => {
    if (!booking.payments || booking.payments.length === 0) {
      return "Unpaid";
    }

    const hasPaid = booking.payments.some(
      (payment) => payment.payment_status.toLowerCase() === "paid"
    );

    const hasPending = booking.payments.some(
      (payment) =>
        ["pending", "processing"].includes(
          payment.payment_status.toLowerCase()
        )
    );

    if (hasPaid && hasPending) return "Partial";
    if (hasPaid) return "Paid";

    return "Pending";
  };

  const getPaymentStyle = (status: string) => {
    switch (status) {
      case "Paid":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      case "Partial":
        return "border-sky-200 bg-sky-50 text-sky-700";
      case "Pending":
        return "border-amber-200 bg-amber-50 text-amber-700";
      default:
        return "border-gray-200 bg-gray-100 text-gray-600";
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const normalizedSearch = search.trim().toLowerCase();

    const matchesSearch =
      !normalizedSearch ||
      String(booking.id).includes(normalizedSearch) ||
      (booking.user?.name || "").toLowerCase().includes(normalizedSearch) ||
      (booking.user?.email || "").toLowerCase().includes(normalizedSearch) ||
      `${booking.car?.brand || ""} ${booking.car?.model || ""}`
        .toLowerCase()
        .includes(normalizedSearch);

    const matchesStatus =
      statusFilter === "all" ||
      booking.status.toLowerCase() === statusFilter;

    const matchesPayment =
      paymentFilter === "all" ||
      getPaymentStatus(booking).toLowerCase() ===
        paymentFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPayment;
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f8f7] px-4 pb-16 pt-28 text-[#0a1411] md:px-6 md:pt-32">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-[#e9e6df] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#e8e3d8] border-t-[#c6a15b]" />
            <p className="font-medium text-gray-500">
              Loading bookings...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f8f7] px-4 pb-16 pt-28 text-[#0a1411] md:px-6 md:pt-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link
            href={dashboardPath}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#9a783c]"
          >
            <span aria-hidden="true">←</span>
            Back to Dashboard
          </Link>

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c6a15b]/40 bg-[#c6a15b]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#80612d]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c6a15b]" />
                {dashboardPath === "/staff" ? "Staff Workspace" : "Admin Workspace"}
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                Manage Bookings
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 md:text-base">
                Monitor reservations, review payment status, and access
                booking details from one place.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-[#e9e6df] bg-white px-4 py-3 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a1411] text-sm font-bold text-[#d8b979]">
                DX
              </span>
              <div>
                <p className="text-sm font-bold text-[#0a1411]">DriveX</p>
                <p className="text-xs capitalize text-gray-500">
                  {dashboardPath === "/staff" ? "Staff access" : "Admin access"}
                </p>
              </div>
            </div>
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

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Bookings"
            value={bookings.length}
            detail="All listed reservations"
            accent="gold"
          />
          <StatCard
            label="Pending"
            value={pendingBookings}
            detail="Awaiting confirmation"
            accent="amber"
          />
          <StatCard
            label="Confirmed"
            value={confirmedBookings}
            detail="Approved reservations"
            accent="blue"
          />
          <StatCard
            label="Active"
            value={activeBookings}
            detail="Currently in progress"
            accent="green"
          />
        </section>

        <section className="mb-8 overflow-hidden rounded-3xl border border-[#25392f] bg-[#0a1411] text-white shadow-sm">
          <div className="flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center md:p-8">
            <div>
              <p className="text-sm font-medium text-white/60">
                Total Booking Value
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-[#d8b979] md:text-4xl">
                {formatMoney(totalRevenue)}
              </p>
              <p className="mt-3 max-w-xl text-xs leading-5 text-white/45">
                Total value of listed bookings. This is not necessarily the
                amount actually collected.
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#c6a15b]/30 bg-[#c6a15b]/10 text-2xl text-[#d8b979]">
              EGP
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#e9e6df] bg-white shadow-sm">
          <div className="border-b border-[#eeeae2] p-5 md:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-xl font-bold text-[#0a1411]">
                  All Bookings
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Search reservations and filter by booking or payment status.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="relative min-w-0 flex-1 sm:min-w-[230px]">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    ⌕
                  </span>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search booking, customer, car..."
                    aria-label="Search bookings"
                    className="w-full rounded-xl border border-[#dedbd3] bg-[#fbfaf7] py-3 pl-9 pr-4 text-sm text-[#17251e] outline-none transition placeholder:text-gray-400 focus:border-[#c6a15b] focus:ring-2 focus:ring-[#c6a15b]/20"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter by booking status"
                  className="rounded-xl border border-[#dedbd3] bg-[#fbfaf7] px-3 py-3 text-sm text-[#17251e] outline-none focus:border-[#c6a15b]"
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={paymentFilter}
                  onChange={(event) => setPaymentFilter(event.target.value)}
                  aria-label="Filter by payment status"
                  className="rounded-xl border border-[#dedbd3] bg-[#fbfaf7] px-3 py-3 text-sm text-[#17251e] outline-none focus:border-[#c6a15b]"
                >
                  <option value="all">All payments</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="pending">Pending</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
              <p>
                Showing{" "}
                <span className="font-semibold text-[#17251e]">
                  {filteredBookings.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[#17251e]">
                  {bookings.length}
                </span>{" "}
                bookings
              </p>

              {(search || statusFilter !== "all" || paymentFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setPaymentFilter("all");
                  }}
                  className="font-semibold text-[#9a783c] transition hover:text-[#0a1411]"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="border-b border-[#eeeae2] bg-[#fbfaf7]">
                <tr>
                  {[
                    "Booking",
                    "Customer",
                    "Vehicle",
                    "Rental Dates",
                    "Amount",
                    "Payment",
                    "Status",
                    "Action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className={`whitespace-nowrap px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 ${
                        heading === "Action" ? "text-right" : ""
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#eeeae2]">
                {filteredBookings.map((booking) => {
                  const paymentStatus = getPaymentStatus(booking);

                  return (
                    <tr
                      key={booking.id}
                      className="transition hover:bg-[#fbfaf7]"
                    >
                      <td className="px-5 py-5">
                        <p className="font-bold text-[#0a1411]">
                          #{booking.id}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {booking.total_days}{" "}
                          {booking.total_days === 1 ? "day" : "days"}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <p className="font-semibold text-[#17251e]">
                          {booking.user?.name || "Unknown Customer"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {booking.user?.email || "—"}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <p className="font-semibold text-[#17251e]">
                          {booking.car?.brand || "Unknown"}{" "}
                          {booking.car?.model || ""}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Car ID #{booking.car_id}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <p className="whitespace-nowrap text-sm text-[#17251e]">
                          {formatDate(booking.pickup_date)}
                        </p>
                        <p className="my-1 text-xs text-gray-400">to</p>
                        <p className="whitespace-nowrap text-sm text-[#17251e]">
                          {formatDate(booking.return_date)}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <p className="whitespace-nowrap font-bold text-[#17251e]">
                          {formatMoney(booking.total_amount)}
                        </p>
                        <p className="mt-1 whitespace-nowrap text-xs text-gray-500">
                          {formatMoney(booking.daily_rate)}/day
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${getPaymentStyle(
                            paymentStatus
                          )}`}
                        >
                          {paymentStatus}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${getStatusStyle(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </td>

                      <td className="px-5 py-5 text-right">
                        <Link
  href={`${dashboardPath}/bookings/${booking.id}`}
  className="inline-flex items-center justify-center rounded-xl border border-lime-400/20 bg-lime-400/10 px-4 py-2.5 text-xs font-semibold text-lime-300 transition hover:bg-lime-400/20"
>
  View Details
  <span className="ml-2" aria-hidden="true">→</span>
</Link>
                      </td>
                    </tr>
                  );
                })}

                {filteredBookings.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4f0e7] text-2xl text-[#9a783c]">
                        ⌕
                      </div>
                      <p className="mt-4 font-semibold text-[#17251e]">
                        No bookings found
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        Try changing your search or filters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col justify-between gap-2 border-t border-[#eeeae2] bg-[#fbfaf7] px-5 py-4 text-xs text-gray-500 sm:flex-row sm:items-center">
            <span>DriveX Booking Management</span>
            <span>All amounts are displayed in EGP</span>
          </div>
        </section>
      </div>
    </main>
  );
}
