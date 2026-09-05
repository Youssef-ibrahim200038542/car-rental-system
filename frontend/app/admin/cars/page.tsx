"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Car = {
id: number;
brand: string;
model: string;
year: number;
daily_rate: number;
status: string;
category?: {
id: number;
name: string;
};
branch?: {
id: number;
name: string;
};
};

export default function AdminCarsPage() {
const router = useRouter();

const [cars, setCars] = useState<Car[]>([]);
const [loading, setLoading] = useState(true);
const [deletingId, setDeletingId] = useState<number | null>(null);
const [error, setError] = useState("");

const fetchCars = async () => {
const token = localStorage.getItem("token");


if (!token) {
  router.push("/login");
  return;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

try {
  const response = await fetch(apiUrl + "/cars", {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + token,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load cars.");
  }

  const data = await response.json();

  setCars(data.data || []);
} catch (err) {
  setError(
    err instanceof Error ? err.message : "Failed to load cars."
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

  fetchCars();
} catch {
  localStorage.removeItem("user");
  router.push("/login");
}


}, [router]);

const handleDelete = async (id: number) => {
const confirmed = window.confirm(
"Are you sure you want to delete this car?"
);


if (!confirmed) {
  return;
}

const token = localStorage.getItem("token");
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

setDeletingId(id);
setError("");

try {
  const response = await fetch(apiUrl + "/cars/" + id, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + token,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete car.");
  }

  setCars((currentCars) =>
    currentCars.filter((car) => car.id !== id)
  );
} catch (err) {
  setError(
    err instanceof Error ? err.message : "Failed to delete car."
  );
} finally {
  setDeletingId(null);
}


};

const availableCars = cars.filter(
(car) => car.status === "available"
).length;

const rentedCars = cars.filter(
(car) => car.status === "rented"
).length;

const getStatusStyle = (status: string) => {
switch (status) {
case "available":
return "bg-green-500/10 text-green-400 border-green-500/20";


  case "rented":
    return "bg-blue-500/10 text-blue-400 border-blue-500/20";

  case "reserved":
    return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";

  case "maintenance":
    return "bg-orange-500/10 text-orange-400 border-orange-500/20";

  case "inactive":
    return "bg-gray-500/10 text-gray-400 border-gray-500/20";

  default:
    return "bg-white/5 text-gray-400 border-white/10";
}


};

if (loading) {
return ( <main className="min-h-screen bg-[#050816] px-6 pb-20 pt-32 text-white"> <div className="mx-auto max-w-7xl"> <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center"> <p className="text-gray-400">Loading cars...</p> </div> </div> </main>
);
}

return ( <main className="min-h-screen bg-[#050816] px-6 pb-20 pt-32 text-white"> <div className="mx-auto max-w-7xl"> <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"> <div> <Link
           href="/admin"
           className="mb-5 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
         >
← Back to Dashboard </Link>


        <h1 className="text-4xl font-bold tracking-tight">
          Manage Cars
        </h1>

        <p className="mt-2 text-gray-400">
          Manage your vehicle fleet.
        </p>
      </div>

      <Link
        href="/admin/cars/create"
        className="rounded-xl bg-blue-500 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600"
      >
        + Add New Car
      </Link>
    </div>

    {error && (
      <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
        {error}
      </div>
    )}

    <div className="mb-8 grid gap-5 md:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-gray-400">Total Cars</p>
        <p className="mt-2 text-3xl font-bold">{cars.length}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-gray-400">Available</p>
        <p className="mt-2 text-3xl font-bold text-green-400">
          {availableCars}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-gray-400">Currently Rented</p>
        <p className="mt-2 text-3xl font-bold text-blue-400">
          {rentedCars}
        </p>
      </div>
    </div>

    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead className="border-b border-white/10 bg-white/[0.02]">
            <tr>
              <th className="px-6 py-5 text-sm font-semibold text-gray-300">
                Vehicle
              </th>

              <th className="px-6 py-5 text-sm font-semibold text-gray-300">
                Category
              </th>

              <th className="px-6 py-5 text-sm font-semibold text-gray-300">
                Branch
              </th>

              <th className="px-6 py-5 text-sm font-semibold text-gray-300">
                Rate
              </th>

              <th className="px-6 py-5 text-sm font-semibold text-gray-300">
                Status
              </th>

              <th className="px-6 py-5 text-right text-sm font-semibold text-gray-300">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {cars.map((car) => (
              <tr
                key={car.id}
                className="transition hover:bg-white/[0.02]"
              >
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-16 items-center justify-center rounded-xl bg-white/5 text-2xl">
                      🚘
                    </div>

                    <div>
                      <p className="font-semibold text-white">
                        {car.brand} {car.model}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {car.year} • ID #{car.id}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-5 text-sm text-gray-300">
                  {car.category?.name || "—"}
                </td>

                <td className="px-6 py-5 text-sm text-gray-300">
                  {car.branch?.name || "—"}
                </td>

                <td className="px-6 py-5">
                  <span className="font-semibold text-white">
                    {Number(car.daily_rate).toLocaleString()} EGP
                  </span>

                  <span className="block text-xs text-gray-500">
                    / day
                  </span>
                </td>

                <td className="px-6 py-5">
                  <span
                    className={
                      "rounded-full border px-3 py-1.5 text-xs font-medium capitalize " +
                      getStatusStyle(car.status)
                    }
                  >
                    {car.status}
                  </span>
                </td>

                <td className="px-6 py-5">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={"/cars/" + car.id}
                      className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
                    >
                      View
                    </Link>

                    <Link
                      href={"/admin/cars/edit/" + car.id}
                      className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-400 transition hover:bg-blue-500/20"
                    >
                      Edit
                    </Link>

                    <button
                      onClick={() => handleDelete(car.id)}
                      disabled={deletingId === car.id}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === car.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {cars.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-16 text-center"
                >
                  <p className="text-gray-400">
                    No cars found.
                  </p>

                  <Link
                    href="/admin/cars/create"
                    className="mt-4 inline-block text-sm text-blue-400 hover:text-blue-300"
                  >
                    Add your first car →
                  </Link>
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
