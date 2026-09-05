    "use client";

    import { useEffect, useState } from "react";
    import Link from "next/link";
    import { useRouter } from "next/navigation";

    type Review = {
    id: number;
    user_id: number;
    car_id: number;
    booking_id: number;
    rating: number;
    comment?: string | null;
    created_at: string;

    user?: {
    id: number;
    name: string;
    email?: string;
    };

    car?: {
    id: number;
    brand?: string;
    model?: string;
    name?: string;
    };

    booking?: {
    id: number;
    status?: string;
    };
    };

    export default function AdminReviewsPage() {
    const router = useRouter();

    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
    const fetchReviews = async () => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");


    if (!token || !storedUser) {
        router.push("/login");
        return;
    }

    try {
        const user = JSON.parse(storedUser);

        if (user.role !== "admin") {
        router.push("/");
        return;
        }
    } catch {
        localStorage.removeItem("user");
        router.push("/login");
        return;
    }

    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        const response = await fetch(apiUrl + "/reviews", {
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + token,
        },
        });

        const data = await response.json();

        if (!response.ok) {
        throw new Error(
            data.message || "Failed to load reviews."
        );
        }

        setReviews(data.data || []);
    } catch (err) {
        console.error(err);

        setError(
        err instanceof Error
            ? err.message
            : "Failed to load reviews."
        );
    } finally {
        setLoading(false);
    }
    };

    fetchReviews();


    }, [router]);

    const handleDelete = async (reviewId: number) => {
    const confirmed = window.confirm(
    "Are you sure you want to delete this review?"
    );


    if (!confirmed) {
    return;
    }

    const token = localStorage.getItem("token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) {
    router.push("/login");
    return;
    }

    setDeletingId(reviewId);
    setError("");

    try {
    const response = await fetch(
        apiUrl + "/reviews/" + reviewId,
        {
        method: "DELETE",
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + token,
        },
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
        data.message || "Failed to delete review."
        );
    }

    setReviews((currentReviews) =>
        currentReviews.filter(
        (review) => review.id !== reviewId
        )
    );
    } catch (err) {
    console.error(err);

    setError(
        err instanceof Error
        ? err.message
        : "Failed to delete review."
    );
    } finally {
    setDeletingId(null);
    }


    };

    const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    });
    };

    const getCarName = (review: Review) => {
    return (
    review.car?.name ||
    (
    (review.car?.brand || "") +
    " " +
    (review.car?.model || "")
    ).trim() ||
    "Unknown Car"
    );
    };

    const averageRating =
    reviews.length > 0
    ? reviews.reduce(
    (sum, review) =>
    sum + Number(review.rating),
    0
    ) / reviews.length
    : 0;

    const fiveStarReviews = reviews.filter(
    (review) => Number(review.rating) === 5
    ).length;

    const fourStarAndAbove = reviews.filter(
    (review) => Number(review.rating) >= 4
    ).length;

    return ( <main className="min-h-screen bg-[#050816] px-6 pb-20 pt-32 text-white"> <div className="mx-auto max-w-7xl">


        <div className="mb-10">
        <Link
            href="/admin"
            className="text-sm text-gray-500 transition hover:text-white"
        >
            ← Back to Dashboard
        </Link>

        <div className="mt-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
                Management
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
                Reviews
            </h1>

            <p className="mt-3 max-w-xl text-gray-400">
                Monitor customer feedback and manage vehicle
                reviews across the platform.
            </p>
            </div>

            <Link
            href="/admin"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-gray-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            >
            Admin Dashboard
            <span>→</span>
            </Link>
        </div>
        </div>

        {!loading && !error && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-gray-500">
                Total Reviews
            </p>

            <p className="mt-2 text-3xl font-bold">
                {reviews.length}
            </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-gray-500">
                Average Rating
            </p>

            <div className="mt-2 flex items-center gap-3">
                <p className="text-3xl font-bold text-yellow-400">
                {reviews.length > 0
                    ? averageRating.toFixed(1)
                    : "—"}
                </p>

                {reviews.length > 0 && (
                <span className="text-lg text-yellow-400">
                    ★
                </span>
                )}
            </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-gray-500">
                5-Star Reviews
            </p>

            <p className="mt-2 text-3xl font-bold text-green-400">
                {fiveStarReviews}
            </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-gray-500">
                4+ Star Reviews
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-400">
                {fourStarAndAbove}
            </p>
            </div>

        </div>
        )}

        {error && (
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
        </div>
        )}

        {loading && (
        <div className="flex min-h-[350px] items-center justify-center">
            <div className="text-center">
            <div className="mx-auto mb-5 h-11 w-11 animate-spin rounded-full border-4 border-white/10 border-t-blue-500"></div>

            <p className="text-gray-400">
                Loading reviews...
            </p>
            </div>
        </div>
        )}

        {!loading && !error && reviews.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-20 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/10 text-4xl">
            ⭐
            </div>

            <h2 className="mt-6 text-2xl font-bold">
            No Reviews Yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-gray-500">
            Customer reviews will appear here once customers
            complete their rentals and submit feedback.
            </p>
        </div>
        )}

        {!loading && !error && reviews.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">

            <div className="border-b border-white/10 px-6 py-5">
            <h2 className="text-xl font-semibold">
                Customer Reviews
            </h2>

            <p className="mt-1 text-sm text-gray-500">
                {reviews.length}{" "}
                {reviews.length === 1
                ? "review"
                : "reviews"}{" "}
                submitted by customers.
            </p>
            </div>

            <div className="divide-y divide-white/10">

            {reviews.map((review) => (
                <div
                key={review.id}
                className="p-6 transition hover:bg-white/[0.02]"
                >

                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">

                    <div className="min-w-0 flex-1">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500/10 font-bold text-blue-400">
                        {review.user?.name
                            ? review.user.name
                                .charAt(0)
                                .toUpperCase()
                            : "U"}
                        </div>

                        <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-semibold text-white">
                            {review.user?.name ||
                                "Unknown Customer"}
                            </h3>

                            <span className="text-xs text-gray-600">
                            Review #{review.id}
                            </span>
                        </div>

                        {review.user?.email && (
                            <p className="mt-1 text-sm text-gray-500">
                            {review.user.email}
                            </p>
                        )}

                        <div className="mt-3 flex items-center gap-3">
                            <div className="flex gap-0.5 text-lg">
                            {[1, 2, 3, 4, 5].map(
                                (star) => (
                                <span
                                    key={star}
                                    className={
                                    star <=
                                    Number(
                                        review.rating
                                    )
                                        ? "text-yellow-400"
                                        : "text-gray-700"
                                    }
                                >
                                    ★
                                </span>
                                )
                            )}
                            </div>

                            <span className="text-sm font-semibold text-gray-300">
                            {review.rating}/5
                            </span>
                        </div>

                        </div>
                    </div>

                    {review.comment && (
                        <div className="mt-5 rounded-2xl border border-white/10 bg-black/10 p-5">
                        <p className="leading-7 text-gray-300">
                            "{review.comment}"
                        </p>
                        </div>
                    )}

                    </div>

                    <div className="w-full shrink-0 xl:w-64">

                    <div className="rounded-2xl border border-white/10 bg-black/10 p-5">

                        <p className="text-xs uppercase tracking-wider text-gray-600">
                        Vehicle
                        </p>

                        <p className="mt-2 font-semibold text-white">
                        {getCarName(review)}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                        Car #{review.car_id}
                        </p>

                        <div className="mt-4 border-t border-white/10 pt-4">

                        <p className="text-xs uppercase tracking-wider text-gray-600">
                            Booking
                        </p>

                        <p className="mt-2 text-sm font-medium text-gray-300">
                            #{review.booking_id}
                        </p>

                        {review.booking?.status && (
                            <p className="mt-1 text-xs capitalize text-green-400">
                            {review.booking.status}
                            </p>
                        )}

                        </div>

                        <p className="mt-4 text-xs text-gray-600">
                        {formatDate(review.created_at)}
                        </p>

                    </div>

                    <div className="mt-3 flex gap-3">

                        <Link
                        href={"/cars/" + review.car_id}
                        className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-center text-sm font-semibold text-gray-300 transition hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400"
                        >
                        View Car
                        </Link>

                        <button
                        onClick={() =>
                            handleDelete(review.id)
                        }
                        disabled={
                            deletingId === review.id
                        }
                        className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                        {deletingId === review.id
                            ? "..."
                            : "Delete"}
                        </button>

                    </div>

                    </div>

                </div>

                </div>
            ))}

            </div>
        </div>
        )}

    </div>
    </main>


    );
    }
