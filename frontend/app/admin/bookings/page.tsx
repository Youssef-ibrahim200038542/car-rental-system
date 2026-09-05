"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type User = {
id: number;
name: string;
email: string;
};

type Car = {
id: number;
brand: string;
model: string;
};

type Payment = {
id: number;
amount: number;
payment_method: string;
payment_status: string;
};

type Booking = {
id: number;
user_id: number;
car_id: number;
pickup_date: string;
return_date: string;
total_days: number;
daily_rate: number;
subtotal: number;
discount: number;
total_amount: number;
status: string;
user?: User;
car?: Car;
payments?: Payment[];
};

export default function AdminBookingsPage() {
const router = useRouter();

const [bookings, setBookings] = useState<Booking[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

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

fetch(apiUrl + "/bookings", {
  headers: {
    Accept: "application/json",
    Authorization: "Bearer " + token,
  },
})
  .then(async (response) => {
    if (!response.ok) {
      throw new Error("Failed to load bookings.");
    }

    const data = await response.json();

    setBookings(data.data || []);
  })
  .catch((err) => {
    setError(
      err instanceof Error
        ? err.message
        : "Failed to load bookings."
    );
  })
  .finally(() => {
    setLoading(false);
  });


}, [router]);

const pendingBookings = bookings.filter(
(booking) => booking.status === "pending"
).length;

const confirmedBookings = bookings.filter(
(booking) => booking.status === "confirmed"
).length;

const activeBookings = bookings.filter(
(booking) => booking.status === "active"
).length;

const totalRevenue = bookings.reduce(
(total, booking) => total + Number(booking.total_amount || 0),
0
);

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

const getPaymentStatus = (booking: Booking) => {
if (!booking.payments || booking.payments.length === 0) {
return "Unpaid";
}


const paid = booking.payments.some(
  (payment) => payment.payment_status === "paid"
);

return paid ? "Paid" : "Pending";


};

const getPaymentStyle = (status: string) => {
if (status === "Paid") {
return "text-green-400";
}


return "text-yellow-400";


};

const formatDate = (date: string) => {
return new Date(date).toLocaleDateString("en-US", {
year: "numeric",
month: "short",
day: "numeric",
});
};

if (loading) {
return ( <main className="min-h-screen bg-[#050816] px-6 pb-20 pt-32 text-white"> <div className="mx-auto max-w-7xl"> <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center"> <p className="text-gray-400">Loading bookings...</p> </div> </div> </main>
);
}

return ( <main className="min-h-screen bg-[#050816] px-6 pb-20 pt-32 text-white"> <div className="mx-auto max-w-7xl"> <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"> <div> <Link
           href="/admin"
           className="mb-5 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
         >
← Back to Dashboard </Link>


        <h1 className="text-4xl font-bold tracking-tight">
          Manage Bookings
        </h1>

        <p className="mt-2 text-gray-400">
          View and manage all customer bookings.
        </p>
      </div>
    </div>

    {error && (
      <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
        {error}
      </div>
    )}

    <div className="mb-8 grid gap-5 md:grid-cols-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-gray-400">Total Bookings</p>
        <p className="mt-2 text-3xl font-bold">
          {bookings.length}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-gray-400">Pending</p>
        <p className="mt-2 text-3xl font-bold text-yellow-400">
          {pendingBookings}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-gray-400">Active</p>
        <p className="mt-2 text-3xl font-bold text-green-400">
          {activeBookings}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-gray-400">Total Value</p>
        <p className="mt-2 text-2xl font-bold text-blue-400">
          {totalRevenue.toLocaleString()} EGP
        </p>
      </div>
    </div>

    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left">
          <thead className="border-b border-white/10 bg-white/[0.02]">
            <tr>
              <th className="px-6 py-5 text-sm font-semibold text-gray-300">
                Booking
              </th>

              <th className="px-6 py-5 text-sm font-semibold text-gray-300">
                Customer
              </th>

              <th className="px-6 py-5 text-sm font-semibold text-gray-300">
                Vehicle
              </th>

              <th className="px-6 py-5 text-sm font-semibold text-gray-300">
                Dates
              </th>

              <th className="px-6 py-5 text-sm font-semibold text-gray-300">
                Amount
              </th>

              <th className="px-6 py-5 text-sm font-semibold text-gray-300">
                Payment
              </th>

              <th className="px-6 py-5 text-sm font-semibold text-gray-300">
                Status
              </th>

              <th className="px-6 py-5 text-right text-sm font-semibold text-gray-300">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {bookings.map((booking) => {
              const paymentStatus = getPaymentStatus(booking);

              return (
                <tr
                  key={booking.id}
                  className="transition hover:bg-white/[0.02]"
                >
                  <td className="px-6 py-5">
                    <p className="font-semibold text-white">
                      #{booking.id}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {booking.total_days}{" "}
                      {booking.total_days === 1 ? "day" : "days"}
                    </p>
                  </td>

                  <td className="px-6 py-5">
                    <p className="font-medium text-white">
                      {booking.user?.name || "Unknown Customer"}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {booking.user?.email || "—"}
                    </p>
                  </td>

                  <td className="px-6 py-5">
                    <p className="font-medium text-white">
                      {booking.car?.brand || "Unknown"}{" "}
                      {booking.car?.model || ""}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Car ID #{booking.car_id}
                    </p>
                  </td>

                  <td className="px-6 py-5">
                    <p className="text-sm text-gray-300">
                      {formatDate(booking.pickup_date)}
                    </p>

                    <p className="my-1 text-xs text-gray-600">
                      to
                    </p>

                    <p className="text-sm text-gray-300">
                      {formatDate(booking.return_date)}
                    </p>
                  </td>

                  <td className="px-6 py-5">
                    <p className="font-semibold text-white">
                      {Number(
                        booking.total_amount
                      ).toLocaleString()}{" "}
                      EGP
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {Number(
                        booking.daily_rate
                      ).toLocaleString()}{" "}
                      EGP/day
                    </p>
                  </td>

                  <td className="px-6 py-5">
                    <span
                      className={
                        "text-sm font-medium " +
                        getPaymentStyle(paymentStatus)
                      }
                    >
                      {paymentStatus}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <span
                      className={
                        "rounded-full border px-3 py-1.5 text-xs font-medium capitalize " +
                        getStatusStyle(booking.status)
                      }
                    >
                      {booking.status}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-right">
                    <Link
                      href={"/admin/bookings/" + booking.id}
                      className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}

            {bookings.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-16 text-center"
                >
                  <p className="text-gray-400">
                    No bookings found.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</main>

);
}
