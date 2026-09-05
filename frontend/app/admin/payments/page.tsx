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

type Booking = {
id: number;
user?: User;
car?: Car;
total_amount: number;
};

type Payment = {
id: number;
booking_id: number;
amount: number;
payment_method: string;
payment_status: string;
transaction_reference?: string | null;
paid_at?: string | null;
booking?: Booking;
};

export default function AdminPaymentsPage() {
const router = useRouter();

const [payments, setPayments] = useState<Payment[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [updatingId, setUpdatingId] = useState<number | null>(null);

const fetchPayments = async () => {
const token = localStorage.getItem("token");


if (!token) {
  router.push("/login");
  return;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

try {
  const response = await fetch(apiUrl + "/payments", {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + token,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load payments.");
  }

  const data = await response.json();

  setPayments(data.data || []);
} catch (err) {
  setError(
    err instanceof Error
      ? err.message
      : "Failed to load payments."
  );
} finally {
  setLoading(false);
}


};

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

  fetchPayments();
} catch {
  localStorage.removeItem("user");
  router.push("/login");
}


}, [router]);

const updatePaymentStatus = async (
payment: Payment,
status: string
) => {
const token = localStorage.getItem("token");
const apiUrl = process.env.NEXT_PUBLIC_API_URL;


setUpdatingId(payment.id);
setError("");

try {
  const response = await fetch(
    apiUrl + "/payments/" + payment.id,
    {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        payment_status: status,
        paid_at:
          status === "paid"
            ? new Date().toISOString()
            : null,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update payment."
    );
  }

  setPayments((currentPayments) =>
    currentPayments.map((item) =>
      item.id === payment.id
        ? {
            ...item,
            payment_status: status,
            paid_at:
              status === "paid"
                ? new Date().toISOString()
                : null,
          }
        : item
    )
  );
} catch (err) {
  setError(
    err instanceof Error
      ? err.message
      : "Failed to update payment."
  );
} finally {
  setUpdatingId(null);
}


};

const formatDate = (date?: string | null) => {
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

const getPaymentStatusStyle = (status: string) => {
switch (status) {
case "paid":
return "border-green-500/20 bg-green-500/10 text-green-400";


  case "pending":
    return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";

  case "failed":
    return "border-red-500/20 bg-red-500/10 text-red-400";

  case "refunded":
    return "border-purple-500/20 bg-purple-500/10 text-purple-400";

  default:
    return "border-white/10 bg-white/5 text-gray-400";
}


};

if (loading) {
return ( <main className="min-h-screen bg-[#050816] px-6 pb-20 pt-32 text-white"> <div className="mx-auto max-w-7xl"> <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center"> <p className="text-gray-400">
Loading payments... </p> </div> </div> </main>
);
}

const totalPayments = payments.length;

const paidPayments = payments.filter(
(payment) => payment.payment_status === "paid"
);

const pendingPayments = payments.filter(
(payment) => payment.payment_status === "pending"
);

const totalRevenue = paidPayments.reduce(
(total, payment) => total + Number(payment.amount),
0
);

return ( <main className="min-h-screen bg-[#050816] px-6 pb-20 pt-32 text-white"> <div className="mx-auto max-w-7xl"> <div className="mb-10"> <Link
         href="/admin"
         className="mb-5 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
       >
← Back to Dashboard </Link>


      <h1 className="text-4xl font-bold tracking-tight">
        Manage Payments
      </h1>

      <p className="mt-2 text-gray-400">
        Monitor and manage all booking payments.
      </p>
    </div>

    {error && (
      <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
        {error}
      </div>
    )}

    <div className="mb-8 grid gap-5 md:grid-cols-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-gray-400">
          Total Payments
        </p>

        <p className="mt-2 text-3xl font-bold">
          {totalPayments}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-gray-400">
          Paid
        </p>

        <p className="mt-2 text-3xl font-bold text-green-400">
          {paidPayments.length}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-gray-400">
          Pending
        </p>

        <p className="mt-2 text-3xl font-bold text-yellow-400">
          {pendingPayments.length}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-gray-400">
          Total Revenue
        </p>

        <p className="mt-2 text-3xl font-bold text-blue-400">
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
                Payment
              </th>

              <th className="px-6 py-5 text-sm font-semibold text-gray-300">
                Customer
              </th>

              <th className="px-6 py-5 text-sm font-semibold text-gray-300">
                Booking
              </th>

              <th className="px-6 py-5 text-sm font-semibold text-gray-300">
                Method
              </th>

              <th className="px-6 py-5 text-sm font-semibold text-gray-300">
                Amount
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
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className="transition hover:bg-white/[0.02]"
              >
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-lg">
                      💳
                    </div>

                    <div>
                      <p className="font-semibold text-white">
                        Payment #{payment.id}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {formatDate(payment.paid_at)}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-5">
                  <p className="font-medium text-white">
                    {payment.booking?.user?.name ||
                      "Unknown"}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {payment.booking?.user?.email || "—"}
                  </p>
                </td>

                <td className="px-6 py-5">
                  <p className="font-medium text-white">
                    #{payment.booking_id}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {payment.booking?.car?.brand || ""}
                    {" "}
                    {payment.booking?.car?.model || ""}
                  </p>
                </td>

                <td className="px-6 py-5">
                  <span className="capitalize text-sm text-gray-300">
                    {payment.payment_method}
                  </span>
                </td>

                <td className="px-6 py-5">
                  <span className="font-semibold text-white">
                    {Number(
                      payment.amount
                    ).toLocaleString()}{" "}
                    EGP
                  </span>
                </td>

                <td className="px-6 py-5">
                  <span
                    className={
                      "rounded-full border px-3 py-1.5 text-xs font-medium capitalize " +
                      getPaymentStatusStyle(
                        payment.payment_status
                      )
                    }
                  >
                    {payment.payment_status}
                  </span>
                </td>

                <td className="px-6 py-5">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={
                        "/admin/bookings/" +
                        payment.booking_id
                      }
                      className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
                    >
                      Booking
                    </Link>

                    <select
                      value={payment.payment_status}
                      disabled={
                        updatingId === payment.id
                      }
                      onChange={(e) =>
                        updatePaymentStatus(
                          payment,
                          e.target.value
                        )
                      }
                      className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-gray-300 outline-none focus:border-blue-500/50 disabled:opacity-50"
                    >
                      <option value="pending">
                        Pending
                      </option>

                      <option value="paid">
                        Paid
                      </option>

                      <option value="failed">
                        Failed
                      </option>

                      <option value="refunded">
                        Refunded
                      </option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}

            {payments.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-16 text-center"
                >
                  <p className="text-gray-400">
                    No payments found.
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
