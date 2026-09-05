    "use client";

    import { useState } from "react";

    type Car = {
    id: number;
    category_id: number;
    branch_id: number;
    brand: string;
    model: string;
    year: number;
    color: string;
    license_plate: string;
    vin: string;
    mileage: number;
    fuel_type: string;
    transmission: string;
    seats: number;
    daily_rate: string;
    status: string;
    image?: string | null;
    description?: string;
    category?: {
    id: number;
    name: string;
    };
    branch?: {
    id: number;
    name: string;
    address: string;
    city: string;
    };
    };

    type Recommendation = {
    car: Car;
    score: number;
    reasons: string[];
    estimated_total: number;
    within_budget: boolean;
    };

    type Preferences = {
    budget?: number | null;
    seats?: number | null;
    duration?: number | null;
    fuel_type?: string | null;
    category?: string | null;
    };

    type RecommendationResponse = {
    success: boolean;
    message?: string;
    preferences?: Preferences;
    budget_match?: boolean;
    data?: Recommendation[];
    };

    const examples = [
    "I need a hybrid SUV for 5 people for one week. My budget is 15000.",
    "I need a comfortable sedan for 4 people for 3 days.",
    "I need a cheap car for 2 people for one day. My budget is 2000.",
    ];

    export default function RecommendationsPage() {
    const [message, setMessage] = useState("");
    const [results, setResults] = useState<Recommendation[]>([]);
    const [preferences, setPreferences] = useState<Preferences>();
    const [budgetMatch, setBudgetMatch] = useState<boolean | undefined>();
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState("");

    const handleSearch = async () => {
    if (!message.trim()) {
    setError("Tell me what kind of car you're looking for first.");
    return;
    }


    setLoading(true);
    setError("");
    setSearched(false);
    setResults([]);

    try {
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ai/recommendations`,
        {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            message: message.trim(),
        }),
        }
    );

    const data: RecommendationResponse = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || "Something went wrong.");
    }

    setPreferences(data.preferences);
    setBudgetMatch(data.budget_match);
    setResults(data.data || []);
    setSearched(true);
    } catch (err) {
    setError(
        err instanceof Error
        ? err.message
        : "Unable to connect to the AI service."
    );
    } finally {
    setLoading(false);
    }


    };

    const getImageUrl = (image?: string | null) => {
    if (!image) return null;


    if (image.startsWith("http")) {
    return image;
    }

    return `http://127.0.0.1:8000/${image}`;


    };

    const formatFuel = (fuel?: string | null) => {
    if (!fuel) return "Any fuel";


    return fuel.charAt(0).toUpperCase() + fuel.slice(1);


    };

    const resetSearch = () => {
    setMessage("");
    setResults([]);
    setPreferences(undefined);
    setBudgetMatch(undefined);
    setSearched(false);
    setError("");
    };

    return ( <main className="min-h-screen bg-slate-950 text-white">
    {/* ===================================================== */}
    {/* HERO */}
    {/* ===================================================== */}


    <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.18),transparent_42%)]" />

        <div className="absolute -left-40 top-40 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px]" />

        <div className="absolute -right-40 top-72 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />

        <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
            backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
        }}
        />

        <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-32 text-center">
        {/* AI Badge */}

        <div className="mx-auto mb-7 inline-flex items-center gap-3 rounded-full border border-blue-400/20 bg-blue-400/10 px-5 py-2.5 text-sm font-medium text-blue-300 shadow-lg shadow-blue-500/5 backdrop-blur-xl">
            <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-400" />
            </span>

            AI-Powered Car Recommendation
        </div>

        {/* Heading */}

        <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Find your
            <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            perfect car.
            </span>
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-gray-400 sm:text-xl">
            Tell us what you need in natural language. Our AI understands your
            requirements and finds the best available cars for you.
        </p>

        {/* ================================================= */}
        {/* AI SEARCH */}
        {/* ================================================= */}

        <div className="mx-auto mt-12 max-w-4xl">
            <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.045] p-2 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="pointer-events-none absolute -inset-px rounded-[2rem] bg-gradient-to-r from-blue-500/20 via-transparent to-cyan-500/20 opacity-50" />

            <div className="relative rounded-[1.5rem] bg-slate-900/80 p-5">
                <div className="flex items-start gap-4">
                <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 sm:flex">
                    <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.7}
                        d="M9.75 3.75h4.5M12 3.75v2.25M6.75 8.25h10.5a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25H6.75a2.25 2.25 0 01-2.25-2.25v-7.5a2.25 2.25 0 012.25-2.25z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.7}
                        d="M8.25 13.5h.01M15.75 13.5h.01M9.75 16.5a3.5 3.5 0 004.5 0"
                    />
                    </svg>
                </div>

                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSearch();
                    }
                    }}
                    rows={3}
                    placeholder="Describe the car you need..."
                    className="min-h-[80px] flex-1 resize-none bg-transparent text-base leading-7 text-white outline-none placeholder:text-gray-600"
                />
                </div>

                <div className="mt-4 flex flex-col gap-4 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-600">
                    Press Enter to search • Natural language supported
                </p>

                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="group inline-flex items-center justify-center gap-3 rounded-xl bg-blue-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-300 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? (
                    <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        AI is thinking...
                    </>
                    ) : (
                    <>
                        Find My Perfect Car
                        <span className="transition-transform duration-300 group-hover:translate-x-1">
                        →
                        </span>
                    </>
                    )}
                </button>
                </div>
            </div>
            </div>

            {/* Examples */}

            <div className="mt-7">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-600">
                Try an example
            </p>

            <div className="flex flex-wrap justify-center gap-2">
                {examples.map((example) => (
                <button
                    key={example}
                    onClick={() => setMessage(example)}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-gray-400 transition hover:border-blue-400/20 hover:bg-blue-500/10 hover:text-blue-300"
                >
                    {example}
                </button>
                ))}
            </div>
            </div>

            {error && (
            <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/5 px-5 py-4 text-sm text-red-300">
                {error}
            </div>
            )}
        </div>
        </div>
    </section>

    {/* ===================================================== */}
    {/* RESULTS */}
    {/* ===================================================== */}

    {searched && (
        <section className="relative border-t border-white/10 bg-slate-950 py-20">
        <div className="mx-auto max-w-7xl px-6">
            {/* AI Interpretation */}

            <div className="mb-12">
            <div className="mb-3 flex items-center gap-3">
                <span className="h-px w-8 bg-blue-500" />

                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
                AI Analysis
                </p>
            </div>

            <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Here's what we understood.
            </h2>

            <p className="mt-3 text-gray-500">
                Our AI translated your request into rental preferences.
            </p>
            </div>

            {/* Preferences */}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <PreferenceCard
                label="Budget"
                value={
                preferences?.budget
                    ? `${preferences.budget.toLocaleString()} EGP`
                    : "Any budget"
                }
                icon="₣"
            />

            <PreferenceCard
                label="Passengers"
                value={
                preferences?.seats
                    ? `${preferences.seats} people`
                    : "Any size"
                }
                icon="P"
            />

            <PreferenceCard
                label="Duration"
                value={
                preferences?.duration
                    ? `${preferences.duration} days`
                    : "Flexible"
                }
                icon="D"
            />

            <PreferenceCard
                label="Fuel"
                value={formatFuel(preferences?.fuel_type)}
                icon="E"
            />

            <PreferenceCard
                label="Car type"
                value={
                preferences?.category
                    ? preferences.category.charAt(0).toUpperCase() +
                    preferences.category.slice(1)
                    : "Any type"
                }
                icon="C"
            />
            </div>

            {/* Results Header */}

            <div className="mt-20 flex flex-col gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <p className="text-sm text-gray-500">
                {results.length}{" "}
                {results.length === 1 ? "vehicle" : "vehicles"} matched
                </p>

                <h2 className="mt-2 text-3xl font-bold text-white">
                {budgetMatch === false
                    ? "Closest alternatives"
                    : "Best matches for you"}
                </h2>
            </div>

            <button
                onClick={resetSearch}
                className="w-fit rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
                New Search
            </button>
            </div>

            {/* Cars */}

            {results.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                <svg
                    className="h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.6}
                    d="M8 17h8M7 17l1.5-6h7L17 17M9 11l1-3h4l1 3"
                    />
                </svg>
                </div>

                <h3 className="mt-5 text-xl font-bold text-white">
                No matching cars found
                </h3>

                <p className="mx-auto mt-2 max-w-md text-gray-500">
                Try increasing your budget or describing your requirements
                differently.
                </p>
            </div>
            ) : (
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
                {results.map((recommendation, index) => {
                const car = recommendation.car;
                const imageUrl = getImageUrl(car.image);

                return (
                    <div
                    key={car.id}
                    className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-xl shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-blue-400/20 hover:bg-white/[0.05]"
                    >
                    {/* Image */}

                    <div className="relative aspect-[16/9] overflow-hidden bg-slate-900">
                        {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={`${car.brand} ${car.model}`}
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                        ) : (
                        <div className="flex h-full items-center justify-center">
                            <div className="text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
                                <svg
                                className="h-7 w-7 text-gray-700"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M5 17h14M7 17l1.5-6h7L17 17M9 11l1-3h4l1 3"
                                />
                                </svg>
                            </div>

                            <p className="mt-3 text-xs text-gray-700">
                                No image available
                            </p>
                            </div>
                        </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

                        {/* Best Match */}

                        {index === 0 && (
                        <div className="absolute left-5 top-5 rounded-full border border-blue-300/20 bg-blue-500/90 px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md">
                            Best Match
                        </div>
                        )}

                        {/* Score */}

                        <div className="absolute right-5 top-5 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-center backdrop-blur-md">
                        <p className="text-[10px] uppercase tracking-widest text-gray-500">
                            Match
                        </p>

                        <p className="mt-0.5 text-xl font-bold text-blue-400">
                            {recommendation.score}%
                        </p>
                        </div>

                        {/* Vehicle name */}

                        <div className="absolute bottom-5 left-6">
                        <p className="text-sm font-medium text-blue-300">
                            {car.category?.name || "Vehicle"}
                        </p>

                        <h3 className="mt-1 text-3xl font-bold text-white">
                            {car.brand} {car.model}
                        </h3>

                        <p className="mt-1 text-sm text-gray-400">
                            {car.year} • {car.color}
                        </p>
                        </div>
                    </div>

                    {/* Content */}

                    <div className="p-6">
                        {/* Price */}

                        <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-600">
                            Daily rate
                            </p>

                            <p className="mt-1 text-xl font-bold text-white">
                            {Number(car.daily_rate).toLocaleString()}
                            <span className="ml-1 text-xs font-normal text-gray-500">
                                EGP
                            </span>
                            </p>
                        </div>

                        <div className="text-right">
                            <p className="text-xs text-gray-600">
                            Estimated total
                            </p>

                            <p className="mt-1 text-xl font-bold text-blue-400">
                            {recommendation.estimated_total.toLocaleString()}
                            <span className="ml-1 text-xs font-normal text-gray-500">
                                EGP
                            </span>
                            </p>
                        </div>
                        </div>

                        {/* Specs */}

                        <div className="mt-6 grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.025] py-4">
                        <Spec
                            label="Seats"
                            value={`${car.seats}`}
                        />

                        <Spec
                            label="Fuel"
                            value={formatFuel(car.fuel_type)}
                        />

                        <Spec
                            label="Gear"
                            value={
                            car.transmission === "automatic"
                                ? "Auto"
                                : "Manual"
                            }
                        />
                        </div>

                        {/* AI Reasons */}

                        {recommendation.reasons.length > 0 && (
                        <div className="mt-5 rounded-2xl border border-blue-400/10 bg-blue-500/[0.04] p-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-blue-400">
                            Why AI picked this
                            </p>

                            <div className="space-y-2">
                            {recommendation.reasons.slice(0, 4).map(
                                (reason, reasonIndex) => (
                                <div
                                    key={reasonIndex}
                                    className="flex items-center gap-2 text-sm text-gray-400"
                                >
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[10px] text-blue-400">
                                    ✓
                                    </span>

                                    {reason}
                                </div>
                                )
                            )}
                            </div>
                        </div>
                        )}

                        {/* Actions */}

                        <div className="mt-5 flex gap-3">
                        <a
                            href={`/cars/${car.id}`}
                            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                            View Car
                        </a>

                        <a
                            href={`/bookings/create?car_id=${car.id}`}
                            className="flex-1 rounded-xl bg-blue-500 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-blue-500/10 transition hover:bg-blue-600"
                        >
                            Book Now
                        </a>
                        </div>
                    </div>
                    </div>
                );
                })}
            </div>
            )}
        </div>
        </section>
    )}

    {/* ===================================================== */}
    {/* HOW AI WORKS */}
    {/* ===================================================== */}

    {!searched && (
        <section className="relative overflow-hidden border-t border-white/10 bg-slate-950 py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.07),transparent_50%)]" />

        <div className="relative mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
                How it works
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Let AI do the searching.
            </h2>

            <p className="mt-5 text-lg leading-8 text-gray-500">
                No complicated filters. Just describe what you need and let
                our AI turn your words into the right rental options.
            </p>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-3">
            <FeatureCard
                number="01"
                title="Tell us your budget"
                description="Mention how much you want to spend for the entire rental and the AI will prioritize cars that fit."
                icon="₣"
            />

            <FeatureCard
                number="02"
                title="Describe your needs"
                description="Passengers, car type, fuel preference, comfort, or anything else important to you."
                icon="AI"
            />

            <FeatureCard
                number="03"
                title="Get smart matches"
                description="The system analyzes your request and ranks available vehicles based on how well they fit."
                icon="★"
            />
            </div>
        </div>
        </section>
    )}

    {/* ===================================================== */}
    {/* CTA */}
    {/* ===================================================== */}

    {!searched && (
        <section className="relative overflow-hidden border-t border-white/10 bg-slate-900 py-20">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/10 blur-[100px]" />

        <div className="relative mx-auto max-w-3xl px-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-400">
            <svg
                className="h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.6}
                d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"
                />
            </svg>
            </div>

            <h2 className="mt-6 text-3xl font-bold text-white sm:text-4xl">
            Your next ride is one sentence away.
            </h2>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-gray-500">
            Describe your perfect rental above and let AI handle the rest.
            </p>
        </div>
        </section>
    )}
    </main>


    );
    }

    /* ========================================================= */
    /* COMPONENTS */
    /* ========================================================= */

    function PreferenceCard({
    label,
    value,
    icon,
    }: {
    label: string;
    value: string;
    icon: string;
    }) {
    return ( <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-blue-400/20 hover:bg-white/[0.05]"> <div className="flex items-center gap-3"> <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-xs font-bold text-blue-400">
    {icon} </div>


        <p className="text-xs font-medium uppercase tracking-wider text-gray-600">
        {label}
        </p>
    </div>

    <p className="mt-4 truncate text-sm font-semibold text-white">
        {value}
    </p>
    </div>


    );
    }

    function Spec({
    label,
    value,
    }: {
    label: string;
    value: string;
    }) {
    return ( <div className="text-center"> <p className="text-[10px] uppercase tracking-wider text-gray-600">
    {label} </p>


    <p className="mt-1 text-sm font-semibold text-gray-300">
        {value}
    </p>
    </div>


    );
    }

    function FeatureCard({
    number,
    title,
    description,
    icon,
    }: {
    number: string;
    title: string;
    description: string;
    icon: string;
    }) {
    return ( <div className="group relative rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition duration-300 hover:-translate-y-2 hover:border-blue-400/20 hover:bg-white/[0.05] hover:shadow-2xl hover:shadow-blue-500/5"> <div className="flex items-start justify-between"> <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-sm font-bold text-blue-400">
    {icon} </div>


        <span className="text-sm font-bold tracking-widest text-gray-700">
        {number}
        </span>
    </div>

    <h3 className="mt-8 text-xl font-bold text-white">
        {title}
    </h3>

    <p className="mt-4 leading-7 text-gray-500">
        {description}
    </p>

    <div className="mt-8 h-1 w-10 rounded-full bg-blue-500 transition-all duration-300 group-hover:w-20" />
    </div>
    );
    }
