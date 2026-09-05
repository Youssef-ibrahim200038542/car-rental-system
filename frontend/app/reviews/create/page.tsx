    "use client";

    import { useEffect, useState } from "react";
    import { useRouter, useSearchParams } from "next/navigation";
    import Link from "next/link";

    type Booking = {
    id: number;
    user_id: number;
    car_id: number;
    pickup_date: string;
    return_date: string;
    status: string;
    car?: {
    id: number;
    brand?: string;
    model?: string;
    name?: string;
    year?: number;
    };
    };

    export default function CreateReviewPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const bookingId = searchParams.get("booking_id");

    const [booking, setBooking] = useState<Booking | null>(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
    const fetchBooking = async () => {
    try {
    const token = localStorage.getItem("token");
    const userString = localStorage.getItem("user");


        if (!token || !userString) {
        router.push("/login");
        return;
        }

        if (!bookingId) {
        setError("Booking ID is missing.");
        setLoading(false);
        return;
        }

        const user = JSON.parse(userString);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        const response = await fetch(
        apiUrl + "/bookings/" + bookingId,
        {
            headers: {
            Accept: "application/json",
            Authorization: "Bearer " + token,
            },
        }
        );

        const data = await response.json();

        if (!response.ok) {
        throw new Error(
            data.message || "Failed to load booking."
        );
        }

        const fetchedBooking: Booking = data.data;

        if (
        Number(fetchedBooking.user_id) !==
        Number(user.id)
        ) {
        setError(
            "You can only review your own bookings."
        );
        setLoading(false);
        return;
        }

        if (fetchedBooking.status !== "completed") {
        setError(
            "You can only review a completed booking."
        );
        setLoading(false);
        return;
        }

        setBooking(fetchedBooking);
    } catch (err) {
        console.error(err);

        setError(
        err instanceof Error
            ? err.message
            : "Unable to load booking."
        );
    } finally {
        setLoading(false);
    }
    };

    fetchBooking();


    }, [bookingId, router]);

    const handleSubmit = async () => {
    if (!booking) {
    return;
    }


    if (rating === 0) {
    setError("Please select a rating.");
    return;
    }

    try {
    setSubmitting(true);
    setError("");

    const token = localStorage.getItem("token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!token) {
        router.push("/login");
        return;
    }

    const response = await fetch(
        apiUrl + "/reviews",
        {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
            booking_id: booking.id,
            rating: rating,
            comment: comment.trim() || null,
        }),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
        data.message || "Failed to submit review."
        );
    }

    router.push("/bookings");
    } catch (err) {
    console.error(err);

    setError(
        err instanceof Error
        ? err.message
        : "Unable to submit review."
    );
    } finally {
    setSubmitting(false);
    }


    };

    const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    });
    };

    const carName =
    booking?.car?.name ||
    (
    (booking?.car?.brand || "") +
    " " +
    (booking?.car?.model || "")
    ).trim() ||
    "Rental Car";

    return ( <main className="min-h-screen bg-[#070b14] px-6 pb-20 pt-32 text-white"> <div className="mx-auto max-w-3xl">


        <div className="mb-10">
        <Link
            href="/bookings"
            className="text-sm text-gray-500 transition hover:text-white"
        >
            ← Back to My Bookings
        </Link>

        <p className="mt-8 mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
            Your Experience
        </p>

        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Leave a Review
        </h1>

        <p className="mt-3 max-w-xl text-gray-400">
            Tell us about your rental experience and help
            other customers choose the right car.
        </p>
        </div>

        {loading && (
        <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
            <div className="mx-auto mb-5 h-11 w-11 animate-spin rounded-full border-4 border-white/10 border-t-blue-500"></div>

            <p className="text-gray-400">
                Loading booking...
            </p>
            </div>
        </div>
        )}

        {!loading && error && (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">
            <div className="mb-4 text-4xl">
            ⚠️
            </div>

            <h2 className="text-xl font-semibold">
            Unable to continue
            </h2>

            <p className="mt-2 text-red-300">
            {error}
            </p>

            <Link
            href="/bookings"
            className="mt-6 inline-flex rounded-xl bg-white/10 px-6 py-3 text-sm font-semibold transition hover:bg-white/15"
            >
            Back to My Bookings
            </Link>
        </div>
        )}

        {!loading && !error && booking && (
        <div className="space-y-6">

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

                <div className="flex h-24 w-28 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] text-5xl">
                🚘
                </div>

                <div>
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold">
                    {carName}
                    </h2>

                    <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400">
                    Completed
                    </span>
                </div>

                <p className="mt-2 text-sm text-gray-500">
                    Booking #{booking.id}
                </p>

                <p className="mt-1 text-sm text-gray-400">
                    {formatDate(booking.pickup_date)}
                    {" → "}
                    {formatDate(booking.return_date)}
                </p>
                </div>

            </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">

            <div className="text-center">
                <h2 className="text-2xl font-bold">
                How was your experience?
                </h2>

                <p className="mt-2 text-gray-500">
                Your rating helps us improve our service.
                </p>
            </div>

            <div className="mt-8 flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={
                    "text-5xl transition duration-200 hover:scale-110 " +
                    (star <= rating
                        ? "text-yellow-400"
                        : "text-gray-700")
                    }
                >
                    ★
                </button>
                ))}
            </div>

            <div className="mt-3 text-center">
                <p className="text-sm font-medium text-gray-400">
                {rating === 0
                    ? "Select your rating"
                    : rating === 1
                    ? "Poor"
                    : rating === 2
                    ? "Fair"
                    : rating === 3
                    ? "Good"
                    : rating === 4
                    ? "Very Good"
                    : "Excellent"}
                </p>
            </div>

            <div className="mt-8">
                <label className="mb-3 block text-sm font-semibold text-gray-300">
                Your Comment
                </label>

                <textarea
                value={comment}
                onChange={(e) =>
                    setComment(e.target.value)
                }
                placeholder="Tell us about your experience..."
                rows={6}
                className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
                />
            </div>

            {error && (
                <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
                </div>
            )}

            <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
                className="mt-6 w-full rounded-2xl bg-blue-500 px-6 py-4 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
                {submitting
                ? "Submitting Review..."
                : "Submit Review"}
            </button>

            </div>
        </div>
        )}

    </div>
    </main>
    );
    }
