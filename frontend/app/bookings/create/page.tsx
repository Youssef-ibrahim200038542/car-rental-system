
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Branch = {
  id: number;
  name: string;
  city?: string;
  location?: string;
};

type Car = {
  id: number;
  name?: string;
  brand?: string;
  model?: string;
  daily_rate: number;
  status: string;
  image?: string | null;
  category?: {
    id: number;
    name: string;
  } | null;
  branch?: Branch | null;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

function getBackendUrl() {
  return API_URL.replace(/\/api\/?$/, "");
}

function getCarImage(image?: string | null) {
  if (!image) return null;

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  let imagePath = image.replace(/^\/+/, "");
  imagePath = imagePath.replace(/^public\//, "");

  if (!imagePath.startsWith("images/")) {
    imagePath = `images/cars/${imagePath}`;
  }

  return `${getBackendUrl()}/${imagePath}`;
}

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

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CreateBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const carId = searchParams.get("car_id");

  const [car, setCar] = useState<Car | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [pickupBranchId, setPickupBranchId] = useState("");
  const [dropoffBranchId, setDropoffBranchId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState("");

  const days = calculateDays(startDate, endDate);
  const total = days > 0 && car ? days * Number(car.daily_rate) : 0;
  const carImage = getCarImage(car?.image);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      if (!carId || !/^\d+$/.test(carId)) {
        setError("Invalid car selection. Please choose a car first.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [carResponse, branchesResponse] = await Promise.all([
          fetch(`${API_URL}/cars/${carId}`, {
            headers: { Accept: "application/json" },
          }),
          fetch(`${API_URL}/branches`, {
            headers: { Accept: "application/json" },
          }),
        ]);

        const carData = await carResponse.json();
        const branchesData = await branchesResponse.json();

        if (!carResponse.ok) {
          throw new Error(carData.message || "Failed to load car.");
        }

        if (!branchesResponse.ok) {
          throw new Error(
            branchesData.message || "Failed to load branches."
          );
        }

        const selectedCar = carData.data || carData;
        const branchList = branchesData.data || branchesData;

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
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load booking information."
        );
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

    const token = localStorage.getItem("token");
    const userString = localStorage.getItem("user");

    if (!token || !userString) {
      const returnTo = `/bookings/create?car_id=${encodeURIComponent(
        carId || ""
      )}`;

      router.push(`/login?redirect=${encodeURIComponent(returnTo)}`);
      return;
    }

    let user: { id?: number | string };

    try {
      user = JSON.parse(userString);
    } catch {
      setError(
        "Your saved login information is invalid. Please log in again."
      );
      return;
    }

    if (!user?.id) {
      setError(
        "Your saved user information is incomplete. Please log in again."
      );
      return;
    }

    if (!car) {
      setError("Car information is missing.");
      return;
    }

    if (car.status?.toLowerCase() !== "available") {
      setError("This car is currently unavailable.");
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

    if (days <= 0) {
      setError("Return date must be after pickup date.");
      return;
    }

    try {
      setBookingLoading(true);

      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          car_id: car.id,
          pickup_branch_id: Number(pickupBranchId),
          dropoff_branch_id: Number(dropoffBranchId),
          pickup_date: startDate,
          return_date: endDate,
          daily_rate: Number(car.daily_rate),
          total_days: days,
          subtotal: total,
          discount: 0,
          total_amount: total,
          status: "pending",
          notes: null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError(
            "Your session has expired. Please log in again before booking."
          );
          return;
        }

        if (response.status === 422 && data.errors) {
          const validationMessage = Object.values(
            data.errors as Record<string, string[]>
          )
            .flat()
            .join(" ");

          throw new Error(
            validationMessage || data.message || "Please check your booking details."
          );
        }

        throw new Error(data.message || "Booking failed.");
      }

      const booking = data.data || data;

      if (!booking?.id) {
        throw new Error(
          "The booking response did not include a booking ID."
        );
      }

      router.push(`/payment?booking_id=${booking.id}`);
    } catch (err) {
      console.error("Booking failed:", err);

      setError(
        err instanceof Error ? err.message : "Something went wrong."
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

            {!statusAvailable && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                This car is currently unavailable for booking.
              </div>
            )}

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

                    if (endDate && value && endDate <= value) {
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
                Final booking acceptance and availability must be confirmed by
                the server.
              </p>
            </div>

            <button
              type="button"
              onClick={handleBooking}
              disabled={
                bookingLoading ||
                !statusAvailable ||
                branches.length === 0
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
              <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-[#eeece6]">
                {carImage ? (
                  <img
                    src={carImage}
                    alt={
                      car.name ||
                      `${car.brand || ""} ${car.model || ""}`.trim() ||
                      "Rental Car"
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-6xl">
                    🚘
                  </div>
                )}
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
