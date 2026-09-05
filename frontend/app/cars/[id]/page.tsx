"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Car = {
id: number;
category_id: number;
branch_id: number;
brand: string;
model: string;
year: number;
color: string;
license_plate: string;
vin: string;
mileage: number;
fuel_type: string;
transmission: string;
seats: number;
daily_rate: string;
status: string;
image: string | null;
description: string | null;
category?: {
id: number;
name: string;
};
branch?: {
id: number;
name: string;
address?: string;
city?: string;
phone?: string;
};
};

type Review = {
id: number;
rating: number;
comment: string | null;
user?: {
id: number;
name: string;
};
created_at?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getImageUrl(image: string | null) {
if (!image) return null;

if (image.startsWith("http://") || image.startsWith("https://")) {
return image;
}

return `http://127.0.0.1:8000/${image.replace(/^\/+/, "")}`;
}

function Icon({
name,
size = 20,
}: {
name: string;
size?: number;
}) {
const common = {
width: size,
height: size,
viewBox: "0 0 24 24",
fill: "none",
stroke: "currentColor",
strokeWidth: 1.8,
strokeLinecap: "round" as const,
strokeLinejoin: "round" as const,
};

switch (name) {
case "arrow":
return (
<svg {...common}> <path d="M5 12h14" /> <path d="m13 6 6 6-6 6" /> </svg>
);


case "calendar":
  return (
    <svg {...common}>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );

case "users":
  return (
    <svg {...common}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );

case "fuel":
  return (
    <svg {...common}>
      <path d="M3 21h12" />
      <path d="M5 21V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v16" />
      <path d="M5 9h9" />
      <path d="M14 7h2l3 3v7a2 2 0 0 0 4 0v-5" />
      <path d="M19 10h2" />
    </svg>
  );

case "gear":
  return (
    <svg {...common}>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.04 1.56V20h-2.4v-.2a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.56-1.04H6.6v-2.4h.24A1.7 1.7 0 0 0 8.4 10a1.7 1.7 0 0 0-.34-1.88L8 8.06l1.7-1.7.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 12.68 5.2V5h2.4v.2a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 19.36 10a1.7 1.7 0 0 0 1.56 1.04h.24v2.4h-.24A1.7 1.7 0 0 0 19.4 15Z" />
    </svg>
  );

case "location":
  return (
    <svg {...common}>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );

case "star":
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="m12 2.7 2.85 5.78 6.38.93-4.62 4.5 1.09 6.35L12 17.26 6.3 20.26l1.09-6.35-4.62-4.5 6.38-.93L12 2.7Z" />
    </svg>
  );

case "back":
  return (
    <svg {...common}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );

case "check":
  return (
    <svg {...common}>
      <path d="m5 12 4 4L19 6" />
    </svg>
  );

default:
  return null;


}
}

export default function CarDetailsPage() {
const params = useParams();
const router = useRouter();
const id = params.id;

const [car, setCar] = useState<Car | null>(null);
const [reviews, setReviews] = useState<Review[]>([]);
const [loading, setLoading] = useState(true);
const [reviewsLoading, setReviewsLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
if (!id) return;


const fetchCar = async () => {
  try {
    setLoading(true);
    setError("");

    const response = await fetch(`${API_URL}/cars/${id}`);

    if (!response.ok) {
      throw new Error("Failed to load car");
    }

    const result = await response.json();
    setCar(result.data ?? result);
  } catch (err) {
    console.error(err);
    setError("Unable to load this car.");
  } finally {
    setLoading(false);
  }
};

const fetchReviews = async () => {
  try {
    setReviewsLoading(true);

    const response = await fetch(`${API_URL}/reviews`);

    if (!response.ok) return;

    const result = await response.json();
    const allReviews: Review[] = result.data ?? [];

    setReviews(
      allReviews.filter(
        (review) => review.user && review.comment !== null
      )
    );
  } catch (err) {
    console.error(err);
  } finally {
    setReviewsLoading(false);
  }
};

fetchCar();
fetchReviews();


}, [id]);

if (loading) {
return ( <main className="min-h-screen bg-[#070b14] text-white"> <div className="mx-auto max-w-7xl px-6 py-12"> <div className="h-5 w-32 animate-pulse rounded bg-white/10" />


      <div className="mt-8 grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="h-[340px] animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />

        <div className="space-y-5">
          <div className="h-6 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-14 w-3/4 animate-pulse rounded bg-white/10" />
          <div className="h-24 animate-pulse rounded bg-white/10" />
          <div className="h-32 animate-pulse rounded bg-white/10" />
        </div>
      </div>
    </div>
  </main>
);


}

if (error || !car) {
return ( <main className="flex min-h-screen items-center justify-center bg-[#070b14] px-6 text-white"> <div className="text-center"> <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/10 text-red-400"> <Icon name="back" size={28} /> </div>


      <h1 className="text-2xl font-semibold">Car not found</h1>

      <p className="mt-2 text-sm text-white/50">
        We couldn't find the vehicle you're looking for.
      </p>

      <button
        onClick={() => router.push("/cars")}
        className="mt-7 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold transition hover:bg-blue-500"
      >
        Back to Cars
      </button>
    </div>
  </main>
);


}

