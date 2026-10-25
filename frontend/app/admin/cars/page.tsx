
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Car = {
  id: number;
  brand: string;
  model: string;
  year: number;
  daily_rate: number;
  status: string;
  category?: {
    id: number;
    name: string;
  };
  branch?: {
    id: number;
    name: string;
  };
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

const statusStyles: Record<string, string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rented: "border-amber-200 bg-amber-50 text-amber-800",
  reserved: "border-[#e7dcc4] bg-[#f8f0df] text-[#806331]",
  maintenance: "border-orange-200 bg-orange-50 text-orange-800",
  inactive: "border-[#e4e2dc] bg-[#f2f1ed] text-[#73766e]",
};

const statusLabels: Record<string, string> = {
  available: "Available",
  rented: "Rented",
  reserved: "Reserved",
  maintenance: "Maintenance",
  inactive: "Inactive",
};

function StatIcon({ type }: { type: "fleet" | "available" | "rented" }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3ead7] text-[#96743b]">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
        aria-hidden="true"
      >
        {type === "fleet" && (
          <>
            <path d="m5 11 1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" />
            <path d="M3 11h18v7H3z" />
            <path d="M6 18v2m12-2v2M6 14h.01M18 14h.01" />
          </>
        )}
        {type === "available" && (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12 2.5 2.5L16 9" />
          </>
        )}
        {type === "rented" && (
          <>
            <rect x="3" y="5" width="18" height="15" rx="2" />
            <path d="M16 3v4M8 3v4M3 10h18" />
          </>
        )}
      </svg>
    </div>
  );
}

function CarIllustration() {
  return (
    <div className="flex h-14 w-[72px] shrink-0 items-center justify-center rounded-2xl border border-[#e9e5dc] bg-[#f8f8f5] text-[#8d9b8d]">
      <svg
        viewBox="0 0 64 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-9 w-14"
        aria-hidden="true"
      >
        <path d="m10 23 4-10a4 4 0 0 1 3.7-2.5h26.6A4 4 0 0 1 48 13l4 10" />
        <path d="M7 23h50v8H7z" />
        <path d="m17 13-3 8h36l-3-8" />
        <circle cx="17" cy="31" r="4" fill="#f8f8f5" />
        <circle cx="47" cy="31" r="4" fill="#f8f8f5" />
        <path d="M8 26h5m38 0h5" />
      </svg>
    </div>
  );
}

