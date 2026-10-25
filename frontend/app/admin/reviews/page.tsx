
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

    const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

    const cardClass =
    "rounded-2xl border border-[#e8e2d5] bg-white p-5 shadow-sm";

    const secondaryButtonClass =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-[#e5dfd2] bg-white px-4 py-2.5 text-sm font-semibold text-[#34463b] transition hover:border-[#c6a15b] hover:bg-[#faf7f0]";

    export default function AdminReviewsPage() {
    const router = useRouter();

    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [ratingFilter, setRatingFilter] = useState("all");

    useEffect(() => {
        let active = true;

        const fetchReviews = async () => {
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
            router.replace("/login");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/reviews`, {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            });

            const data = await response.json();

            if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                router.replace("/login");
                return;
            }

            throw new Error(data.message || "Failed to load reviews.");
            }

            if (active) {
            setReviews(Array.isArray(data.data) ? data.data : []);
            }
        } catch (err) {
            if (active) {
            setError(
                err instanceof Error ? err.message : "Failed to load reviews."
            );
            }
        } finally {
            if (active) {
            setLoading(false);
            }
        }
        };

        fetchReviews();

        return () => {
        active = false;
        };
    }, [router]);

    const handleDelete = async (reviewId: number) => {
        const confirmed = window.confirm(
        "Are you sure you want to delete this review? This action cannot be undone."
        );

        if (!confirmed) return;

        const token = localStorage.getItem("token");

        if (!token) {
        router.push("/login");
        return;
        }

        setDeletingId(reviewId);
        setError("");

        try {
        const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
            method: "DELETE",
            headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            },
        });

        const data = response.status === 204 ? {} : await response.json();

        if (!response.ok) {
            if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.replace("/login");
            return;
            }

            throw new Error(data.message || "Failed to delete review.");
        }

        setReviews((current) =>
            current.filter((review) => review.id !== reviewId)
        );
        } catch (err) {
        setError(
            err instanceof Error ? err.message : "Failed to delete review."
        );
        } finally {
        setDeletingId(null);
        }
    };

    const formatDate = (date: string) => {
        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) return "—";

        return parsedDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        });
    };

    const getCarName = (review: Review) =>
        review.car?.name ||
        `${review.car?.brand || ""} ${review.car?.model || ""}`.trim() ||
        "Unknown Car";

    const filteredReviews = reviews.filter((review) => {
        const query = search.trim().toLowerCase();
        const customer = review.user?.name || "";
        const email = review.user?.email || "";
        const carName = getCarName(review);

        const matchesSearch =
        !query ||
        customer.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        carName.toLowerCase().includes(query) ||
        String(review.id).includes(query) ||
        String(review.booking_id).includes(query);

        const matchesRating =
        ratingFilter === "all" ||
        Number(review.rating) === Number(ratingFilter);

        return matchesSearch && matchesRating;
    });

    const averageRating =
        reviews.length > 0
        ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
            reviews.length
        : 0;

    const fiveStarReviews = reviews.filter(
        (review) => Number(review.rating) === 5
    ).length;

    const fourStarAndAbove = reviews.filter(
        (review) => Number(review.rating) >= 4
    ).length;

    const getBookingStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
        case "completed":
            return "bg-[#e6f2e8] text-[#28633b]";
        case "confirmed":
            return "bg-[#f7efd9] text-[#846326]";
        case "cancelled":
            return "bg-[#fbe9e6] text-[#a23b30]";
        default:
            return "bg-[#efeee9] text-[#62665e]";
        }
    };

    if (loading) {
        return (
        <main className="min-h-screen bg-[#f8f8f7] px-5 pb-16 pt-28 text-[#17251e] md:px-8">
            <div className="mx-auto max-w-7xl">
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-[#e8e2d5] bg-white">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e9e1d2] border-t-[#c6a15b]" />
                <p className="mt-5 text-sm font-medium text-[#697168]">
                Loading customer reviews...
                </p>
            </div>
            </div>
        </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f8f8f7] px-5 pb-16 pt-28 text-[#17251e] md:px-8">
        <div className="mx-auto max-w-7xl">
            <div className="mb-8">
            <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#6d756c] transition hover:text-[#9a783c]"
            >
                <span aria-hidden="true">←</span>
                Back to Dashboard
            </Link>

            <div className="mt-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#e5d7b8] bg-[#f5efdf] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#896b35]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#c6a15b]" />
                    Customer Experience
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-[#14251c] md:text-4xl">
                    Customer Reviews
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#73796f] md:text-base">
                    Review customer feedback, monitor vehicle ratings, and manage
                    reviews across your fleet.
                </p>
                </div>

                <Link href="/admin" className={secondaryButtonClass}>
                Admin Dashboard
                <span aria-hidden="true">↗</span>
                </Link>
            </div>
            </div>

            {error && (
            <div
                role="alert"
                className="mb-6 flex flex-col justify-between gap-3 rounded-2xl border border-[#e9c8c1] bg-[#fff2ef] px-5 py-4 text-sm text-[#a23b30] sm:flex-row sm:items-center"
            >
                <p>{error}</p>
                <button
                type="button"
                onClick={() => setError("")}
                className="self-start font-semibold underline underline-offset-4 sm:self-auto"
                >
                Dismiss
                </button>
            </div>
            )}

            <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className={cardClass}>
                <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-[#73796f]">
                    Total Reviews
                    </p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-[#17251e]">
                    {reviews.length}
                    </p>
                    <p className="mt-2 text-xs text-[#858a81]">
                    Customer submissions
                    </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf1e9] text-xl">
                    <span aria-hidden="true">▤</span>
                </div>
                </div>
            </div>

            <div className={cardClass}>
                <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-[#73796f]">
                    Average Rating
                    </p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-[#17251e]">
                    {reviews.length ? averageRating.toFixed(1) : "—"}
                    <span className="ml-1 text-base font-medium text-[#858a81]">
                        / 5
                    </span>
                    </p>
                    <p className="mt-2 text-xs text-[#858a81]">
                    Across all reviews
                    </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f7efd9] text-xl text-[#b28a3e]">
                    ★
                </div>
                </div>
            </div>

            <div className={cardClass}>
                <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-[#73796f]">
                    5-Star Reviews
                    </p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-[#28633b]">
                    {fiveStarReviews}
                    </p>
                    <p className="mt-2 text-xs text-[#858a81]">
                    Excellent experiences
                    </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e6f2e8] text-xl text-[#28633b]">
                    ★
                </div>
                </div>
            </div>

            <div className={cardClass}>
                <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-[#73796f]">
                    4+ Star Reviews
                    </p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-[#9a783c]">
                    {fourStarAndAbove}
                    </p>
                    <p className="mt-2 text-xs text-[#858a81]">
                    Positive feedback
                    </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5efdf] text-xl text-[#9a783c]">
                    ✓
                </div>
                </div>
            </div>
            </div>

            <section className="overflow-hidden rounded-3xl border border-[#e8e2d5] bg-white shadow-sm">
            <div className="border-b border-[#eee9df] p-5 md:p-6">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                    <h2 className="text-lg font-bold text-[#17251e]">
                    Review Management
                    </h2>
                    <p className="mt-1 text-sm text-[#7b8178]">
                    Showing {filteredReviews.length} of {reviews.length} reviews
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative min-w-0 sm:w-72">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9086]">
                        ⌕
                    </span>
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search customer, car, ID..."
                        aria-label="Search reviews"
                        className="w-full rounded-xl border border-[#e5dfd2] bg-[#fcfbf8] py-3 pl-10 pr-4 text-sm text-[#17251e] outline-none transition placeholder:text-[#9a9e95] focus:border-[#c6a15b] focus:ring-2 focus:ring-[#c6a15b]/15"
                    />
                    </div>

                    <select
                    value={ratingFilter}
                    onChange={(event) => setRatingFilter(event.target.value)}
                    aria-label="Filter by rating"
                    className="rounded-xl border border-[#e5dfd2] bg-[#fcfbf8] px-4 py-3 text-sm text-[#34463b] outline-none transition focus:border-[#c6a15b] focus:ring-2 focus:ring-[#c6a15b]/15"
                    >
                    <option value="all">All ratings</option>
                    <option value="5">5 stars</option>
                    <option value="4">4 stars</option>
                    <option value="3">3 stars</option>
                    <option value="2">2 stars</option>
                    <option value="1">1 star</option>
                    </select>
                </div>
                </div>
            </div>

            {reviews.length === 0 ? (
                <div className="px-6 py-20 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f5efdf] text-3xl text-[#b28a3e]">
                    ★
                </div>
                <h3 className="mt-5 text-xl font-bold text-[#17251e]">
                    No Reviews Yet
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7b8178]">
                    Customer reviews will appear here once customers submit
                    feedback about their rental experience.
                </p>
                </div>
            ) : filteredReviews.length === 0 ? (
                <div className="px-6 py-16 text-center">
                <h3 className="text-lg font-bold text-[#17251e]">
                    No matching reviews
                </h3>
                <p className="mt-2 text-sm text-[#7b8178]">
                    Try another search term or rating.
                </p>
                <button
                    type="button"
                    onClick={() => {
                    setSearch("");
                    setRatingFilter("all");
                    }}
                    className="mt-4 text-sm font-semibold text-[#9a783c] underline underline-offset-4"
                >
                    Clear filters
                </button>
                </div>
            ) : (
                <div className="divide-y divide-[#eee9df]">
                {filteredReviews.map((review) => (
                    <article
                    key={review.id}
                    className="p-5 transition hover:bg-[#fcfbf8] md:p-6"
                    >
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#e5d7b8] bg-[#f5efdf] text-lg font-bold text-[#896b35]">
                            {review.user?.name?.charAt(0).toUpperCase() || "U"}
                            </div>

                            <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-[#17251e]">
                                {review.user?.name || "Unknown Customer"}
                                </h3>
                                <span className="rounded-md bg-[#f1f0eb] px-2 py-1 text-[11px] font-medium text-[#777d73]">
                                Review #{review.id}
                                </span>
                            </div>

                            {review.user?.email && (
                                <p className="mt-1 break-all text-sm text-[#858a81]">
                                {review.user.email}
                                </p>
                            )}

                            <div className="mt-3 flex flex-wrap items-center gap-3">
                                <div
                                className="flex gap-0.5 text-lg"
                                aria-label={`${review.rating} out of 5 stars`}
                                >
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                    key={star}
                                    className={
                                        star <= Number(review.rating)
                                        ? "text-[#c6a15b]"
                                        : "text-[#ddd9cf]"
                                    }
                                    >
                                    ★
                                    </span>
                                ))}
                                </div>
                                <span className="text-sm font-bold text-[#34463b]">
                                {review.rating}/5
                                </span>
                            </div>
                            </div>
                        </div>

                        {review.comment?.trim() ? (
                            <blockquote className="mt-5 rounded-2xl border border-[#eee9df] bg-[#fcfbf8] p-4 text-sm leading-7 text-[#555f55] md:p-5">
                            “{review.comment}”
                            </blockquote>
                        ) : (
                            <p className="mt-5 text-sm italic text-[#9a9e95]">
                            No written comment provided.
                            </p>
                        )}
                        </div>

                        <aside className="w-full shrink-0 xl:w-72">
                        <div className="rounded-2xl border border-[#e8e2d5] bg-[#fcfbf8] p-5">
                            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#96998f]">
                            Vehicle
                            </p>
                            <p className="mt-2 font-bold text-[#17251e]">
                            {getCarName(review)}
                            </p>
                            <p className="mt-1 text-xs text-[#858a81]">
                            Car ID #{review.car_id}
                            </p>

                            <div className="my-4 border-t border-[#e8e2d5]" />

                            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#96998f]">
                            Booking
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[#34463b]">
                            Booking #{review.booking_id}
                            </p>

                            {review.booking?.status && (
                            <span
                                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getBookingStatusStyle(review.booking.status)}`}
                            >
                                {review.booking.status}
                            </span>
                            )}

                            <div className="mt-4 flex items-center gap-2 text-xs text-[#858a81]">
                            <span aria-hidden="true">◷</span>
                            {formatDate(review.created_at)}
                            </div>
                        </div>

                        <div className="mt-3 flex gap-2">
                            <Link
                            href={`/cars/${review.car_id}`}
                            className={`${secondaryButtonClass} flex-1`}
                            >
                            View Car
                            </Link>

                            <button
                            type="button"
                            onClick={() => handleDelete(review.id)}
                            disabled={deletingId === review.id}
                            className="inline-flex items-center justify-center rounded-xl border border-[#e8c9c2] bg-[#fff5f2] px-4 py-2.5 text-sm font-semibold text-[#a23b30] transition hover:bg-[#fbe9e6] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                            {deletingId === review.id ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                        </aside>
                    </div>
                    </article>
                ))}
                </div>
            )}
            </section>

            <p className="mt-5 text-center text-xs text-[#96998f]">
            DriveX Admin · Customer Feedback
            </p>
        </div>
        </main>
    );
    }
