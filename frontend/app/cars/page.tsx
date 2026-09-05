"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Car = {
  id: number;
  name: string;
  brand?: string;
  model?: string;
  year?: number;
  daily_rate: number;
  status: string;
  mileage?: number;
  transmission?: string;
  fuel_type?: string;
  seats?: number;
  image?: string;
  category?: {
    id: number;
    name: string;
  };
};

export default function CarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [fuel, setFuel] = useState("All");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/cars`)
      .then((response) => response.json())
      .then((data) => {
        setCars(data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching cars:", error);
        setLoading(false);
      });
  }, []);

  const getImageUrl = (image?: string) => {
    if (!image) return null;

    return `http://127.0.0.1:8000/${image}`;
  };

  const categories = useMemo(() => {
    const values = cars
      .map((car) => car.category?.name)
      .filter(Boolean) as string[];

    return ["All", ...Array.from(new Set(values))];
  }, [cars]);

  const fuels = useMemo(() => {
    const values = cars
      .map((car) => car.fuel_type)
      .filter(Boolean) as string[];

    return ["All", ...Array.from(new Set(values))];
  }, [cars]);

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        !search ||
        car.brand?.toLowerCase().includes(searchValue) ||
        car.model?.toLowerCase().includes(searchValue) ||
        car.name?.toLowerCase().includes(searchValue) ||
        car.category?.name?.toLowerCase().includes(searchValue);

      const matchesCategory =
        category === "All" || car.category?.name === category;

      const matchesFuel = fuel === "All" || car.fuel_type === fuel;

      return matchesSearch && matchesCategory && matchesFuel;
    });
  }, [cars, search, category, fuel]);

  return (
    <main className="min-h-screen bg-[#05070d] px-6 pb-24 pt-32">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-blue-600/[0.07] blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-amber-500/[0.04] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Hero */}
        <section className="relative mb-16 overflow-hidden rounded-[2.5rem] border border-slate-800/80 bg-gradient-to-br from-[#0b0f1a] via-[#0a0d16] to-[#05070d] px-8 py-14 md:px-14 md:py-20">
          {/* Decorative grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-blue-500/10 blur-[100px]" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-amber-500/[0.06] blur-[100px]" />

          <div className="relative z-10">
            <div className="flex items-center gap-2.5">
              <span className="flex h-1.5 w-1.5">
                <span className="absolute h-1.5 w-1.5 animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-blue-400" />
              </span>

              <p className="text-xs font-bold uppercase tracking-[0.35em] text-blue-400">
                DriveX Fleet
              </p>

              <span className="h-px w-8 bg-gradient-to-r from-amber-400/60 to-transparent" />

              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400/80">
                Premium Selection
              </p>
            </div>

            <div className="mt-6 flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
              <div className="max-w-3xl">
                <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-white md:text-7xl">
                  Find the car that
                  <span className="block bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                    fits your journey.
                  </span>
                </h1>

                <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 md:text-lg">
                  A curated fleet, handled with precision. Every vehicle
                  inspected, detailed, and ready — matched to your style,
                  comfort, and budget.
                </p>
              </div>

              {!loading && (
                <div className="flex shrink-0 gap-4">
                  <div className="rounded-2xl border border-slate-800 bg-[#0b0f1a]/80 px-7 py-6 backdrop-blur-xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Fleet Size
                    </p>

                    <p className="mt-2 text-4xl font-bold text-white">
                      {cars.length}
                    </p>

                    <p className="mt-0.5 text-sm text-slate-500">vehicles</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Stats */}
        {!loading && cars.length > 0 && (
          <section className="mb-10 grid gap-4 sm:grid-cols-3">
            <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0b0f1a] p-6 transition hover:border-emerald-400/30">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-400/[0.06] blur-2xl transition group-hover:bg-emerald-400/[0.12]" />

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Available
              </p>

              <p className="mt-3 text-3xl font-bold text-emerald-400">
                {cars.filter((car) => car.status === "available").length}
              </p>

              <p className="mt-1 text-sm text-slate-500">Ready to rent</p>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0b0f1a] p-6 transition hover:border-blue-400/30">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-400/[0.06] blur-2xl transition group-hover:bg-blue-400/[0.12]" />

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Categories
              </p>

              <p className="mt-3 text-3xl font-bold text-white">
                {categories.length - 1}
              </p>

              <p className="mt-1 text-sm text-slate-500">Vehicle types</p>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0b0f1a] p-6 transition hover:border-amber-400/30">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-400/[0.06] blur-2xl transition group-hover:bg-amber-400/[0.12]" />

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Fuel Options
              </p>

              <p className="mt-3 text-3xl font-bold text-amber-400">
                {fuels.length - 1}
              </p>

              <p className="mt-1 text-sm text-slate-500">Powertrains</p>
            </div>
          </section>
        )}

        {/* Filters */}
        {!loading && cars.length > 0 && (
          <section className="mb-10 rounded-3xl border border-slate-800 bg-[#0b0f1a] p-6 md:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-white">
                  Explore the fleet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Search and filter vehicles to find your match.
                </p>
              </div>

              {(search || category !== "All" || fuel !== "All") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                    setFuel("All");
                  }}
                  className="rounded-full border border-slate-800 px-4 py-2 text-xs font-semibold text-blue-400 transition hover:border-blue-400/30 hover:bg-blue-400/5 hover:text-blue-300"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr]">
              {/* Search */}
              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 6.04 6.04a7.5 7.5 0 0 0 10.61 10.61Z"
                  />
                </svg>

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by brand, model..."
                  className="w-full rounded-xl border border-slate-800 bg-[#05070d] py-3.5 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/50"
                />
              </div>

              {/* Category */}
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl border border-slate-800 bg-[#05070d] px-4 py-3.5 text-sm text-slate-300 outline-none transition focus:border-blue-500/50"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item === "All" ? "All categories" : item}
                  </option>
                ))}
              </select>

              {/* Fuel */}
              <select
                value={fuel}
                onChange={(e) => setFuel(e.target.value)}
                className="rounded-xl border border-slate-800 bg-[#05070d] px-4 py-3.5 text-sm capitalize text-slate-300 outline-none transition focus:border-blue-500/50"
              >
                {fuels.map((item) => (
                  <option key={item} value={item}>
                    {item === "All" ? "All fuel types" : item}
                  </option>
                ))}
              </select>
            </div>
          </section>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-[1.75rem] border border-slate-800 bg-[#0b0f1a]"
              >
                <div className="h-72 animate-pulse bg-[#111726]" />

                <div className="space-y-4 p-6">
                  <div className="h-3 w-20 animate-pulse rounded bg-[#111726]" />
                  <div className="h-7 w-40 animate-pulse rounded bg-[#111726]" />
                  <div className="h-4 w-full animate-pulse rounded bg-[#111726]" />
                  <div className="h-16 animate-pulse rounded-2xl bg-[#111726]" />
                  <div className="h-12 animate-pulse rounded-xl bg-[#111726]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Header */}
        {!loading && cars.length > 0 && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing
              <span className="mx-1 font-semibold text-white">
                {filteredCars.length}
              </span>
              vehicles
            </p>
          </div>
        )}

        {/* Cars */}
        {!loading && filteredCars.length > 0 && (
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {filteredCars.map((car) => {
              const imageUrl = getImageUrl(car.image);

              return (
                <article
                  key={car.id}
                  className="group relative overflow-hidden rounded-[1.75rem] border border-slate-800 bg-[#0b0f1a] shadow-2xl shadow-black/40 transition-all duration-500 hover:-translate-y-1.5 hover:border-blue-400/30 hover:shadow-blue-500/[0.06]"
                >
                  {/* Subtle top accent line on hover */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/0 to-transparent transition-all duration-500 group-hover:via-blue-400/60" />

                  {/* Image */}
                  <div className="relative h-72 overflow-hidden bg-gradient-to-br from-[#0d111f] via-[#0a0d16] to-[#05070d]">
                    {imageUrl ? (
                      <>
                        <img
                          src={imageUrl}
                          alt={`${car.brand ?? ""} ${car.name ?? car.model ?? "Vehicle"}`}
                          className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.08]"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f1a] via-[#0b0f1a]/5 to-transparent" />
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl transition duration-700 group-hover:bg-blue-500/20" />

                        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-slate-800 bg-white/5 backdrop-blur-xl">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            className="h-12 w-12 text-blue-400"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 13l2-5a2 2 0 012-1.3h10A2 2 0 0119 8l2 5M3 13v5a1 1 0 001 1h1a1 1 0 001-1v-1h10v1a1 1 0 001 1h1a1 1 0 001-1v-5M3 13h18M6 13h.01M18 13h.01"
                            />
                          </svg>
                        </div>

                        <p className="mt-4 text-xs font-medium uppercase tracking-[0.25em] text-slate-600">
                          Vehicle image
                        </p>
                      </div>
                    )}

                    {/* Top Badges */}
                    <div className="absolute left-5 top-5 flex items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize backdrop-blur-xl ${
                          car.status === "available"
                            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
                            : "border-yellow-400/20 bg-yellow-400/10 text-yellow-400"
                        }`}
                      >
                        {car.status}
                      </span>

                      <span className="rounded-full border border-slate-800 bg-[#05070d]/70 px-3 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-xl">
                        {car.category?.name ?? "Vehicle"}
                      </span>
                    </div>

                    {/* Price tag floating on image */}
                    <div className="absolute bottom-5 left-5 rounded-xl border border-amber-400/20 bg-[#05070d]/80 px-4 py-2.5 backdrop-blur-xl">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/80">
                        Daily rate
                      </p>

                      <p className="text-lg font-bold leading-tight text-white">
                        {Number(car.daily_rate).toLocaleString()}
                        <span className="ml-1 text-xs font-medium text-slate-400">
                          EGP
                        </span>
                      </p>
                    </div>

                    {/* Hover View */}
                    <div className="absolute bottom-5 right-5 translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-[#05070d]/80 text-white backdrop-blur-xl">
                        →
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
                      {car.brand ?? "Premium Brand"}
                    </p>

                    <h2 className="mt-1.5 truncate text-2xl font-bold tracking-tight text-white">
                      {car.name ?? car.model ?? "Premium Vehicle"}
                    </h2>

                    {/* Specs */}
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-slate-800/80 bg-[#05070d] px-3 py-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-600">
                          Year
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-200">
                          {car.year ?? "—"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800/80 bg-[#05070d] px-3 py-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-600">
                          Seats
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-200">
                          {car.seats ?? "—"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800/80 bg-[#05070d] px-3 py-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-600">
                          Transmission
                        </p>

                        <p className="mt-1 text-sm font-semibold capitalize text-slate-200">
                          {car.transmission ?? "—"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800/80 bg-[#05070d] px-3 py-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-600">
                          Fuel
                        </p>

                        <p className="mt-1 text-sm font-semibold capitalize text-slate-200">
                          {car.fuel_type ?? "—"}
                        </p>
                      </div>
                    </div>

                    {/* Mileage */}
                    {car.mileage !== undefined && (
                      <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-4 text-xs">
                        <span className="text-slate-500">Mileage</span>

                        <span className="font-medium text-slate-300">
                          {Number(car.mileage).toLocaleString()} km
                        </span>
                      </div>
                    )}

                    {/* Button */}
                    <Link
                      href={`/cars/${car.id}`}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/10 transition-all duration-300 hover:bg-blue-500 hover:shadow-blue-500/25"
                    >
                      View Details
                      <span className="transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* No Filter Results */}
        {!loading && cars.length > 0 && filteredCars.length === 0 && (
          <div className="rounded-3xl border border-slate-800 bg-[#0b0f1a] p-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-white/5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="h-8 w-8 text-blue-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 6.04 6.04a7.5 7.5 0 0 0 10.61 10.61Z"
                />
              </svg>
            </div>

            <h2 className="mt-5 text-xl font-bold text-white">
              No matching vehicles
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Try changing your search or filters to discover more vehicles
              from our fleet.
            </p>

            <button
              onClick={() => {
                setSearch("");
                setCategory("All");
                setFuel("All");
              }}
              className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && cars.length === 0 && (
          <div className="rounded-3xl border border-slate-800 bg-[#0b0f1a] p-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-white/5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                className="h-8 w-8 text-blue-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13l2-5a2 2 0 012-1.3h10A2 2 0 0119 8l2 5M3 13v5a1 1 0 001 1h1a1 1 0 001-1v-1h10v1a1 1 0 001 1h1a1 1 0 001-1v-5M3 13h18"
                />
              </svg>
            </div>

            <h2 className="mt-5 text-xl font-bold text-white">
              No cars available
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              There are no vehicles available at the moment.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}