
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import CarImage from "@/app/components/CarImage";
import { apiFetch, errorMessage, getToken, isApiError } from "@/lib/api";
import { getCarImageUrl, getLocalCarImage } from "@/lib/car-images";
import type {
  Booking,
  Branch,
  Car as ApiCar,
  CarAvailability,
} from "@/lib/types";

/** The API has no `name` column; kept optional so the brand/model fallbacks still read. */
type Car = ApiCar & { name?: string };

/** An availability answer for one exact date range. */
type AvailabilityResult = CarAvailability & { key: string };

function getLocalToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function calculateDays(startDate: string, endDate: string) {
  if (!startDate || !endDate) return 0;

  const [startYear, startMonth, startDay] = startDate
    .split("-")
    .map(Number);

  const [endYear, endMonth, endDay] = endDate
    .split("-")
    .map(Number);

  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const end = Date.UTC(endYear, endMonth - 1, endDay);

  return Math.round((end - start) / 86_400_000);
}

/**
 * Billable days, matching the server: same-day return counts as 1 day.
 * Returns 0 when the range is incomplete or reversed.
 */
function rentalDays(startDate: string, endDate: string) {
  if (!startDate || !endDate || endDate < startDate) return 0;
  return Math.max(1, calculateDays(startDate, endDate));
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CreateBookingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f8f8f7] px-6 pt-24">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-[#e8e4db] border-t-[#c6a15b]" />
        </main>
      }
    >
      <CreateBookingForm />
    </Suspense>
  );
}

function CreateBookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const carId = searchParams.get("car_id");

  const [car, setCar] = useState<Car | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [pickupBranchId, setPickupBranchId] = useState("");
  const [dropoffBranchId, setDropoffBranchId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState("");
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);

  // Client-side estimate only; the server computes the authoritative total.
  const days = rentalDays(startDate, endDate);
  const total = days > 0 && car ? days * Number(car.daily_rate) : 0;

  const rangeKey = days > 0 ? `${startDate}|${endDate}` : "";
  const currentAvailability =
    availability && availability.key === rangeKey ? availability : null;
  const checkingAvailability = Boolean(rangeKey) && !currentAvailability;

  useEffect(() => {
    if (!car?.id || !rangeKey) return;

    let cancelled = false;
    const [pickup, dropoff] = rangeKey.split("|");
    const query = new URLSearchParams({ pickup_date: pickup, return_date: dropoff });

    (async () => {
      try {
        const result = await apiFetch<CarAvailability>(
          `/cars/${car.id}/availability?${query}`,
          { auth: false }
        );
        if (!cancelled) setAvailability({ ...result, key: rangeKey });
      } catch (err) {
        if (cancelled) return;
        setAvailability({
          key: rangeKey,
          available: false,
          reason: errorMessage(err, "Could not check availability for these dates."),
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [car?.id, rangeKey]);

  const carImage = car
    ? getCarImageUrl(
        car.image,
        car.brand,
        car.model,
        car.name
      )
    : null;

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        if (!carId || !/^\d+$/.test(carId)) {
          throw new Error("Invalid car selection. Please choose a car first.");
        }

        const [selectedCar, branchList] = await Promise.all([
          apiFetch<Car>(`/cars/${carId}`, { auth: false }),
          apiFetch<Branch[]>("/branches", { auth: false }),
        ]);

        if (!selectedCar?.id) {
          throw new Error("Car information could not be found.");
        }

        if (!Array.isArray(branchList)) {
          throw new Error("Unable to load branch information.");
        }

        if (cancelled) return;

        setCar(selectedCar);
        setBranches(branchList);

        if (selectedCar.branch?.id) {
          setPickupBranchId(String(selectedCar.branch.id));
        } else if (branchList.length > 0) {
          setPickupBranchId(String(branchList[0].id));
        }

        if (branchList.length > 0) {
          setDropoffBranchId(String(branchList[0].id));
        }
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to load booking information:", err);
        setError(errorMessage(err, "Unable to load booking information."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [carId]);

  const handleBooking = async () => {
    setError("");

    if (!getToken()) {
      const returnTo = `/bookings/create?car_id=${encodeURIComponent(
        carId || ""
      )}`;

      router.push(`/login?redirect=${encodeURIComponent(returnTo)}`);
      return;
    }

    if (!car) {
      setError("Car information is missing.");
      return;
    }

    if (!pickupBranchId || !dropoffBranchId) {
      setError("Please select pickup and drop-off branches.");
      return;
    }

    if (!startDate || !endDate) {
      setError("Please select pickup and return dates.");
      return;
    }

    if (startDate < getLocalToday()) {
      setError("Pickup date cannot be in the past.");
      return;
    }

    if (endDate < startDate) {
      setError("Return date cannot be before the pickup date.");
      return;
    }

    try {
      setBookingLoading(true);

      // The server sets user, status, rate, days and totals itself.
      const booking = await apiFetch<Booking>("/bookings", {
        method: "POST",
        body: {
          car_id: car.id,
          pickup_branch_id: Number(pickupBranchId),
          dropoff_branch_id: Number(dropoffBranchId),
          pickup_date: startDate,
          return_date: endDate,
          notes: notes.trim() || null,
        },
      });

      if (!booking?.id) {
        throw new Error(
          "The booking response did not include a booking ID."
        );
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
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f8f7] px-6 pt-24">
        <div className="text-center">
          <div className="mx-auto mb-5 h-11 w-11 animate-spin rounded-full border-4 border-[#e8e4db] border-t-[#c6a15b]" />
          <p className="text-sm text-[#77776f]">
            Loading booking information...
          </p>
        </div>
      </main>
    );
  }

  if (!car) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f8f7] px-6 pt-24">
        <div className="w-full max-w-lg rounded-3xl border border-[#e8e4db] bg-white p-8 text-center sm:p-10">
          <div className="mb-5 text-5xl">🚗</div>
          <h1 className="text-2xl font-bold text-[#0a1411]">
            Unable to load booking
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#77776f]">
            {error || "Please select a car and try again."}
          </p>
          <Link
            href="/cars"
            className="mt-7 inline-flex rounded-xl bg-[#0a1411] px-6 py-3 font-semibold text-white transition hover:bg-[#1a3027]"
          >
            Back to Cars
          </Link>
        </div>
      </main>
    );
  }

  const statusAvailable = car.status?.toLowerCase() === "available";

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

        <div className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-[2px] w-8 bg-[#c6a15b]" />
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#9a783c]">
              Reservation
            </p>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-[#0a1411] md:text-5xl">
            Book Your Car
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#77776f] sm:text-base">
            Choose your dates and locations to complete your reservation.
          </p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
          {/* Booking Form */}
          <section className="rounded-3xl border border-[#e8e4db] bg-white p-6 shadow-[0_8px_30px_rgba(10,20,17,0.03)] sm:p-8">
            <h2 className="text-2xl font-bold text-[#0a1411]">
              Rental Details
            </h2>
            <p className="mt-2 text-sm text-[#898981]">
              Select your pickup and return information.
            </p>


            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="pickup-branch"
                  className="mb-2 block text-sm font-semibold text-[#343830]"
                >
                  Pickup Location
                </label>
                <select
                  id="pickup-branch"
                  value={pickupBranchId}
                  onChange={(e) => setPickupBranchId(e.target.value)}
                  className="h-12 w-full rounded-xl border border-[#e8e4db] bg-[#fafaf8] px-4 text-sm text-[#202020] outline-none transition focus:border-[#c6a15b]"
                >
                  <option value="">Select pickup location</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="dropoff-branch"
                  className="mb-2 block text-sm font-semibold text-[#343830]"
                >
                  Drop-off Location
                </label>
                <select
                  id="dropoff-branch"
                  value={dropoffBranchId}
                  onChange={(e) => setDropoffBranchId(e.target.value)}
                  className="h-12 w-full rounded-xl border border-[#e8e4db] bg-[#fafaf8] px-4 text-sm text-[#202020] outline-none transition focus:border-[#c6a15b]"
                >
                  <option value="">Select drop-off location</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="pickup-date"
                  className="mb-2 block text-sm font-semibold text-[#343830]"
                >
                  Pickup Date
                </label>
                <input
                  id="pickup-date"
                  type="date"
                  value={startDate}
                  min={getLocalToday()}
                  onChange={(e) => {
                    const value = e.target.value;
                    setStartDate(value);

                    if (endDate && value && endDate < value) {
                      setEndDate("");
                    }
                  }}
                  className="h-12 w-full rounded-xl border border-[#e8e4db] bg-[#fafaf8] px-4 text-sm text-[#202020] outline-none transition focus:border-[#c6a15b]"
                />
              </div>

              <div>
                <label
                  htmlFor="return-date"
                  className="mb-2 block text-sm font-semibold text-[#343830]"
                >
                  Return Date
                </label>
                <input
                  id="return-date"
                  type="date"
                  value={endDate}
                  min={startDate || getLocalToday()}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-12 w-full rounded-xl border border-[#e8e4db] bg-[#fafaf8] px-4 text-sm text-[#202020] outline-none transition focus:border-[#c6a15b]"
                />
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor="booking-notes"
                className="mb-2 block text-sm font-semibold text-[#343830]"
              >
                Notes <span className="font-normal text-[#898981]">(optional)</span>
              </label>
              <textarea
                id="booking-notes"
                rows={3}
                maxLength={1000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything we should know about your rental?"
                className="w-full rounded-xl border border-[#e8e4db] bg-[#fafaf8] px-4 py-3 text-sm text-[#202020] outline-none transition focus:border-[#c6a15b]"
              />
            </div>

            {rangeKey && (
              <div
                role="status"
                className={`mt-6 rounded-xl border px-4 py-3 text-sm leading-6 ${
                  checkingAvailability
                    ? "border-[#e8e4db] bg-[#fafaf8] text-[#77776f]"
                    : currentAvailability?.available
                      ? "border-[#cfe5d6] bg-[#e5f3e9] text-[#216b42]"
                      : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {checkingAvailability
                  ? "Checking availability for these dates..."
                  : currentAvailability?.available
                    ? "This car is available for your selected dates."
                    : currentAvailability?.reason ||
                      "This car is not available for your selected dates."}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
              >
                {error}
              </div>
            )}

            {/* Price Summary */}
            <div className="mt-8 rounded-2xl border border-[#e8e4db] bg-[#fafaf8] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-[#77776f]">
                  Rental Duration
                </span>
                <span className="font-semibold text-[#0a1411]">
                  {days > 0
                    ? `${days} ${days === 1 ? "Day" : "Days"}`
                    : "--"}
                </span>
              </div>

              <div className="my-4 h-px bg-[#e8e4db]" />

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-[#77776f]">Daily Rate</span>
                <span className="font-semibold text-[#0a1411]">
                  {formatPrice(Number(car.daily_rate))} EGP
                </span>
              </div>

              <div className="my-4 h-px bg-[#e8e4db]" />

              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-[#0a1411]">
                  Estimated Total
                </span>
                <span className="text-2xl font-bold text-[#9a783c]">
                  {formatPrice(total)} EGP
                </span>
              </div>

              <p className="mt-3 text-xs leading-5 text-[#898981]">
                This is an estimate. The final total and availability are
                confirmed by the server when you book, and shown on the payment
                page.
              </p>
            </div>

            <button
              type="button"
              onClick={handleBooking}
              disabled={
                bookingLoading ||
                branches.length === 0 ||
                checkingAvailability ||
                currentAvailability?.available === false
              }
              className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#0a1411] px-5 text-base font-semibold text-white transition hover:bg-[#1a3027] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bookingLoading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Confirming Booking...
                </>
              ) : (
                <>
                  Confirm Booking <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </section>

          {/* Selected Car Summary */}
          <aside className="h-fit overflow-hidden rounded-3xl border border-[#e8e4db] bg-white shadow-[0_8px_30px_rgba(10,20,17,0.03)] lg:sticky lg:top-28">
            <div className="bg-[#0a1411] px-6 py-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af6a]">
                Selected Car
              </p>
              <p className="mt-2 text-sm text-white/65">
                Your chosen DriveX vehicle
              </p>
            </div>

            <div className="p-6">
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#eeece6]">
                <CarImage
                  src={
                    carImage ||
                    getLocalCarImage(car.brand, car.model, car.name)
                  }
                  fallbackSrc={getLocalCarImage(car.brand, car.model, car.name)}
                  alt={
                    car.name ||
                    `${car.brand || ""} ${car.model || ""}`.trim() ||
                    "Rental Car"
                  }
                  sizes="380px"
                  className="object-cover"
                />
              </div>

              <div className="mt-5">
                <h2 className="text-2xl font-bold tracking-tight text-[#0a1411]">
                  {car.name ||
                    `${car.brand || ""} ${car.model || ""}`.trim() ||
                    "Rental Car"}
                </h2>

                {car.category?.name && (
                  <p className="mt-2 text-sm text-[#9a783c]">
                    {car.category.name}
                  </p>
                )}

                <span
                  className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    statusAvailable
                      ? "bg-[#e5f3e9] text-[#216b42]"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      statusAvailable ? "bg-[#2c8b52]" : "bg-red-500"
                    }`}
                  />
                  {statusAvailable ? "Available" : "Unavailable"}
                </span>
              </div>

              <div className="mt-6 rounded-2xl bg-[#fafaf8] p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-[#77776f]">Daily Rate</span>
                  <span className="font-semibold text-[#0a1411]">
                    {formatPrice(Number(car.daily_rate))} EGP
                  </span>
                </div>

                <div className="my-4 h-px bg-[#e8e4db]" />

                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm text-[#77776f]">
                    Default Branch
                  </span>
                  <span className="max-w-[160px] text-right text-sm font-semibold text-[#0a1411]">
                    {car.branch?.name || "Choose your branch"}
                  </span>
                </div>

                {days > 0 && (
                  <>
                    <div className="my-4 h-px bg-[#e8e4db]" />
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-[#77776f]">
                        {days} {days === 1 ? "day" : "days"}
                      </span>
                      <span className="font-bold text-[#9a783c]">
                        {formatPrice(total)} EGP
                      </span>
                    </div>
                  </>
                )}
              </div>

              <Link
                href={`/cars/${car.id}`}
                className="mt-5 block text-center text-sm font-semibold text-[#77776f] transition hover:text-[#9a783c]"
              >
                ← Back to Car Details
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
