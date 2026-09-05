"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Booking = {
id: number;
car_id: number;
pickup_branch_id: number;
dropoff_branch_id: number;
pickup_date: string;
return_date: string;
daily_rate: number;
total_days: number;
subtotal: number;
discount: number;
total_amount: number;
status: string;

car?: {
id: number;
brand?: string;
model?: string;
name?: string;
year?: number;
image?: string;
};

pickup_branch?: {
id: number;
name: string;
};

dropoff_branch?: {
id: number;
name: string;
};
};

export default function PaymentPage() {
const router = useRouter();
const searchParams = useSearchParams();

const bookingId = searchParams.get("booking_id");

const [booking, setBooking] =
useState<Booking | null>(null);

const [paymentMethod, setPaymentMethod] =
useState("card");

const [loading, setLoading] =
useState(true);

const [paymentLoading, setPaymentLoading] =
useState(false);

const [error, setError] =
useState("");

useEffect(() => {
const token = localStorage.getItem("token");
const user = localStorage.getItem("user");


if (!token || !user) {
  router.push("/login");
  return;
}

if (!bookingId) {
  setError("Booking not found.");
  setLoading(false);
  return;
}

const fetchBooking = async () => {
  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(
      apiUrl + "/bookings/" + bookingId,
      {
        headers: {
          Accept: "application/json",
          Authorization:
            "Bearer " + token,
        },
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to load booking."
      );
    }

    setBooking(data.data);
  } catch (err) {
    console.error(err);

    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError(
        "Unable to load booking."
      );
    }
  } finally {
    setLoading(false);
  }
};

fetchBooking();


}, [bookingId, router]);

const handlePayment = async () => {
setError("");


const token =
  localStorage.getItem("token");

if (!token) {
  router.push("/login");
  return;
}

if (!booking) {
  setError(
    "Booking information is missing."
  );
  return;
}

try {
  setPaymentLoading(true);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL;

  const transactionReference =
    "TXN-" +
    Date.now() +
    "-" +
    Math.floor(
      Math.random() * 10000
    );

  const paymentResponse =
    await fetch(
      apiUrl + "/payments",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",

          Authorization:
            "Bearer " + token,
        },

        body: JSON.stringify({
          booking_id: booking.id,

          amount: Number(
            booking.total_amount
          ),

          payment_method:
            paymentMethod,

          payment_status:
            "paid",

          transaction_reference:
            transactionReference,

          paid_at:
            new Date().toISOString(),
        }),
      }
    );

  const paymentData =
    await paymentResponse.json();

  if (!paymentResponse.ok) {
    throw new Error(
      paymentData.message ||
        "Payment failed."
    );
  }

  const bookingResponse =
    await fetch(
      apiUrl +
        "/bookings/" +
        booking.id,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",

          Authorization:
            "Bearer " + token,
        },

        body: JSON.stringify({
          status: "confirmed",
        }),
      }
    );

  const bookingData =
    await bookingResponse.json();

  if (!bookingResponse.ok) {
    throw new Error(
      bookingData.message ||
        "Payment succeeded but booking confirmation failed."
    );
  }

  router.push(
    "/payment/success?booking_id=" +
      booking.id
  );
} catch (err) {
  console.error(err);

  if (err instanceof Error) {
    setError(err.message);
  } else {
    setError(
      "Something went wrong."
    );
  }
} finally {
  setPaymentLoading(false);
}


};

const formatDate = (
date: string
) => {
return new Date(
date
).toLocaleDateString(
"en-GB",
{
day: "2-digit",
month: "short",
year: "numeric",
}
);
};

const getCarImage = () => {
if (!booking?.car?.image) {
return null;
}


const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  "";

const backendUrl =
  apiUrl.replace(
    /\/api\/?$/,
    ""
  );

let imagePath =
  booking.car.image;

if (
  imagePath.startsWith(
    "http://"
  ) ||
  imagePath.startsWith(
    "https://"
  )
) {
  return imagePath;
}

imagePath =
  imagePath.replace(
    /^\/+/,
    ""
  );

if (
  imagePath.startsWith(
    "public/"
  )
) {
  imagePath =
    imagePath.replace(
      /^public\//,
      ""
    );
}

if (
  !imagePath.startsWith(
    "images/"
  )
) {
  imagePath =
    "images/cars/" +
    imagePath;
}

return (
  backendUrl +
  "/" +
  imagePath
);


};

