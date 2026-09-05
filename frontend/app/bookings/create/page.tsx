"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Branch = {
id: number;
name: string;
city?: string;
};

type Car = {
id: number;
name?: string;
brand?: string;
model?: string;
daily_rate: number;
status: string;
category?: {
id: number;
name: string;
};
branch?: Branch;
};

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

const [days, setDays] = useState(0);
const [total, setTotal] = useState(0);

useEffect(() => {
const token = localStorage.getItem("token");
const user = localStorage.getItem("user");


if (!token || !user) {
  router.push("/login");
  return;
}

const fetchData = async () => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    const carResponse = await fetch(
      apiUrl + "/cars/" + carId
    );

    const carData = await carResponse.json();

    if (!carResponse.ok) {
      throw new Error(
        carData.message || "Failed to load car"
      );
    }

    const branchesResponse = await fetch(
      apiUrl + "/branches"
    );

    const branchesData = await branchesResponse.json();

    if (!branchesResponse.ok) {
      throw new Error(
        branchesData.message || "Failed to load branches"
      );
    }

    const selectedCar = carData.data;

    setCar(selectedCar);

    const branchList = branchesData.data || [];

    setBranches(branchList);

    if (selectedCar.branch?.id) {
      setPickupBranchId(
        String(selectedCar.branch.id)
      );
    }

    if (branchList.length > 0) {
      setDropoffBranchId(
        String(branchList[0].id)
      );
    }
  } catch (err) {
    console.error(err);
    setError("Unable to load booking information.");
  } finally {
    setLoading(false);
  }
};

if (carId) {
  fetchData();
} else {
  setError("Car not found.");
  setLoading(false);
}


}, [carId, router]);

useEffect(() => {
if (!startDate || !endDate || !car) {
setDays(0);
setTotal(0);
return;
}


const start = new Date(startDate);
const end = new Date(endDate);

const difference =
  end.getTime() - start.getTime();

const calculatedDays = Math.ceil(
  difference / (1000 * 60 * 60 * 24)
);

if (calculatedDays > 0) {
  setDays(calculatedDays);
  setTotal(
    calculatedDays * Number(car.daily_rate)
  );
} else {
  setDays(0);
  setTotal(0);
}


}, [startDate, endDate, car]);

