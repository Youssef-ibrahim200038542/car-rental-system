
"use client";

import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useState } from "react";
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

type CarForm = {
  category_id: string;
  branch_id: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  license_plate: string;
  vin: string;
  mileage: string;
  fuel_type: string;
  transmission: string;
  seats: string;
  daily_rate: string;
  status: string;
  description: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

const initialForm: CarForm = {
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
};

const inputClass =
  "w-full rounded-xl border border-[#dedbd2] bg-white px-4 py-3 text-sm text-[#0a1411] outline-none transition placeholder:text-[#9b9a91] focus:border-[#c6a15b] focus:ring-2 focus:ring-[#c6a15b]/15";

const selectClass =
  "w-full rounded-xl border border-[#dedbd2] bg-white px-4 py-3 text-sm text-[#0a1411] outline-none transition focus:border-[#c6a15b] focus:ring-2 focus:ring-[#c6a15b]/15";

const labelClass = "mb-2 block text-sm font-semibold text-[#34443b]";

function FormField({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-[#85867c]">{hint}</p>}
    </div>
  );
}

function SectionIcon({ type }: { type: "car" | "details" | "settings" | "description" }) {
  const paths = {
    car: (
      <>
        <path d="m5 11 1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" />
        <path d="M3 11h18v7H3z" />
        <path d="M6 18v2m12-2v2M6 14h.01M18 14h.01" />
      </>
    ),
    details: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1-.1 1.9Z" />
      </>
    ),
    description: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h8" />
      </>
    ),
  };

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3ead7] text-[#96743b]">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        {paths[type]}
      </svg>
    </div>
  );
}

