    
    "use client";

    import { useCallback, useEffect, useState } from "react";
    import Link from "next/link";
    import { useRouter } from "next/navigation";

    type Stats = {
    cars: number;
    bookings: number;
    payments: number;
    branches: number;
    reviews: number;
    };

    type Car = {
    id: number;
    brand: string;
    model: string;
    status: string;
    daily_rate: number;
    };

    type Booking = {
    id: number;
    status: string;
    total_amount: number;
    pickup_date: string;
    return_date: string;
    created_at?: string;
    user?: { name: string };
    car?: { brand: string; model: string };
    };

    type Payment = {
    id: number;
    amount: number;
    payment_status: string;
    payment_method: string;
    paid_at?: string | null;
    };

    type Review = {
    id: number;
    rating: number;
    comment?: string | null;
    created_at: string;
    user?: { name: string };
    car?: {
        brand?: string;
        model?: string;
        name?: string;
    };
    };

    type User = {
    id: number;
    name: string;
    email: string;
    role: string;
    };

    const API_URL = (
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"
    ).replace(/\/+$/, "");

    const money = (value: number) =>
    Number(value || 0).toLocaleString("en-US", {
        maximumFractionDigits: 2,
    });

    const date = (value?: string) => {
    if (!value) return "—";

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) return "—";

    return parsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
    };

    const statusStyle = (status: string) => {
    const styles: Record<string, string> = {
        pending: "bg-amber-50 text-amber-800 ring-amber-200",
        confirmed: "bg-[#e9efe9] text-[#31543d] ring-[#cddace]",
        active: "bg-[#eee9dc] text-[#765b2d] ring-[#e0d3b7]",
        completed: "bg-[#e4eee5] text-[#28613b] ring-[#c7ddcb]",
        cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
        available: "bg-[#e4eee5] text-[#28613b] ring-[#c7ddcb]",
        reserved: "bg-[#eee9dc] text-[#765b2d] ring-[#e0d3b7]",
        rented: "bg-[#e9efe9] text-[#31543d] ring-[#cddace]",
        maintenance: "bg-orange-50 text-orange-800 ring-orange-200",
        inactive: "bg-gray-100 text-gray-600 ring-gray-200",
        paid: "bg-[#e4eee5] text-[#28613b] ring-[#c7ddcb]",
        failed: "bg-rose-50 text-rose-700 ring-rose-200",
    };

    return (
        styles[status.toLowerCase()] ??
        "bg-gray-100 text-gray-600 ring-gray-200"
    );
    };

    function Icon({
    name,
    className = "h-5 w-5",
    }: {
    name: string;
    className?: string;
    }) {
    const common = {
        className,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.7,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
        "aria-hidden": true as const,
    };

    const paths: Record<string, React.ReactNode> = {
        car: (
        <>
            <path d="m5 11 1.5-5h11l1.5 5" />
            <path d="M3.5 13 5 11h14l1.5 2v5h-17z" />
            <path d="M6 18v2m12-2v2M6 14h.01M18 14h.01" />
        </>
        ),
        calendar: (
        <>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 10h18" />
        </>
        ),
        wallet: (
        <>
            <rect x="3" y="5" width="18" height="15" rx="2" />
            <path d="M3 9h18M16 14h2" />
            <path d="M3 5V4a1 1 0 0 1 1-1h14" />
        </>
        ),
        branch: (
        <path d="M3 21h18M5 21V5l7-3 7 3v16M9 9h.01M15 9h.01M9 13h.01M15 13h.01M10 21v-4h4v4" />
        ),
        star: (
        <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3Z" />
        ),
        users: (
        <>
            <circle cx="9" cy="8" r="3" />
            <path d="M3 20c0-3.3 2.3-5 6-5s6 1.7 6 5M16 5.5a3 3 0 0 1 0 5.8M18 15c2 .7 3 2.2 3 5" />
        </>
        ),
        chart: (
        <>
            <path d="M3 3v18h18" />
            <path d="m7 14 4-4 3 3 6-7" />
        </>
        ),
        search: (
        <>
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 4.5 4.5" />
        </>
        ),
        arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
        clock: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </>
        ),
        check: <path d="m5 12 4 4L19 6" />,
        wrench: (
        <path d="M14.5 6.5a5 5 0 0 0-6.9 6.9L3 18l3 3 4.6-4.6a5 5 0 0 0 6.9-6.9L14 13l-3-3z" />
        ),
    };

    return <svg {...common}>{paths[name] ?? paths.car}</svg>;
    }

    function SectionTitle({
    eyebrow,
    title,
    action,
    }: {
    eyebrow: string;
    title: string;
    action?: React.ReactNode;
    }) {
    return (
        <div className="mb-5 flex items-end justify-between gap-4">
        <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9a783c]">
            {eyebrow}
            </p>
            <h2 className="mt-1.5 text-lg font-bold tracking-tight text-[#17251e] sm:text-xl">
            {title}
            </h2>
        </div>
        {action}
        </div>
    );
    }

    const actionLinkClass =
    "text-xs font-bold text-[#9a783c] transition hover:text-[#765b2d]";

    export default function AdminDashboardPage() {
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<Stats>({
        cars: 0,
        bookings: 0,
        payments: 0,
        branches: 0,
        reviews: 0,
    });

    const [cars, setCars] = useState<Car[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const fetchDashboard = useCallback(async () => {
        const token = localStorage.getItem("token");

        if (!token) {
        router.replace("/login");
        return;
        }

        setLoading(true);
        setError("");

        const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        };

        try {
        const meResponse = await fetch(`${API_URL}/me`, {
            headers,
            cache: "no-store",
        });

        if (meResponse.status === 401 || meResponse.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.dispatchEvent(new Event("auth-changed"));
            router.replace("/login");
            return;
        }

        if (!meResponse.ok) {
            throw new Error("Unable to verify your account.");
        }

        const meData = await meResponse.json();
        const currentUser = meData?.data?.user as User | undefined;

        if (!currentUser || currentUser.role !== "admin") {
            router.replace("/");
            return;
        }

        setUser(currentUser);
        localStorage.setItem("user", JSON.stringify(currentUser));

        const [
            carsResponse,
            bookingsResponse,
            paymentsResponse,
            branchesResponse,
            reviewsResponse,
        ] = await Promise.all([
            fetch(`${API_URL}/cars`, { headers, cache: "no-store" }),
            fetch(`${API_URL}/bookings`, { headers, cache: "no-store" }),
            fetch(`${API_URL}/payments`, { headers, cache: "no-store" }),
            fetch(`${API_URL}/branches`, { headers, cache: "no-store" }),
            fetch(`${API_URL}/reviews`, { headers, cache: "no-store" }),
        ]);

        const responses = [
            carsResponse,
            bookingsResponse,
            paymentsResponse,
            branchesResponse,
            reviewsResponse,
        ];

        if (responses.some((response) => !response.ok)) {
            throw new Error("Failed to load dashboard data.");
        }

        const [
            carsData,
            bookingsData,
            paymentsData,
            branchesData,
            reviewsData,
        ] = await Promise.all(responses.map((response) => response.json()));

        const carsList: Car[] = Array.isArray(carsData.data)
            ? carsData.data
            : [];
        const bookingsList: Booking[] = Array.isArray(bookingsData.data)
            ? bookingsData.data
            : [];
        const paymentsList: Payment[] = Array.isArray(paymentsData.data)
            ? paymentsData.data
            : [];
        const branchesList = Array.isArray(branchesData.data)
            ? branchesData.data
            : [];
        const reviewsList: Review[] = Array.isArray(reviewsData.data)
            ? reviewsData.data
            : [];

        setCars(carsList);
        setBookings(bookingsList);
        setPayments(paymentsList);
        setReviews(reviewsList);

        setStats({
            cars: carsList.length,
            bookings: bookingsList.length,
            payments: paymentsList.length,
            branches: branchesList.length,
            reviews: reviewsList.length,
        });
        } catch (err) {
        console.error(err);
        setError(
            err instanceof Error ? err.message : "Unable to load dashboard."
        );
        } finally {
        setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        void fetchDashboard();
    }, [fetchDashboard]);

    const pendingBookings = bookings.filter(
        (item) => item.status === "pending"
    ).length;
    const confirmedBookings = bookings.filter(
        (item) => item.status === "confirmed"
    ).length;
    const activeBookings = bookings.filter(
        (item) => item.status === "active"
    ).length;
    const completedBookings = bookings.filter(
        (item) => item.status === "completed"
    ).length;
    const cancelledBookings = bookings.filter(
        (item) => item.status === "cancelled"
    ).length;

    const availableCars = cars.filter(
        (item) => item.status === "available"
    ).length;
    const reservedCars = cars.filter(
        (item) => item.status === "reserved"
    ).length;
    const rentedCars = cars.filter(
        (item) => item.status === "rented"
    ).length;
    const maintenanceCars = cars.filter(
        (item) => item.status === "maintenance"
    ).length;

    const paidPayments = payments.filter(
        (item) => item.payment_status === "paid"
    );
    const pendingPayments = payments.filter(
        (item) => item.payment_status === "pending"
    ).length;
    const totalRevenue = paidPayments.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
    );
    const totalBookingValue = bookings.reduce(
        (sum, item) => sum + Number(item.total_amount || 0),
        0
    );

    const averageRating = reviews.length
        ? reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) /
        reviews.length
        : 0;

    const recentBookings = [...bookings]
        .sort(
        (a, b) =>
            new Date(b.created_at || b.pickup_date).getTime() -
            new Date(a.created_at || a.pickup_date).getTime()
        )
        .slice(0, 6);

    const recentReviews = [...reviews]
        .sort(
        (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )
        .slice(0, 3);

    const filteredBookings = recentBookings.filter((booking) => {
        const query = search.toLowerCase();
        const customer = booking.user?.name?.toLowerCase() ?? "";
        const car =
        `${booking.car?.brand ?? ""} ${booking.car?.model ?? ""}`.toLowerCase();

        return (
        String(booking.id).includes(query) ||
        customer.includes(query) ||
        car.includes(query)
        );
    });

    const maxBookingStatus = Math.max(
        pendingBookings,
        confirmedBookings,
        activeBookings,
        completedBookings,
        cancelledBookings,
        1
    );

    const maxFleetStatus = Math.max(
        availableCars,
        reservedCars,
        rentedCars,
        maintenanceCars,
        1
    );

    const fleetItems = [
        {
        label: "Available",
        count: availableCars,
        color: "bg-[#315b3c]",
        },
        {
        label: "Reserved",
        count: reservedCars,
        color: "bg-[#c6a15b]",
        },
        {
        label: "Rented",
        count: rentedCars,
        color: "bg-[#6e806f]",
        },
        {
        label: "Maintenance",
        count: maintenanceCars,
        color: "bg-[#c17b42]",
        },
    ];

    const bookingStatuses = [
        {
        label: "Pending",
        count: pendingBookings,
        color: "bg-[#c6a15b]",
        },
        {
        label: "Confirmed",
        count: confirmedBookings,
        color: "bg-[#718675]",
        },
        {
        label: "Active",
        count: activeBookings,
        color: "bg-[#9a783c]",
        },
        {
        label: "Completed",
        count: completedBookings,
        color: "bg-[#315b3c]",
        },
        {
        label: "Cancelled",
        count: cancelledBookings,
        color: "bg-[#bd7770]",
        },
    ];

    if (loading) {
        return (
        <main className="min-h-screen bg-[#f8f8f7] px-4 pb-16 pt-8 text-[#17251e] sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1600px] animate-pulse space-y-6">
            <div className="h-10 w-72 rounded-xl bg-[#e5e8df]" />
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                <div
                    key={item}
                    className="h-36 rounded-2xl border border-[#e6e6de] bg-white"
                />
                ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="h-80 rounded-2xl bg-white" />
                <div className="h-80 rounded-2xl bg-white" />
            </div>
            </div>
        </main>
        );
    }

    if (error) {
        return (
        <main className="min-h-screen bg-[#f8f8f7] px-4 pb-16 pt-8 text-[#17251e] sm:px-6 lg:px-8">
            <div className="mx-auto max-w-xl rounded-3xl border border-[#e5e2d8] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5eee0] text-[#9a783c]">
                <Icon name="wrench" className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-2xl font-bold">Dashboard unavailable</h1>
            <p className="mt-2 text-sm text-[#788078]">{error}</p>
            <button
                onClick={() => void fetchDashboard()}
                className="mt-6 rounded-xl bg-[#0a1411] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1a3027]"
            >
                Try again
            </button>
            </div>
        </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f8f8f7] pb-16 pt-8 text-[#17251e]">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
            <header className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
                <p className="text-sm font-medium text-[#788078]">
                Workspace / <span className="text-[#9a783c]">Overview</span>
                </p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Dashboard<span className="text-[#c6a15b]">.</span>
                </h1>
                <p className="mt-2 text-sm text-[#788078]">
                Here&apos;s what&apos;s happening with your rental business.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <Link
                href="/"
                className="rounded-xl border border-[#e2e3db] bg-white px-4 py-3 text-sm font-semibold text-[#536157] shadow-sm transition hover:border-[#c6a15b] hover:text-[#765b2d]"
                >
                View website ↗
                </Link>
                <button
                onClick={() => void fetchDashboard()}
                className="flex items-center gap-2 rounded-xl bg-[#0a1411] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1a3027]"
                >
                <Icon name="clock" className="h-4 w-4 text-[#c6a15b]" />
                Refresh data
                </button>
            </div>
            </header>

            <section className="relative mb-6 overflow-hidden rounded-3xl bg-[#0a1411] p-6 text-white shadow-xl shadow-[#0a1411]/10 sm:p-8">
            <div className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full border-[40px] border-[#c6a15b]/10" />
            <div className="pointer-events-none absolute -bottom-24 right-40 h-48 w-48 rounded-full bg-[#c6a15b]/10 blur-2xl" />
            <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#c6a15b]/30 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#e4d1a7]">
                    <span className="h-2 w-2 rounded-full bg-[#c6a15b]" />
                    System operational
                </div>
                <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl">
                    Welcome back
                    {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#c0c9c1]">
                    Monitor your fleet, keep bookings moving, and stay on top of
                    your business performance.
                </p>
                </div>
                <Link
                href="/admin/bookings"
                className="inline-flex shrink-0 items-center justify-center gap-3 rounded-xl bg-[#c6a15b] px-5 py-3 text-sm font-bold text-[#17251e] shadow-lg transition hover:bg-[#d7b873]"
                >
                Review bookings <Icon name="arrow" className="h-4 w-4" />
                </Link>
            </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
                {
                label: "Total vehicles",
                value: stats.cars,
                detail: `${availableCars} available now`,
                icon: "car",
                color: "bg-[#e8eee7] text-[#315b3c]",
                accent: "border-l-[#315b3c]",
                },
                {
                label: "Total bookings",
                value: stats.bookings,
                detail: `${pendingBookings} awaiting review`,
                icon: "calendar",
                color: "bg-[#eee8da] text-[#8b6a31]",
                accent: "border-l-[#c6a15b]",
                },
                {
                label: "Collected revenue",
                value: `${money(totalRevenue)} EGP`,
                detail: `${paidPayments.length} paid transactions`,
                icon: "wallet",
                color: "bg-[#e4eee5] text-[#315b3c]",
                accent: "border-l-[#718675]",
                },
                {
                label: "Customer rating",
                value: reviews.length ? `${averageRating.toFixed(1)} / 5` : "—",
                detail: `${stats.reviews} customer reviews`,
                icon: "star",
                color: "bg-[#f5eee0] text-[#9a783c]",
                accent: "border-l-[#c6a15b]",
                },
            ].map((item) => (
                <div
                key={item.label}
                className={`rounded-2xl border border-[#e6e6de] border-l-4 ${item.accent} bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md`}
                >
                <div className="flex items-start justify-between gap-3">
                    <div>
                    <p className="text-sm font-medium text-[#788078]">
                        {item.label}
                    </p>
                    <p className="mt-3 break-words text-2xl font-extrabold tracking-tight text-[#17251e]">
                        {item.value}
                    </p>
                    </div>
                    <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.color}`}
                    >
                    <Icon name={item.icon} className="h-5 w-5" />
                    </div>
                </div>
                <p className="mt-3 text-xs font-medium text-[#929990]">
                    {item.detail}
                </p>
                </div>
            ))}
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
            <div className="rounded-2xl border border-[#e6e6de] bg-white p-5 shadow-sm sm:p-6">
                <SectionTitle
                eyebrow="Performance"
                title="Booking overview"
                action={
                    <Link href="/admin/bookings" className={actionLinkClass}>
                    View all ↗
                    </Link>
                }
                />

                <div className="mb-6 grid grid-cols-3 gap-3">
                {[
                    { label: "Active", value: activeBookings },
                    { label: "Confirmed", value: confirmedBookings },
                    { label: "Pending", value: pendingBookings },
                ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-[#f7f7f2] p-3">
                    <p className="text-xs text-[#788078]">{item.label}</p>
                    <p className="mt-1 text-xl font-extrabold text-[#17251e]">
                        {item.value}
                    </p>
                    </div>
                ))}
                </div>

                <div className="space-y-5">
                {bookingStatuses.map((item) => (
                    <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-[#536157]">
                        {item.label}
                        </span>
                        <span className="font-bold text-[#17251e]">
                        {item.count}
                        </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#efefe9]">
                        <div
                        className={`h-full rounded-full ${item.color} transition-all duration-700`}
                        style={{
                            width: `${(item.count / maxBookingStatus) * 100}%`,
                        }}
                        />
                    </div>
                    </div>
                ))}
                </div>

                <div className="mt-7 flex flex-col justify-between gap-2 rounded-xl border border-[#e6deca] bg-[#faf7ef] p-4 sm:flex-row sm:items-center">
                <div>
                    <p className="text-xs font-medium text-[#536157]">
                    Total booking value
                    </p>
                    <p className="mt-1 text-xs text-[#929990]">
                    Value of all returned reservations
                    </p>
                </div>
                <p className="text-xl font-extrabold text-[#765b2d]">
                    {money(totalBookingValue)} EGP
                </p>
                </div>
            </div>

            <div className="rounded-2xl border border-[#e6e6de] bg-white p-5 shadow-sm sm:p-6">
                <SectionTitle
                eyebrow="Fleet status"
                title="Vehicle availability"
                />

                <div className="flex items-end justify-around gap-4 border-b border-[#eeeee8] pb-5 pt-3">
                {fleetItems.map((item) => (
                    <div
                    key={item.label}
                    className="flex min-w-0 flex-1 flex-col items-center"
                    >
                    <span className="mb-2 text-sm font-extrabold text-[#17251e]">
                        {item.count}
                    </span>
                    <div className="flex h-36 w-full max-w-12 items-end overflow-hidden rounded-t-lg bg-[#efefe9]">
                        <div
                        className={`w-full rounded-t-lg ${item.color} transition-all duration-700`}
                        style={{
                            height: `${Math.max(
                            (item.count / maxFleetStatus) * 100,
                            item.count ? 8 : 0
                            )}%`,
                        }}
                        />
                    </div>
                    <span className="mt-3 text-center text-[10px] font-medium text-[#788078] sm:text-xs">
                        {item.label}
                    </span>
                    </div>
                ))}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#dce7dc] bg-[#f0f5ef] p-4">
                    <p className="text-xs font-medium text-[#536157]">
                    Available rate
                    </p>
                    <p className="mt-2 text-2xl font-extrabold text-[#315b3c]">
                    {stats.cars
                        ? Math.round((availableCars / stats.cars) * 100)
                        : 0}
                    %
                    </p>
                </div>
                <div className="rounded-xl border border-[#e6deca] bg-[#faf7ef] p-4">
                    <p className="text-xs font-medium text-[#536157]">
                    In use / reserved
                    </p>
                    <p className="mt-2 text-2xl font-extrabold text-[#765b2d]">
                    {stats.cars
                        ? Math.round(
                            ((rentedCars + reservedCars) / stats.cars) * 100
                        )
                        : 0}
                    %
                    </p>
                </div>
                </div>

                <Link
                href="/admin/cars"
                className="mt-5 flex items-center justify-between rounded-xl border border-[#e2e3db] px-4 py-3 text-sm font-bold text-[#536157] transition hover:border-[#c6a15b] hover:bg-[#faf7ef] hover:text-[#765b2d]"
                >
                Manage fleet <Icon name="arrow" className="h-4 w-4" />
                </Link>
            </div>
            </section>

            <section className="mt-6 rounded-2xl border border-[#e6e6de] bg-white p-5 shadow-sm sm:p-6">
            <SectionTitle
                eyebrow="Latest activity"
                title="Recent bookings"
                action={
                <Link href="/admin/bookings" className={actionLinkClass}>
                    All bookings ↗
                </Link>
                }
            />

            <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#e2e3db] bg-[#fafaf7] px-3 py-2.5 sm:max-w-sm">
                <Icon name="search" className="h-4 w-4 shrink-0 text-[#9a783c]" />
                <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search booking, customer or car..."
                className="w-full bg-transparent text-sm text-[#17251e] outline-none placeholder:text-[#929990]"
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                <thead>
                    <tr className="border-b border-[#eeeee8] text-[10px] font-bold uppercase tracking-[0.14em] text-[#929990]">
                    <th className="px-3 py-4">Booking</th>
                    <th className="px-3 py-4">Customer</th>
                    <th className="px-3 py-4">Vehicle</th>
                    <th className="px-3 py-4">Pickup date</th>
                    <th className="px-3 py-4">Status</th>
                    <th className="px-3 py-4 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0ea]">
                    {filteredBookings.map((booking) => (
                    <tr
                        key={booking.id}
                        className="transition hover:bg-[#fafaf7]"
                    >
                        <td className="px-3 py-4">
                        <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="font-bold text-[#765b2d] hover:text-[#17251e]"
                        >
                            #{booking.id}
                        </Link>
                        <p className="mt-1 text-[11px] text-[#929990]">
                            {date(booking.created_at)}
                        </p>
                        </td>
                        <td className="px-3 py-4">
                        <p className="text-sm font-semibold text-[#17251e]">
                            {booking.user?.name || "Unknown customer"}
                        </p>
                        </td>
                        <td className="px-3 py-4">
                        <p className="text-sm font-medium text-[#536157]">
                            {booking.car
                            ? `${booking.car.brand} ${booking.car.model}`
                            : "Unknown vehicle"}
                        </p>
                        </td>
                        <td className="px-3 py-4 text-sm text-[#788078]">
                        {date(booking.pickup_date)}
                        </td>
                        <td className="px-3 py-4">
                        <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ring-1 ring-inset ${statusStyle(
                            booking.status
                            )}`}
                        >
                            {booking.status}
                        </span>
                        </td>
                        <td className="px-3 py-4 text-right text-sm font-bold text-[#17251e]">
                        {money(booking.total_amount)}{" "}
                        <span className="text-[10px] text-[#929990]">EGP</span>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>

                {filteredBookings.length === 0 && (
                <div className="py-12 text-center">
                    <p className="text-sm font-semibold text-[#536157]">
                    No matching bookings
                    </p>
                    <p className="mt-1 text-xs text-[#929990]">
                    Try another search term.
                    </p>
                </div>
                )}
            </div>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#e6e6de] bg-white p-5 shadow-sm sm:p-6">
                <SectionTitle
                eyebrow="Financial overview"
                title="Payment summary"
                />

                <div className="rounded-2xl bg-[#0a1411] p-5 text-white">
                <p className="text-sm text-[#b2bdb5]">Collected revenue</p>
                <p className="mt-2 break-words text-3xl font-extrabold">
                    {money(totalRevenue)}{" "}
                    <span className="text-sm font-medium text-[#b2bdb5]">
                    EGP
                    </span>
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-[#d9bc7d]">
                    <Icon name="check" className="h-4 w-4" />
                    {paidPayments.length} successful payment records
                </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#e6deca] bg-[#faf7ef] p-4">
                    <p className="text-xs text-[#765b2d]">Pending payments</p>
                    <p className="mt-2 text-2xl font-extrabold text-[#17251e]">
                    {pendingPayments}
                    </p>
                </div>
                <div className="rounded-xl border border-[#e2e3db] bg-[#f7f7f2] p-4">
                    <p className="text-xs text-[#536157]">
                    All payment records
                    </p>
                    <p className="mt-2 text-2xl font-extrabold text-[#17251e]">
                    {stats.payments}
                    </p>
                </div>
                </div>

                <Link
                href="/admin/payments"
                className="mt-4 flex items-center justify-between rounded-xl border border-[#e2e3db] px-4 py-3 text-sm font-bold text-[#536157] transition hover:border-[#c6a15b] hover:bg-[#faf7ef] hover:text-[#765b2d]"
                >
                Open payments <Icon name="arrow" className="h-4 w-4" />
                </Link>
            </div>

            <div className="rounded-2xl border border-[#e6e6de] bg-white p-5 shadow-sm sm:p-6">
                <SectionTitle
                eyebrow="Customer feedback"
                title="Latest reviews"
                action={
                    <Link href="/admin/reviews" className={actionLinkClass}>
                    View all ↗
                    </Link>
                }
                />

                <div className="mb-5 flex items-center gap-4 rounded-2xl bg-[#faf7ef] p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#c6a15b] shadow-sm">
                    <Icon name="star" className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-2xl font-extrabold text-[#17251e]">
                    {reviews.length ? averageRating.toFixed(1) : "—"}
                    <span className="ml-1 text-sm font-medium text-[#929990]">
                        / 5
                    </span>
                    </p>
                    <p className="text-xs text-[#788078]">
                    Average rating from {reviews.length} reviews
                    </p>
                </div>
                </div>

                {recentReviews.length ? (
                <div className="space-y-3">
                    {recentReviews.map((review) => (
                    <div
                        key={review.id}
                        className="rounded-xl border border-[#eeeee8] p-4"
                    >
                        <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eee8da] text-sm font-bold text-[#765b2d]">
                            {(review.user?.name || "U")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[#17251e]">
                                {review.user?.name || "Customer"}
                            </p>
                            <p className="mt-0.5 text-[11px] text-[#929990]">
                                {date(review.created_at)}
                            </p>
                            </div>
                        </div>
                        <span className="shrink-0 rounded-lg bg-[#faf7ef] px-2 py-1 text-xs font-bold text-[#9a783c]">
                            ★ {review.rating}/5
                        </span>
                        </div>
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#788078]">
                        {review.comment || "No comment provided."}
                        </p>
                    </div>
                    ))}
                </div>
                ) : (
                <div className="rounded-xl border border-dashed border-[#e2e3db] py-8 text-center text-sm text-[#929990]">
                    No customer reviews yet.
                </div>
                )}
            </div>
            </section>

            <section className="mt-6">
            <SectionTitle eyebrow="Shortcuts" title="Quick actions" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                {
                    href: "/admin/cars",
                    label: "Add or manage cars",
                    icon: "car",
                    color: "text-[#315b3c] bg-[#e8eee7]",
                },
                {
                    href: "/admin/bookings",
                    label: "Review bookings",
                    icon: "calendar",
                    color: "text-[#765b2d] bg-[#eee8da]",
                },
                {
                    href: "/admin/branches",
                    label: "Manage branches",
                    icon: "branch",
                    color: "text-[#315b3c] bg-[#e4eee5]",
                },
                {
                    href: "/admin/users",
                    label: "Manage users",
                    icon: "users",
                    color: "text-[#9a783c] bg-[#f5eee0]",
                },
                ].map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center gap-3 rounded-2xl border border-[#e6e6de] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#c6a15b]/60 hover:shadow-md"
                >
                    <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}
                    >
                    <Icon name={item.icon} />
                    </div>
                    <span className="flex-1 text-sm font-bold text-[#536157]">
                    {item.label}
                    </span>
                    <Icon
                    name="arrow"
                    className="h-4 w-4 text-[#b5b9af] transition group-hover:translate-x-1 group-hover:text-[#9a783c]"
                    />
                </Link>
                ))}
            </div>
            </section>

            <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-[#e2e3db] pt-5 text-xs text-[#929990] sm:flex-row">
            <p>DriveX Administration</p>
            <p>Business overview · Live data from your API</p>
            </footer>
        </div>
        </main>
    );
    }
    