if (loading) {
return ( <main className="min-h-screen bg-[#070b14] px-6 pt-32 text-white"> <div className="mx-auto flex min-h-[400px] max-w-5xl items-center justify-center"> <div className="text-center">


        <div className="mx-auto mb-5 h-11 w-11 animate-spin rounded-full border-4 border-white/10 border-t-blue-500"></div>

        <p className="text-gray-400">
          Loading payment information...
        </p>

      </div>
    </div>
  </main>
);


}

if (error || !booking) {
return ( <main className="min-h-screen bg-[#070b14] px-6 pt-32 text-white"> <div className="mx-auto max-w-3xl rounded-3xl border border-red-500/20 bg-red-500/10 p-10 text-center">


      <div className="text-5xl">
        ⚠️
      </div>

      <h1 className="mt-5 text-2xl font-bold">
        Payment Unavailable
      </h1>

      <p className="mt-3 text-red-300">
        {error ||
          "Booking not found."}
      </p>

      <Link
        href="/bookings"
        className="mt-7 inline-block rounded-xl bg-blue-500 px-6 py-3 font-semibold transition hover:bg-blue-600"
      >
        Back to My Bookings
      </Link>

    </div>
  </main>
);


}

const carName =
booking.car?.name ||
(
(booking.car?.brand ||
"") +
" " +
(booking.car?.model ||
"")
).trim() ||
"Rental Car";

const carImage =
getCarImage();