export default function AdminCarsPage() {
  const router = useRouter();

  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const fetchCars = useCallback(
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
        const response = await fetch(`${API_URL}/cars`, {
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
          throw new Error(data.message || "Failed to load cars.");
        }

        setCars(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load cars."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router]
  );

  useEffect(() => {
    void fetchCars();
  }, [fetchCars]);

  const handleDelete = async (id: number) => {
    const car = cars.find((item) => item.id === id);
    const confirmed = window.confirm(
      `Are you sure you want to delete ${
        car ? `${car.brand} ${car.model}` : "this car"
      }? This action cannot be undone.`
    );

    if (!confirmed) return;

    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setDeletingId(id);
    setError("");

    try {
      const response = await fetch(`${API_URL}/cars/${id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace("/login");
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete car.");
      }

      setCars((currentCars) =>
        currentCars.filter((item) => item.id !== id)
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete car."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const availableCars = cars.filter(
    (car) => car.status === "available"
  ).length;

  const rentedCars = cars.filter(
    (car) => car.status === "rented"
  ).length;

  const filteredCars = cars.filter((car) => {
    const searchValue = search.trim().toLowerCase();

    const matchesSearch =
      !searchValue ||
      `${car.brand} ${car.model}`.toLowerCase().includes(searchValue) ||
      String(car.id).includes(searchValue) ||
      car.category?.name.toLowerCase().includes(searchValue) ||
      car.branch?.name.toLowerCase().includes(searchValue);

    const matchesStatus =
      statusFilter === "all" || car.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f8f7] px-4 pb-16 pt-28 text-[#0a1411] sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-[#e9e5dc] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-[#e9e5dc] border-t-[#c6a15b]" />
            <p className="font-medium text-[#59645c]">
              Loading your vehicle fleet...
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
                Fleet Management
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-[#0a1411] sm:text-4xl">
                Manage Cars
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#73786f] sm:text-base">
                Manage your vehicles, monitor availability, and keep your fleet organized.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void fetchCars(true)}
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
                Refresh
              </button>

              <Link
                href="/admin/cars/create"
className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e8eee7] px-6 py-3 text-sm font-bold text-[#17251e] shadow-lg shadow-[#0a1411]/10 transition hover:bg-[#d5e1d3]"              >
                <span className="text-lg leading-none">+</span>
                Add New Car
              </Link>
            </div>
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

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-[#e9e5dc] bg-white p-5 shadow-[0_4px_20px_rgba(10,20,17,0.025)] sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#73786f]">
                  Total Vehicles
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-[#0a1411]">
                  {cars.length}
                </p>
                <p className="mt-1 text-xs text-[#85867c]">
                  Registered in your fleet
                </p>
              </div>
              <StatIcon type="fleet" />
            </div>
          </div>

          <div className="rounded-2xl border border-[#e9e5dc] bg-white p-5 shadow-[0_4px_20px_rgba(10,20,17,0.025)] sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#73786f]">
                  Available
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-[#23764c]">
                  {availableCars}
                </p>
                <p className="mt-1 text-xs text-[#85867c]">
                  Ready for rental
                </p>
              </div>
              <StatIcon type="available" />
            </div>
          </div>

          <div className="rounded-2xl border border-[#e9e5dc] bg-white p-5 shadow-[0_4px_20px_rgba(10,20,17,0.025)] sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#73786f]">
                  Currently Rented
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-[#9a783c]">
                  {rentedCars}
                </p>
                <p className="mt-1 text-xs text-[#85867c]">
                  Currently on rental
                </p>
              </div>
              <StatIcon type="rented" />
            </div>
          </div>
        </div>

        <section className="overflow-hidden rounded-3xl border border-[#e9e5dc] bg-white shadow-[0_8px_35px_rgba(10,20,17,0.035)]">
          <div className="flex flex-col gap-4 border-b border-[#e9e5dc] px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#0a1411]">
                Vehicle Inventory
              </h2>
              <p className="mt-1 text-sm text-[#85867c]">
                {filteredCars.length} of {cars.length} vehicles displayed
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
                  placeholder="Search vehicles..."
                  aria-label="Search vehicles"
                  className="w-full rounded-xl border border-[#dedbd2] bg-[#fcfbf8] py-3 pl-10 pr-4 text-sm text-[#0a1411] outline-none transition placeholder:text-[#9b9a91] focus:border-[#c6a15b] focus:ring-2 focus:ring-[#c6a15b]/15"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by status"
                className="rounded-xl border border-[#dedbd2] bg-[#fcfbf8] px-4 py-3 text-sm text-[#34443b] outline-none focus:border-[#c6a15b] sm:min-w-[160px]"
              >
                <option value="all">All statuses</option>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="rented">Rented</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {filteredCars.length === 0 ? (
            <div className="px-6 py-16 text-center sm:py-20">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f3ead7] text-[#96743b]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-8 w-8"
                  aria-hidden="true"
                >
                  <path d="m5 11 1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" />
                  <path d="M3 11h18v7H3z" />
                  <path d="M6 18v2m12-2v2" />
                </svg>
              </div>

              <h3 className="text-lg font-bold text-[#0a1411]">
                {cars.length === 0
                  ? "Your fleet is empty"
                  : "No vehicles found"}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#73786f]">
                {cars.length === 0
                  ? "Add your first vehicle to start building your rental fleet."
                  : "Try changing your search or status filter to find a vehicle."}
              </p>

              {cars.length === 0 ? (
                <Link
                  href="/admin/cars/create"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0a1411] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1a3027]"
                >
                  <span>+</span>
                  Add Your First Car
                </Link>
              ) : (
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
                <table className="w-full min-w-[900px] text-left">
                  <thead className="border-b border-[#e9e5dc] bg-[#fcfbf8]">
                    <tr>
                      {[
                        "Vehicle",
                        "Category",
                        "Branch",
                        "Daily Rate",
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
                    {filteredCars.map((car) => (
                      <tr
                        key={car.id}
                        className="transition hover:bg-[#fcfbf8]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <CarIllustration />
                            <div>
                              <p className="font-bold text-[#0a1411]">
                                {car.brand} {car.model}
                              </p>
                              <p className="mt-1 text-xs text-[#85867c]">
                                {car.year} · ID #{car.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-[#59645c]">
                          {car.category?.name || "—"}
                        </td>

                        <td className="px-5 py-4 text-sm text-[#59645c]">
                          {car.branch?.name || "—"}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-bold text-[#0a1411]">
                            {Number(car.daily_rate).toLocaleString("en-US", {
                              maximumFractionDigits: 2,
                            })}{" "}
                            EGP
                          </p>
                          <p className="mt-1 text-xs text-[#85867c]">
                            per day
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
                              statusStyles[car.status] ||
                              "border-[#e4e2dc] bg-[#f2f1ed] text-[#73766e]"
                            }`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {statusLabels[car.status] || car.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/cars/${car.id}`}
                              className="rounded-lg border border-[#dedbd2] bg-white px-3 py-2 text-xs font-bold text-[#59645c] transition hover:border-[#c6a15b] hover:text-[#806331]"
                            >
                              View
                            </Link>

                            <Link
                              href={`/admin/cars/edit/${car.id}`}
                              className="rounded-lg border border-[#e7dcc4] bg-[#f8f0df] px-3 py-2 text-xs font-bold text-[#806331] transition hover:bg-[#f1e5c9]"
                            >
                              Edit
                            </Link>

                            <button
                              type="button"
                              onClick={() => void handleDelete(car.id)}
                              disabled={deletingId === car.id}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingId === car.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 p-4 md:hidden">
                {filteredCars.map((car) => (
                  <article
                    key={car.id}
                    className="rounded-2xl border border-[#e9e5dc] bg-white p-4"
                  >
                    <div className="flex items-start gap-3">
                      <CarIllustration />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-[#0a1411]">
                          {car.brand} {car.model}
                        </h3>
                        <p className="mt-1 text-xs text-[#85867c]">
                          {car.year} · ID #{car.id}
                        </p>
                        <span
                          className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
                            statusStyles[car.status] ||
                            "border-[#e4e2dc] bg-[#f2f1ed] text-[#73766e]"
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {statusLabels[car.status] || car.status}
                        </span>
                      </div>
                    </div>

                    <div className="my-4 grid grid-cols-2 gap-3 rounded-xl bg-[#fcfbf8] p-3">
                      <div>
                        <p className="text-xs text-[#85867c]">Category</p>
                        <p className="mt-1 text-sm font-semibold text-[#34443b]">
                          {car.category?.name || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#85867c]">Branch</p>
                        <p className="mt-1 text-sm font-semibold text-[#34443b]">
                          {car.branch?.name || "—"}
                        </p>
                      </div>
                      <div className="col-span-2 border-t border-[#e9e5dc] pt-3">
                        <p className="text-xs text-[#85867c]">Daily Rate</p>
                        <p className="mt-1 font-bold text-[#0a1411]">
                          {Number(car.daily_rate).toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                          })}{" "}
                          EGP
                          <span className="ml-1 text-xs font-normal text-[#85867c]">
                            / day
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <Link
                        href={`/admin/cars/${car.id}`}
                        className="rounded-lg border border-[#dedbd2] px-2 py-2.5 text-center text-xs font-bold text-[#59645c] transition hover:bg-[#f8f8f7]"
                      >
                        View
                      </Link>

                      <Link
                        href={`/admin/cars/edit/${car.id}`}
                        className="rounded-lg border border-[#e7dcc4] bg-[#f8f0df] px-2 py-2.5 text-center text-xs font-bold text-[#806331] transition hover:bg-[#f1e5c9]"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => void handleDelete(car.id)}
                        disabled={deletingId === car.id}
                        className="rounded-lg border border-red-200 bg-red-50 px-2 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        {deletingId === car.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {filteredCars.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-[#e9e5dc] bg-[#fcfbf8] px-5 py-4 text-xs text-[#85867c] sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {filteredCars.length} of {cars.length} vehicles
              </span>
              <span>DriveX Fleet Management</span>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
