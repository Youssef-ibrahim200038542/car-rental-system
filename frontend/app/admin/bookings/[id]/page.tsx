"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type User = {
id: number;
name: string;
email: string;
phone?: string | null;
};

type Car = {
id: number;
brand: string;
model: string;
year: number;
color?: string | null;
daily_rate: number;
status: string;
};

type Branch = {
id: number;
name: string;
address?: string | null;
};

type Payment = {
id: number;
amount: number;
payment_method: string;
payment_status: string;
transaction_reference?: string | null;
paid_at?: string | null;
};

type Booking = {
id: number;
user_id: number;
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
notes?: string | null;
user?: User;
car?: Car;
pickup_branch?: Branch;
dropoff_branch?: Branch;
payments?: Payment[];
};

export default function AdminBookingDetailsPage() {
const router = useRouter();
const params = useParams();

const bookingId = params.id;

const [booking, setBooking] = useState<Booking | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [updating, setUpdating] = useState(false);
const [selectedStatus, setSelectedStatus] = useState("");

useEffect(() => {
const token = localStorage.getItem("token");
const storedUser = localStorage.getItem("user");


if (!token || !storedUser) {
  router.push("/login");
  return;
}

try {
  const user = JSON.parse(storedUser);

  if (user.role !== "admin") {
    router.push("/");
    return;
  }
} catch {
  localStorage.removeItem("user");
  router.push("/login");
  return;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

fetch(apiUrl + "/bookings/" + bookingId, {
  headers: {
    Accept: "application/json",
    Authorization: "Bearer " + token,
  },
})
  .then(async (response) => {
    if (!response.ok) {
      throw new Error("Failed to load booking.");
    }

    const data = await response.json();

    setBooking(data.data);
    setSelectedStatus(data.data.status);
  })
  .catch((err) => {
    setError(
      err instanceof Error
        ? err.message
        : "Failed to load booking."
    );
  })
  .finally(() => {
    setLoading(false);
  });


}, [bookingId, router]);

const updateStatus = async () => {
if (!booking) {
return;
}


const token = localStorage.getItem("token");
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

setUpdating(true);
setError("");

try {
  const response = await fetch(
    apiUrl + "/bookings/" + booking.id,
    {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        status: selectedStatus,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update booking status."
    );
  }

  setBooking({
    ...booking,
    status: selectedStatus,
  });
} catch (err) {
  setError(
    err instanceof Error
      ? err.message
      : "Failed to update booking status."
  );
} finally {
  setUpdating(false);
}


};

const formatDate = (date: string) => {
return new Date(date).toLocaleDateString("en-US", {
year: "numeric",
month: "long",
day: "numeric",
});
};

const formatDateTime = (date?: string | null) => {
if (!date) {
return "—";
}


return new Date(date).toLocaleString("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});


};

const getStatusStyle = (status: string) => {
switch (status) {
case "pending":
return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";


  case "confirmed":
    return "border-blue-500/20 bg-blue-500/10 text-blue-400";

  case "active":
    return "border-green-500/20 bg-green-500/10 text-green-400";

  case "completed":
    return "border-purple-500/20 bg-purple-500/10 text-purple-400";

  case "cancelled":
    return "border-red-500/20 bg-red-500/10 text-red-400";

  default:
    return "border-white/10 bg-white/5 text-gray-400";
}


};

if (loading) {
return ( <main className="min-h-screen bg-[#050816] px-6 pb-20 pt-32 text-white"> <div className="mx-auto max-w-6xl"> <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center"> <p className="text-gray-400">Loading booking...</p> </div> </div> </main>
);
}

if (!booking) {
return ( <main className="min-h-screen bg-[#050816] px-6 pb-20 pt-32 text-white"> <div className="mx-auto max-w-6xl"> <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-10 text-center"> <p className="text-red-400">
{error || "Booking not found."} </p>


        <Link
          href="/admin/bookings"
          className="mt-6 inline-block rounded-xl border border-white/10 px-5 py-3 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
        >
          Back to Bookings
        </Link>
      </div>
    </div>
  </main>
);


}

const paidAmount =
booking.payments?.reduce(
(total, payment) =>
payment.payment_status === "paid"
? total + Number(payment.amount)
: total,
0
) || 0;

return ( <main className="min-h-screen bg-[#050816] px-6 pb-20 pt-32 text-white"> <div className="mx-auto max-w-6xl"> <div className="mb-8"> <Link
         href="/admin/bookings"
         className="mb-5 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
       >
← Back to Bookings </Link>


      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm text-blue-400">
            Booking #{booking.id}
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Booking Details
          </h1>

          <p className="mt-2 text-gray-400">
            Complete information about this booking.
          </p>
        </div>

        <span
          className={
            "w-fit rounded-full border px-4 py-2 text-sm font-medium capitalize " +
            getStatusStyle(booking.status)
          }
        >
          {booking.status}
        </span>
      </div>
    </div>

    {error && (
      <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
        {error}
      </div>
    )}

    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Customer
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                {booking.user?.name || "Unknown Customer"}
              </h2>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-lg font-bold text-blue-400">
              {booking.user?.name
                ? booking.user.name.charAt(0).toUpperCase()
                : "?"}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Email
              </p>

              <p className="mt-2 text-sm text-gray-200">
                {booking.user?.email || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Phone
              </p>

              <p className="mt-2 text-sm text-gray-200">
                {booking.user?.phone || "—"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-3xl">
              🚘
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Vehicle
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                {booking.car?.brand || "Unknown"}{" "}
                {booking.car?.model || ""}
              </h2>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Year
              </p>

              <p className="mt-2 text-sm text-gray-200">
                {booking.car?.year || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Color
              </p>

              <p className="mt-2 text-sm capitalize text-gray-200">
                {booking.car?.color || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Car ID
              </p>

              <p className="mt-2 text-sm text-gray-200">
                #{booking.car_id}
              </p>
            </div>
          </div>

          <Link
            href={"/cars/" + booking.car_id}
            className="mt-6 inline-block text-sm font-medium text-blue-400 transition hover:text-blue-300"
          >
            View Vehicle →
          </Link>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <h2 className="mb-6 text-xl font-semibold">
            Rental Period
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Pickup Date
              </p>

              <p className="mt-2 text-lg font-semibold text-white">
                {formatDate(booking.pickup_date)}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                {booking.pickup_branch?.name ||
                  "Pickup Branch"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Return Date
              </p>

              <p className="mt-2 text-lg font-semibold text-white">
                {formatDate(booking.return_date)}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                {booking.dropoff_branch?.name ||
                  "Drop-off Branch"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Duration
              </p>

              <p className="mt-2 font-medium text-white">
                {booking.total_days}{" "}
                {booking.total_days === 1 ? "day" : "days"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Pickup Branch
              </p>

              <p className="mt-2 font-medium text-white">
                {booking.pickup_branch?.name || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Drop-off Branch
              </p>

              <p className="mt-2 font-medium text-white">
                {booking.dropoff_branch?.name || "—"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <h2 className="mb-6 text-xl font-semibold">
            Payment Information
          </h2>

          {booking.payments &&
          booking.payments.length > 0 ? (
            <div className="space-y-4">
              {booking.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-2xl border border-white/10 bg-black/10 p-5"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <p className="font-semibold capitalize text-white">
                        {payment.payment_method}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Transaction:{" "}
                        {payment.transaction_reference ||
                          "—"}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="font-semibold text-white">
                        {Number(
                          payment.amount
                        ).toLocaleString()}{" "}
                        EGP
                      </p>

                      <p
                        className={
                          "mt-1 text-xs font-medium capitalize " +
                          (payment.payment_status ===
                          "paid"
                            ? "text-green-400"
                            : "text-yellow-400")
                        }
                      >
                        {payment.payment_status}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-gray-500">
                    Paid at:{" "}
                    {formatDateTime(payment.paid_at)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
              <p className="text-sm text-yellow-400">
                No payment has been recorded for this
                booking.
              </p>
            </div>
          )}
        </section>

        {booking.notes && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
            <h2 className="mb-4 text-xl font-semibold">
              Notes
            </h2>

            <p className="leading-7 text-gray-300">
              {booking.notes}
            </p>
          </section>
        )}
      </div>

      <div className="space-y-6">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold">
            Booking Summary
          </h2>

          <div className="mt-6 space-y-4">
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-gray-500">
                Daily Rate
              </span>

              <span className="font-medium text-white">
                {Number(
                  booking.daily_rate
                ).toLocaleString()}{" "}
                EGP
              </span>
            </div>

            <div className="flex justify-between gap-4 text-sm">
              <span className="text-gray-500">
                Total Days
              </span>

              <span className="font-medium text-white">
                {booking.total_days}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-sm">
              <span className="text-gray-500">
                Subtotal
              </span>

              <span className="font-medium text-white">
                {Number(
                  booking.subtotal
                ).toLocaleString()}{" "}
                EGP
              </span>
            </div>

            <div className="flex justify-between gap-4 text-sm">
              <span className="text-gray-500">
                Discount
              </span>

              <span className="font-medium text-green-400">
                -{" "}
                {Number(
                  booking.discount || 0
                ).toLocaleString()}{" "}
                EGP
              </span>
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="flex justify-between gap-4">
                <span className="font-semibold text-gray-300">
                  Total
                </span>

                <span className="text-xl font-bold text-blue-400">
                  {Number(
                    booking.total_amount
                  ).toLocaleString()}{" "}
                  EGP
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
              <p className="text-xs text-gray-500">
                Paid Amount
              </p>

              <p className="mt-1 text-lg font-bold text-green-400">
                {paidAmount.toLocaleString()} EGP
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold">
            Update Status
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Change the current status of this booking.
          </p>

          <select
            value={selectedStatus}
            onChange={(e) =>
              setSelectedStatus(e.target.value)
            }
            className="mt-5 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50"
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            onClick={updateStatus}
            disabled={
              updating ||
              selectedStatus === booking.status
            }
            className="mt-4 w-full rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updating
              ? "Updating..."
              : "Update Status"}
          </button>
        </section>
      </div>
    </div>
  </div>
</main>

);
}