const imageUrl = getImageUrl(car.image);

const carReviews = reviews.filter(
(review) => review.user && review.comment !== null
);

const averageRating =
carReviews.length > 0
? carReviews.reduce((sum, review) => sum + review.rating, 0) /
carReviews.length
: 0;

const statusAvailable = car.status === "available";

return ( <main className="min-h-screen bg-[#070b14] text-white"> <section className="relative overflow-hidden border-b border-white/[0.06]"> <div className="absolute left-1/3 top-0 h-80 w-80 rounded-full bg-blue-600/10 blur-[120px]" /> <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-cyan-500/[0.06] blur-[120px]" />


    <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-10">
      {/* Back */}
      <button
        onClick={() => router.push("/cars")}
        className="mb-8 flex items-center gap-2 text-sm text-white/40 transition hover:text-white"
      >
        <Icon name="back" size={17} />
        Back to fleet
      </button>

      <div className="grid items-center gap-10 lg:grid-cols-[0.7fr_1.3fr]">
        {/* CAR IMAGE */}
        <div className="flex justify-center lg:justify-start">
          <div className="relative w-full max-w-[390px]">
            <div className="absolute -inset-5 rounded-[30px] bg-blue-500/[0.06] blur-2xl" />

            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 bg-[#0d131f] shadow-2xl shadow-black/30">
              {/* Small label */}
              <div className="absolute left-4 top-4 z-10 rounded-full border border-white/10 bg-[#080d18]/85 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/45 backdrop-blur-xl">
                DriveX Collection
              </div>

              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={`${car.brand} ${car.model}`}
                  className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <svg
                    width="150"
                    height="90"
                    viewBox="0 0 200 120"
                    fill="none"
                    className="text-white/10"
                  >
                    <path
                      d="M35 72 48 42c3-8 10-13 19-13h65c8 0 15 4 19 11l16 32"
                      stroke="currentColor"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />

                    <path
                      d="M24 72h152c6 0 10 5 10 11v6H14v-7c0-6 4-10 10-10Z"
                      stroke="currentColor"
                      strokeWidth="5"
                    />

                    <circle
                      cx="51"
                      cy="89"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="5"
                    />

                    <circle
                      cx="149"
                      cy="89"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="5"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CAR DETAILS */}
        <div>
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-300">
              {car.category?.name || "Vehicle"}
            </span>

            <span
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold capitalize ${
                statusAvailable
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                  : "border-amber-400/20 bg-amber-400/10 text-amber-300"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  statusAvailable
                    ? "bg-emerald-400"
                    : "bg-amber-400"
                }`}
              />

              {car.status}
            </span>
          </div>

          {/* Title */}
          <div className="mt-5">
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-white/30">
              {car.brand}
            </p>

            <h1 className="mt-1 text-5xl font-bold tracking-tight text-white">
              {car.model}
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-white/45">
              {car.description ||
                `Experience the ${car.brand} ${car.model}, designed to deliver a comfortable and reliable driving experience.`}
            </p>
          </div>

          {/* Rating */}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Icon name="star" size={16} />

              <span className="text-sm font-semibold text-white">
                {averageRating > 0
                  ? averageRating.toFixed(1)
                  : "New"}
              </span>
            </div>

            <span className="h-4 w-px bg-white/10" />

            <span className="text-sm text-white/35">
              {carReviews.length}{" "}
              {carReviews.length === 1 ? "review" : "reviews"}
            </span>
          </div>

          {/* Price + Booking */}
          <div className="mt-6 flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/30">
                Daily rental
              </p>

              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  EGP {Number(car.daily_rate).toLocaleString()}
                </span>

                <span className="text-sm text-white/30">
                  / day
                </span>
              </div>
            </div>

            <button
              onClick={() =>
                router.push(`/bookings?car_id=${car.id}`)
              }
              disabled={!statusAvailable}
              className={`group flex items-center justify-center gap-3 rounded-xl px-6 py-3.5 text-sm font-semibold transition ${
                statusAvailable
                  ? "bg-blue-600 hover:bg-blue-500"
                  : "cursor-not-allowed bg-white/10 text-white/30"
              }`}
            >
              {statusAvailable ? "Book This Car" : "Unavailable"}

              {statusAvailable && (
                <span className="transition group-hover:translate-x-1">
                  <Icon name="arrow" size={17} />
                </span>
              )}
            </button>
          </div>

          {/* Quick Specs */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-4">
              <div className="text-white/30">
                <Icon name="calendar" size={17} />
              </div>

              <p className="mt-2 text-[10px] uppercase tracking-wider text-white/25">
                Year
              </p>

              <p className="mt-1 text-sm font-semibold">
                {car.year}
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-4">
              <div className="text-white/30">
                <Icon name="users" size={17} />
              </div>

              <p className="mt-2 text-[10px] uppercase tracking-wider text-white/25">
                Seats
              </p>

              <p className="mt-1 text-sm font-semibold">
                {car.seats}
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-4">
              <div className="text-white/30">
                <Icon name="gear" size={17} />
              </div>

              <p className="mt-2 text-[10px] uppercase tracking-wider text-white/25">
                Gearbox
              </p>

              <p className="mt-1 text-sm font-semibold capitalize">
                {car.transmission}
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-4">
              <div className="text-white/30">
                <Icon name="fuel" size={17} />
              </div>

              <p className="mt-2 text-[10px] uppercase tracking-wider text-white/25">
                Fuel
              </p>

              <p className="mt-1 text-sm font-semibold capitalize">
                {car.fuel_type}
              </p>
            </div>
          </div>

          {/* Location */}
          {car.branch && (
            <div className="mt-4 flex items-center gap-2.5 text-sm text-white/35">
              <span className="text-blue-400">
                <Icon name="location" size={17} />
              </span>

              <span>
                Available at{" "}
                <span className="font-medium text-white/65">
                  {car.branch.name}
                </span>

                {car.branch.city && (
                  <span> · {car.branch.city}</span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  </section>

  {/* SPECIFICATIONS */}
  <section className="mx-auto max-w-7xl px-6 py-16">
    <div className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">
        Vehicle information
      </p>

      <h2 className="mt-2 text-2xl font-bold">
        Specifications
      </h2>

      <p className="mt-2 text-sm text-white/40">
        Everything you need to know before booking.
      </p>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[
        ["Brand", car.brand],
        ["Model", car.model],
        ["Year", String(car.year)],
        ["Color", car.color],
        ["Mileage", `${car.mileage.toLocaleString()} km`],
        ["Transmission", car.transmission],
        ["Fuel Type", car.fuel_type],
        ["Seats", String(car.seats)],
        ["License Plate", car.license_plate],
      ].map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] px-5 py-4"
        >
          <span className="text-sm text-white/35">
            {label}
          </span>

          <span className="text-sm font-medium capitalize text-white/80">
            {value}
          </span>
        </div>
      ))}
    </div>
  </section>

  {/* REVIEWS */}
  <section className="border-y border-white/[0.06] bg-white/[0.015]">
    <div className="mx-auto max-w-7xl px-6 py-16">
      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">
            Customer feedback
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Reviews
          </h2>

          <p className="mt-2 text-sm text-white/40">
            See what other customers think about this vehicle.
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4">
          <div className="text-3xl font-bold">
            {averageRating > 0
              ? averageRating.toFixed(1)
              : "—"}
          </div>

          <div>
            <div className="flex gap-0.5 text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon key={star} name="star" size={13} />
              ))}
            </div>

            <p className="mt-1 text-xs text-white/35">
              {carReviews.length} reviews
            </p>
          </div>
        </div>
      </div>

      {reviewsLoading ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
            />
          ))}
        </div>
      ) : carReviews.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/30">
            <Icon name="star" size={21} />
          </div>

          <h3 className="mt-4 text-sm font-semibold">
            No reviews yet
          </h3>

          <p className="mt-2 text-sm text-white/35">
            Be the first to share your experience with this car.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {carReviews.map((review) => (
            <div
              key={review.id}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 transition hover:border-white/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">
                    {review.user?.name || "Customer"}
                  </p>

                  <div className="mt-2 flex gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={
                          star <= review.rating
                            ? "opacity-100"
                            : "opacity-20"
                        }
                      >
                        <Icon name="star" size={13} />
                      </span>
                    ))}
                  </div>
                </div>

                {review.created_at && (
                  <span className="text-xs text-white/25">
                    {new Date(
                      review.created_at
                    ).toLocaleDateString()}
                  </span>
                )}
              </div>

              <p className="mt-5 text-sm leading-7 text-white/50">
                “{review.comment}”
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  </section>

  {/* CTA */}
  <section className="mx-auto max-w-7xl px-6 py-16">
    <div className="relative overflow-hidden rounded-3xl border border-blue-400/10 bg-gradient-to-br from-blue-600/10 via-white/[0.025] to-transparent p-8 sm:p-10">
      <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-blue-500/10 blur-[80px]" />

      <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-blue-400">
            <Icon name="check" size={18} />

            <span className="text-xs font-semibold uppercase tracking-[0.2em]">
              Ready to drive?
            </span>
          </div>

          <h2 className="mt-3 text-2xl font-bold">
            Make your next journey simple.
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-white/40">
            Reserve this vehicle and enjoy a smooth rental
            experience with DriveX.
          </p>
        </div>

        <button
          onClick={() =>
            router.push(`/bookings?car_id=${car.id}`)
          }
          disabled={!statusAvailable}
          className={`group flex shrink-0 items-center justify-center gap-3 rounded-xl px-6 py-3.5 text-sm font-semibold transition ${
            statusAvailable
              ? "bg-blue-600 hover:bg-blue-500"
              : "cursor-not-allowed bg-white/10 text-white/30"
          }`}
        >
          {statusAvailable ? "Book Now" : "Unavailable"}

          {statusAvailable && (
            <span className="transition group-hover:translate-x-1">
              <Icon name="arrow" size={17} />
            </span>
          )}
        </button>
      </div>
    </div>
  </section>
</main>
);
}
