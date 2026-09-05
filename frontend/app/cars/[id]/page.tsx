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
  rating: number;
  comment: string;
  user?: {
    name: string;
  };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getImageUrl(image: string | null | undefined) {
  if (!image) return null;

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  let imagePath = image.replace(/^\/+/, "");

  imagePath = imagePath.replace(/^public\//, "");

  if (!imagePath.startsWith("images/")) {
    imagePath = `images/cars/${imagePath}`;
  }

  const baseUrl = (API_URL || "http://127.0.0.1:8000/api").replace(
    /\/api\/?$/,
    ""
  );

  return `${baseUrl}/${imagePath}`;
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

        const response = await fetch(`${API_URL}/cars/${id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch car");
        }

        const data = await response.json();

        setCar(data.data || data);
      } catch (err) {
        console.error(err);
        setError("Failed to load car details.");
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

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        const reviewsData = data.data || data;

        if (Array.isArray(reviewsData)) {
          setReviews(reviewsData);
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
      }
    };

    fetchReviews();
  }, []);

  const handleBooking = () => {
    if (!car) return;

    if (car.status !== "available") {
      return;
    }

    router.push(`/bookings/create?car_id=${car.id}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#05070d] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>

          <p className="text-slate-400 font-medium">
            Loading car details...
          </p>
        </div>
      </main>
    );
  }

  if (error || !car) {
    return (
      <main className="min-h-screen bg-[#05070d] flex items-center justify-center px-6">
        <div className="bg-[#0b0f1a] rounded-3xl shadow-sm border border-slate-800 p-10 text-center max-w-md w-full">
          <div className="text-5xl mb-5">🚗</div>

          <h1 className="text-2xl font-bold text-white mb-3">
            Car Not Found
          </h1>

          <p className="text-slate-400 mb-6">
            {error || "We couldn't find this car."}
          </p>

          <button
            onClick={() => router.push("/cars")}
            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-500 transition"
          >
            Back to Cars
          </button>
        </div>
      </main>
    );
  }

  const imageUrl = getImageUrl(car.image);

  const statusAvailable = car.status === "available";

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) /
        reviews.length
      : 0;

  return (
    <main className="min-h-screen bg-[#05070d]">
      {/* Header */}
      <section className="bg-[#05070d] border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-blue-400 transition font-medium"
          >
            ← Back
          </button>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Car Image */}
          <div className="bg-[#0b0f1a] rounded-3xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="h-[450px] bg-[#0f1420] relative">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={`${car.brand} ${car.model}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <span className="text-8xl">🚗</span>
                </div>
              )}

              {/* Status */}
              <div className="absolute top-5 left-5">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    statusAvailable
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {statusAvailable ? "Available" : "Unavailable"}
                </span>
              </div>
            </div>
          </div>

          {/* Car Information */}
          <div className="flex flex-col justify-center">
            <div className="mb-3">
              {car.category?.name && (
                <span className="text-sm font-bold text-blue-400 uppercase tracking-widest">
                  {car.category.name}
                </span>
              )}
            </div>

            <h1 className="text-5xl font-bold text-white tracking-tight mb-2">
              {car.brand}
            </h1>

            <h2 className="text-3xl font-semibold text-slate-300 mb-6">
              {car.model}
            </h2>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center gap-1">
                <span className="text-yellow-400 text-xl">★</span>

                <span className="font-bold text-white">
                  {averageRating > 0
                    ? averageRating.toFixed(1)
                    : "No ratings"}
                </span>
              </div>

              <span className="text-slate-600">•</span>

              <span className="text-slate-400">
                {reviews.length}{" "}
                {reviews.length === 1 ? "review" : "reviews"}
              </span>
            </div>

            {/* Price */}
            <div className="bg-[#0b0f1a] border border-slate-800 rounded-2xl p-6 mb-8">
              <p className="text-sm text-slate-400 mb-1">
                Daily Rental Rate
              </p>

              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-white">
                  {Number(car.daily_rate).toLocaleString()}
                </span>

                <span className="text-slate-400 mb-1">
                  EGP / day
                </span>
              </div>
            </div>

            {/* Book Button */}
            <button
              onClick={handleBooking}
              disabled={!statusAvailable}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition ${
                statusAvailable
                  ? "bg-blue-600 text-white hover:bg-blue-500"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              {statusAvailable ? "Book This Car" : "Currently Unavailable"}
            </button>
          </div>
        </div>

        {/* Specifications */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">
            Specifications
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Year */}
            <div className="bg-[#0b0f1a] border border-slate-800 rounded-2xl p-5">
              <p className="text-sm text-slate-400 mb-2">Year</p>

              <p className="font-bold text-white">
                {car.year}
              </p>
            </div>

            {/* Transmission */}
            <div className="bg-[#0b0f1a] border border-slate-800 rounded-2xl p-5">
              <p className="text-sm text-slate-400 mb-2">
                Transmission
              </p>

              <p className="font-bold text-white capitalize">
                {car.transmission || "N/A"}
              </p>
            </div>

            {/* Fuel */}
            <div className="bg-[#0b0f1a] border border-slate-800 rounded-2xl p-5">
              <p className="text-sm text-slate-400 mb-2">
                Fuel Type
              </p>

              <p className="font-bold text-white capitalize">
                {car.fuel_type || "N/A"}
              </p>
            </div>

            {/* Seats */}
            <div className="bg-[#0b0f1a] border border-slate-800 rounded-2xl p-5">
              <p className="text-sm text-slate-400 mb-2">
                Seats
              </p>

              <p className="font-bold text-white">
                {car.seats || "N/A"}
              </p>
            </div>

            {/* Color */}
            <div className="bg-[#0b0f1a] border border-slate-800 rounded-2xl p-5">
              <p className="text-sm text-slate-400 mb-2">
                Color
              </p>

              <p className="font-bold text-white capitalize">
                {car.color || "N/A"}
              </p>
            </div>

            {/* Branch */}
            <div className="bg-[#0b0f1a] border border-slate-800 rounded-2xl p-5">
              <p className="text-sm text-slate-400 mb-2">
                Branch
              </p>

              <p className="font-bold text-white">
                {car.branch?.name || "N/A"}
              </p>
            </div>
          </div>
        </section>

        {/* Description */}
        {car.description && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-5">
              About This Car
            </h2>

            <div className="bg-[#0b0f1a] border border-slate-800 rounded-2xl p-6">
              <p className="text-slate-400 leading-7">
                {car.description}
              </p>
            </div>
          </section>
        )}

        {/* Reviews */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Customer Reviews
            </h2>

            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 text-xl">★</span>

                <span className="font-bold text-white">
                  {averageRating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="bg-[#0b0f1a] border border-slate-800 rounded-2xl p-8 text-center">
              <p className="text-slate-400">
                No reviews yet for this car.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-[#0b0f1a] border border-slate-800 rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold text-white">
                        {review.user?.name || "Customer"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>

                      <span className="font-semibold text-white">
                        {review.rating}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-400 leading-6">
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Bottom CTA */}
        <section className="mt-12 bg-[#0b0f1a] border border-slate-800 rounded-3xl p-8 md:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Ready to drive?
            </h2>

            <p className="text-slate-400">
              Book your {car.brand} {car.model} today.
            </p>
          </div>

          <button
            onClick={handleBooking}
            disabled={!statusAvailable}
            className={`px-8 py-4 rounded-2xl font-bold transition ${
              statusAvailable
                ? "bg-blue-600 text-white hover:bg-blue-500"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            {statusAvailable ? "Book Now" : "Unavailable"}
          </button>
        </section>
      </section>
    </main>
  );
}