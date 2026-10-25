
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Car = {
  id: number;
  brand: string;
  model: string;
  year: number;
  color?: string;
  transmission?: string;
  fuel_type?: string;
  seats?: number;
  daily_rate: number;
  status: string;
  image?: string | null;
  description?: string | null;
  category?: {
    id: number;
    name: string;
  } | null;
  branch?: {
    id: number;
    name: string;
    location?: string;
  } | null;
};

type Review = {
  id: number;
  car_id: number;
  rating: number;
  comment?: string | null;
  user?: {
    name: string;
  };
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";


function getImageUrl(image: string | null | undefined) {
  if (!image?.trim()) return null;

  const value = image.trim();

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const imagePath = value
    .replace(/^\/+/, "")
    .replace(/^public\//, "");

  const baseUrl = API_URL.replace(/\/api\/?$/, "");

  if (imagePath.startsWith("images/")) {
    return `${baseUrl}/${imagePath}`;
  }

  const storagePath = imagePath.replace(/^storage\//, "");

  return `${baseUrl}/storage/${storagePath}`;
}


function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
}

function SpecCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-[#e8e4db] bg-white p-5 transition hover:border-[#d4af6a]">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[#88877f]">
        {label}
      </p>
      <p className="break-words font-semibold capitalize text-[#0a1411]">
        {value || "N/A"}
      </p>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-1 text-[#c6a15b]"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={index < Math.round(rating) ? "opacity-100" : "opacity-25"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function CarDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id;

  const [car, setCar] = useState<Car | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchCar = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/cars/${id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch car");
        }

        const data = await response.json();
        const carData = data.data || data;

        if (!carData || !carData.id) {
          throw new Error("Car not found");
        }

        setCar(carData);
      } catch (err) {
        console.error("Failed to load car details:", err);
        setError("Failed to load car details. Please try again.");
        setCar(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCar();
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`${API_URL}/reviews`);

        if (!response.ok) return;

        const data = await response.json();
        const reviewsData = data.data || data;

        if (Array.isArray(reviewsData)) {
          const currentCarId = Number(id);

          setReviews(
            reviewsData.filter(
              (review: Review) => Number(review.car_id) === currentCarId
            )
          );
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
      }
    };

    if (id) fetchReviews();
  }, [id]);

  const handleBooking = () => {
    if (!car || car.status?.toLowerCase() !== "available") return;

    router.push(`/bookings/create?car_id=${car.id}`);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f8f7] px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#e8e4db] border-t-[#c6a15b]" />
          <p className="font-medium text-[#77776f]">
            Loading car details...
          </p>
        </div>
      </main>
    );
  }

  if (error || !car) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f8f7] px-6">
        <div className="w-full max-w-md rounded-3xl border border-[#e8e4db] bg-white p-10 text-center shadow-sm">
          <div className="mb-5 text-5xl">🚗</div>

          <h1 className="mb-3 text-2xl font-bold text-[#0a1411]">
            Car Not Found
          </h1>

          <p className="mb-6 text-sm leading-6 text-[#77776f]">
            {error || "We couldn't find this car."}
          </p>

          <button
            type="button"
            onClick={() => router.push("/cars")}
            className="w-full rounded-xl bg-[#0a1411] py-3.5 font-semibold text-white transition hover:bg-[#1a3027]"
          >
            Back to Cars
          </button>
        </div>
      </main>
    );
  }

  const imageUrl = getImageUrl(car.image);
  const statusAvailable = car.status?.toLowerCase() === "available";

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
        reviews.length
      : 0;

  return (
    <main className="min-h-screen bg-[#f8f8f7] pb-20 text-[#202020]">
      {/* Navigation */}
      <section className="border-b border-[#e8e4db] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8 lg:px-12">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#77776f] transition hover:text-[#9a783c]"
          >
            <span aria-hidden="true">←</span>
            Back
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
        {/* Breadcrumb */}
        <div className="mb-7 flex flex-wrap items-center gap-2 text-xs text-[#898981]">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="transition hover:text-[#9a783c]"
          >
            Home
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => router.push("/cars")}
            className="transition hover:text-[#9a783c]"
          >
            Cars
          </button>
          <span>/</span>
          <span className="font-medium text-[#0a1411]">
            {car.brand} {car.model}
          </span>
        </div>

        {/* Main Car Section */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          {/* Image */}
          <div className="overflow-hidden rounded-3xl border border-[#e8e4db] bg-white shadow-[0_8px_30px_rgba(10,20,17,0.04)]">
            <div className="relative aspect-[4/3] min-h-[280px] overflow-hidden bg-[#eeece6] sm:min-h-[400px]">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={`${car.brand} ${car.model}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-8xl">
                  🚗
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

              <div className="absolute left-5 top-5">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold backdrop-blur-md ${
                    statusAvailable
                      ? "border-[#b9dfc3]/60 bg-[#e5f3e9]/95 text-[#216b42]"
                      : "border-white/40 bg-black/50 text-white"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      statusAvailable ? "bg-[#2c8b52]" : "bg-[#e57373]"
                    }`}
                  />
                  {statusAvailable ? "Available" : "Unavailable"}
                </span>
              </div>

              {car.category?.name && (
                <div className="absolute right-5 top-5">
                  <span className="rounded-full border border-white/30 bg-black/40 px-4 py-2 text-xs font-medium text-white backdrop-blur-md">
                    {car.category.name}
                  </span>
                </div>
              )}

              <div className="absolute bottom-5 left-5 right-5 text-white">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/75">
                  DriveX Collection
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  {car.brand} {car.model}
                </h1>
                <p className="mt-1 text-sm text-white/80">{car.year}</p>
              </div>
            </div>
          </div>

          {/* Car Details and Booking */}
          <div className="flex flex-col">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-[2px] w-8 bg-[#c6a15b]" />
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#9a783c]">
                Your next journey
              </span>
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-[#0a1411] sm:text-4xl">
              {car.brand} {car.model}
            </h2>

            <p className="mt-3 text-sm leading-7 text-[#77776f]">
              Discover the details, explore the features, and get ready for
              your next drive with DriveX.
            </p>

            {/* Rating */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Stars rating={averageRating} />

              <span className="font-semibold text-[#0a1411]">
                {averageRating > 0 ? averageRating.toFixed(1) : "No ratings"}
              </span>

              <span className="text-[#c5c1b8]">•</span>

              <span className="text-sm text-[#77776f]">
                {reviews.length}{" "}
                {reviews.length === 1 ? "review" : "reviews"}
              </span>
            </div>

            {/* Price */}
            <div className="mt-7 rounded-2xl border border-[#e8e4db] bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#898981]">
                Daily rental rate
              </p>

              <div className="mt-2 flex flex-wrap items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight text-[#0a1411]">
                  {formatPrice(car.daily_rate)}
                </span>
                <span className="text-sm font-medium text-[#898981]">
                  EGP / day
                </span>
              </div>

              <div className="mt-5 border-t border-[#efeee9] pt-4">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-[#77776f]">Pickup branch</span>
                  <span className="text-right font-semibold text-[#0a1411]">
                    {car.branch?.name || "See booking options"}
                  </span>
                </div>

                {car.branch?.location && (
                  <p className="mt-2 text-right text-xs text-[#898981]">
                    {car.branch.location}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleBooking}
              disabled={!statusAvailable}
              className={`mt-5 flex h-14 w-full items-center justify-center gap-3 rounded-xl px-6 font-semibold transition ${
                statusAvailable
                  ? "bg-[#0a1411] text-white hover:bg-[#1a3027]"
                  : "cursor-not-allowed bg-[#e5e3dd] text-[#99968e]"
              }`}
            >
              {statusAvailable ? "Book This Car" : "Currently Unavailable"}
              {statusAvailable && <span aria-hidden="true">→</span>}
            </button>

            <p className="mt-3 text-center text-xs leading-5 text-[#898981]">
              Review your booking details before confirming your reservation.
            </p>
          </div>
        </div>

        {/* Specifications */}
        <section className="mt-14">
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-[2px] w-7 bg-[#c6a15b]" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a783c]">
                The details
              </span>
            </div>

            <h2 className="text-2xl font-bold text-[#0a1411] sm:text-3xl">
              Specifications
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <SpecCard label="Year" value={car.year} />
            <SpecCard label="Transmission" value={car.transmission || "N/A"} />
            <SpecCard label="Fuel type" value={car.fuel_type || "N/A"} />
            <SpecCard label="Seats" value={car.seats || "N/A"} />
            <SpecCard label="Color" value={car.color || "N/A"} />
            <SpecCard label="Branch" value={car.branch?.name || "N/A"} />
          </div>
        </section>

        {/* Description */}
        {car.description && (
          <section className="mt-14">
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-[2px] w-7 bg-[#c6a15b]" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a783c]">
                  Get to know your ride
                </span>
              </div>

              <h2 className="text-2xl font-bold text-[#0a1411] sm:text-3xl">
                About This Car
              </h2>
            </div>

            <div className="rounded-2xl border border-[#e8e4db] bg-white p-6 sm:p-8">
              <p className="whitespace-pre-line text-sm leading-8 text-[#686860]">
                {car.description}
              </p>
            </div>
          </section>
        )}

        {/* Reviews */}
        <section className="mt-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-[2px] w-7 bg-[#c6a15b]" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a783c]">
                  From our customers
                </span>
              </div>

              <h2 className="text-2xl font-bold text-[#0a1411] sm:text-3xl">
                Customer Reviews
              </h2>
            </div>

            {reviews.length > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-[#e8e4db] bg-white px-4 py-3">
                <span className="text-2xl text-[#c6a15b]">★</span>
                <div>
                  <p className="font-bold text-[#0a1411]">
                    {averageRating.toFixed(1)} / 5
                  </p>
                  <p className="text-xs text-[#898981]">
                    Based on {reviews.length}{" "}
                    {reviews.length === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d9d4c8] bg-white px-6 py-12 text-center">
              <div className="text-4xl text-[#c6a15b]">★</div>
              <h3 className="mt-4 font-semibold text-[#0a1411]">
                No reviews yet
              </h3>
              <p className="mt-2 text-sm text-[#898981]">
                Be the first to share your experience after completing a
                booking.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-2xl border border-[#e8e4db] bg-white p-6 transition hover:border-[#d4af6a]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f5efdf] font-bold text-[#9a783c]">
                        {(review.user?.name || "C")
                          .trim()
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#0a1411]">
                          {review.user?.name || "Customer"}
                        </p>
                        <p className="mt-1 text-xs text-[#898981]">
                          Verified customer review
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-bold text-[#0a1411]">
                        {Number(review.rating).toFixed(1)}
                      </p>
                      <Stars rating={Number(review.rating)} />
                    </div>
                  </div>

                  {review.comment ? (
                    <p className="mt-5 whitespace-pre-line text-sm leading-7 text-[#686860]">
                      {review.comment}
                    </p>
                  ) : (
                    <p className="mt-5 text-sm italic text-[#aaa69c]">
                      No written comment.
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Bottom CTA */}
        <section className="relative mt-14 overflow-hidden rounded-3xl bg-[#0a1411] px-6 py-9 text-white sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-[#d4af6a]/20" />
          <div className="pointer-events-none absolute -right-2 -top-10 h-44 w-44 rounded-full border border-[#d4af6a]/20" />

          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#d4af6a]">
                Your journey starts here
              </p>

              <h2 className="text-2xl font-bold sm:text-3xl">
                Ready to drive?
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-7 text-white/65">
                Make your next trip memorable with the {car.brand} {car.model}.
              </p>
            </div>

            <button
              type="button"
              onClick={handleBooking}
              disabled={!statusAvailable}
              className={`flex shrink-0 items-center justify-center gap-3 rounded-xl px-7 py-4 font-semibold transition ${
                statusAvailable
                  ? "bg-[#d4af6a] text-[#0a1411] hover:bg-[#e2c58d]"
                  : "cursor-not-allowed bg-white/10 text-white/40"
              }`}
            >
              {statusAvailable ? "Book Now" : "Unavailable"}
              {statusAvailable && <span aria-hidden="true">→</span>}
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