const handleBooking = async () => {
setError("");


const token = localStorage.getItem("token");
const userString = localStorage.getItem("user");

if (!token || !userString) {
  router.push("/login");
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

if (days <= 0) {
  setError(
    "Return date must be after pickup date."
  );
  return;
}

try {
  const user = JSON.parse(userString);

  setBookingLoading(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(
    apiUrl + "/bookings",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        user_id: user.id,
        car_id: car.id,
        pickup_branch_id: Number(
          pickupBranchId
        ),
        dropoff_branch_id: Number(
          dropoffBranchId
        ),
        pickup_date: startDate,
        return_date: endDate,
        daily_rate: Number(
          car.daily_rate
        ),
        total_days: days,
        subtotal: total,
        discount: 0,
        total_amount: total,
        status: "pending",
        notes: null,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Booking failed"
    );
  }

  router.push("/payment?booking_id=" + data.data.id);
} catch (err) {
  console.error(err);

  if (err instanceof Error) {
    setError(err.message);
  } else {
    setError("Something went wrong.");
  }
} finally {
  setBookingLoading(false);
}


};

if (loading) {
return ( <main className="min-h-screen bg-[#070b14] px-6 pt-32 text-white"> <div className="mx-auto flex min-h-[400px] max-w-5xl items-center justify-center"> <div className="text-center"> <div className="mx-auto mb-5 h-11 w-11 animate-spin rounded-full border-4 border-white/10 border-t-blue-500"></div>

```
        <p className="text-gray-400">
          Loading booking information...
        </p>
      </div>
    </div>
  </main>
);


}

if (error && !car) {
return ( <main className="min-h-screen bg-[#070b14] px-6 pt-32 text-white"> <div className="mx-auto max-w-3xl rounded-3xl border border-red-500/20 bg-red-500/10 p-10 text-center"> <h1 className="text-2xl font-bold">
Something went wrong </h1>


      <p className="mt-3 text-red-300">
        {error}
      </p>

      <Link
        href="/cars"
        className="mt-7 inline-block rounded-xl bg-blue-500 px-6 py-3 font-semibold hover:bg-blue-600"
      >
        Back to Cars
      </Link>
    </div>
  </main>
);


}

return ( <main className="min-h-screen bg-[#070b14] px-6 pb-20 pt-32 text-white"> <div className="mx-auto max-w-6xl">


    {/* Header */}
    <div className="mb-10">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
        Reservation
      </p>

      <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
        Book Your Car
      </h1>

      <p className="mt-3 text-gray-400">
        Choose your dates and locations to complete your reservation.
      </p>
    </div>

    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

      {/* Form */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">

        <h2 className="text-2xl font-bold">
          Rental Details
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Select your pickup and return information.
        </p>

        {/* Branches */}
        <div className="mt-8 grid gap-5 md:grid-cols-2">

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Pickup Location
            </label>

            <select
              value={pickupBranchId}
              onChange={(e) =>
                setPickupBranchId(e.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-[#0d1320] px-4 py-3.5 text-white outline-none transition focus:border-blue-500"
            >
              {branches.map((branch) => (
                <option
                  key={branch.id}
                  value={branch.id}
                >
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Drop-off Location
            </label>

            <select
              value={dropoffBranchId}
              onChange={(e) =>
                setDropoffBranchId(e.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-[#0d1320] px-4 py-3.5 text-white outline-none transition focus:border-blue-500"
            >
              {branches.map((branch) => (
                <option
                  key={branch.id}
                  value={branch.id}
                >
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Dates */}
        <div className="mt-6 grid gap-5 md:grid-cols-2">

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Pickup Date
            </label>

            <input
              type="date"
              value={startDate}
              min={
                new Date()
                  .toISOString()
                  .split("T")[0]
              }
              onChange={(e) =>
                setStartDate(e.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-[#0d1320] px-4 py-3.5 text-white outline-none transition focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Return Date
            </label>

            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) =>
                setEndDate(e.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-[#0d1320] px-4 py-3.5 text-white outline-none transition focus:border-blue-500"
            />
          </div>

        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Summary */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">

          <div className="flex items-center justify-between">
            <span className="text-gray-400">
              Rental Duration
            </span>

            <span className="font-semibold">
              {days > 0
                ? days +
                  (days === 1
                    ? " Day"
                    : " Days")
                : "--"}
            </span>
          </div>

          <div className="my-4 h-px bg-white/10"></div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">
              Daily Rate
            </span>

            <span className="font-semibold">
              {Number(
                car?.daily_rate || 0
              ).toLocaleString()}{" "}
              EGP
            </span>
          </div>

          <div className="my-4 h-px bg-white/10"></div>

          <div className="flex items-center justify-between">
            <span className="text-gray-300">
              Total
            </span>

            <span className="text-2xl font-bold text-blue-400">
              {total.toLocaleString()} EGP
            </span>
          </div>

        </div>

        {/* Confirm */}
        <button
          onClick={handleBooking}
          disabled={bookingLoading}
          className="mt-6 w-full rounded-xl bg-blue-500 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {bookingLoading
            ? "Confirming Booking..."
            : "Confirm Booking →"}
        </button>

      </div>

      {/* Car Summary */}
      <div className="h-fit rounded-3xl border border-white/10 bg-white/[0.03] p-6 lg:sticky lg:top-28">

        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
          Selected Car
        </p>

        <div className="mt-6 flex h-48 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] text-8xl">
          🚘
        </div>

        <div className="mt-6">
          <h2 className="text-2xl font-bold">
            {car?.name ||
              (
                (car?.brand || "") +
                " " +
                (car?.model || "")
              ).trim() ||
              "Rental Car"}
          </h2>

          {car?.category?.name && (
            <p className="mt-1 text-sm text-gray-500">
              {car.category.name}
            </p>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">

          <div className="flex items-center justify-between">
            <span className="text-gray-400">
              Daily Rate
            </span>

            <span className="font-semibold">
              {Number(
                car?.daily_rate || 0
              ).toLocaleString()}{" "}
              EGP
            </span>
          </div>

          <div className="my-4 h-px bg-white/10"></div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">
              Pickup Branch
            </span>

            <span className="max-w-[170px] text-right text-sm font-medium">
              {car?.branch?.name ||
                "Selected Branch"}
            </span>
          </div>

        </div>

        <Link
          href={"/cars/" + car?.id}
          className="mt-5 block text-center text-sm font-medium text-gray-400 transition hover:text-white"
        >
          ← Back to Car Details
        </Link>

      </div>
    </div>
  </div>
</main>

);
}
