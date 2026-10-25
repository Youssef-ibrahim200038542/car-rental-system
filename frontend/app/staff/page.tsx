
    "use client";

    import { useEffect, useState } from "react";
    import Link from "next/link";
    import { useRouter } from "next/navigation";

    type Booking = {
    id: number;
    pickup_date: string;
    return_date: string;
    total_amount: number;
    status: string;
    user?: {
        name: string;
        email?: string;
    };
    car?: {
        brand: string;
        model: string;
    };
    };

    type AuthUser = {
    id: number;
    name: string;
    email: string;
    role: "admin" | "customer" | "staff";
    };

    export default function StaffDashboardPage() {
    const router = useRouter();

    const [user, setUser] = useState<AuthUser | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadDashboard = async () => {
        const token = localStorage.getItem("token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!token || !apiUrl) {
            router.replace("/login");
            return;
        }

        try {
            const meResponse = await fetch(`${apiUrl}/me`, {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
            });

            if (!meResponse.ok) {
            if (meResponse.status === 401 || meResponse.status === 403) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                router.replace("/login");
                return;
            }

            throw new Error("Could not verify your account.");
            }

            const meResult = await meResponse.json();
            const currentUser = meResult?.data?.user as AuthUser | undefined;

            if (
            !currentUser ||
            !["staff", "admin"].includes(currentUser.role)
            ) {
            router.replace("/");
            return;
            }

            if (cancelled) return;

            setUser(currentUser);
            localStorage.setItem("user", JSON.stringify(currentUser));

            const bookingsResponse = await fetch(`${apiUrl}/bookings`, {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
            });

            if (!bookingsResponse.ok) {
            throw new Error(
                bookingsResponse.status === 403
                ? "Your account does not have permission to view bookings."
                : "Could not load bookings."
            );
            }

            const bookingsResult = await bookingsResponse.json();

            if (!cancelled) {
            setBookings(
                Array.isArray(bookingsResult.data)
                ? bookingsResult.data
                : []
            );
            }
        } catch (err) {
            if (!cancelled) {
            setError(
                err instanceof Error
                ? err.message
                : "Something went wrong while loading the dashboard."
            );
            }
        } finally {
            if (!cancelled) {
            setLoading(false);
            }
        }
        };

        void loadDashboard();

        return () => {
        cancelled = true;
        };
    }, [router]);

    const pending = bookings.filter(
        (booking) => booking.status === "pending"
    ).length;

    const confirmed = bookings.filter(
        (booking) => booking.status === "confirmed"
    ).length;

    const active = bookings.filter(
        (booking) => booking.status === "active"
    ).length;

    const completed = bookings.filter(
        (booking) => booking.status === "completed"
    ).length;

    const formatDate = (date: string) => {
        if (!date) return "—";

        const parsed = new Date(date);

        return Number.isNaN(parsed.getTime())
        ? "—"
        : parsed.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            });
    };

    const statusStyle = (status: string) => {
        switch (status) {
        case "pending":
            return "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";
        case "confirmed":
            return "border-blue-400/20 bg-blue-400/10 text-blue-300";
        case "active":
            return "border-green-400/20 bg-green-400/10 text-green-300";
        case "completed":
            return "border-purple-400/20 bg-purple-400/10 text-purple-300";
        case "cancelled":
            return "border-red-400/20 bg-red-400/10 text-red-300";
        default:
            return "border-white/10 bg-white/5 text-gray-300";
        }
    };

    if (loading) {
        return (
        <main className="min-h-screen bg-[#070b16] px-6 pb-16 pt-32 text-white">
            <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-400/20 border-t-blue-400" />
            <p className="text-gray-400">Loading staff dashboard...</p>
            </div>
        </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#070b16] px-5 pb-16 pt-32 text-white sm:px-8">
        <div className="mx-auto max-w-7xl">
            <section className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#111c35] via-[#10172a] to-[#0b1020] p-7 sm:p-10">
            <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs font-semibold text-blue-300">
                    <span className="h-2 w-2 rounded-full bg-blue-400" />
                    STAFF WORKSPACE
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    Welcome back{user?.name ? `, ${user.name}` : ""}
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400 sm:text-base">
                    Track customer bookings and monitor their current status from
                    one place.
                </p>
                </div>

                <Link
                href="/admin/bookings"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400"
                >
                Manage Bookings
                <span aria-hidden="true">→</span>
                </Link>
            </div>
            </section>

            {error && (
            <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-300">
                <p className="font-semibold">Unable to load dashboard data</p>
                <p className="mt-1">{error}</p>
            </div>
            )}

            <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
                {
                title: "Total Bookings",
                value: bookings.length,
                description: "All retrieved bookings",
                color: "text-white",
                icon: "▤",
                },
                {
                title: "Pending",
                value: pending,
                description: "Awaiting confirmation",
                color: "text-amber-300",
                icon: "◷",
                },
                {
                title: "Confirmed",
                value: confirmed,
                description: "Approved reservations",
                color: "text-blue-300",
                icon: "✓",
                },
                {
                title: "Active Rentals",
                value: active,
                description: `${completed} completed`,
                color: "text-emerald-300",
                icon: "↗",
                },
            ].map((stat) => (
                <div
                key={stat.title}
                className="rounded-2xl border border-white/[0.08] bg-[#101626] p-6 transition hover:border-white/15"
                >
                <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-gray-400">
                    {stat.title}
                    </p>
                    <span className={`text-xl ${stat.color}`} aria-hidden="true">
                    {stat.icon}
                    </span>
                </div>

                <p className={`mt-5 text-3xl font-bold ${stat.color}`}>
                    {stat.value}
                </p>

                <p className="mt-2 text-xs text-gray-500">
                    {stat.description}
                </p>
                </div>
            ))}
            </section>

            <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#101626]">
            <div className="flex flex-col justify-between gap-4 border-b border-white/[0.08] px-6 py-6 sm:flex-row sm:items-center sm:px-8">
                <div>
                <h2 className="text-xl font-bold">Recent Bookings</h2>
                <p className="mt-1 text-sm text-gray-400">
                    The latest bookings returned by the API.
                </p>
                </div>

                <Link
                href="/admin/bookings"
                className="text-sm font-semibold text-blue-300 transition hover:text-blue-200"
                >
                View all bookings →
                </Link>
            </div>

            {bookings.length === 0 ? (
                <div className="px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-2xl text-gray-400">
                    ▤
                </div>
                <p className="font-medium text-gray-300">No bookings found</p>
                <p className="mt-2 text-sm text-gray-500">
                    New customer bookings will appear here.
                </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                    <thead className="bg-white/[0.02]">
                    <tr>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Booking
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Customer
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Vehicle
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Pickup
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Amount
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Status
                        </th>
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-white/[0.06]">
                    {[...bookings]
                        .sort((a, b) => b.id - a.id)
                        .slice(0, 6)
                        .map((booking) => (
                        <tr
                            key={booking.id}
                            className="transition hover:bg-white/[0.025]"
                        >
                            <td className="px-6 py-5">
                            <span className="font-semibold text-white">
                                #{booking.id}
                            </span>
                            </td>

                            <td className="px-6 py-5">
                            <p className="font-medium text-gray-200">
                                {booking.user?.name || "Unknown Customer"}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                {booking.user?.email || ""}
                            </p>
                            </td>

                            <td className="px-6 py-5">
                            <p className="font-medium text-gray-200">
                                {booking.car
                                ? `${booking.car.brand} ${booking.car.model}`
                                : "Unknown Vehicle"}
                            </p>
                            </td>

                            <td className="px-6 py-5 text-sm text-gray-400">
                            {formatDate(booking.pickup_date)}
                            </td>

                            <td className="px-6 py-5 text-sm font-semibold text-gray-200">
                            {Number(booking.total_amount || 0).toLocaleString(
                                "en-US"
                            )}{" "}
                            EGP
                            </td>

                            <td className="px-6 py-5">
                            <span
                                className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${statusStyle(
                                booking.status
                                )}`}
                            >
                                {booking.status}
                            </span>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            )}
            </section>

            <p className="mt-6 text-center text-xs text-gray-600">
            DriveX Staff Workspace
            </p>
        </div>
        </main>
    );
    }
