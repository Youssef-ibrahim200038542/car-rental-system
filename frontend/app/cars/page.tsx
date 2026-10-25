
"use client";

import { getCarImageUrl, getLocalCarImage } from "@/lib/car-images";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
  category?: { id: number; name: string };
};

const categoryAliases: Record<string, string[]> = {
  luxury: ["luxury"],
  suv: ["suv", "suvs"],
  sport: ["sport", "sports", "sports car"],
  economy: ["economy", "economical"],
};

export default function CarsPage() {
  const searchParams = useSearchParams();

  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [fuel, setFuel] = useState("All");
  const [seats, setSeats] = useState("any");
  const [pickup, setPickup] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Read search values passed from the Home page.
  useEffect(() => {
    const typeParam = searchParams.get("type")?.toLowerCase() ?? "";
    const seatsParam = searchParams.get("seats") ?? "any";

    setPickup(searchParams.get("pickup") ?? "");
    setFrom(searchParams.get("from") ?? "");
    setTo(searchParams.get("to") ?? "");
    setSeats(seatsParam);

    if (typeParam) {
      const aliases = categoryAliases[typeParam];

      if (aliases) {
        const matchingCategory = cars.find((car) =>
          aliases.some(
            (alias) =>
              car.category?.name.toLowerCase() === alias ||
              car.brand?.toLowerCase() === alias ||
              car.model?.toLowerCase() === alias
          )
        )?.category?.name;

        if (matchingCategory) {
          setCategory(matchingCategory);
        } else {
          setSearch(typeParam);
        }
      } else {
        setSearch(typeParam);
      }
    } else {
      setCategory("All");
    }
  }, [searchParams, cars]);

  // Fetch cars from Laravel.
  useEffect(() => {
    const fetchCars = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

        const response = await fetch(`${apiUrl}/cars`);

        if (!response.ok) {
          throw new Error("Failed to fetch cars");
        }

        const data = await response.json();
        setCars(Array.isArray(data.data) ? data.data : []);
      } catch (error) {
        console.error("Error fetching cars:", error);
        setCars([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, []);

  const categories = useMemo(
    () => [
      "All",
      ...new Set(
        cars
          .map((car) => car.category?.name)
          .filter((name): name is string => Boolean(name))
      ),
    ],
    [cars]
  );

  const fuels = useMemo(
    () => [
      "All",
      ...new Set(
        cars
          .map((car) => car.fuel_type)
          .filter((type): type is string => Boolean(type))
      ),
    ],
    [cars]
  );

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const query = search.toLowerCase().trim();

      const matchesSearch =
        !query ||
        `${car.brand ?? ""} ${car.model ?? ""} ${car.name ?? ""} ${
          car.category?.name ?? ""
        }`
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        category === "All" || car.category?.name === category;

      const matchesFuel = fuel === "All" || car.fuel_type === fuel;

      const requestedSeats = Number(seats);
      const matchesSeats =
        seats === "any" ||
        (seats === "7"
          ? (car.seats ?? 0) >= 7
          : car.seats === requestedSeats);

      const matchesPickup =
        !pickup.trim() ||
        `${car.name} ${car.brand ?? ""} ${car.model ?? ""} ${
          car.category?.name ?? ""
        }`
          .toLowerCase()
          .includes(pickup.trim().toLowerCase());

      return (
        matchesSearch &&
        matchesCategory &&
        matchesFuel &&
        matchesSeats &&
        matchesPickup
      );
    });
  }, [cars, search, category, fuel, seats, pickup]);

  const availableCars = cars.filter(
    (car) => car.status?.toLowerCase() === "available"
  ).length;

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setFuel("All");
    setSeats("any");
    setPickup("");
    setFrom("");
    setTo("");
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <main className="min-h-screen bg-[#f8f8f7] pb-20 text-[#202020]">
      <section className="px-5 pb-8 pt-32 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 border-b border-[#e8e6e1] pb-8 md:flex-row md:items-end">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <span className="h-[2px] w-8 bg-[#c6a15b]" />
                <span className="text-xs font-bold uppercase tracking-[0.24em] text-[#9a783c]">
                  The DriveX Collection
                </span>
              </div>

              <h1 className="text-4xl font-semibold tracking-tight text-[#0a1411] sm:text-5xl lg:text-6xl">
                Find your <span className="text-[#b08b48]">drive.</span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-[#777777] sm:text-base">
                Explore our collection and find the right car for your next
                journey, whether it&apos;s a city drive or a weekend escape.
              </p>
            </div>

            <div className="flex items-center gap-4 self-start rounded-2xl border border-[#e8e6e1] bg-white px-5 py-4 md:self-auto">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5efdf] text-[#a7833e]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-6 w-6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path
                    d="M3 13.5 5 8a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 8l2 5.5V19h-2v-2H5v2H3v-5.5Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 13h14M7 10h.01M17 10h.01"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div>
                <p className="text-2xl font-semibold text-[#0a1411]">
                  {loading ? "—" : cars.length}
                </p>
                <p className="mt-1 text-xs text-[#777777]">
                  Cars in our collection
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center justify-between rounded-xl bg-[#0a1411] px-5 py-4 text-white">
              <span className="text-sm text-white/70">Available cars</span>
              <span className="text-xl font-semibold text-[#d4af6a]">
                {loading ? "—" : availableCars}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#e8e6e1] bg-white px-5 py-4">
              <span className="text-sm text-[#777777]">Categories</span>
              <span className="text-xl font-semibold text-[#0a1411]">
                {loading ? "—" : Math.max(categories.length - 1, 0)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#e8e6e1] bg-white px-5 py-4">
              <span className="text-sm text-[#777777]">Fuel options</span>
              <span className="text-xl font-semibold text-[#0a1411]">
                {loading ? "—" : Math.max(fuels.length - 1, 0)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-[#e8e6e1] bg-white p-4 shadow-[0_4px_20px_rgba(10,20,17,0.03)] sm:p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.6fr_1fr_1fr_auto]">
              <div className="relative">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#999999]"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <circle cx="10.8" cy="10.8" r="6.8" />
                  <path d="m16 16 4 4" strokeLinecap="round" />
                </svg>

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by car, brand..."
                  className="h-12 w-full rounded-xl border border-[#e8e6e1] bg-[#fafaf9] pl-12 pr-4 text-sm text-[#202020] outline-none transition focus:border-[#c6a15b] focus:bg-white"
                />
              </div>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-12 w-full rounded-xl border border-[#e8e6e1] bg-[#fafaf9] px-4 text-sm text-[#333333] outline-none transition focus:border-[#c6a15b] focus:bg-white"
                aria-label="Filter by category"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item === "All" ? "All Categories" : item}
                  </option>
                ))}
              </select>

              <select
                value={fuel}
                onChange={(e) => setFuel(e.target.value)}
                className="h-12 w-full rounded-xl border border-[#e8e6e1] bg-[#fafaf9] px-4 text-sm text-[#333333] outline-none transition focus:border-[#c6a15b] focus:bg-white"
                aria-label="Filter by fuel type"
              >
                {fuels.map((item) => (
                  <option key={item} value={item}>
                    {item === "All" ? "All Fuel Types" : item}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={clearFilters}
                className="h-12 rounded-xl border border-[#e8e6e1] px-5 text-sm font-medium text-[#555555] transition hover:border-[#c6a15b] hover:bg-[#f5efdf] hover:text-[#0a1411]"
              >
                Clear filters
              </button>
            </div>

            {(pickup || from || to || seats !== "any") && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#efeee9] pt-4 text-xs text-[#777777]">
                <span className="font-semibold text-[#0a1411]">
                  Home search:
                </span>

                {pickup && (
                  <span className="rounded-full bg-[#f5efdf] px-3 py-1.5">
                    Pickup: {pickup}
                  </span>
                )}

                {from && (
                  <span className="rounded-full bg-[#f5efdf] px-3 py-1.5">
                    From: {from}
                  </span>
                )}

                {to && (
                  <span className="rounded-full bg-[#f5efdf] px-3 py-1.5">
                    To: {to}
                  </span>
                )}

                {seats !== "any" && (
                  <span className="rounded-full bg-[#f5efdf] px-3 py-1.5">
                    {seats === "7" ? "7+ seats" : `${seats} seats`}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 py-7">
            <div>
              <h2 className="text-xl font-semibold text-[#0a1411]">
                Explore our fleet
              </h2>
              <p className="mt-1 text-sm text-[#888888]">
                Find the car that fits your journey.
              </p>
            </div>

            <p className="rounded-full bg-[#f0eee8] px-4 py-2 text-sm text-[#555555]">
              <span className="font-semibold text-[#0a1411]">
                {loading ? "..." : filteredCars.length}
              </span>{" "}
              {filteredCars.length === 1 ? "car" : "cars"} found
            </p>
          </div>

          {loading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-2xl border border-[#e8e6e1] bg-white"
                >
                  <div className="aspect-[16/10] animate-pulse bg-[#eae8e2]" />
                  <div className="space-y-4 p-5">
                    <div className="h-3 w-1/3 animate-pulse rounded bg-[#eae8e2]" />
                    <div className="h-5 w-2/3 animate-pulse rounded bg-[#eae8e2]" />
                    <div className="h-4 w-full animate-pulse rounded bg-[#eae8e2]" />
                    <div className="h-11 w-full animate-pulse rounded-xl bg-[#eae8e2]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredCars.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCars.map((car) => {
                const imageUrl = getCarImageUrl(
                  car.image,
                  car.brand,
                  car.model,
                  car.name
                );

                const isAvailable =
                  car.status?.toLowerCase() === "available";

                return (
                  <article
                    key={car.id}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#e8e6e1] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#d8c49c] hover:shadow-[0_16px_40px_rgba(10,20,17,0.09)]"
                  >
                    <Link
                      href={`/cars/${car.id}`}
                      className="relative block aspect-[16/10] overflow-hidden bg-[#efeee9]"
                    >
                      <img
                        src={imageUrl}
                        alt={`${car.brand ?? ""} ${car.name}`}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = getLocalCarImage(
                            car.brand,
                            car.model,
                            car.name
                          );
                        }}
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

                      <span
                        className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide backdrop-blur-sm ${
                          isAvailable
                            ? "bg-[#e5f3e9]/95 text-[#216b42]"
                            : "bg-white/90 text-[#555555]"
                        }`}
                      >
                        <span
                          className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                            isAvailable ? "bg-[#2c8b52]" : "bg-[#999999]"
                          }`}
                        />
                        {car.status || "Unavailable"}
                      </span>

                      {car.category?.name && (
                        <span className="absolute right-4 top-4 max-w-[55%] truncate rounded-full border border-white/30 bg-black/35 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-md">
                          {car.category.name}
                        </span>
                      )}

                      <div className="absolute bottom-4 left-4 text-white">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/75">
                          Starting from
                        </p>
                        <p className="mt-1 text-2xl font-semibold">
                          {formatPrice(Number(car.daily_rate) || 0)}
                          <span className="ml-1 text-xs font-normal text-white/80">
                            EGP / day
                          </span>
                        </p>
                      </div>
                    </Link>

                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="truncate text-xs font-bold uppercase tracking-[0.17em] text-[#a7833e]">
                          {car.brand || car.category?.name || "DriveX Select"}
                        </p>
                        {car.year && (
                          <span className="shrink-0 text-xs text-[#888888]">
                            {car.year}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-semibold tracking-tight text-[#0a1411] transition group-hover:text-[#9a783c]">
                        {car.name ||
                          [car.brand, car.model].filter(Boolean).join(" ") ||
                          "Premium Car"}
                      </h3>

                      {car.model && car.name && car.model !== car.name && (
                        <p className="mt-1 text-sm text-[#888888]">
                          {car.model}
                        </p>
                      )}

                      <div className="mt-5 grid grid-cols-2 gap-3 border-y border-[#efeee9] py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f5efdf] text-[#a7833e]">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              className="h-4 w-4"
                              stroke="currentColor"
                              strokeWidth="1.6"
                            >
                              <rect
                                x="3"
                                y="5"
                                width="18"
                                height="15"
                                rx="2"
                              />
                              <path d="M7 3v4M17 3v4M3 10h18" />
                            </svg>
                          </span>
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-[#999999]">
                              Year
                            </p>
                            <p className="mt-0.5 truncate text-xs font-semibold text-[#333333]">
                              {car.year || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f5efdf] text-[#a7833e]">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              className="h-4 w-4"
                              stroke="currentColor"
                              strokeWidth="1.6"
                            >
                              <circle cx="9" cy="8" r="3" />
                              <path
                                d="M3 20v-2a6 6 0 0 1 12 0v2M16 5.5a3 3 0 0 1 0 5.8M18 14a5 5 0 0 1 3 4.6V20"
                                strokeLinecap="round"
                              />
                            </svg>
                          </span>
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-[#999999]">
                              Seats
                            </p>
                            <p className="mt-0.5 truncate text-xs font-semibold text-[#333333]">
                              {car.seats ? `${car.seats} Seats` : "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f5efdf] text-[#a7833e]">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              className="h-4 w-4"
                              stroke="currentColor"
                              strokeWidth="1.6"
                            >
                              <circle cx="12" cy="12" r="9" />
                              <circle cx="12" cy="12" r="2.5" />
                              <path d="m5.6 5.6 4.6 4.6m3.6 3.6 4.6 4.6M18.4 5.6l-4.6 4.6m-3.6 3.6-4.6 4.6" />
                            </svg>
                          </span>
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-[#999999]">
                              Transmission
                            </p>
                            <p className="mt-0.5 truncate text-xs font-semibold text-[#333333]">
                              {car.transmission || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f5efdf] text-[#a7833e]">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              className="h-4 w-4"
                              stroke="currentColor"
                              strokeWidth="1.6"
                            >
                              <path
                                d="M12 3c2.2 3.4 6 7.3 6 11a6 6 0 1 1-12 0c0-3.7 3.8-7.6 6-11Z"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-[#999999]">
                              Fuel
                            </p>
                            <p className="mt-0.5 truncate text-xs font-semibold text-[#333333]">
                              {car.fuel_type || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {car.mileage !== undefined && car.mileage !== null && (
                        <p className="mt-4 text-xs text-[#888888]">
                          Mileage:{" "}
                          <span className="font-medium text-[#555555]">
                            {formatPrice(car.mileage)} km
                          </span>
                        </p>
                      )}

                      <div className="mt-auto pt-5">
                        <Link
                          href={`/cars/${car.id}`}
                          style={{
                            color: "#ffffff",
                            backgroundColor: "#0a1411",
                          }}
                          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition hover:!bg-[#c6a15b] hover:!text-white"
                        >
                          View Details
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-4 w-4 transition-transform group-hover:translate-x-1"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <path
                              d="M5 12h14m-6-6 6 6-6 6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && cars.length > 0 && filteredCars.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#d9d4c8] bg-white px-5 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f5efdf] text-[#a7833e]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-8 w-8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="10.8" cy="10.8" r="6.8" />
                  <path d="m16 16 4 4" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="mt-5 text-xl font-semibold text-[#0a1411]">
                No cars match your search
              </h3>
              <p className="mt-2 text-sm text-[#888888]">
                Try another keyword or adjust your filters.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 rounded-xl bg-[#0a1411] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#172b23]"
              >
                Clear all filters
              </button>
            </div>
          )}

          {!loading && cars.length === 0 && (
            <div className="rounded-2xl border border-[#e8e6e1] bg-white px-5 py-16 text-center">
              <h3 className="text-xl font-semibold text-[#0a1411]">
                Our collection is being updated
              </h3>
              <p className="mt-2 text-sm text-[#888888]">
                No cars are available to display right now. Please check back
                soon.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
