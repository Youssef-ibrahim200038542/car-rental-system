
    "use client";

    import { useEffect, useMemo, useState } from "react";
    import Link from "next/link";
    import { getCarImageUrl, getLocalCarImage } from "@/lib/car-images";

    type Booking = {
    id: number;
    user_id: number | string;
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

    car?: {
        id: number;
        brand?: string;
        model?: string;
        name?: string;
        image?: string | null;
        year?: number;
    };

    pickup_branch?: {
        id: number;
        name: string;
        city?: string;
    };

    dropoff_branch?: {
        id: number;
        name: string;
        city?: string;
    };
    };

    type User = {
    id: number | string;
    name: string;
    email: string;
    role?: string;
    };

    type FilterType = "all" | "active" | "completed" | "cancelled";

    const API_URL = (
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"
    ).replace(/\/+$/, "");

    const isActiveBooking = (status: string) =>
    ["active", "confirmed", "pending"].includes(status.toLowerCase());

    export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState<FilterType>("all");

    useEffect(() => {
        const fetchBookings = async () => {
        try {
            const token = localStorage.getItem("token");
            const userString = localStorage.getItem("user");

            if (!token || !userString) {
            window.location.href = "/login";
            return;
            }

            const user: User = JSON.parse(userString);

            const response = await fetch(`${API_URL}/bookings`, {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            });

            const data = await response.json();

            if (!response.ok) {
            throw new Error(data.message || "Failed to fetch bookings");
            }

            const allBookings: Booking[] = Array.isArray(data.data)
            ? data.data
            : [];

            const userBookings = allBookings.filter(
            (booking) => Number(booking.user_id) === Number(user.id)
            );

            setBookings(userBookings);
        } catch (err) {
            console.error("Error fetching bookings:", err);
            setError("Unable to load your bookings. Please try again.");
        } finally {
            setLoading(false);
        }
        };

        fetchBookings();
    }, []);

    const getStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
        case "confirmed":
            return "border-[#b9d8c0] bg-[#edf6ee] text-[#356847]";
        case "active":
            return "border-[#c4d9cb] bg-[#e5f0e8] text-[#28583b]";
        case "completed":
            return "border-[#ded1b5] bg-[#f8f1e3] text-[#87662f]";
        case "cancelled":
            return "border-[#e8caca] bg-[#fbefef] text-[#a34444]";
        default:
            return "border-[#e7d7ac] bg-[#fcf6e5] text-[#87662f]";
        }
    };

    const getStatusDot = (status: string) => {
        switch (status.toLowerCase()) {
        case "confirmed":
            return "bg-[#4d8b5e]";
        case "active":
            return "bg-[#356847]";
        case "completed":
            return "bg-[#c6a15b]";
        case "cancelled":
            return "bg-[#c45a5a]";
        default:
            return "bg-[#c6a15b]";
        }
    };

    const formatStatus = (status: string) =>
        status.charAt(0).toUpperCase() + status.slice(1);

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

    const totalSpent = bookings.reduce(
        (sum, booking) => sum + Number(booking.total_amount || 0),
        0
    );

    const activeBookings = bookings.filter((booking) =>
        isActiveBooking(booking.status)
    );

    const filteredBookings = useMemo(() => {
        switch (filter) {
        case "active":
            return bookings.filter((booking) =>
            isActiveBooking(booking.status)
            );
        case "completed":
            return bookings.filter(
            (booking) => booking.status.toLowerCase() === "completed"
            );
        case "cancelled":
            return bookings.filter(
            (booking) => booking.status.toLowerCase() === "cancelled"
            );
        default:
            return bookings;
        }
    }, [bookings, filter]);

    const filters: { value: FilterType; label: string }[] = [
        { value: "all", label: "All Bookings" },
        { value: "active", label: "Active" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
    ];

    return (
        <main className="min-h-screen bg-[#f8f8f7] px-4 pb-20 pt-28 text-[#0a1411] sm:px-6 sm:pt-32">
        <div className="mx-auto max-w-7xl">
            {/* Hero */}
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
                    Manage your reservations, keep track of your rental schedule,
                    and revisit every journey in one place.
                </p>
                </div>

                <Link
                href="/cars"
                className="inline-flex w-fit shrink-0 items-center justify-center gap-3 rounded-xl bg-[#365747] px-6 py-3.5 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#c6a15b] hover:text-[#0a1411] hover:shadow-lg hover:shadow-[#c6a15b]/20 focus:outline-none focus:ring-2 focus:ring-[#c6a15b] focus:ring-offset-2"
                >
                Browse Cars
                <span aria-hidden="true">→</span>
                </Link>
            </div>
            </section>

            {/* Statistics */}
            {!loading && !error && bookings.length > 0 && (
            <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-[#e8e4db] bg-white p-5 transition-colors hover:border-[#c6a15b]/60">
                <div className="flex items-start justify-between gap-4">
                    <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#898981]">
                        Total Bookings
                    </p>
                    <p className="mt-3 text-3xl font-bold text-[#0a1411]">
                        {bookings.length}
                    </p>
                    <p className="mt-1 text-sm text-[#77776f]">
                        All reservations
                    </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f6f0e3] text-[#9a783c]">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        className="h-5 w-5"
                        aria-hidden="true"
                    >
                        <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 3.75v2.5m10.5-2.5v2.5M3.75 9.75h16.5M5.25 5.25h13.5A1.5 1.5 0 0 1 20.25 6.75v12A1.5 1.5 0 0 1 18.75 20.25H5.25a1.5 1.5 0 0 1-1.5-1.5v-12a1.5 1.5 0 0 1 1.5-1.5Z"
                        />
                    </svg>
                    </div>
                </div>
                </div>

                <div className="rounded-2xl border border-[#e8e4db] bg-white p-5 transition-colors hover:border-[#b9d8c0]">
                <div className="flex items-start justify-between gap-4">
                    <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#898981]">
                        Active Trips
                    </p>
                    <p className="mt-3 text-3xl font-bold text-[#356847]">
                        {activeBookings.length}
                    </p>
                    <p className="mt-1 text-sm text-[#77776f]">
                        Current reservations
                    </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf6ee]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#4d8b5e]" />
                    </div>
                </div>
                </div>

                <div className="rounded-2xl border border-[#e8e4db] bg-white p-5 transition-colors hover:border-[#c6a15b]/60 sm:col-span-2 lg:col-span-1">
                <div className="flex items-start justify-between gap-4">
                    <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#898981]">
                        Total Spent
                    </p>
                    <p className="mt-3 text-3xl font-bold text-[#9a783c]">
                        {totalSpent.toLocaleString()}
                        <span className="ml-1 text-sm font-medium text-[#898981]">
                        EGP
                        </span>
                    </p>
                    <p className="mt-1 text-sm text-[#77776f]">
                        Across all bookings
                    </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f6f0e3] text-[#9a783c]">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        className="h-5 w-5"
                        aria-hidden="true"
                    >
                        <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v12m4-9.5c0-1.105-1.79-2-4-2s-4 .895-4 2 1.79 2 4 2 4 .895 4 2-1.79 2-4 2-4-.895-4-2"
                        />
                    </svg>
                    </div>
                </div>
                </div>
            </section>
            )}

            {/* Filters */}
            {!loading && !error && bookings.length > 0 && (
            <section className="mb-7 flex flex-col gap-4 rounded-2xl border border-[#e8e4db] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div>
                <p className="font-semibold text-[#0a1411]">
                    Reservation History
                </p>
                <p className="mt-1 text-xs text-[#898981]">
                    {filteredBookings.length} reservation
                    {filteredBookings.length !== 1 ? "s" : ""}
                </p>
                </div>

                <div className="flex flex-wrap gap-2">
                {filters.map((item) => (
                    <button
                    key={item.value}
                    type="button"
                    onClick={() => setFilter(item.value)}
                    aria-pressed={filter === item.value}
                    className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#c6a15b] focus:ring-offset-2 ${
                        filter === item.value
                        ? "bg-[#365747] text-white shadow-sm"
                        : "border border-[#e8e4db] bg-white text-[#77776f] hover:border-[#c6a15b] hover:bg-[#fbf8f0] hover:text-[#0a1411]"
                    }`}
                    >
                    {item.label}
                    </button>
                ))}
                </div>
            </section>
            )}

            {/* Loading */}
            {loading && (
            <div className="grid gap-6">
                {[1, 2, 3].map((item) => (
                <div
                    key={item}
                    className="overflow-hidden rounded-3xl border border-[#e8e4db] bg-white"
                >
                    <div className="flex flex-col md:flex-row">
                    <div className="h-64 animate-pulse bg-[#eeede8] md:w-72" />
                    <div className="flex-1 space-y-5 p-6">
                        <div className="h-4 w-32 animate-pulse rounded bg-[#eeede8]" />
                        <div className="h-8 w-56 animate-pulse rounded bg-[#eeede8]" />
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((box) => (
                            <div
                            key={box}
                            className="h-20 animate-pulse rounded-xl bg-[#f1f0ec]"
                            />
                        ))}
                        </div>
                    </div>
                    </div>
                </div>
                ))}
            </div>
            )}

            {/* Error */}
            {!loading && error && (
            <div className="rounded-3xl border border-[#e8caca] bg-white p-8 text-center sm:p-14">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fbefef] text-[#a34444]">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="h-8 w-8"
                    aria-hidden="true"
                >
                    <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m0 3h.008v.008H12v-.008ZM10.29 3.86 2.82 17a1.5 1.5 0 0 0 1.3 2.25h15.76a1.5 1.5 0 0 0 1.3-2.25l-7.47-13.14a1.5 1.5 0 0 0-2.61 0Z"
                    />
                </svg>
                </div>

                <h2 className="mt-5 text-xl font-bold text-[#0a1411]">
                Something went wrong
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#a34444]">
                {error}
                </p>

                <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#365747] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#c6a15b] hover:text-[#0a1411] focus:outline-none focus:ring-2 focus:ring-[#c6a15b] focus:ring-offset-2"
                >
                Try Again
                </button>
            </div>
            )}

            {/* Empty */}
            {!loading && !error && bookings.length === 0 && (
            <div className="relative overflow-hidden rounded-[2rem] border border-[#e8e4db] bg-white px-6 py-16 text-center shadow-[0_12px_40px_rgba(10,20,17,0.04)] sm:py-20">
                <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-[#c6a15b]/10 blur-3xl" />

                <div className="relative z-10">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#f6f0e3] text-[#9a783c]">
                    <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    className="h-10 w-10"
                    aria-hidden="true"
                    >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 3.75v2.5m10.5-2.5v2.5M3.75 9.75h16.5M5.25 5.25h13.5A1.5 1.5 0 0 1 20.25 6.75v12A1.5 1.5 0 0 1 18.75 20.25H5.25a1.5 1.5 0 0 1-1.5-1.5v-12a1.5 1.5 0 0 1 1.5-1.5Z"
                    />
                    </svg>
                </div>

                <h2 className="mt-6 text-2xl font-bold text-[#0a1411]">
                    Your journey starts here
                </h2>

                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#77776f]">
                    You haven&apos;t made any reservations yet. Explore our fleet
                    and find a car for your next journey.
                </p>

                <Link
                    href="/cars"
                    className="mt-8 inline-flex items-center justify-center gap-3 rounded-xl bg-[#365747] px-7 py-3.5 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#c6a15b] hover:text-[#0a1411] hover:shadow-lg hover:shadow-[#c6a15b]/20 focus:outline-none focus:ring-2 focus:ring-[#c6a15b] focus:ring-offset-2"
                >
                    Explore Our Fleet
                    <span aria-hidden="true">→</span>
                </Link>
                </div>
            </div>
            )}

            {/* Filter Empty */}
            {!loading &&
            !error &&
            bookings.length > 0 &&
            filteredBookings.length === 0 && (
                <div className="rounded-3xl border border-[#e8e4db] bg-white px-6 py-14 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f6f0e3] text-[#9a783c]">
                    <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="h-8 w-8"
                    aria-hidden="true"
                    >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 17.25V6.75Z"
                    />
                    </svg>
                </div>

                <h2 className="mt-5 text-xl font-bold text-[#0a1411]">
                    No reservations found
                </h2>

                <p className="mt-2 text-sm text-[#77776f]">
                    There are no bookings in this category.
                </p>

                <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className="mt-5 rounded-xl border border-[#e8e4db] px-5 py-2.5 text-sm font-semibold text-[#365747] transition hover:border-[#c6a15b] hover:bg-[#fbf8f0]"
                >
                    View All Bookings
                </button>
                </div>
            )}

            {/* Bookings */}
            {!loading && !error && filteredBookings.length > 0 && (
            <div className="space-y-6">
                {filteredBookings.map((booking) => {
                const carName =
                    booking.car?.name ||
                    `${booking.car?.brand || ""} ${booking.car?.model || ""}`.trim() ||
                    "Rental Car";

                const imageUrl = getCarImageUrl(
                    booking.car?.image,
                    booking.car?.brand,
                    booking.car?.model,
                    carName
                );

                const fallbackImage = getLocalCarImage(
                    booking.car?.brand,
                    booking.car?.model,
                    carName
                );

                return (
                    <article
                    key={booking.id}
                    className="group overflow-hidden rounded-[1.75rem] border border-[#e8e4db] bg-white shadow-[0_10px_35px_rgba(10,20,17,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c6a15b]/60 hover:shadow-[0_18px_45px_rgba(10,20,17,0.08)]"
                    >
                    <div className="flex flex-col lg:flex-row">
                        {/* Car Image */}
                        <div className="relative h-64 overflow-hidden bg-[#eeede8] lg:min-h-[420px] lg:w-72 lg:shrink-0">
                        <img
                            src={imageUrl}
                            alt={carName}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                            onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = fallbackImage;
                            }}
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1411]/50 via-transparent to-transparent" />

                        <div className="absolute left-5 top-5">
                            <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur-md ${getStatusStyle(
                                booking.status
                            )}`}
                            >
                            <span
                                className={`h-1.5 w-1.5 rounded-full ${getStatusDot(
                                booking.status
                                )}`}
                            />
                            {formatStatus(booking.status)}
                            </span>
                        </div>

                        <div className="absolute bottom-5 left-5 text-xs font-semibold tracking-wide text-white">
                            BOOKING #{booking.id}
                        </div>
                        </div>

                        {/* Main Info */}
                        <div className="min-w-0 flex-1 p-5 sm:p-6 lg:p-7">
                        <div className="flex flex-col justify-between gap-5 sm:flex-row">
                            <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a783c]">
                                Reservation #{booking.id}
                            </p>

                            <h2 className="mt-2 break-words text-2xl font-bold tracking-tight text-[#0a1411] md:text-3xl">
                                {carName}
                            </h2>

                            {booking.car?.year && (
                                <p className="mt-1 text-sm text-[#898981]">
                                {booking.car.year} Model
                                </p>
                            )}
                            </div>

                            <div className="sm:text-right">
                            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#898981]">
                                Total Amount
                            </p>

                            <p className="mt-1 text-2xl font-bold text-[#9a783c] sm:text-3xl">
                                {Number(
                                booking.total_amount || 0
                                ).toLocaleString()}
                                <span className="ml-1 text-sm font-medium text-[#898981]">
                                EGP
                                </span>
                            </p>
                            </div>
                        </div>

                        {/* Rental Timeline */}
                        <div className="mt-6 rounded-2xl border border-[#e8e4db] bg-[#f8f8f7] p-4 sm:p-5">
                            <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
                            <div>
                                <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-[#4d8b5e]" />
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#898981]">
                                    Pick-up
                                </p>
                                </div>

                                <p className="mt-2 text-lg font-bold text-[#0a1411]">
                                {formatDate(booking.pickup_date)}
                                </p>

                                <p className="mt-1 text-sm text-[#77776f]">
                                {booking.pickup_branch?.name || "Pickup Branch"}
                                </p>

                                {booking.pickup_branch?.city && (
                                <p className="mt-0.5 text-xs text-[#898981]">
                                    {booking.pickup_branch.city}
                                </p>
                                )}
                            </div>

                            <div className="hidden h-px w-16 bg-gradient-to-r from-[#4d8b5e]/50 via-[#d9d3c6] to-[#c6a15b]/70 md:block" />

                            <div className="md:text-right">
                                <div className="flex items-center gap-2 md:justify-end">
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#898981]">
                                    Return
                                </p>
                                <span className="h-2 w-2 rounded-full bg-[#c6a15b]" />
                                </div>

                                <p className="mt-2 text-lg font-bold text-[#0a1411]">
                                {formatDate(booking.return_date)}
                                </p>

                                <p className="mt-1 text-sm text-[#77776f]">
                                {booking.dropoff_branch?.name ||
                                    "Drop-off Branch"}
                                </p>

                                {booking.dropoff_branch?.city && (
                                <p className="mt-0.5 text-xs text-[#898981]">
                                    {booking.dropoff_branch.city}
                                </p>
                                )}
                            </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-xl border border-[#e8e4db] bg-white p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#898981]">
                                Duration
                            </p>
                            <p className="mt-1 text-sm font-bold text-[#0a1411]">
                                {booking.total_days}{" "}
                                {booking.total_days === 1 ? "Day" : "Days"}
                            </p>
                            </div>

                            <div className="rounded-xl border border-[#e8e4db] bg-white p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#898981]">
                                Daily Rate
                            </p>
                            <p className="mt-1 text-sm font-bold text-[#0a1411]">
                                {Number(booking.daily_rate || 0).toLocaleString()}{" "}
                                EGP
                            </p>
                            </div>

                            <div className="rounded-xl border border-[#e8e4db] bg-white p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#898981]">
                                Subtotal
                            </p>
                            <p className="mt-1 text-sm font-bold text-[#0a1411]">
                                {Number(booking.subtotal || 0).toLocaleString()}{" "}
                                EGP
                            </p>
                            </div>

                            <div className="rounded-xl border border-[#e8e4db] bg-white p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#898981]">
                                Discount
                            </p>
                            <p className="mt-1 text-sm font-bold text-[#356847]">
                                {Number(booking.discount || 0).toLocaleString()} EGP
                            </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 flex flex-col gap-4 border-t border-[#e8e4db] pt-5 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-[#898981]">
                            Booking ID #{booking.id}
                            </p>

                            <div className="flex flex-col gap-3 sm:flex-row">
                            {booking.status.toLowerCase() === "completed" && (
                                <Link
                                href={`/reviews/create?booking_id=${booking.id}`}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e7d7ac] bg-[#fcf6e5] px-5 py-2.5 text-sm font-semibold text-[#87662f] transition-all duration-200 hover:border-[#c6a15b] hover:bg-[#f6f0e3] focus:outline-none focus:ring-2 focus:ring-[#c6a15b] focus:ring-offset-2"
                                >
                                Leave a Review
                                <span aria-hidden="true">→</span>
                                </Link>
                            )}

                            <Link
                                href={`/cars/${booking.car_id}`}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d9e2db] bg-[#edf3ee] px-5 py-2.5 text-sm font-semibold text-[#365747] transition-all duration-200 hover:border-[#c6a15b] hover:bg-[#c6a15b] hover:text-[#0a1411] focus:outline-none focus:ring-2 focus:ring-[#c6a15b] focus:ring-offset-2"
                            >
                                View Car
                                <span
                                aria-hidden="true"
                                className="transition-transform duration-200 group-hover:translate-x-1"
                                >
                                →
                                </span>
                            </Link>
                            </div>
                        </div>
                        </div>
                    </div>
                    </article>
                );
                })}
            </div>
            )}
        </div>
        </main>
    );
    }