return ( <main className="min-h-screen bg-[#070b14] px-6 pb-20 pt-32 text-white">


  <div className="mx-auto max-w-6xl">

    <div className="mb-10">

      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
        Secure Checkout
      </p>

      <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
        Complete Your Payment
      </h1>

      <p className="mt-3 text-gray-400">
        Review your reservation and choose your payment method.
      </p>

    </div>

    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">

        <div className="flex items-center gap-4">

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
            💳
          </div>

          <div>

            <h2 className="text-2xl font-bold">
              Payment Method
            </h2>

            <p className="text-sm text-gray-500">
              Select how you would like to pay.
            </p>

          </div>

        </div>

        <div className="mt-8 space-y-4">

          <button
            type="button"
            onClick={() =>
              setPaymentMethod(
                "card"
              )
            }
            className={`w-full rounded-2xl border p-5 text-left transition ${
              paymentMethod ===
              "card"
                ? "border-blue-500 bg-blue-500/10"
                : "border-white/10 bg-black/20 hover:border-white/20"
            }`}
          >

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-4">

                <div className="text-3xl">
                  💳
                </div>

                <div>

                  <p className="font-semibold">
                    Credit / Debit Card
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Pay securely by card
                  </p>

                </div>

              </div>

              <div
                className={`h-5 w-5 rounded-full border ${
                  paymentMethod ===
                  "card"
                    ? "border-blue-500 bg-blue-500"
                    : "border-white/20"
                }`}
              >
                {paymentMethod ===
                  "card" && (
                  <div className="flex h-full items-center justify-center text-xs">
                    ✓
                  </div>
                )}
              </div>

            </div>

          </button>

          <button
            type="button"
            onClick={() =>
              setPaymentMethod(
                "online"
              )
            }
            className={`w-full rounded-2xl border p-5 text-left transition ${
              paymentMethod ===
              "online"
                ? "border-blue-500 bg-blue-500/10"
                : "border-white/10 bg-black/20 hover:border-white/20"
            }`}
          >

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-4">

                <div className="text-3xl">
                  🌐
                </div>

                <div>

                  <p className="font-semibold">
                    Online Payment
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Pay online through our system
                  </p>

                </div>

              </div>

              <div
                className={`h-5 w-5 rounded-full border ${
                  paymentMethod ===
                  "online"
                    ? "border-blue-500 bg-blue-500"
                    : "border-white/20"
                }`}
              >
                {paymentMethod ===
                  "online" && (
                  <div className="flex h-full items-center justify-center text-xs">
                    ✓
                  </div>
                )}
              </div>

            </div>

          </button>

          <button
            type="button"
            onClick={() =>
              setPaymentMethod(
                "cash"
              )
            }
            className={`w-full rounded-2xl border p-5 text-left transition ${
              paymentMethod ===
              "cash"
                ? "border-blue-500 bg-blue-500/10"
                : "border-white/10 bg-black/20 hover:border-white/20"
            }`}
          >

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-4">

                <div className="text-3xl">
                  💵
                </div>

                <div>

                  <p className="font-semibold">
                    Cash
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Pay at the branch
                  </p>

                </div>

              </div>

              <div
                className={`h-5 w-5 rounded-full border ${
                  paymentMethod ===
                  "cash"
                    ? "border-blue-500 bg-blue-500"
                    : "border-white/20"
                }`}
              >
                {paymentMethod ===
                  "cash" && (
                  <div className="flex h-full items-center justify-center text-xs">
                    ✓
                  </div>
                )}
              </div>

            </div>

          </button>

        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-white/10 bg-blue-500/[0.05] p-5">

          <div className="flex gap-3">

            <span className="text-lg">
              🔒
            </span>

            <div>

              <p className="font-medium">
                Secure Payment
              </p>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Your payment information is handled securely.
                This demo does not collect or store real card details.
              </p>

            </div>

          </div>

        </div>

        <button
          onClick={handlePayment}
          disabled={paymentLoading}
          className="mt-6 w-full rounded-xl bg-blue-500 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {paymentLoading
            ? "Processing Payment..."
            : "Pay " +
              Number(
                booking.total_amount
              ).toLocaleString() +
              " EGP →"}
        </button>

        <Link
          href="/bookings"
          className="mt-5 block text-center text-sm font-medium text-gray-500 transition hover:text-white"
        >
          ← Back to My Bookings
        </Link>

      </div>

      <div className="h-fit rounded-3xl border border-white/10 bg-white/[0.03] p-6 lg:sticky lg:top-28">

        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
          Reservation Summary
        </p>

        <div className="mt-6 h-40 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02]">

          {carImage ? (
            <img
              src={carImage}
              alt={carName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-7xl text-gray-500">
              🚘
            </div>
          )}

        </div>

        <h2 className="mt-6 text-2xl font-bold">
          {carName}
        </h2>

        {booking.car?.year && (
          <p className="mt-1 text-sm text-gray-500">
            {booking.car.year}
          </p>
        )}

        <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">

          <div className="flex items-center justify-between gap-4">

            <span className="text-sm text-gray-500">
              Pickup
            </span>

            <span className="text-right text-sm font-medium">
              {formatDate(
                booking.pickup_date
              )}
            </span>

          </div>

          <div className="flex items-center justify-between gap-4">

            <span className="text-sm text-gray-500">
              Return
            </span>

            <span className="text-right text-sm font-medium">
              {formatDate(
                booking.return_date
              )}
            </span>

          </div>

          <div className="h-px bg-white/10"></div>

          <div className="flex items-center justify-between gap-4">

            <span className="text-sm text-gray-500">
              Duration
            </span>

            <span className="text-sm font-medium">
              {booking.total_days}{" "}
              {booking.total_days ===
              1
                ? "Day"
                : "Days"}
            </span>

          </div>

          <div className="flex items-center justify-between gap-4">

            <span className="text-sm text-gray-500">
              Daily Rate
            </span>

            <span className="text-sm font-medium">
              {Number(
                booking.daily_rate
              ).toLocaleString()}{" "}
              EGP
            </span>

          </div>

          <div className="h-px bg-white/10"></div>

          <div className="flex items-center justify-between gap-4">

            <span className="text-gray-300">
              Total
            </span>

            <span className="text-2xl font-bold text-blue-400">
              {Number(
                booking.total_amount
              ).toLocaleString()}{" "}
              EGP
            </span>

          </div>

        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-4">

          <p className="text-xs uppercase tracking-wider text-gray-600">
            Booking ID
          </p>

          <p className="mt-1 font-mono text-sm text-gray-300">
            #{booking.id}
          </p>

        </div>

      </div>

    </div>

  </div>
</main>
);
}
