"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import CarCard from "@/app/components/CarCard";
import CarGridSkeleton from "@/app/components/CarGridSkeleton";
import { StateCard } from "@/app/components/StateViews";
import { apiFetch } from "@/lib/api";
import { isCarBookable } from "@/lib/cars";
import { pluralise } from "@/lib/format";
import CarFilters from "./CarFilters";
import CarsHeader from "./CarsHeader";
import { categoryForType, filterCars, optionsFrom, type Car } from "./car-filters";

/** Booking link that pre-fills the dates chosen on the home page. */
function bookingHref(carId: number, from: string, to: string): string {
  const query = new URLSearchParams({ car_id: String(carId), pickup_date: from, return_date: to });
  return `/bookings/create?${query}`;
}

export default function CarsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f8f8f7]" />}>
      <CarsCatalog />
    </Suspense>
  );
}

function CarsCatalog() {
  // Search values passed from the Home page seed the initial filters.
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type")?.toLowerCase() ?? "";

  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [fuel, setFuel] = useState("All");
  const [seats, setSeats] = useState(() => searchParams.get("seats") ?? "any");
  const [pickup, setPickup] = useState(() => searchParams.get("pickup") ?? "");
  const [from, setFrom] = useState(() => searchParams.get("from") ?? "");
  const [to, setTo] = useState(() => searchParams.get("to") ?? "");

  // Fetch cars from Laravel, then apply the `type` shortcut against real categories.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await apiFetch<Car[]>("/cars", { auth: false });
        if (cancelled) return;

        const list = Array.isArray(data) ? data : [];
        setCars(list);
        setLoadError(false);

        if (typeParam) {
          const matchingCategory = categoryForType(list, typeParam);
          if (matchingCategory) {
            setCategory(matchingCategory);
          } else {
            setSearch(typeParam);
          }
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Error fetching cars:", error);
        setCars([]);
        setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [typeParam, reloadKey]);

  const categories = useMemo(() => optionsFrom(cars.map((car) => car.category?.name)), [cars]);
  const fuels = useMemo(() => optionsFrom(cars.map((car) => car.fuel_type)), [cars]);

  const filteredCars = useMemo(
    () => filterCars(cars, { search, category, fuel, seats, pickup }),
    [cars, search, category, fuel, seats, pickup]
  );

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setFuel("All");
    setSeats("any");
    setPickup("");
    setFrom("");
    setTo("");
  };

  const retry = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  return (
    <main className="min-h-screen bg-[#f8f8f7] pb-20 text-[#202020]">
      <CarsHeader
        loading={loading}
        total={cars.length}
        available={cars.filter(isCarBookable).length}
        categories={Math.max(categories.length - 1, 0)}
        fuels={Math.max(fuels.length - 1, 0)}
      />

      <section className="px-5 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <CarFilters
            search={search}
            category={category}
            fuel={fuel}
            categories={categories}
            fuels={fuels}
            homeSearch={{ pickup, from, to, seats }}
            onSearchChange={setSearch}
            onCategoryChange={setCategory}
            onFuelChange={setFuel}
            onClear={clearFilters}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 py-7">
            <div>
              <h2 className="text-xl font-semibold text-[#0a1411]">Explore our fleet</h2>
              <p className="mt-1 text-sm text-[#888888]">Find the car that fits your journey.</p>
            </div>

            <p className="rounded-full bg-[#f0eee8] px-4 py-2 text-sm text-[#555555]">
              <span className="font-semibold text-[#0a1411]">
                {loading ? "..." : filteredCars.length}
              </span>{" "}
              {pluralise(filteredCars.length, "car")} found
            </p>
          </div>

          {from && to && !loading && !loadError && (
            <p className="mb-6 rounded-xl border border-[#e8e6e1] bg-white px-4 py-3 text-sm text-[#555555]">
              Showing the whole fleet. We check each car against {from} – {to} when you book, and
              your dates are filled in for you.
            </p>
          )}

          {loading && <CarGridSkeleton />}

          {!loading && loadError && (
            <StateCard
              tone="error"
              title="We couldn't load the fleet"
              message="Check your connection, then try again."
              action={{ label: "Try Again", onClick: retry }}
            />
          )}

          {!loading && filteredCars.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCars.map((car) => (
                <CarCard
                  key={car.id}
                  car={car}
                  action={
                    from && to
                      ? { label: "Book for these dates", href: bookingHref(car.id, from, to) }
                      : undefined
                  }
                />
              ))}
            </div>
          )}

          {!loading && cars.length > 0 && filteredCars.length === 0 && (
            <StateCard
              tone="empty"
              icon="search"
              title="No cars match your search"
              message="Try another keyword or adjust your filters."
              action={{ label: "Clear all filters", onClick: clearFilters }}
            />
          )}

          {!loading && !loadError && cars.length === 0 && (
            <StateCard
              tone="empty"
              icon="car"
              title="Our collection is being updated"
              message="No cars are available to display right now. Please check back soon."
            />
          )}
        </div>
      </section>
    </main>
  );
}
