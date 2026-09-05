    "use client";

    import { useEffect, useState } from "react";
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
    user?: {
    name: string;
    };
    car?: {
    brand: string;
    model: string;
    };
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
    user?: {
    name: string;
    };
    car?: {
    brand?: string;
    model?: string;
    name?: string;
    };
    };

    const Icon = ({
    children,
    className = "h-5 w-5",
    }: {
    children: React.ReactNode;
    className?: string;
    }) => (
    <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}

    >


    {children}


    </svg>
    );

    export default function AdminDashboardPage() {
    const router = useRouter();

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

    useEffect(() => {
    const token = localStorage.getItem("token");
    const userString = localStorage.getItem("user");


    if (!token || !userString) {
    router.push("/login");
    return;
    }

    try {
    const user = JSON.parse(userString);

    if (user.role !== "admin") {
        router.push("/");
        return;
    }
    } catch {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
    return;
    }

    const fetchDashboard = async () => {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        const headers = {
        Accept: "application/json",
        Authorization: "Bearer " + token,
        };

        const [
        carsResponse,
        bookingsResponse,
        paymentsResponse,
        branchesResponse,
        reviewsResponse,
        ] = await Promise.all([
        fetch(apiUrl + "/cars", { headers }),
        fetch(apiUrl + "/bookings", { headers }),
        fetch(apiUrl + "/payments", { headers }),
        fetch(apiUrl + "/branches", { headers }),
        fetch(apiUrl + "/reviews", { headers }),
        ]);

        const carsData = await carsResponse.json();
        const bookingsData = await bookingsResponse.json();
        const paymentsData = await paymentsResponse.json();
        const branchesData = await branchesResponse.json();
        const reviewsData = await reviewsResponse.json();

        if (
        !carsResponse.ok ||
        !bookingsResponse.ok ||
        !paymentsResponse.ok ||
        !branchesResponse.ok ||
        !reviewsResponse.ok
        ) {
        throw new Error("Failed to load dashboard data.");
        }

        const carsList = carsData.data || [];
        const bookingsList = bookingsData.data || [];
        const paymentsList = paymentsData.data || [];
        const branchesList = branchesData.data || [];
        const reviewsList = reviewsData.data || [];

        setStats({
        cars: carsList.length,
        bookings: bookingsList.length,
        payments: paymentsList.length,
        branches: branchesList.length,
        reviews: reviewsList.length,
        });

        setCars(carsList);
        setBookings(bookingsList);
        setPayments(paymentsList);
        setReviews(reviewsList);
    } catch (err) {
        console.error(err);

        if (err instanceof Error) {
        setError(err.message);
        } else {
        setError("Unable to load dashboard.");
        }
    } finally {
        setLoading(false);
    }
    };

    fetchDashboard();


    }, [router]);

    const pendingBookings = bookings.filter(
    (booking) => booking.status === "pending"
    ).length;

    const confirmedBookings = bookings.filter(
    (booking) => booking.status === "confirmed"
    ).length;

    const activeBookings = bookings.filter(
    (booking) => booking.status === "active"
    ).length;

    const completedBookings = bookings.filter(
    (booking) => booking.status === "completed"
    ).length;

    const cancelledBookings = bookings.filter(
    (booking) => booking.status === "cancelled"
    ).length;

    const availableCars = cars.filter(
    (car) => car.status === "available"
    ).length;

    const reservedCars = cars.filter(
    (car) => car.status === "reserved"
    ).length;

    const rentedCars = cars.filter(
    (car) => car.status === "rented"
    ).length;

    const maintenanceCars = cars.filter(
    (car) => car.status === "maintenance"
    ).length;

    const inactiveCars = cars.filter(
    (car) => car.status === "inactive"
    ).length;

    const totalBookingValue = bookings.reduce(
    (sum, booking) =>
    sum + Number(booking.total_amount || 0),
    0
    );

    const paidPayments = payments.filter(
    (payment) => payment.payment_status === "paid"
    );

    const totalRevenue = paidPayments.reduce(
    (sum, payment) =>
    sum + Number(payment.amount || 0),
    0
    );

    const pendingPayments = payments.filter(
    (payment) => payment.payment_status === "pending"
    ).length;

    const averageRating =
    reviews.length > 0
    ? reviews.reduce(
    (sum, review) =>
    sum + Number(review.rating || 0),
    0
    ) / reviews.length
    : 0;

    const fiveStarReviews = reviews.filter(
    (review) => Number(review.rating) === 5
    ).length;

    const revenuePercentage =
    totalBookingValue > 0
    ? Math.min(
    (totalRevenue / totalBookingValue) * 100,
    100
    )
    : 0;

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
    inactiveCars,
    1
    );

    const recentBookings = [...bookings]
    .sort((a, b) => {
    const dateA = new Date(
    a.created_at || a.pickup_date
    ).getTime();


    const dateB = new Date(
        b.created_at || b.pickup_date
    ).getTime();

    return dateB - dateA;
    })
    .slice(0, 5);


    const recentReviews = [...reviews]
    .sort(
    (a, b) =>
    new Date(b.created_at).getTime() -
    new Date(a.created_at).getTime()
    )
    .slice(0, 3);

    const formatDate = (date: string) => {
    if (!date) return "-";


    return new Date(date).toLocaleDateString(
    "en-US",
    {
        month: "short",
        day: "numeric",
        year: "numeric",
    }
    );


    };

    const formatMoney = (amount: number) => {
    return Number(amount || 0).toLocaleString(
    "en-US",
    {
    maximumFractionDigits: 2,
    }
    );
    };

    const getStatusClass = (status: string) => {
    switch (status) {
    case "pending":
    return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";


    case "confirmed":
        return "border-blue-500/20 bg-blue-500/10 text-blue-400";

    case "active":
        return "border-purple-500/20 bg-purple-500/10 text-purple-400";

    case "completed":
        return "border-green-500/20 bg-green-500/10 text-green-400";

    case "cancelled":
        return "border-red-500/20 bg-red-500/10 text-red-400";

    default:
        return "border-white/10 bg-white/5 text-gray-400";
    }


    };

    const getCarName = (review: Review) => {
    return (
    review.car?.name ||
    (
    (review.car?.brand || "") +
    " " +
    (review.car?.model || "")
    ).trim() ||
    "Unknown Vehicle"
    );
    };

    if (loading) {
    return ( <main className="min-h-screen bg-[#060a12] px-6 pt-32 text-white"> <div className="mx-auto max-w-7xl"> <div className="animate-pulse space-y-8"> <div className="h-10 w-72 rounded-xl bg-white/5" /> <div className="h-4 w-96 rounded bg-white/5" />


            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((item) => (
                <div
                key={item}
                className="h-36 rounded-3xl border border-white/5 bg-white/[0.03]"
                />
            ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div className="h-[480px] rounded-3xl bg-white/[0.03]" />
            <div className="h-[480px] rounded-3xl bg-white/[0.03]" />
            </div>
        </div>
        </div>
    </main>
    );


    }

    if (error) {
    return ( <main className="min-h-screen bg-[#060a12] px-6 pt-32 text-white"> <div className="mx-auto max-w-3xl rounded-3xl border border-red-500/20 bg-red-500/[0.06] p-10 text-center"> <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400"> <Icon className="h-8 w-8"> <path d="M12 9v4" /> <path d="M12 17h.01" /> <path d="M10.3 3.5 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0Z" /> </Icon> </div>


        <h1 className="mt-6 text-2xl font-bold">
            Dashboard Error
        </h1>

        <p className="mt-3 text-red-300">
            {error}
        </p>

        <button
            onClick={() => window.location.reload()}
            className="mt-7 rounded-xl bg-blue-500 px-6 py-3 font-semibold transition hover:bg-blue-600"
        >
            Try Again
        </button>
        </div>
    </main>
    );


    }

    return ( <main className="min-h-screen bg-[#060a12] px-6 pb-24 pt-32 text-white"> <div className="mx-auto max-w-7xl">


        {/* Header */}

        <section className="relative mb-10 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-500/[0.10] via-white/[0.03] to-transparent p-7 md:p-10">

        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-purple-500/[0.06] blur-3xl" />

        <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-end">

            <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
                Administration
            </div>

            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                Admin Dashboard
            </h1>

            <p className="mt-3 max-w-2xl text-gray-400">
                Monitor your fleet, bookings, revenue and
                customer activity from one central workspace.
            </p>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-full border border-green-500/20 bg-green-500/[0.06] px-4 py-2.5 text-sm font-medium text-green-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            System Online
            </div>

        </div>
        </section>

        {/* Main Stats */}

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">

        <div className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:bg-blue-500/[0.04]">
            <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
                Total Cars
            </span>

            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-2.5 text-blue-400">
                <Icon>
                <path d="M5 17h14" />
                <path d="M6 17v2" />
                <path d="M18 17v2" />
                <path d="M4 14.5 5.5 8h13L20 14.5" />
                <path d="M7 14h.01" />
                <path d="M17 14h.01" />
                </Icon>
            </div>
            </div>

            <p className="mt-5 text-4xl font-bold">
            {stats.cars}
            </p>

            <p className="mt-2 text-sm text-green-400">
            {availableCars} currently available
            </p>
        </div>

        <div className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition duration-300 hover:-translate-y-1 hover:border-purple-500/30 hover:bg-purple-500/[0.04]">
            <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
                Total Bookings
            </span>

            <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-2.5 text-purple-400">
                <Icon>
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M8 8h8" />
                <path d="M8 12h8" />
                <path d="M8 16h5" />
                </Icon>
            </div>
            </div>

            <p className="mt-5 text-4xl font-bold">
            {stats.bookings}
            </p>

            <p className="mt-2 text-sm text-purple-400">
            {activeBookings} currently active
            </p>
        </div>

        <div className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition duration-300 hover:-translate-y-1 hover:border-green-500/30 hover:bg-green-500/[0.04]">
            <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
                Total Revenue
            </span>

            <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-2.5 text-green-400">
                <Icon>
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8v8" />
                <path d="M9.5 10.5c0-1 1-1.5 2.5-1.5s2.5.5 2.5 1.5-1 1.5-2.5 1.5-2.5.5-2.5 1.5 1 1.5 2.5 1.5 2.5-.5 2.5-1.5" />
                </Icon>
            </div>
            </div>

            <p className="mt-5 text-2xl font-bold md:text-3xl">
            {formatMoney(totalRevenue)}
            <span className="ml-1 text-sm text-gray-500">
                EGP
            </span>
            </p>

            <p className="mt-3 text-sm text-green-400">
            {paidPayments.length} paid transactions
            </p>
        </div>

        <div className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-500/30 hover:bg-cyan-500/[0.04]">
            <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
                Branches
            </span>

            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2.5 text-cyan-400">
                <Icon>
                <path d="M4 21V5l8-2 8 2v16" />
                <path d="M8 9h1" />
                <path d="M15 9h1" />
                <path d="M8 13h1" />
                <path d="M15 13h1" />
                <path d="M10 21v-4h4v4" />
                </Icon>
            </div>
            </div>

            <p className="mt-5 text-4xl font-bold">
            {stats.branches}
            </p>

            <p className="mt-2 text-sm text-gray-500">
            Rental locations
            </p>
        </div>

        <div className="group rounded-3xl border border-yellow-500/10 bg-yellow-500/[0.025] p-6 transition duration-300 hover:-translate-y-1 hover:border-yellow-500/30">
            <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
                Reviews
            </span>

            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-2.5 text-yellow-400">
                <Icon>
                <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3Z" />
                </Icon>
            </div>
            </div>

            <p className="mt-5 text-4xl font-bold">
            {stats.reviews}
            </p>

            <p className="mt-2 text-sm text-yellow-400">
            {averageRating > 0
                ? `${averageRating.toFixed(1)} average rating`
                : "No ratings yet"}
            </p>
        </div>

        </section>

        {/* Booking Analytics + Fleet */}

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">

        {/* Booking Analytics */}

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">

            <div className="flex items-start justify-between">

            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">
                Analytics
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                Booking Overview
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                Current reservation status
                </p>
            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-blue-400">
                <Icon className="h-6 w-6">
                <path d="M4 19V5" />
                <path d="M4 19h16" />
                <path d="m7 15 3-4 3 2 5-7" />
                </Icon>
            </div>

            </div>

            <div className="mt-9 space-y-5">

            {[
                {
                label: "Pending",
                value: pendingBookings,
                color: "bg-yellow-400",
                text: "text-yellow-400",
                },
                {
                label: "Confirmed",
                value: confirmedBookings,
                color: "bg-blue-400",
                text: "text-blue-400",
                },
                {
                label: "Active",
                value: activeBookings,
                color: "bg-purple-400",
                text: "text-purple-400",
                },
                {
                label: "Completed",
                value: completedBookings,
                color: "bg-green-400",
                text: "text-green-400",
                },
                {
                label: "Cancelled",
                value: cancelledBookings,
                color: "bg-red-400",
                text: "text-red-400",
                },
            ].map((item) => (
                <div key={item.label}>

                <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                    {item.label}
                    </span>

                    <span className={`font-semibold ${item.text}`}>
                    {item.value}
                    </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                    className={`h-full rounded-full ${item.color} transition-all duration-1000`}
                    style={{
                        width: `${
                        (item.value / maxBookingStatus) * 100
                        }%`,
                    }}
                    />
                </div>

                </div>
            ))}

            </div>

            <div className="mt-8 flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-5">

            <div>
                <p className="text-sm text-gray-400">
                Total Booking Value
                </p>

                <p className="mt-1 text-xs text-gray-600">
                Value of all reservations
                </p>
            </div>

            <p className="text-xl font-bold text-blue-400">
                {formatMoney(totalBookingValue)} EGP
            </p>

            </div>

        </div>

        {/* Fleet */}

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">

            <div className="flex items-start justify-between">

            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">
                Fleet
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                Fleet Overview
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                Current vehicle availability
                </p>
            </div>

            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-3 text-purple-400">
                <Icon className="h-6 w-6">
                <path d="M5 17h14" />
                <path d="M6 17v2" />
                <path d="M18 17v2" />
                <path d="M4 14.5 5.5 8h13L20 14.5" />
                <path d="M7 14h.01" />
                <path d="M17 14h.01" />
                </Icon>
            </div>

            </div>

            <div className="mt-9 flex h-56 items-end justify-center gap-5">

            {[
                {
                label: "Available",
                value: availableCars,
                color: "bg-green-400",
                text: "text-green-400",
                },
                {
                label: "Reserved",
                value: reservedCars,
                color: "bg-blue-400",
                text: "text-blue-400",
                },
                {
                label: "Rented",
                value: rentedCars,
                color: "bg-purple-400",
                text: "text-purple-400",
                },
                {
                label: "Service",
                value: maintenanceCars,
                color: "bg-orange-400",
                text: "text-orange-400",
                },
            ].map((item) => (
                <div
                key={item.label}
                className="flex h-full w-12 flex-col items-center justify-end gap-2"
                >
                <div className="flex h-40 w-full items-end overflow-hidden rounded-xl bg-white/5">
                    <div
                    className={`w-full rounded-xl ${item.color} transition-all duration-1000`}
                    style={{
                        height: `${
                        (item.value / maxFleetStatus) * 100
                        }%`,
                    }}
                    />
                </div>

                <span className="text-[10px] text-gray-500">
                    {item.label}
                </span>

                <span className={`font-bold ${item.text}`}>
                    {item.value}
                </span>
                </div>
            ))}

            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">

            <div className="rounded-2xl border border-green-500/10 bg-green-500/[0.04] p-4">
                <p className="text-xs text-gray-500">
                Available Rate
                </p>

                <p className="mt-2 text-xl font-bold text-green-400">
                {stats.cars > 0
                    ? Math.round(
                        (availableCars / stats.cars) * 100
                    )
                    : 0}
                %
                </p>
            </div>

            <div className="rounded-2xl border border-purple-500/10 bg-purple-500/[0.04] p-4">
                <p className="text-xs text-gray-500">
                Utilization
                </p>

                <p className="mt-2 text-xl font-bold text-purple-400">
                {stats.cars > 0
                    ? Math.round(
                        ((rentedCars + reservedCars) /
                        stats.cars) *
                        100
                    )
                    : 0}
                %
                </p>
            </div>

            </div>

        </div>

        </section>

        {/* Revenue + Quick Actions */}

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">

        {/* Revenue */}

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">

            <div className="flex items-start justify-between">

            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-green-400">
                Revenue
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                Payment Analytics
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                Revenue collected from successful payments
                </p>
            </div>

            <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-3 text-green-400">
                <Icon className="h-6 w-6">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8v8" />
                <path d="M9.5 10.5c0-1 1-1.5 2.5-1.5s2.5.5 2.5 1.5-1 1.5-2.5 1.5-2.5.5-2.5 1.5 1 1.5 2.5 1.5 2.5-.5 2.5-1.5" />
                </Icon>
            </div>

            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">

            <div className="rounded-2xl border border-green-500/10 bg-green-500/[0.04] p-5">
                <p className="text-sm text-gray-500">
                Collected
                </p>

                <p className="mt-3 text-2xl font-bold text-green-400">
                {formatMoney(totalRevenue)}
                </p>

                <p className="mt-1 text-xs text-gray-600">
                EGP
                </p>
            </div>

            <div className="rounded-2xl border border-yellow-500/10 bg-yellow-500/[0.04] p-5">
                <p className="text-sm text-gray-500">
                Pending
                </p>

                <p className="mt-3 text-2xl font-bold text-yellow-400">
                {pendingPayments}
                </p>

                <p className="mt-1 text-xs text-gray-600">
                payments
                </p>
            </div>

            <div className="rounded-2xl border border-blue-500/10 bg-blue-500/[0.04] p-5">
                <p className="text-sm text-gray-500">
                Collection Rate
                </p>

                <p className="mt-3 text-2xl font-bold text-blue-400">
                {Math.round(revenuePercentage)}%
                </p>

                <p className="mt-1 text-xs text-gray-600">
                of booking value
                </p>
            </div>

            </div>

            <div className="mt-7">

            <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-gray-400">
                Revenue Progress
                </span>

                <span className="text-sm font-semibold text-blue-400">
                {Math.round(revenuePercentage)}%
                </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-white/5">
                <div
                className="h-full rounded-full bg-blue-500 transition-all duration-1000"
                style={{
                    width: `${revenuePercentage}%`,
                }}
                />
            </div>

            </div>

        </div>

        {/* Quick Actions */}

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">

            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">
            Quick Actions
            </p>

            <h2 className="mt-2 text-2xl font-bold">
            Manage System
            </h2>

            <div className="mt-7 space-y-3">

            {[
                {
                href: "/admin/cars",
                label: "Manage Cars",
                icon: (
                    <Icon>
                    <path d="M5 17h14" />
                    <path d="M6 17v2" />
                    <path d="M18 17v2" />
                    <path d="M4 14.5 5.5 8h13L20 14.5" />
                    <path d="M7 14h.01" />
                    <path d="M17 14h.01" />
                    </Icon>
                ),
                },
                {
                href: "/admin/bookings",
                label: "Manage Bookings",
                icon: (
                    <Icon>
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <path d="M8 8h8" />
                    <path d="M8 12h8" />
                    <path d="M8 16h5" />
                    </Icon>
                ),
                },
                {
                href: "/admin/payments",
                label: "View Payments",
                icon: (
                    <Icon>
                    <rect x="3" y="6" width="18" height="12" rx="2" />
                    <path d="M3 10h18" />
                    <path d="M7 14h3" />
                    </Icon>
                ),
                },
                {
                href: "/admin/branches",
                label: "Manage Branches",
                icon: (
                    <Icon>
                    <path d="M4 21V5l8-2 8 2v16" />
                    <path d="M8 9h1" />
                    <path d="M15 9h1" />
                    <path d="M8 13h1" />
                    <path d="M15 13h1" />
                    <path d="M10 21v-4h4v4" />
                    </Icon>
                ),
                },
                {
                href: "/admin/users",
                label: "Manage Users",
                icon: (
                    <Icon>
                    <circle cx="9" cy="8" r="3" />
                    <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5" />
                    <path d="M16 5.5a3 3 0 0 1 0 5.8" />
                    <path d="M18 15c2 .7 3 2.2 3 5" />
                    </Icon>
                ),
                },
                {
                href: "/admin/reviews",
                label: "Manage Reviews",
                icon: (
                    <Icon>
                    <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3Z" />
                    </Icon>
                ),
                },
            ].map((action) => (
                <Link
                key={action.href}
                href={action.href}
                className="group flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4 transition duration-300 hover:border-blue-500/30 hover:bg-blue-500/[0.05]"
                >
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-white/5 p-2.5 text-gray-400 transition group-hover:bg-blue-500/10 group-hover:text-blue-400">
                    {action.icon}
                    </div>

                    <span className="font-medium">
                    {action.label}
                    </span>
                </div>

                <span className="text-gray-600 transition group-hover:translate-x-1 group-hover:text-blue-400">
                    →
                </span>
                </Link>
            ))}

            </div>

        </div>

        </section>

        {/* Reviews */}

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

            <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-yellow-400">
                Customer Feedback
            </p>

            <h2 className="mt-2 text-2xl font-bold">
                Reviews Overview
            </h2>

            <p className="mt-1 text-sm text-gray-500">
                Latest customer feedback about your vehicles
            </p>
            </div>

            <Link
            href="/admin/reviews"
            className="text-sm font-medium text-yellow-400 transition hover:text-yellow-300"
            >
            View All Reviews →
            </Link>

        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3">

            <div className="rounded-2xl border border-yellow-500/10 bg-yellow-500/[0.04] p-5">
            <p className="text-sm text-gray-500">
                Average Rating
            </p>

            <div className="mt-3 flex items-center gap-3">
                <span className="text-3xl font-bold text-yellow-400">
                {reviews.length > 0
                    ? averageRating.toFixed(1)
                    : "—"}
                </span>

                <span className="text-2xl text-yellow-400">
                ★
                </span>
            </div>

            <p className="mt-2 text-xs text-gray-600">
                Based on {reviews.length}{" "}
                {reviews.length === 1
                ? "review"
                : "reviews"}
            </p>
            </div>

            <div className="rounded-2xl border border-green-500/10 bg-green-500/[0.04] p-5">
            <p className="text-sm text-gray-500">
                5-Star Reviews
            </p>

            <p className="mt-3 text-3xl font-bold text-green-400">
                {fiveStarReviews}
            </p>

            <p className="mt-2 text-xs text-gray-600">
                Excellent customer ratings
            </p>
            </div>

            <div className="rounded-2xl border border-blue-500/10 bg-blue-500/[0.04] p-5">
            <p className="text-sm text-gray-500">
                Total Reviews
            </p>

            <p className="mt-3 text-3xl font-bold text-blue-400">
                {reviews.length}
            </p>

            <p className="mt-2 text-xs text-gray-600">
                Customer feedback entries
            </p>
            </div>

        </div>

        {recentReviews.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-400">
                <Icon>
                <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3Z" />
                </Icon>
            </div>

            <p className="mt-4 text-gray-400">
                No customer reviews yet.
            </p>
            </div>
        ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-3">

            {recentReviews.map((review) => (
                <div
                key={review.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-yellow-500/20"
                >

                <div className="flex items-center justify-between gap-3">

                    <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 font-bold text-blue-400">
                        {review.user?.name
                        ? review.user.name
                            .charAt(0)
                            .toUpperCase()
                        : "U"}
                    </div>

                    <div>
                        <p className="text-sm font-semibold">
                        {review.user?.name ||
                            "Customer"}
                        </p>

                        <p className="text-xs text-gray-600">
                        {formatDate(
                            review.created_at
                        )}
                        </p>
                    </div>

                    </div>

                    <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-1 text-xs font-semibold text-yellow-400">
                    {review.rating}/5
                    </span>

                </div>

                <div className="mt-4 flex gap-0.5 text-sm">
                    {[1, 2, 3, 4, 5].map(
                    (star) => (
                        <span
                        key={star}
                        className={
                            star <=
                            Number(review.rating)
                            ? "text-yellow-400"
                            : "text-gray-700"
                        }
                        >
                        ★
                        </span>
                    )
                    )}
                </div>

                <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-400">
                    {review.comment ||
                    "No comment provided."}
                </p>

                <p className="mt-4 border-t border-white/5 pt-4 text-xs text-gray-600">
                    {getCarName(review)}
                </p>

                </div>
            ))}

            </div>
        )}

        </section>

        {/* Recent Bookings */}

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

            <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">
                Activity
            </p>

            <h2 className="mt-2 text-2xl font-bold">
                Recent Bookings
            </h2>

            <p className="mt-1 text-sm text-gray-500">
                Latest reservations in the system
            </p>
            </div>

            <Link
            href="/admin/bookings"
            className="text-sm font-medium text-blue-400 transition hover:text-blue-300"
            >
            View All →
            </Link>

        </div>

        <div className="mt-7 overflow-x-auto">

            {recentBookings.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-10 text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                <Icon>
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <path d="M8 8h8" />
                    <path d="M8 12h8" />
                    <path d="M8 16h5" />
                </Icon>
                </div>

                <p className="mt-4 text-gray-400">
                No bookings yet.
                </p>

            </div>
            ) : (
            <div className="min-w-[760px]">

                <div className="grid grid-cols-[1fr_1.5fr_1.3fr_1fr_1fr] gap-4 border-b border-white/10 px-4 pb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-600">

                <span>Booking</span>
                <span>Customer</span>
                <span>Vehicle</span>
                <span>Status</span>
                <span>Amount</span>

                </div>

                <div className="divide-y divide-white/5">

                {recentBookings.map((booking) => (
                    <Link
                    key={booking.id}
                    href={`/admin/bookings/${booking.id}`}
                    className="group grid grid-cols-[1fr_1.5fr_1.3fr_1fr_1fr] gap-4 px-4 py-5 transition hover:bg-blue-500/[0.025]"
                    >

                    <div>
                        <p className="font-semibold">
                        #{booking.id}
                        </p>

                        <p className="mt-1 text-xs text-gray-600">
                        {formatDate(
                            booking.pickup_date
                        )}
                        </p>
                    </div>

                    <div>
                        <p className="font-medium text-gray-200">
                        {booking.user?.name ||
                            "Unknown Customer"}
                        </p>

                        <p className="mt-1 text-xs text-gray-600">
                        Customer
                        </p>
                    </div>

                    <div>
                        <p className="font-medium text-gray-300">
                        {booking.car
                            ? `${booking.car.brand} ${booking.car.model}`
                            : "Unknown Vehicle"}
                        </p>

                        <p className="mt-1 text-xs text-gray-600">
                        Return{" "}
                        {formatDate(
                            booking.return_date
                        )}
                        </p>
                    </div>

                    <div>
                        <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
                            booking.status
                        )}`}
                        >
                        {booking.status}
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-blue-400">
                        {formatMoney(
                            booking.total_amount
                        )}{" "}
                        EGP
                        </p>

                        <span className="text-gray-700 transition group-hover:translate-x-1 group-hover:text-blue-400">
                        →
                        </span>
                    </div>

                    </Link>
                ))}

                </div>

            </div>
            )}

        </div>

        </section>

    </div>
    </main>
    );
    }
