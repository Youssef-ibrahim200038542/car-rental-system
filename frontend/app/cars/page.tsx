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

    const matchesFuel =
        fuel === "All" || car.fuel_type === fuel;

    return matchesSearch && matchesCategory && matchesFuel;
    });


    }, [cars, search, category, fuel]);

    return ( <main className="min-h-screen bg-slate-950 px-6 pb-24 pt-32"> <div className="mx-auto max-w-7xl">


        {/* Hero */}
        <section className="relative mb-14 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-500/[0.08] via-white/[0.03] to-transparent px-7 py-10 md:px-10 md:py-14">

        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-blue-600/5 blur-3xl" />

        <div className="relative z-10">
            <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50" />

            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">
                DriveX Fleet
            </p>
            </div>

            <div className="mt-5 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">

            <div className="max-w-3xl">
                <h1 className="text-4xl font-bold tracking-tight text-white md:text-6xl">
                Find the car that
                <span className="block bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                    fits your journey.
                </span>
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-7 text-gray-400 md:text-lg">
                Explore our carefully selected fleet and find a vehicle
                that matches your style, comfort, and budget.
                </p>
            </div>

            {!loading && (
                <div className="shrink-0 rounded-2xl border border-white/10 bg-black/20 px-6 py-5 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    Fleet Size
                </p>

                <p className="mt-1 text-3xl font-bold text-white">
                    {cars.length}
                </p>

                <p className="text-sm text-gray-500">
                    vehicles
                </p>
                </div>
            )}
            </div>
        </div>
        </section>

        {/* Stats */}
        {!loading && cars.length > 0 && (
        <section className="mb-10 grid gap-4 sm:grid-cols-3">

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                Available
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-400">
                {cars.filter((car) => car.status === "available").length}
            </p>

            <p className="mt-1 text-sm text-gray-500">
                Ready to rent
            </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                Categories
            </p>

            <p className="mt-2 text-2xl font-bold text-white">
                {categories.length - 1}
            </p>

            <p className="mt-1 text-sm text-gray-500">
                Vehicle types
            </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                Fuel Options
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-400">
                {fuels.length - 1}
            </p>

            <p className="mt-1 text-sm text-gray-500">
                Powertrains
            </p>
            </div>

        </section>
        )}

        {/* Filters */}
        {!loading && cars.length > 0 && (
        <section className="mb-10 rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl md:p-6">

            <div className="mb-5 flex items-center justify-between">
            <div>
                <p className="text-sm font-semibold text-white">
                Explore the fleet
                </p>

                <p className="mt-1 text-xs text-gray-500">
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
                className="text-xs font-semibold text-blue-400 transition hover:text-blue-300"
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
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500"
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
                className="w-full rounded-xl border border-white/10 bg-black/20 py-3.5 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500/50 focus:bg-black/30"
                />
            </div>

            {/* Category */}
            <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3.5 text-sm text-gray-300 outline-none transition focus:border-blue-500/50"
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
                className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3.5 text-sm capitalize text-gray-300 outline-none transition focus:border-blue-500/50"
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
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]"
            >
                <div className="h-72 animate-pulse bg-slate-800" />

                <div className="space-y-4 p-6">
                <div className="h-3 w-20 animate-pulse rounded bg-slate-800" />
                <div className="h-7 w-40 animate-pulse rounded bg-slate-800" />
                <div className="h-4 w-full animate-pulse rounded bg-slate-800" />
                <div className="h-16 animate-pulse rounded-2xl bg-slate-800" />
                <div className="h-12 animate-pulse rounded-xl bg-slate-800" />
                </div>
            </div>
            ))}
        </div>
        )}

        {/* Results Header */}
        {!loading && cars.length > 0 && (
        <div className="mb-6 flex items-center justify-between">
            <div>
            <p className="text-sm text-gray-500">
                Showing
                <span className="mx-1 font-semibold text-white">
                {filteredCars.length}
                </span>
                vehicles
            </p>
            </div>
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
                className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/20 transition-all duration-500 hover:-translate-y-2 hover:border-blue-400/30 hover:bg-white/[0.055]"
                >

                {/* Image */}
                <div className="relative h-72 overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950">

                    {imageUrl ? (
                    <>
                        <img
                        src={imageUrl}
                        alt={`${car.brand ?? ""} ${car.name ?? car.model ?? "Vehicle"}`}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />
                    </>
                    ) : (
                    <>
                        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl transition duration-700 group-hover:bg-blue-500/20" />

                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-xl">
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

                        <p className="mt-4 text-xs font-medium uppercase tracking-[0.25em] text-gray-600">
                            Vehicle image
                        </p>
                        </div>
                    </>
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

                    <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-medium text-gray-300 backdrop-blur-xl">
                        {car.category?.name ?? "Vehicle"}
                    </span>

                    </div>

                    {/* Hover View */}
                    <div className="absolute bottom-5 right-5 translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-xl">
                        →
                    </div>
                    </div>

                </div>

                {/* Content */}
                <div className="p-6">

                    <div className="flex items-start justify-between gap-4">

                    <div className="min-w-0">
                        <p className="text-sm font-medium text-blue-400">
                        {car.brand ?? "Premium Brand"}
                        </p>

                        <h2 className="mt-1 truncate text-2xl font-bold tracking-tight text-white">
                        {car.name ?? car.model ?? "Premium Vehicle"}
                        </h2>
                    </div>

                    <div className="shrink-0 text-right">
                        <p className="text-xl font-bold text-white">
                        {Number(car.daily_rate).toLocaleString()}
                        </p>

                        <p className="text-xs text-gray-500">
                        EGP / day
                        </p>
                    </div>

                    </div>

                    {/* Specs */}
                    <div className="mt-6 grid grid-cols-2 gap-2">

                    <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-3">
                        <p className="text-[10px] uppercase tracking-wider text-gray-600">
                        Year
                        </p>

                        <p className="mt-1 text-sm font-semibold text-gray-200">
                        {car.year ?? "—"}
                        </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-3">
                        <p className="text-[10px] uppercase tracking-wider text-gray-600">
                        Seats
                        </p>

                        <p className="mt-1 text-sm font-semibold text-gray-200">
                        {car.seats ?? "—"}
                        </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-3">
                        <p className="text-[10px] uppercase tracking-wider text-gray-600">
                        Transmission
                        </p>

                        <p className="mt-1 text-sm font-semibold capitalize text-gray-200">
                        {car.transmission ?? "—"}
                        </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-3">
                        <p className="text-[10px] uppercase tracking-wider text-gray-600">
                        Fuel
                        </p>

                        <p className="mt-1 text-sm font-semibold capitalize text-gray-200">
                        {car.fuel_type ?? "—"}
                        </p>
                    </div>

                    </div>

                    {/* Mileage */}
                    {car.mileage !== undefined && (
                    <div className="mt-4 flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                        Mileage
                        </span>

                        <span className="font-medium text-gray-300">
                        {Number(car.mileage).toLocaleString()} km
                        </span>
                    </div>
                    )}

                    {/* Button */}
                    <Link
                    href={`/cars/${car.id}`}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/10 transition-all duration-300 hover:bg-blue-600 hover:shadow-blue-500/20"
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
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-16 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
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

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            Try changing your search or filters to discover more vehicles
            from our fleet.
            </p>

            <button
            onClick={() => {
                setSearch("");
                setCategory("All");
                setFuel("All");
            }}
            className="mt-6 rounded-xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
            >
            Reset filters
            </button>

        </div>
        )}

        {/* Empty */}
        {!loading && cars.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-16 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
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

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            There are no vehicles available at the moment.
            </p>

        </div>
        )}

    </div>
    </main>
    );
    }
