"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SectionHeader from "@/app/components/SectionHeader";
import { PageLoading, PageState } from "@/app/components/StateViews";
import { apiFetch, errorMessage, getToken, isApiError } from "@/lib/api";
import { getLocalToday, rentalDays } from "@/lib/dates";
import { postRecommendationEvent, recommendationContext } from "@/lib/recommendation-events";
import type { Booking, Branch, Car as ApiCar } from "@/lib/types";
import RentalDetailsForm, { type RentalDetails } from "./RentalDetailsForm";
import SelectedCarSummary from "./SelectedCarSummary";
import { useAvailability } from "./useAvailability";

/** The API has no `name` column; kept optional so the brand/model fallbacks still read. */
type Car = ApiCar & { name?: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Dates passed from the cars page; ignored unless both are valid and in order. */
function datesFromQuery(params: { get(name: string): string | null }): RentalDetails["dates"] {
  const start = params.get("pickup_date") ?? "";
  const end = params.get("return_date") ?? "";
  const valid = ISO_DATE.test(start) && ISO_DATE.test(end) && start >= getLocalToday() && end >= start;
  return valid ? { start, end } : { start: "", end: "" };
}

/** First problem with the form, or "" when it can be submitted. */
function validate(details: RentalDetails): string {
  const { start, end } = details.dates;
  if (!details.pickupBranchId || !details.dropoffBranchId) {
    return "Please select pickup and drop-off branches.";
  }
  if (!start || !end) return "Please select pickup and return dates.";
  if (start < getLocalToday()) return "Pickup date cannot be in the past.";
  if (end < start) return "Return date cannot be before the pickup date.";
  return "";
}

export default function CreateBookingPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <CreateBookingForm />
    </Suspense>
  );
}

function CreateBookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const carId = searchParams.get("car_id");
  const recommendation = recommendationContext(searchParams);

  const [car, setCar] = useState<Car | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [details, setDetails] = useState<RentalDetails>(() => ({
    pickupBranchId: "",
    dropoffBranchId: "",
    dates: datesFromQuery(searchParams),
    notes: "",
  }));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Client-side estimate only; the server computes the authoritative total.
  const days = rentalDays(details.dates.start, details.dates.end);
  const total = days > 0 && car ? days * Number(car.daily_rate) : 0;
  const availability = useAvailability(car?.id, details.dates.start, details.dates.end, days > 0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!carId || !/^\d+$/.test(carId)) {
          throw new Error("Invalid car selection. Please choose a car first.");
        }

        const [selectedCar, branchList] = await Promise.all([
          apiFetch<Car>(`/cars/${carId}`, { auth: false }),
          apiFetch<Branch[]>("/branches", { auth: false }),
        ]);

        if (!selectedCar?.id) throw new Error("Car information could not be found.");
        if (!Array.isArray(branchList)) throw new Error("Unable to load branch information.");
        if (cancelled) return;

        setCar(selectedCar);
        setBranches(branchList);
        setDetails((current) => ({
          ...current,
          pickupBranchId: String(selectedCar.branch?.id ?? branchList[0]?.id ?? ""),
          dropoffBranchId: String(branchList[0]?.id ?? ""),
        }));
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load booking information:", err);
        setError(errorMessage(err, "Unable to load booking information."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [carId]);

  const handleBooking = async () => {
    setError("");

    if (!getToken()) {
      // Keep rid/pos so a recommended booking is still attributed after login.
      const returnTo = `/bookings/create?${searchParams.toString()}`;
      router.push(`/login?redirect=${encodeURIComponent(returnTo)}`);
      return;
    }

    if (!car) {
      setError("Car information is missing.");
      return;
    }

    const validationError = validate(details);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      // The server sets user, status, rate, days and totals itself.
      const booking = await apiFetch<Booking>("/bookings", {
        method: "POST",
        body: {
          car_id: car.id,
          pickup_branch_id: Number(details.pickupBranchId),
          dropoff_branch_id: Number(details.dropoffBranchId),
          pickup_date: details.dates.start,
          return_date: details.dates.end,
          notes: details.notes.trim() || null,
        },
      });

      if (!booking?.id) throw new Error("The booking response did not include a booking ID.");

      if (recommendation) {
        postRecommendationEvent({
          event: "book",
          request_id: recommendation.requestId,
          car_id: car.id,
          position: recommendation.position,
        });
      }

      // The payment page shows the server-computed total for this booking.
      router.push(`/payment?booking_id=${booking.id}`);
    } catch (err) {
      console.error("Booking failed:", err);
      setError(
        isApiError(err, 401)
          ? "Your session has expired. Please log in again before booking."
          : isApiError(err, 422)
            ? err.errors.join(" ") || err.message
            : errorMessage(err, "Something went wrong.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoading message="Loading booking information..." />;

  if (!car) {
    return (
      <PageState
        tone="empty"
        icon="car"
        title="Unable to load booking"
        message={error || "Please select a car and try again."}
        action={{ label: "Back to Cars", href: "/cars" }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f8f7] pb-20 pt-28 text-[#202020]">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="mb-8">
          <Link
            href={`/cars/${car.id}`}
            className="text-sm font-medium text-[#77776f] transition hover:text-[#9a783c]"
          >
            ← Back to Car Details
          </Link>
        </div>

        <div className="mb-4">
          <SectionHeader
            level="page"
            eyebrow="Reservation"
            title="Book Your Car"
            description="Choose your dates and locations to complete your reservation."
          />
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
          <RentalDetailsForm
            values={details}
            branches={branches}
            dailyRate={car.daily_rate}
            days={days}
            total={total}
            availability={{
              hasRange: availability.hasRange,
              checking: availability.checking,
              available: availability.availability?.available,
              reason: availability.availability?.reason,
            }}
            error={error}
            submitting={submitting}
            onChange={setDetails}
            onSubmit={handleBooking}
          />

          <SelectedCarSummary car={car} days={days} total={total} />
        </div>
      </div>
    </main>
  );
}
