
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
        image?: string | null;
        image_url?: string | null;
    };
    };

    export default function CreateReviewPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookingId = searchParams.get("booking_id");

    const [booking, setBooking] = useState<Booking | null>(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [imageError, setImageError] = useState(false);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

    function getImageUrl(image?: string | null) {
        if (!image?.trim()) return null;

        const value = image.trim();

        if (/^https?:\/\//i.test(value)) {
        return value;
        }

        const baseUrl = apiUrl.replace(/\/api\/?$/, "");
        const imagePath = value
        .replace(/^\/+/, "")
        .replace(/^public\//, "");

        if (imagePath.startsWith("images/")) {
        return `${baseUrl}/${imagePath}`;
        }

        const storagePath = imagePath.replace(/^storage\//, "");

        return `${baseUrl}/storage/${storagePath}`;
    }

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
            return;
            }

            const user = JSON.parse(userString);

            const response = await fetch(`${apiUrl}/bookings/${bookingId}`, {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            });

            const data = await response.json();

            if (!response.ok) {
            throw new Error(data.message || "Failed to load booking.");
            }

            const fetchedBooking: Booking = data.data;

            if (Number(fetchedBooking.user_id) !== Number(user.id)) {
            setError("You can only review your own bookings.");
            return;
            }

            if (fetchedBooking.status !== "completed") {
            setError("You can only review a completed booking.");
            return;
            }

            setBooking(fetchedBooking);
        } catch (err) {
            console.error(err);
            setError(
            err instanceof Error ? err.message : "Unable to load booking."
            );
        } finally {
            setLoading(false);
        }
        };

        fetchBooking();
    }, [apiUrl, bookingId, router]);

    const handleSubmit = async () => {
        if (!booking) return;

        if (rating === 0) {
        setError("Please select a rating.");
        return;
        }

        try {
        setSubmitting(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
            router.push("/login");
            return;
        }

        const response = await fetch(`${apiUrl}/reviews`, {
            method: "POST",
            headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
            booking_id: booking.id,
            rating,
            comment: comment.trim() || null,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to submit review.");
        }

        router.push("/bookings");
        } catch (err) {
        console.error(err);
        setError(
            err instanceof Error ? err.message : "Unable to submit review."
        );
        } finally {
        setSubmitting(false);
        }
    };

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        });

    const carName =
        booking?.car?.name ||
        `${booking?.car?.brand || ""} ${booking?.car?.model || ""}`.trim() ||
        "Rental Car";

    const carImage = getImageUrl(
        booking?.car?.image_url || booking?.car?.image
    );

    const ratingLabel = [
        "",
        "Poor",
        "Fair",
        "Good",
        "Very Good",
        "Excellent",
    ][rating];

    return (
        <main className="min-h-screen bg-[#f8f8f7] px-5 pb-20 pt-28 text-[#0a1411] sm:px-8">
        <div className="mx-auto max-w-3xl">
            <div className="mb-10">
            <Link
                href="/bookings"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#68736d] transition-colors hover:text-[#9a783c]"
            >
                <span aria-hidden="true">←</span>
                Back to My Bookings
            </Link>

            <div className="mt-8">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c6a15b]/30 bg-[#c6a15b]/10 px-4 py-2">
                <span className="h-2 w-2 rounded-full bg-[#c6a15b]" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a783c]">
                    Your Experience
                </span>
                </div>

                <h1 className="text-4xl font-bold tracking-tight text-[#0a1411] sm:text-5xl">
                Leave a Review<span className="text-[#c6a15b]">.</span>
                </h1>

                <p className="mt-4 max-w-xl leading-7 text-[#68736d]">
                Tell us about your rental experience and help other customers
                choose the right car.
                </p>
            </div>
            </div>

            {loading && (
            <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-[#e5e6e1] bg-white">
                <div className="text-center">
                <div className="mx-auto mb-5 h-11 w-11 animate-spin rounded-full border-4 border-[#e9e8e1] border-t-[#c6a15b]" />
                <p className="text-sm font-medium text-[#68736d]">
                    Loading booking...
                </p>
                </div>
            </div>
            )}

            {!loading && error && (
            <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl">
                ⚠️
                </div>

                <h2 className="text-xl font-bold text-[#0a1411]">
                Unable to continue
                </h2>

                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-red-600">
                {error}
                </p>

                <Link
                href="/bookings"
                className="mt-7 inline-flex items-center justify-center rounded-xl bg-[#0a1411] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#1a3027] focus:outline-none focus:ring-2 focus:ring-[#c6a15b] focus:ring-offset-2"
                >
                Back to My Bookings
                </Link>
            </div>
            )}

            {!loading && !error && booking && (
            <div className="space-y-6">
                <section className="overflow-hidden rounded-3xl border border-[#e5e6e1] bg-white shadow-sm">
                <div className="h-1.5 bg-gradient-to-r from-[#0a1411] via-[#9a783c] to-[#c6a15b]" />

                <div className="p-6 sm:p-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#e9e5da] bg-[#f8f8f7]">
                        {carImage && !imageError ? (
                        <img
                            src={carImage}
                            alt={carName}
                            className="h-full w-full object-cover"
                            onError={() => setImageError(true)}
                        />
                        ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-medium text-[#929a94]">
                            No Image
                        </div>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-bold tracking-tight text-[#0a1411]">
                            {carName}
                        </h2>

                        <span className="inline-flex items-center gap-2 rounded-full border border-[#c6a15b]/30 bg-[#c6a15b]/10 px-3 py-1 text-xs font-semibold text-[#80612d]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#9a783c]" />
                            Completed
                        </span>
                        </div>

                        <p className="mt-3 text-sm font-medium text-[#68736d]">
                        Booking{" "}
                        <span className="font-bold text-[#0a1411]">
                            #{booking.id}
                        </span>
                        </p>

                        <p className="mt-2 text-sm text-[#68736d]">
                        {formatDate(booking.pickup_date)}
                        <span className="mx-2 text-[#c6a15b]">→</span>
                        {formatDate(booking.return_date)}
                        </p>
                    </div>
                    </div>
                </div>
                </section>

                <section className="rounded-3xl border border-[#e5e6e1] bg-white p-6 shadow-sm sm:p-8">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c6a15b]/10 text-xl">
                    ★
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight text-[#0a1411]">
                    How was your experience?
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-[#68736d]">
                    Your feedback helps us improve our service.
                    </p>
                </div>

                <div
                    className="mt-8 flex justify-center gap-1.5 sm:gap-3"
                    role="group"
                    aria-label="Rate your rental experience"
                >
                    {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => {
                        setRating(star);
                        setError("");
                        }}
                        aria-label={`${star} out of 5 stars`}
                        aria-pressed={rating === star}
                        className={`rounded-xl p-1 text-4xl transition duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#c6a15b] sm:text-5xl ${
                        star <= rating
                            ? "text-[#c6a15b]"
                            : "text-[#d9dbd4] hover:text-[#c6a15b]/70"
                        }`}
                    >
                        ★
                    </button>
                    ))}
                </div>

                <div className="mt-3 min-h-6 text-center">
                    <p
                    className={`text-sm font-semibold ${
                        rating ? "text-[#9a783c]" : "text-[#929a94]"
                    }`}
                    >
                    {ratingLabel || "Select your rating"}
                    </p>
                </div>

                <div className="mt-8">
                    <label
                    htmlFor="review-comment"
                    className="mb-3 block text-sm font-semibold text-[#0a1411]"
                    >
                    Your Comment{" "}
                    <span className="font-normal text-[#929a94]">
                        (Optional)
                    </span>
                    </label>

                    <textarea
                    id="review-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us what you liked about the car and your rental experience..."
                    rows={5}
                    className="w-full resize-y rounded-2xl border border-[#e1e3dc] bg-[#f8f8f7] px-5 py-4 text-sm leading-7 text-[#0a1411] outline-none transition placeholder:text-[#9ba29d] focus:border-[#c6a15b] focus:bg-white focus:ring-2 focus:ring-[#c6a15b]/15"
                    />

                    <p className="mt-2 text-right text-xs text-[#929a94]">
                    {comment.length} characters
                    </p>
                </div>

                {error && (
                    <div
                    role="alert"
                    className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600"
                    >
                    {error}
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || rating === 0}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0a1411] px-6 py-4 font-semibold text-white shadow-lg shadow-[#0a1411]/10 transition-all duration-200 hover:bg-[#c6a15b] hover:text-[#0a1411] hover:shadow-[#c6a15b]/20 focus:outline-none focus:ring-2 focus:ring-[#c6a15b] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#0a1411] disabled:hover:text-white"
                >
                    {submitting ? (
                    <>
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Submitting Review...
                    </>
                    ) : (
                    <>
                        Submit Review
                        <span aria-hidden="true">→</span>
                    </>
                    )}
                </button>

                <p className="mt-4 text-center text-xs leading-5 text-[#929a94]">
                    Your honest feedback helps other customers make better choices.
                </p>
                </section>
            </div>
            )}
        </div>
        </main>
    );
    }
