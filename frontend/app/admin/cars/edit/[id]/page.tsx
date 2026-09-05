"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Category = {
id: number;
name: string;
};

type Branch = {
id: number;
name: string;
};

type Car = {
id: number;
category_id: number;
branch_id: number;
brand: string;
model: string;
year: number;
color: string | null;
license_plate: string;
vin: string;
mileage: number;
fuel_type: string;
transmission: string;
seats: number;
daily_rate: number;
status: string;
description: string | null;
};

export default function EditCarPage() {
const router = useRouter();
const params = useParams();

const carId = params.id;

const [categories, setCategories] = useState<Category[]>([]);
const [branches, setBranches] = useState<Branch[]>([]);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [error, setError] = useState("");

const [form, setForm] = useState({
category_id: "",
branch_id: "",
brand: "",
model: "",
year: "",
color: "",
license_plate: "",
vin: "",
mileage: "0",
fuel_type: "petrol",
transmission: "automatic",
seats: "5",
daily_rate: "",
status: "available",
description: "",
});

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

Promise.all([
  fetch(apiUrl + "/cars/" + carId, {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + token,
    },
  }),
  fetch(apiUrl + "/car-categories", {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + token,
    },
  }),
  fetch(apiUrl + "/branches", {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + token,
    },
  }),
])
  .then(async ([carResponse, categoriesResponse, branchesResponse]) => {
    if (
      !carResponse.ok ||
      !categoriesResponse.ok ||
      !branchesResponse.ok
    ) {
      throw new Error("Failed to load car data.");
    }

    const carData = await carResponse.json();
    const categoriesData = await categoriesResponse.json();
    const branchesData = await branchesResponse.json();

    const car: Car = carData.data;

    setCategories(categoriesData.data || []);
    setBranches(branchesData.data || []);

    setForm({
      category_id: String(car.category_id),
      branch_id: String(car.branch_id),
      brand: car.brand || "",
      model: car.model || "",
      year: String(car.year),
      color: car.color || "",
      license_plate: car.license_plate || "",
      vin: car.vin || "",
      mileage: String(car.mileage ?? 0),
      fuel_type: car.fuel_type || "petrol",
      transmission: car.transmission || "automatic",
      seats: String(car.seats ?? 5),
      daily_rate: String(car.daily_rate ?? ""),
      status: car.status || "available",
      description: car.description || "",
    });
  })
  .catch((err) => {
    setError(
      err instanceof Error
        ? err.message
        : "Failed to load car data."
    );
  })
  .finally(() => {
    setLoading(false);
  });


}, [carId, router]);

const handleChange = (
e: React.ChangeEvent<
HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
>
) => {
setForm({
...form,
[e.target.name]: e.target.value,
});
};

const handleSubmit = async (e: FormEvent) => {
e.preventDefault();


setSaving(true);
setError("");

const token = localStorage.getItem("token");
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

try {
  const response = await fetch(apiUrl + "/cars/" + carId, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({
      category_id: Number(form.category_id),
      branch_id: Number(form.branch_id),
      brand: form.brand,
      model: form.model,
      year: Number(form.year),
      color: form.color || null,
      license_plate: form.license_plate,
      vin: form.vin,
      mileage: Number(form.mileage),
      fuel_type: form.fuel_type,
      transmission: form.transmission,
      seats: Number(form.seats),
      daily_rate: Number(form.daily_rate),
      status: form.status,
      description: form.description || null,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    if (data.errors) {
      const firstError = Object.values(data.errors)
        .flat()
        .find((message) => typeof message === "string");

      throw new Error(
        firstError || data.message || "Failed to update car."
      );
    }

    throw new Error(data.message || "Failed to update car.");
  }

  router.push("/admin/cars");
} catch (err) {
  setError(
    err instanceof Error ? err.message : "Something went wrong."
  );
  setSaving(false);
}


};

if (loading) {
return ( <main className="min-h-screen bg-[#050816] px-6 pb-20 pt-32 text-white"> <div className="mx-auto max-w-7xl"> <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center"> <p className="text-gray-400">Loading car...</p> </div> </div> </main>
);
}

return ( <main className="min-h-screen bg-[#050816] px-6 pb-20 pt-32 text-white"> <div className="mx-auto max-w-5xl"> <div className="mb-10"> <Link
         href="/admin/cars"
         className="mb-5 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
       >
← Back to Manage Cars </Link>


      <h1 className="text-4xl font-bold tracking-tight">
        Edit Car
      </h1>

      <p className="mt-2 text-gray-400">
        Update the information of this vehicle.
      </p>
    </div>

    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/20 md:p-8"
    >
      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mb-10">
        <h2 className="mb-5 text-xl font-semibold">
          Vehicle Information
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Brand
            </label>
            <input
              type="text"
              name="brand"
              value={form.brand}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-blue-500/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Model
            </label>
            <input
              type="text"
              name="model"
              value={form.model}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-blue-500/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Year
            </label>
            <input
              type="number"
              name="year"
              value={form.year}
              onChange={handleChange}
              min="1900"
              max="2100"
              required
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-blue-500/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Color
            </label>
            <input
              type="text"
              name="color"
              value={form.color}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-blue-500/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Category
            </label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-500/50"
            >
              <option value="" disabled>
                Select category
              </option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Branch
            </label>
            <select
              name="branch_id"
              value={form.branch_id}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-500/50"
            >
              <option value="" disabled>
                Select branch
              </option>

              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="mb-5 text-xl font-semibold">
          Vehicle Details
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              License Plate
            </label>
            <input
              type="text"
              name="license_plate"
              value={form.license_plate}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-blue-500/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              VIN
            </label>
            <input
              type="text"
              name="vin"
              value={form.vin}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-blue-500/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Mileage
            </label>
            <input
              type="number"
              name="mileage"
              value={form.mileage}
              onChange={handleChange}
              min="0"
              required
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-500/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Seats
            </label>
            <input
              type="number"
              name="seats"
              value={form.seats}
              onChange={handleChange}
              min="1"
              max="20"
              required
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-500/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Fuel Type
            </label>
            <select
              name="fuel_type"
              value={form.fuel_type}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-500/50"
            >
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="hybrid">Hybrid</option>
              <option value="electric">Electric</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Transmission
            </label>
            <select
              name="transmission"
              value={form.transmission}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-500/50"
            >
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="mb-5 text-xl font-semibold">
          Rental Settings
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Daily Rate
            </label>
            <input
              type="number"
              name="daily_rate"
              value={form.daily_rate}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-blue-500/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-500/50"
            >
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Description
        </label>

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={5}
          className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-blue-500/50"
        />
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
        <Link
          href="/admin/cars"
          className="rounded-xl border border-white/10 px-6 py-3 text-center text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-blue-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving Changes..." : "Save Changes"}
        </button>
      </div>
    </form>
  </div>
</main>


);
}
