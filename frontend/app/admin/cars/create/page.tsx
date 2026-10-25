
"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Category = {
  id: number;
  name: string;
};

type Branch = {
  id: number;
  name: string;
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

const inputClass =
  "w-full rounded-xl border border-[#e3e1d9] bg-[#fcfcfa] px-4 py-3.5 text-sm text-[#0a1411] outline-none transition placeholder:text-[#a3aaa4] focus:border-[#c6a15b] focus:bg-white focus:ring-4 focus:ring-[#c6a15b]/10";

const labelClass = "mb-2 block text-sm font-semibold text-[#26352d]";

const selectClass =
  "w-full rounded-xl border border-[#e3e1d9] bg-[#fcfcfa] px-4 py-3.5 text-sm text-[#0a1411] outline-none transition focus:border-[#c6a15b] focus:bg-white focus:ring-4 focus:ring-[#c6a15b]/10";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function SectionIcon({ type }: { type: "car" | "details" | "settings" }) {
  if (type === "car") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="m5 11 2-5h10l2 5M3 11h18l-1 8H4l-1-8Z" />
        <path d="M6 15h.01M18 15h.01M7 19v2m10-2v2" />
      </svg>
    );
  }

  if (type === "details") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M8 9h8M8 13h5M8 16h3" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="m19.4 15 .1.1 1.4 1.1-1.5 2.6-1.7-.6a8 8 0 0 1-1.8 1l-.3 1.8h-3l-.3-1.8a8 8 0 0 1-1.8-1l-1.7.6-1.5-2.6 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.5-2.6 1.7.6a8 8 0 0 1 1.8-1l.3-1.8h3l.3 1.8a8 8 0 0 1 1.8 1l1.7-.6 1.5 2.6-1.4 1.1a7 7 0 0 1 0 2Z" />
    </svg>
  );
}

function FormSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: "car" | "details" | "settings";
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-[#eeece5] py-7 first:pt-0 last:border-b-0 last:pb-0 sm:py-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#c6a15b]/25 bg-[#c6a15b]/10 text-[#9a783c]">
          <SectionIcon type={icon} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-[#0a1411]">{title}</h2>
          <p className="mt-1 text-sm leading-5 text-[#68736c]">
            {description}
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export default function CreateCarPage() {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const [form, setForm] = useState<CarForm>({
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
    let cancelled = false;

    const initializePage = async () => {
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
        const [categoriesResponse, branchesResponse] = await Promise.all([
          fetch(`${API_URL}/car-categories`, {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_URL}/branches`, {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const [categoriesData, branchesData] = await Promise.all([
          categoriesResponse.json().catch(() => ({})),
          branchesResponse.json().catch(() => ({})),
        ]);

        if (
          categoriesResponse.status === 401 ||
          branchesResponse.status === 401
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }

        if (!categoriesResponse.ok || !branchesResponse.ok) {
          throw new Error(
            categoriesData.message ||
              branchesData.message ||
              "Failed to load categories or branches."
          );
        }

        if (!cancelled) {
          setCategories(
            Array.isArray(categoriesData.data) ? categoriesData.data : []
          );
          setBranches(
            Array.isArray(branchesData.data) ? branchesData.data : []
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load categories or branches."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initializePage();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [imageFile]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;

    if (!file) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG, or WebP image.");
      e.target.value = "";
      setImageFile(null);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image size must not exceed 5 MB.");
      e.target.value = "";
      setImageFile(null);
      return;
    }

    setError("");
    setImageFile(file);
  };

  const removeImage = () => {
    setImageFile(null);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = new FormData();

      payload.append("category_id", form.category_id);
      payload.append("branch_id", form.branch_id);
      payload.append("brand", form.brand.trim());
      payload.append("model", form.model.trim());
      payload.append("year", form.year);
      payload.append("color", form.color.trim());
      payload.append("license_plate", form.license_plate.trim());
      payload.append("vin", form.vin.trim());
      payload.append("mileage", form.mileage);
      payload.append("fuel_type", form.fuel_type);
      payload.append("transmission", form.transmission);
      payload.append("seats", form.seats);
      payload.append("daily_rate", form.daily_rate);
      payload.append("status", form.status);
      payload.append("description", form.description.trim());

      if (imageFile) {
        payload.append("image", imageFile);
      }

      const response = await fetch(`${API_URL}/cars`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        if (data.errors) {
          const firstError = Object.values(
            data.errors as Record<string, unknown>
          )
            .flat()
            .find((message): message is string => typeof message === "string");

          throw new Error(
            firstError || data.message || "Failed to create car."
          );
        }

        throw new Error(data.message || "Failed to create car.");
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
      <main className="flex min-h-screen items-center justify-center bg-[#f8f8f7] px-5 py-20 text-[#0a1411]">
        <div className="w-full max-w-md rounded-3xl border border-[#e8e5dc] bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-[#e8e5dc] border-t-[#c6a15b]" />
          <p className="text-sm font-medium text-[#68736c]">
            Preparing vehicle form...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f8f7] px-5 py-10 text-[#0a1411] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin/cars"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#68736c] transition hover:text-[#9a783c]"
        >
          <span aria-hidden="true">←</span>
          Back to Manage Cars
        </Link>

        <div className="mb-8 mt-7">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-px w-8 bg-[#c6a15b]" />
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9a783c]">
              Fleet Management
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#0a1411] sm:text-4xl">
            Add New Car
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#68736c] sm:text-base">
            Add a vehicle to your DriveX fleet and configure its specifications,
            location, and rental pricing.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            <span className="font-bold">!</span>
            <p>{error}</p>
          </div>
        )}

        {(categories.length === 0 || branches.length === 0) && !error && (
          <div
            role="status"
            className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800"
          >
            {categories.length === 0 && branches.length === 0
              ? "There are no categories or branches available. Add at least one category and one branch before creating a car."
              : categories.length === 0
                ? "There are no car categories available. Create a category before adding a vehicle."
                : "There are no branches available. Create a branch before adding a vehicle."}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-3xl border border-[#e8e5dc] bg-white shadow-[0_12px_40px_rgba(10,20,17,0.04)]"
        >
          <div className="bg-[#0a1411] px-6 py-6 sm:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#c6a15b]/30 bg-[#c6a15b]/10 text-[#c6a15b]">
                <SectionIcon type="car" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-white">
                  Vehicle Registration
                </h2>
                <p className="mt-1 text-sm text-white/75">
                  Complete the details below to register a new vehicle.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <FormSection
              title="Vehicle Information"
              description="Identify the vehicle and assign it to a category and branch."
              icon="car"
            >
              <div>
                <label htmlFor="brand" className={labelClass}>
                  Brand <span className="text-[#b58b43]">*</span>
                </label>
                <input
                  id="brand"
                  type="text"
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  placeholder="e.g. BMW"
                  autoComplete="off"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="model" className={labelClass}>
                  Model <span className="text-[#b58b43]">*</span>
                </label>
                <input
                  id="model"
                  type="text"
                  name="model"
                  value={form.model}
                  onChange={handleChange}
                  placeholder="e.g. X5"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="year" className={labelClass}>
                  Model Year <span className="text-[#b58b43]">*</span>
                </label>
                <input
                  id="year"
                  type="number"
                  name="year"
                  value={form.year}
                  onChange={handleChange}
                  placeholder="e.g. 2024"
                  min="1900"
                  max="2100"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="color" className={labelClass}>
                  Exterior Color
                </label>
                <input
                  id="color"
                  type="text"
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  placeholder="e.g. Black"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="category_id" className={labelClass}>
                  Category <span className="text-[#b58b43]">*</span>
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  required
                  disabled={categories.length === 0}
                  className={selectClass}
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="branch_id" className={labelClass}>
                  Rental Branch <span className="text-[#b58b43]">*</span>
                </label>
                <select
                  id="branch_id"
                  name="branch_id"
                  value={form.branch_id}
                  onChange={handleChange}
                  required
                  disabled={branches.length === 0}
                  className={selectClass}
                >
                  <option value="" disabled>
                    Select a branch
                  </option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </FormSection>

            <FormSection
              title="Vehicle Details"
              description="Enter the registration details and technical specifications."
              icon="details"
            >
              <div>
                <label htmlFor="license_plate" className={labelClass}>
                  License Plate <span className="text-[#b58b43]">*</span>
                </label>
                <input
                  id="license_plate"
                  type="text"
                  name="license_plate"
                  value={form.license_plate}
                  onChange={handleChange}
                  placeholder="e.g. ABC-1234"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="vin" className={labelClass}>
                  VIN <span className="text-[#b58b43]">*</span>
                </label>
                <input
                  id="vin"
                  type="text"
                  name="vin"
                  value={form.vin}
                  onChange={handleChange}
                  placeholder="Vehicle identification number"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="mileage" className={labelClass}>
                  Mileage (km) <span className="text-[#b58b43]">*</span>
                </label>
                <input
                  id="mileage"
                  type="number"
                  name="mileage"
                  value={form.mileage}
                  onChange={handleChange}
                  min="0"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="seats" className={labelClass}>
                  Number of Seats <span className="text-[#b58b43]">*</span>
                </label>
                <input
                  id="seats"
                  type="number"
                  name="seats"
                  value={form.seats}
                  onChange={handleChange}
                  min="1"
                  max="20"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="fuel_type" className={labelClass}>
                  Fuel Type <span className="text-[#b58b43]">*</span>
                </label>
                <select
                  id="fuel_type"
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
              </div>

              <div>
                <label htmlFor="transmission" className={labelClass}>
                  Transmission <span className="text-[#b58b43]">*</span>
                </label>
                <select
                  id="transmission"
                  name="transmission"
                  value={form.transmission}
                  onChange={handleChange}
                  required
                  className={selectClass}
                >
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
            </FormSection>

            <FormSection
              title="Rental Settings"
              description="Set the daily rental price and current vehicle status."
              icon="settings"
            >
              <div>
                <label htmlFor="daily_rate" className={labelClass}>
                  Daily Rate (EGP) <span className="text-[#b58b43]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="daily_rate"
                    type="number"
                    name="daily_rate"
                    value={form.daily_rate}
                    onChange={handleChange}
                    placeholder="e.g. 1500"
                    min="0.01"
                    step="0.01"
                    required
                    className={`${inputClass} pr-16`}
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#9a783c]">
                    EGP / day
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="status" className={labelClass}>
                  Vehicle Status <span className="text-[#b58b43]">*</span>
                </label>
                <select
                  id="status"
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
              </div>
            </FormSection>

            <section className="border-b border-[#eeece5] py-7 sm:py-8">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-[#0a1411]">
                  Vehicle Image
                </h2>
                <p className="mt-1 text-sm text-[#68736c]">
                  Upload a vehicle photo. JPG, PNG, or WebP, up to 5 MB.
                </p>
              </div>

              <input
                ref={imageInputRef}
                id="image"
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex min-h-48 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#d9d8ce] bg-[#fcfcfa] p-5 text-center transition hover:border-[#c6a15b] hover:bg-[#f8f8f5]"
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Selected vehicle preview"
                    className="max-h-72 w-full rounded-xl object-contain"
                  />
                ) : (
                  <>
                    <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#e8eee7] text-2xl text-[#17251e]">
                      ↑
                    </span>
                    <span className="text-sm font-bold text-[#17251e]">
                      Choose Vehicle Image
                    </span>
                    <span className="mt-1 text-xs text-[#68736c]">
                      Click here to browse your files
                    </span>
                  </>
                )}
              </button>

              {imageFile && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="break-all text-sm text-[#526057]">
                    {imageFile.name}
                  </p>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </section>

            <section className="pt-7 sm:pt-8">
              <label htmlFor="description" className={labelClass}>
                Vehicle Description
              </label>
              <p className="mb-3 text-xs leading-5 text-[#929990]">
                Add useful information about the vehicle, its features, or
                special equipment.
              </p>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                placeholder="Describe the vehicle and its key features..."
                className={`${inputClass} resize-y`}
              />
            </section>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#eeece5] pt-6 sm:flex-row sm:justify-end">
              <Link
                href="/admin/cars"
                className="inline-flex items-center justify-center rounded-xl border border-[#deded5] px-6 py-3 text-sm font-semibold text-[#526057] transition hover:border-[#b9b9ad] hover:bg-[#f8f8f5] hover:text-[#0a1411]"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={
                  saving || categories.length === 0 || branches.length === 0
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c6a15b] px-7 py-3 text-sm font-bold text-[#0a1411] shadow-sm transition hover:bg-[#d4b474] focus:outline-none focus:ring-4 focus:ring-[#c6a15b]/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a1411]/25 border-t-[#0a1411]" />
                    Adding Car...
                  </>
                ) : (
                  <>
                    Add Car to Fleet
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        <p className="mt-5 text-center text-xs text-[#929990]">
          DriveX Fleet Management · All required fields must be completed.
        </p>
      </div>
    </main>
  );
}