function FormSection({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: "car" | "details" | "settings" | "description";
  children: ReactNode;
}) {
  return (
    <section className="border-b border-[#e9e5dc] py-7 first:pt-0 last:border-b-0">
      <div className="mb-6 flex items-center gap-3">
        <SectionIcon type={icon} />
        <div>
          <h2 className="text-lg font-bold text-[#0a1411]">{title}</h2>
          <p className="mt-0.5 text-sm text-[#85867c]">{subtitle}</p>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function getErrorMessage(data: Record<string, unknown>, fallback: string) {
  const errors = data.errors;

  if (errors && typeof errors === "object") {
    const firstError = Object.values(errors as Record<string, unknown>)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .find((message) => typeof message === "string");

    if (typeof firstError === "string") return firstError;
  }

  return typeof data.message === "string" ? data.message : fallback;
}

export default function EditCarPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const carId = params.id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<CarForm>(initialForm);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!token || !storedUser) {
        router.replace("/login");
        return;
      }

      try {
        const user = JSON.parse(storedUser);

        if (user.role !== "admin") {
          router.replace("/");
          return;
        }
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }

      try {
        const headers = {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        };

        const [carResponse, categoriesResponse, branchesResponse] =
          await Promise.all([
            fetch(`${API_URL}/cars/${carId}`, { headers }),
            fetch(`${API_URL}/car-categories`, { headers }),
            fetch(`${API_URL}/branches`, { headers }),
          ]);

        if (
          carResponse.status === 401 ||
          categoriesResponse.status === 401 ||
          branchesResponse.status === 401
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }

        if (!carResponse.ok || !categoriesResponse.ok || !branchesResponse.ok) {
          throw new Error("Failed to load car information. Please try again.");
        }

        const [carData, categoriesData, branchesData] = await Promise.all([
          carResponse.json(),
          categoriesResponse.json(),
          branchesResponse.json(),
        ]);

        if (cancelled) return;

        const car: Car = carData.data;

        setCategories(categoriesData.data || []);
        setBranches(branchesData.data || []);
        setForm({
          category_id: String(car.category_id),
          branch_id: String(car.branch_id),
          brand: car.brand || "",
          model: car.model || "",
          year: String(car.year ?? ""),
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
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load car information."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [carId, router]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/cars/${carId}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category_id: Number(form.category_id),
          branch_id: Number(form.branch_id),
          brand: form.brand.trim(),
          model: form.model.trim(),
          year: Number(form.year),
          color: form.color.trim() || null,
          license_plate: form.license_plate.trim(),
          vin: form.vin.trim(),
          mileage: Number(form.mileage),
          fuel_type: form.fuel_type,
          transmission: form.transmission,
          seats: Number(form.seats),
          daily_rate: Number(form.daily_rate),
          status: form.status,
          description: form.description.trim() || null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to update car. Please try again.")
        );
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
    return (
      <main className="min-h-screen bg-[#f8f8f7] px-4 pb-16 pt-28 text-[#0a1411] sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-[#e9e5dc] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-[#e9e5dc] border-t-[#c6a15b]" />
            <p className="font-medium text-[#59645c]">Loading vehicle details...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f8f7] px-4 pb-16 pt-28 text-[#0a1411] sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin/cars"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#687269] transition hover:text-[#9a783c]"
        >
          <span aria-hidden="true">←</span>
          Back to Manage Cars
        </Link>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#e7dcc4] bg-[#f3ead7] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#806331]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c6a15b]" />
              Fleet Management
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#0a1411] sm:text-4xl">
              Edit Vehicle
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#73786f] sm:text-base">
              Update vehicle specifications, availability, and rental pricing.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e9e5dc] bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-[#85867c]">
              Vehicle ID
            </p>
            <p className="mt-1 font-bold text-[#0a1411]">#{carId}</p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800"
          >
            <span className="font-bold">!</span>
            <p>{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-3xl border border-[#e9e5dc] bg-white shadow-[0_12px_40px_rgba(10,20,17,0.05)]"
        >
          <div className="border-b border-[#e9e5dc] bg-[#fcfbf8] px-6 py-5 sm:px-8">
            <p className="text-sm text-[#73786f]">
              Fields marked with <span className="font-bold text-[#9a783c]">*</span> are required.
            </p>
          </div>

          <div className="px-6 py-7 sm:px-8 sm:py-9">
            <FormSection
              title="Vehicle Information"
              subtitle="The vehicle's identity and fleet classification"
              icon="car"
            >
              <FormField label="Brand *">
                <input
                  type="text"
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  placeholder="e.g. Toyota"
                  autoComplete="off"
                  required
                  className={inputClass}
                />
              </FormField>

              <FormField label="Model *">
                <input
                  type="text"
                  name="model"
                  value={form.model}
                  onChange={handleChange}
                  placeholder="e.g. Corolla"
                  required
                  className={inputClass}
                />
              </FormField>

              <FormField label="Year *">
                <input
                  type="number"
                  name="year"
                  value={form.year}
                  onChange={handleChange}
                  min="1900"
                  max="2100"
                  required
                  className={inputClass}
                />
              </FormField>

              <FormField label="Color">
                <input
                  type="text"
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  placeholder="e.g. Black"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Category *">
                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  required
                  className={selectClass}
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
              </FormField>

              <FormField label="Branch *">
                <select
                  name="branch_id"
                  value={form.branch_id}
                  onChange={handleChange}
                  required
                  className={selectClass}
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
              </FormField>
            </FormSection>

            <FormSection
              title="Vehicle Details"
              subtitle="Registration, mileage, and technical specifications"
              icon="details"
            >
              <FormField label="License Plate *">
                <input
                  type="text"
                  name="license_plate"
                  value={form.license_plate}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </FormField>

              <FormField label="VIN *" hint="Vehicle Identification Number">
                <input
                  type="text"
                  name="vin"
                  value={form.vin}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </FormField>

              <FormField label="Mileage (km) *">
                <input
                  type="number"
                  name="mileage"
                  value={form.mileage}
                  onChange={handleChange}
                  min="0"
                  required
                  className={inputClass}
                />
              </FormField>

              <FormField label="Number of Seats *">
                <input
                  type="number"
                  name="seats"
                  value={form.seats}
                  onChange={handleChange}
                  min="1"
                  max="20"
                  required
                  className={inputClass}
                />
              </FormField>

              <FormField label="Fuel Type *">
                <select
                  name="fuel_type"
                  value={form.fuel_type}
                  onChange={handleChange}
                  required
                  className={selectClass}
                >
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                </select>
              </FormField>

              <FormField label="Transmission *">
                <select
                  name="transmission"
                  value={form.transmission}
                  onChange={handleChange}
                  required
                  className={selectClass}
                >
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                </select>
              </FormField>
            </FormSection>

            <FormSection
              title="Rental Settings"
              subtitle="Set the daily price and current vehicle status"
              icon="settings"
            >
              <FormField label="Daily Rate (EGP) *">
                <div className="relative">
                  <input
                    type="number"
                    name="daily_rate"
                    value={form.daily_rate}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                    className={`${inputClass} pr-16`}
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#85867c]">
                    EGP / day
                  </span>
                </div>
              </FormField>

              <FormField label="Vehicle Status *">
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  required
                  className={selectClass}
                >
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="rented">Rented</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </select>
                <p className="mt-2 text-xs text-[#85867c]">
                  Controls the current availability shown in the fleet.
                </p>
              </FormField>
            </FormSection>

            <section className="py-7">
              <div className="mb-6 flex items-center gap-3">
                <SectionIcon type="description" />
                <div>
                  <h2 className="text-lg font-bold text-[#0a1411]">
                    Description
                  </h2>
                  <p className="mt-0.5 text-sm text-[#85867c]">
                    Additional information about this vehicle
                  </p>
                </div>
              </div>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                placeholder="Describe the vehicle, its features, or any useful details..."
                className={`${inputClass} resize-y`}
              />
            </section>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#e9e5dc] bg-[#fcfbf8] px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
            <Link
              href="/admin/cars"
              className="inline-flex items-center justify-center rounded-xl border border-[#dcd8cf] bg-white px-6 py-3 text-sm font-semibold text-[#34443b] transition hover:border-[#bdb6a6] hover:bg-[#f8f8f7]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving || categories.length === 0 || branches.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0a1411] px-7 py-3 text-sm font-bold text-[#f8f8f7] shadow-lg shadow-[#0a1411]/10 transition hover:bg-[#1a3027] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving Changes...
                </>
              ) : (
                <>
                  Save Changes
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </div>
        </form>

        <p className="mt-5 text-center text-xs text-[#85867c]">
          DriveX Fleet Management · Vehicle #{carId}
        </p>
      </div>
    </main>
  );
}
