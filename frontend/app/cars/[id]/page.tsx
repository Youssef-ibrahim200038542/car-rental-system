"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import SectionHeader from "@/app/components/SectionHeader";
import { PageLoading, PageState } from "@/app/components/StateViews";
import { apiFetch } from "@/lib/api";
import { carDisplayName, isCarBookable } from "@/lib/cars";
import type { Car, Review } from "@/lib/types";
import CarOverview from "./CarOverview";
import CarReviews from "./CarReviews";
import SimilarCars from "./SimilarCars";

function SpecCard({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-2xl border border-[#e8e4db] bg-white p-5 transition hover:border-[#d4af6a]">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[#88877f]">{label}</p>
      <p className="break-words font-semibold capitalize text-[#0a1411]">{value || "N/A"}</p>
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
    let cancelled = false;

    (async () => {
      try {
        const carData = await apiFetch<Car>(`/cars/${id}`, { auth: false });
        if (!carData?.id) throw new Error("Car not found");
        if (!cancelled) setCar(carData);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load car details:", err);
        setError("Failed to load car details. Please try again.");
        setCar(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    apiFetch<Review[]>("/reviews", { auth: false })
      .then((reviewsData) => {
        if (cancelled || !Array.isArray(reviewsData)) return;
        const currentCarId = Number(id);
        setReviews(reviewsData.filter((review) => Number(review.car_id) === currentCarId));
      })
      .catch((err) => console.error("Failed to load reviews:", err));

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <PageLoading message="Loading car details..." />;

  if (error || !car) {
    return (
      <PageState
        tone="empty"
        icon="car"
        title="Car Not Found"
        message={error || "We couldn't find this car."}
        action={{ label: "Back to Cars", href: "/cars" }}
      />
    );
  }

  const name = carDisplayName(car);
  const bookable = isCarBookable(car);
  const handleBooking = () => {
    if (bookable) router.push(`/bookings/create?car_id=${car.id}`);
  };

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
      : 0;

  return (
    <main className="min-h-screen bg-[#f8f8f7] pb-20 pt-20 text-[#202020]">
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
        <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-2 text-xs text-[#898981]">
          <Link href="/" className="transition hover:text-[#9a783c]">Home</Link>
          <span>/</span>
          <Link href="/cars" className="transition hover:text-[#9a783c]">Cars</Link>
          <span>/</span>
          <span className="font-medium text-[#0a1411]">{name}</span>
        </nav>

        <CarOverview
          car={car}
          bookable={bookable}
          averageRating={averageRating}
          reviewCount={reviews.length}
          onBook={handleBooking}
        />

        <section className="mt-14">
          <SectionHeader eyebrow="The details" title="Specifications" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <SpecCard label="Year" value={car.year} />
            <SpecCard label="Transmission" value={car.transmission} />
            <SpecCard label="Fuel type" value={car.fuel_type} />
            <SpecCard label="Seats" value={car.seats} />
            <SpecCard label="Color" value={car.color} />
            <SpecCard label="Branch" value={car.branch?.name} />
          </div>
        </section>

        {car.description && (
          <section className="mt-14">
            <SectionHeader eyebrow="Get to know your ride" title="About This Car" />
            <div className="rounded-2xl border border-[#e8e4db] bg-white p-6 sm:p-8">
              <p className="whitespace-pre-line text-sm leading-8 text-[#686860]">
                {car.description}
              </p>
            </div>
          </section>
        )}

        <CarReviews reviews={reviews} averageRating={averageRating} />

        <SimilarCars key={car.id} carId={car.id} />

        <section className="relative mt-14 overflow-hidden rounded-3xl bg-[#0a1411] px-6 py-9 text-white sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-[#d4af6a]/20" />
          <div className="pointer-events-none absolute -right-2 -top-10 h-44 w-44 rounded-full border border-[#d4af6a]/20" />

          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#d4af6a]">
                Your journey starts here
              </p>
              <h2 className="text-2xl font-bold sm:text-3xl">Ready to drive?</h2>
              <p className="mt-3 max-w-lg text-sm leading-7 text-white/65">
                Make your next trip memorable with the {name}.
              </p>
            </div>

            <button
              type="button"
              onClick={handleBooking}
              disabled={!bookable}
              className={`flex shrink-0 items-center justify-center gap-3 rounded-xl px-7 py-4 font-semibold transition ${
                bookable
                  ? "bg-[#d4af6a] text-[#0a1411] hover:bg-[#e2c58d]"
                  : "cursor-not-allowed bg-white/10 text-white/40"
              }`}
            >
              {bookable ? "Book Now" : "Unavailable"}
              {bookable && <span aria-hidden="true">→</span>}
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
