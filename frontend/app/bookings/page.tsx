    "use client";

    import { useEffect, useMemo, useState } from "react";
    import Link from "next/link";

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

    export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("all");

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

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        const response = await fetch(apiUrl + "/bookings", {
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + token,
        },
        });

        const data = await response.json();

        if (!response.ok) {
        throw new Error(data.message || "Failed to fetch bookings");
        }

        const allBookings: Booking[] = data.data || [];

        const userBookings = allBookings.filter(
        (booking) => Number(booking.user_id) === Number(user.id)
        );

        setBookings(userBookings);
    } catch (err) {
        console.error(err);
        setError("Unable to load your bookings.");
    } finally {
        setLoading(false);
    }
    };

    fetchBookings();


    }, []);

    const getStatusStyle = (status: string) => {
    switch (status) {
    case "confirmed":
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-400";


    case "active":
        return "border-blue-400/20 bg-blue-400/10 text-blue-400";

    case "completed":
        return "border-violet-400/20 bg-violet-400/10 text-violet-400";

    case "cancelled":
        return "border-red-400/20 bg-red-400/10 text-red-400";

    default:
        return "border-yellow-400/20 bg-yellow-400/10 text-yellow-400";
    }


    };

    const getStatusDot = (status: string) => {
    switch (status) {
    case "confirmed":
    return "bg-emerald-400";


    case "active":
        return "bg-blue-400";

    case "completed":
        return "bg-violet-400";

    case "cancelled":
        return "bg-red-400";

    default:
        return "bg-yellow-400";
    }


    };

    const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    });
    };

    const getImageUrl = (image?: string | null) => {
    if (!image) return null;


    return `http://127.0.0.1:8000/${image}`;


    };

    const totalSpent = bookings.reduce(
    (sum, booking) => sum + Number(booking.total_amount),
    0
    );

    const activeBookings = bookings.filter(
    (booking) =>
    booking.status === "active" ||
    booking.status === "confirmed" ||
    booking.status === "pending"
    );

    const completedBookings = bookings.filter(
    (booking) => booking.status === "completed"
    );

    const filteredBookings = useMemo(() => {
    if (filter === "all") {
    return bookings;
    }


    if (filter === "active") {
    return bookings.filter(
        (booking) =>
        booking.status === "active" ||
        booking.status === "confirmed" ||
        booking.status === "pending"
    );
    }

    if (filter === "completed") {
    return bookings.filter(
        (booking) => booking.status === "completed"
    );
    }

    if (filter === "cancelled") {
    return bookings.filter(
        (booking) => booking.status === "cancelled"
    );
    }

    return bookings;


    }, [bookings, filter]);

    return ( <main className="min-h-screen bg-slate-950 px-6 pb-24 pt-32 text-white"> <div className="mx-auto max-w-7xl">


        {/* Hero */}
        <section className="relative mb-10 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-500/[0.08] via-white/[0.03] to-transparent px-7 py-10 md:px-10 md:py-12">

        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-blue-600/5 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">

            <div className="max-w-3xl">

            <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50" />

                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">
                Your Journey
                </p>
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">
                My
                <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                {" "}Bookings
                </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-400 md:text-lg">
                Manage your reservations, keep track of your rental
                schedule, and revisit every journey in one place.
            </p>

            </div>

            <Link
            href="/cars"
            className="inline-flex w-fit shrink-0 items-center gap-3 rounded-xl bg-blue-500 px-6 py-3.5 font-semibold text-white shadow-xl shadow-blue-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-blue-500/30"
            >
            Browse Cars

            <span className="transition-transform duration-300 hover:translate-x-1">
                →
            </span>
            </Link>

        </div>
        </section>

        {/* Stats */}
        {!loading && !error && bookings.length > 0 && (
        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <div className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:border-blue-400/20 hover:bg-white/[0.05]">
            <div className="flex items-start justify-between">
                <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    Total Bookings
                </p>

                <p className="mt-3 text-3xl font-bold text-white">
                    {bookings.length}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                    All reservations
                </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/10 bg-blue-400/10">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="h-5 w-5 text-blue-400"
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

            <div className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:border-emerald-400/20 hover:bg-white/[0.05]">
            <div className="flex items-start justify-between">
                <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    Active Trips
                </p>

                <p className="mt-3 text-3xl font-bold text-emerald-400">
                    {activeBookings.length}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                    Current reservations
                </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/10 bg-emerald-400/10">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
                </div>
            </div>
            </div>

            <div className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:border-violet-400/20 hover:bg-white/[0.05] sm:col-span-2 lg:col-span-1">
            <div className="flex items-start justify-between">
                <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    Total Spent
                </p>

                <p className="mt-3 text-3xl font-bold text-blue-400">
                    {totalSpent.toLocaleString()}
                    <span className="ml-1 text-base font-medium text-gray-500">
                    EGP
                    </span>
                </p>

                <p className="mt-1 text-sm text-gray-500">
                    Across all bookings
                </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-400/10 bg-violet-400/10">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="h-5 w-5 text-violet-400"
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
        <section className="mb-8 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
            <p className="text-sm font-semibold text-white">
                Reservation History
            </p>

            <p className="mt-1 text-xs text-gray-500">
                {filteredBookings.length} reservation
                {filteredBookings.length !== 1 ? "s" : ""}
            </p>
            </div>

            <div className="flex flex-wrap gap-2">

            {[
                { value: "all", label: "All" },
                { value: "active", label: "Active" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
            ].map((item) => (
                <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                    filter === item.value
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                    : "border border-white/10 bg-white/[0.03] text-gray-400 hover:border-white/20 hover:text-white"
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
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]"
            >
                <div className="flex flex-col md:flex-row">

                <div className="h-64 animate-pulse bg-slate-800 md:h-auto md:w-72" />

                <div className="flex-1 space-y-5 p-6">

                    <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />

                    <div className="h-8 w-56 animate-pulse rounded bg-slate-800" />

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((box) => (
                        <div
                        key={box}
                        className="h-20 animate-pulse rounded-xl bg-slate-800"
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
        <div className="rounded-3xl border border-red-400/20 bg-red-400/[0.06] p-14 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-400/10 bg-red-400/10">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="h-8 w-8 text-red-400"
            >
                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m0 3h.008v.008H12v-.008ZM10.29 3.86 2.82 17a1.5 1.5 0 0 0 1.3 2.25h15.76a1.5 1.5 0 0 0 1.3-2.25l-7.47-13.14a1.5 1.5 0 0 0-2.61 0Z"
                />
            </svg>
            </div>

            <h2 className="mt-5 text-xl font-bold text-white">
            Something went wrong
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-red-300">
            {error}
            </p>

        </div>
        )}

        {/* Empty */}
        {!loading && !error && bookings.length === 0 && (
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025] px-6 py-20 text-center">

            <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative z-10">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.2"
                stroke="currentColor"
                className="h-10 w-10 text-blue-400"
                >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3.75v2.5m10.5-2.5v2.5M3.75 9.75h16.5M5.25 5.25h13.5A1.5 1.5 0 0 1 20.25 6.75v12A1.5 1.5 0 0 1 18.75 20.25H5.25a1.5 1.5 0 0 1-1.5-1.5v-12a1.5 1.5 0 0 1 1.5-1.5Z"
                />
                </svg>
            </div>

            <h2 className="mt-6 text-2xl font-bold text-white">
                Your journey starts here
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
                You haven't made any reservations yet. Explore our fleet
                and find a car for your next journey.
            </p>

            <Link
                href="/cars"
                className="mt-8 inline-flex items-center gap-3 rounded-xl bg-blue-500 px-7 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600"
            >
                Explore Our Fleet
                <span>→</span>
            </Link>

            </div>
        </div>
        )}

        {/* Filter Empty */}
        {!loading &&
        !error &&
        bookings.length > 0 &&
        filteredBookings.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-16 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="h-8 w-8 text-blue-400"
                >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 17.25V6.75Z"
                />
                </svg>
            </div>

            <h2 className="mt-5 text-xl font-bold text-white">
                No reservations found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
                There are no bookings in this category.
            </p>

            </div>
        )}

        {/* Bookings */}
        {!loading &&
        !error &&
        filteredBookings.length > 0 && (
            <div className="space-y-6">

            {filteredBookings.map((booking) => {
                const carName =
                booking.car?.name ||
                (
                    (booking.car?.brand || "") +
                    " " +
                    (booking.car?.model || "")
                ).trim() ||
                "Rental Car";

                const imageUrl = getImageUrl(booking.car?.image);

                return (
                <article
                    key={booking.id}
                    className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/10 transition-all duration-500 hover:-translate-y-1 hover:border-blue-400/20 hover:bg-white/[0.05]"
                >

                    {/* Top Section */}
                    <div className="flex flex-col lg:flex-row">

                    {/* Car Image */}
                    <div className="relative h-64 overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 lg:h-auto lg:w-72 lg:shrink-0">

                        {imageUrl ? (
                        <>
                            <img
                            src={imageUrl}
                            alt={carName}
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                        </>
                        ) : (
                        <>
                            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />

                            <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-xl">
                                <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.2"
                                stroke="currentColor"
                                className="h-12 w-12 text-blue-400"
                                >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 13l2-5a2 2 0 012-1.3h10A2 2 0 0119 8l2 5M3 13v5a1 1 0 001 1h1a1 1 0 001-1v-1h10v1a1 1 0 001 1h1a1 1 0 001-1v-5M3 13h18M6 13h.01M18 13h.01"
                                />
                                </svg>
                            </div>
                            </div>
                        </>
                        )}

                        <div className="absolute left-5 top-5">
                        <span
                            className={
                            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-xl " +
                            getStatusStyle(booking.status)
                            }
                        >
                            <span
                            className={
                                "h-1.5 w-1.5 rounded-full " +
                                getStatusDot(booking.status)
                            }
                            />

                            {formatStatus(booking.status)}
                        </span>
                        </div>

                    </div>

                    {/* Main Info */}
                    <div className="flex-1 p-6 lg:p-7">

                        <div className="flex flex-col justify-between gap-6 sm:flex-row">

                        <div>

                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                            Reservation #{booking.id}
                            </p>

                            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
                            {carName}
                            </h2>

                            {booking.car?.year && (
                            <p className="mt-1 text-sm text-gray-500">
                                {booking.car.year} Model
                            </p>
                            )}

                        </div>

                        <div className="sm:text-right">

                            <p className="text-xs uppercase tracking-[0.15em] text-gray-500">
                            Total
                            </p>

                            <p className="mt-1 text-3xl font-bold text-blue-400">
                            {Number(
                                booking.total_amount
                            ).toLocaleString()}
                            <span className="ml-1 text-sm font-medium text-gray-500">
                                EGP
                            </span>
                            </p>

                        </div>

                        </div>

                        {/* Rental Timeline */}
                        <div className="mt-7 rounded-2xl border border-white/10 bg-black/10 p-5">

                        <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">

                            <div>

                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-blue-400 shadow-lg shadow-blue-400/40" />

                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                                Pick-up
                                </p>
                            </div>

                            <p className="mt-2 text-lg font-bold text-white">
                                {formatDate(booking.pickup_date)}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                                {booking.pickup_branch?.name ||
                                "Pickup Branch"}
                            </p>

                            {booking.pickup_branch?.city && (
                                <p className="mt-0.5 text-xs text-gray-600">
                                {booking.pickup_branch.city}
                                </p>
                            )}

                            </div>

                            <div className="hidden h-px w-20 bg-gradient-to-r from-blue-400/40 via-white/10 to-violet-400/40 md:block" />

                            <div className="md:text-right">

                            <div className="flex items-center gap-2 md:justify-end">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                                Return
                                </p>

                                <span className="h-2 w-2 rounded-full bg-violet-400 shadow-lg shadow-violet-400/40" />
                            </div>

                            <p className="mt-2 text-lg font-bold text-white">
                                {formatDate(booking.return_date)}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                                {booking.dropoff_branch?.name ||
                                "Drop-off Branch"}
                            </p>

                            {booking.dropoff_branch?.city && (
                                <p className="mt-0.5 text-xs text-gray-600">
                                {booking.dropoff_branch.city}
                                </p>
                            )}

                            </div>

                        </div>

                        </div>

                        {/* Details */}
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                        <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                            <p className="text-[10px] uppercase tracking-wider text-gray-600">
                            Duration
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-200">
                            {booking.total_days}{" "}
                            {booking.total_days === 1
                                ? "Day"
                                : "Days"}
                            </p>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                            <p className="text-[10px] uppercase tracking-wider text-gray-600">
                            Daily Rate
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-200">
                            {Number(
                                booking.daily_rate
                            ).toLocaleString()}{" "}
                            EGP
                            </p>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                            <p className="text-[10px] uppercase tracking-wider text-gray-600">
                            Subtotal
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-200">
                            {Number(
                                booking.subtotal
                            ).toLocaleString()}{" "}
                            EGP
                            </p>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                            <p className="text-[10px] uppercase tracking-wider text-gray-600">
                            Discount
                            </p>

                            <p className="mt-1 text-sm font-semibold text-emerald-400">
                            {Number(
                                booking.discount || 0
                            ).toLocaleString()}{" "}
                            EGP
                            </p>
                        </div>

                        </div>

                        {/* Footer */}
                        <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">

                        <p className="text-xs text-gray-600">
                            Booking ID #{booking.id}
                        </p>

                        <div className="flex flex-col gap-3 sm:flex-row">

                            {booking.status === "completed" && (
                            <Link
                                href={
                                "/reviews/create?booking_id=" +
                                booking.id
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-yellow-400/10 bg-yellow-400/10 px-5 py-2.5 text-sm font-semibold text-yellow-400 transition hover:border-yellow-400/20 hover:bg-yellow-400/15"
                            >
                                <span>Leave a Review</span>
                                <span>→</span>
                            </Link>
                            )}

                            <Link
                            href={"/cars/" + booking.car_id}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-blue-400/20 hover:bg-blue-400/10 hover:text-blue-400"
                            >
                            View Car
                            <span className="transition-transform group-hover:translate-x-1">
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
