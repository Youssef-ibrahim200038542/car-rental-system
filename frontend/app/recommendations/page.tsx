
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

    const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

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
        const response = await fetch(`${apiUrl}/ai/recommendations`, {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            },
            body: JSON.stringify({
            message: message.trim(),
            }),
        });

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
        if (image.startsWith("http")) return image;

        return `${apiUrl.replace(/\/api\/?$/, "")}/${image.replace(/^\/+/, "")}`;
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

    return (
        <main className="min-h-screen bg-[#f8f8f7] text-[#0a1411]">
        <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(198,161,91,0.14),transparent_55%)]" />

            <div className="absolute -left-40 top-40 h-96 w-96 rounded-full bg-[#c6a15b]/10 blur-[120px]" />

            <div className="absolute -right-40 top-72 h-96 w-96 rounded-full bg-[#1a3027]/10 blur-[120px]" />

            <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
                backgroundImage:
                "linear-gradient(#0a1411 1px, transparent 1px), linear-gradient(90deg, #0a1411 1px, transparent 1px)",
                backgroundSize: "60px 60px",
            }}
            />

            <div className="relative mx-auto max-w-5xl px-5 pb-20 pt-32 text-center sm:px-8">
            <div className="mx-auto mb-7 inline-flex items-center gap-3 rounded-full border border-[#c6a15b]/30 bg-white/80 px-5 py-2.5 text-sm font-semibold text-[#80612d] shadow-sm backdrop-blur">
                <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c6a15b] opacity-50" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#9a783c]" />
                </span>
                AI-Powered Car Recommendations
            </div>

            <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight text-[#0a1411] sm:text-6xl lg:text-7xl">
                Find your
                <span className="block bg-gradient-to-r from-[#9a783c] via-[#c6a15b] to-[#80612d] bg-clip-text text-transparent">
                perfect car.
                </span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[#68736d] sm:text-xl">
                Tell us what you need in natural language. Our AI understands your
                requirements and finds the best matching cars for your trip.
            </p>

            <div className="mx-auto mt-12 max-w-4xl">
                <div className="rounded-[2rem] border border-[#e5e6e1] bg-white p-2 shadow-xl shadow-[#0a1411]/5">
                <div className="rounded-[1.5rem] bg-[#f8f8f7] p-5 sm:p-7">
                    <div className="flex items-start gap-4">
                    <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0a1411] text-[#c6a15b] sm:flex">
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
                            if (!loading) handleSearch();
                        }
                        }}
                        rows={3}
                        placeholder="Describe the car you need..."
                        className="min-h-[100px] flex-1 resize-y bg-transparent text-base leading-7 text-[#0a1411] outline-none placeholder:text-[#9ba29d]"
                    />
                    </div>

                    <div className="mt-4 flex flex-col gap-4 border-t border-[#e5e6e1] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-[#929a94]">
                        Press Enter to search · Shift + Enter for a new line
                    </p>

                    <button
                        type="button"
                        onClick={handleSearch}
                        disabled={loading}
                        className="group inline-flex items-center justify-center gap-3 rounded-xl bg-[#0a1411] px-6 py-3.5 font-semibold text-white shadow-lg shadow-[#0a1411]/10 transition duration-200 hover:bg-[#c6a15b] hover:text-[#0a1411] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#0a1411] disabled:hover:text-white"
                    >
                        {loading ? (
                        <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            AI is thinking...
                        </>
                        ) : (
                        <>
                            Find My Perfect Car
                            <span className="transition-transform duration-200 group-hover:translate-x-1">
                            →
                            </span>
                        </>
                        )}
                    </button>
                    </div>
                </div>
                </div>

                <div className="mt-7">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#929a94]">
                    Try an example
                </p>

                <div className="flex flex-wrap justify-center gap-2">
                    {examples.map((example) => (
                    <button
                        key={example}
                        type="button"
                        onClick={() => {
                        setMessage(example);
                        setError("");
                        }}
                        className="rounded-full border border-[#e1e3dc] bg-white px-4 py-2.5 text-xs leading-5 text-[#68736d] transition hover:border-[#c6a15b] hover:bg-[#c6a15b]/10 hover:text-[#80612d]"
                    >
                        {example}
                    </button>
                    ))}
                </div>
                </div>

                {error && (
                <div
                    role="alert"
                    className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-left text-sm leading-6 text-red-700"
                >
                    {error}
                </div>
                )}
            </div>
            </div>
        </section>

        {searched && (
            <section className="border-t border-[#e5e6e1] bg-white py-16 sm:py-20">
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
                <div className="mb-10">
                <div className="mb-3 flex items-center gap-3">
                    <span className="h-px w-8 bg-[#c6a15b]" />
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9a783c]">
                    AI Analysis
                    </p>
                </div>

                <h2 className="text-3xl font-bold tracking-tight text-[#0a1411] sm:text-4xl">
                    Here&apos;s what we understood.
                </h2>

                <p className="mt-3 text-[#68736d]">
                    Your request translated into rental preferences.
                </p>
                </div>

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

                {budgetMatch === false && (
                <div className="mt-6 rounded-2xl border border-[#c6a15b]/30 bg-[#c6a15b]/10 px-5 py-4 text-sm leading-6 text-[#80612d]">
                    We couldn&apos;t find a match within your budget, so these
                    recommendations show the closest alternatives.
                </div>
                )}

                <div className="mt-16 flex flex-col gap-5 border-b border-[#e5e6e1] pb-7 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm text-[#68736d]">
                    {results.length}{" "}
                    {results.length === 1 ? "vehicle" : "vehicles"} matched
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-[#0a1411]">
                    {budgetMatch === false
                        ? "Closest alternatives"
                        : "Best matches for you"}
                    </h2>
                </div>

                <button
                    type="button"
                    onClick={resetSearch}
                    className="w-fit rounded-xl border border-[#e1e3dc] bg-white px-5 py-3 text-sm font-semibold text-[#0a1411] transition hover:border-[#c6a15b] hover:bg-[#c6a15b]/10 hover:text-[#80612d]"
                >
                    New Search
                </button>
                </div>

                {results.length === 0 ? (
                <div className="mt-8 rounded-3xl border border-[#e5e6e1] bg-[#f8f8f7] p-10 text-center sm:p-12">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0a1411] text-2xl text-[#c6a15b]">
                    🚘
                    </div>

                    <h3 className="mt-5 text-xl font-bold text-[#0a1411]">
                    No matching cars found
                    </h3>

                    <p className="mx-auto mt-2 max-w-md leading-7 text-[#68736d]">
                    Try increasing your budget or describing your requirements
                    differently.
                    </p>

                    <button
                    type="button"
                    onClick={() => {
                        setMessage("");
                        setError("");
                    }}
                    className="mt-6 rounded-xl bg-[#0a1411] px-6 py-3 font-semibold text-white transition hover:bg-[#c6a15b] hover:text-[#0a1411]"
                    >
                    Try Another Search
                    </button>
                </div>
                ) : (
                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                    {results.map((recommendation, index) => {
                    const car = recommendation.car;
                    const imageUrl = getImageUrl(car.image);

                    return (
                        <article
                        key={car.id}
                        className="group overflow-hidden rounded-3xl border border-[#e5e6e1] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#c6a15b]/60 hover:shadow-xl hover:shadow-[#0a1411]/5"
                        >
                        <div className="relative aspect-[16/9] overflow-hidden bg-[#eeeee9]">
                            {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={`${car.brand} ${car.model}`}
                                loading="lazy"
                                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                            />
                            ) : (
                            <div className="flex h-full items-center justify-center">
                                <div className="text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl">
                                    🚘
                                </div>
                                <p className="mt-3 text-xs text-[#929a94]">
                                    No image available
                                </p>
                                </div>
                            </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1411]/90 via-[#0a1411]/10 to-transparent" />

                            {index === 0 && (
                            <div className="absolute left-5 top-5 rounded-full border border-white/30 bg-[#c6a15b] px-4 py-2 text-xs font-bold text-[#0a1411] shadow-lg">
                                Best Match
                            </div>
                            )}

                            <div className="absolute right-5 top-5 rounded-2xl border border-white/20 bg-[#0a1411]/80 px-4 py-3 text-center backdrop-blur-md">
                            <p className="text-[10px] uppercase tracking-widest text-white/70">
                                Match
                            </p>
                            <p className="mt-0.5 text-xl font-bold text-[#e0bd78]">
                                {recommendation.score}%
                            </p>
                            </div>

                            <div className="absolute bottom-5 left-6 right-5">
                            <p className="text-sm font-semibold text-[#e0bd78]">
                                {car.category?.name || "Vehicle"}
                            </p>

                            <h3 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                                {car.brand} {car.model}
                            </h3>

                            <p className="mt-1 text-sm text-white/75">
                                {car.year} <span className="mx-1">·</span>{" "}
                                {car.color}
                            </p>
                            </div>
                        </div>

                        <div className="p-5 sm:p-6">
                            <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs text-[#929a94]">
                                Daily rate
                                </p>
                                <p className="mt-1 text-xl font-bold text-[#0a1411]">
                                {Number(car.daily_rate).toLocaleString()}
                                <span className="ml-1 text-xs font-medium text-[#68736d]">
                                    EGP
                                </span>
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-xs text-[#929a94]">
                                Estimated total
                                </p>
                                <p className="mt-1 text-xl font-bold text-[#9a783c]">
                                {Number(
                                    recommendation.estimated_total
                                ).toLocaleString()}
                                <span className="ml-1 text-xs font-medium text-[#68736d]">
                                    EGP
                                </span>
                                </p>
                            </div>
                            </div>

                            <div className="mt-6 grid grid-cols-3 divide-x divide-[#e5e6e1] rounded-2xl border border-[#e5e6e1] bg-[#f8f8f7] py-4">
                            <Spec label="Seats" value={`${car.seats}`} />
                            <Spec
                                label="Fuel"
                                value={formatFuel(car.fuel_type)}
                            />
                            <Spec
                                label="Gear"
                                value={
                                car.transmission?.toLowerCase() === "automatic"
                                    ? "Auto"
                                    : "Manual"
                                }
                            />
                            </div>

                            {recommendation.reasons?.length > 0 && (
                            <div className="mt-5 rounded-2xl border border-[#c6a15b]/25 bg-[#c6a15b]/[0.08] p-4">
                                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#80612d]">
                                Why AI picked this
                                </p>

                                <div className="space-y-2">
                                {recommendation.reasons
                                    .slice(0, 4)
                                    .map((reason, reasonIndex) => (
                                    <div
                                        key={reasonIndex}
                                        className="flex items-start gap-2 text-sm leading-6 text-[#526057]"
                                    >
                                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0a1411] text-[10px] text-[#e0bd78]">
                                        ✓
                                        </span>
                                        <span>{reason}</span>
                                    </div>
                                    ))}
                                </div>
                            </div>
                            )}

                            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                            <a
                                href={`/cars/${car.id}`}
                                className="flex-1 rounded-xl border border-[#dfe2da] bg-white px-5 py-3.5 text-center text-sm font-semibold text-[#0a1411] transition hover:border-[#c6a15b] hover:bg-[#c6a15b]/10 hover:text-[#80612d]"
                            >
                                View Car
                            </a>

                            <a
                                href={`/bookings/create?car_id=${car.id}`}
                                className="flex-1 rounded-xl bg-[#0a1411] px-5 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-[#c6a15b] hover:text-[#0a1411]"
                            >
                                Book Now <span aria-hidden="true">→</span>
                            </a>
                            </div>
                        </div>
                        </article>
                    );
                    })}
                </div>
                )}
            </div>
            </section>
        )}

        {!searched && (
            <>
            <section className="border-t border-[#e5e6e1] bg-white py-20 sm:py-24">
                <div className="mx-auto max-w-7xl px-5 sm:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#9a783c]">
                    How it works
                    </p>

                    <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#0a1411] sm:text-5xl">
                    Let AI do the searching.
                    </h2>

                    <p className="mt-5 text-lg leading-8 text-[#68736d]">
                    No complicated filters. Just describe what you need and let
                    our AI turn your words into rental options.
                    </p>
                </div>

                <div className="mt-14 grid gap-6 md:grid-cols-3">
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
                    description="The system analyzes your request and ranks vehicles based on how well they fit."
                    icon="★"
                    />
                </div>
                </div>
            </section>

            <section className="relative overflow-hidden border-t border-[#e5e6e1] bg-[#0a1411] py-20">
                <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#c6a15b]/10 blur-[100px]" />

                <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c6a15b]/30 bg-[#c6a15b]/10 text-3xl text-[#e0bd78]">
                    ✦
                </div>

                <h2 className="mt-6 text-3xl font-bold text-white sm:text-4xl">
                    Your next ride is one sentence away.
                </h2>

                <p className="mx-auto mt-4 max-w-xl leading-7 text-white/65">
                    Describe your perfect rental above and let AI handle the rest.
                </p>

                <button
                    type="button"
                    onClick={() =>
                    document.querySelector("textarea")?.focus()
                    }
                    className="mt-7 rounded-xl bg-[#c6a15b] px-6 py-3.5 font-semibold text-[#0a1411] transition hover:bg-[#e0bd78]"
                >
                    Find My Car <span aria-hidden="true">↑</span>
                </button>
                </div>
            </section>
            </>
        )}
        </main>
    );
    }

    function PreferenceCard({
    label,
    value,
    icon,
    }: {
    label: string;
    value: string;
    icon: string;
    }) {
    return (
        <div className="rounded-2xl border border-[#e5e6e1] bg-[#f8f8f7] p-5 transition hover:border-[#c6a15b]/60 hover:bg-white">
        <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0a1411] text-xs font-bold text-[#e0bd78]">
            {icon}
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#68736d]">
            {label}
            </p>
        </div>

        <p className="mt-4 truncate text-sm font-bold text-[#0a1411]">
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
    return (
        <div className="min-w-0 px-1 text-center">
        <p className="text-[10px] uppercase tracking-wider text-[#929a94]">
            {label}
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-[#0a1411]">
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
    return (
        <div className="group rounded-3xl border border-[#e5e6e1] bg-[#f8f8f7] p-7 transition duration-300 hover:-translate-y-1 hover:border-[#c6a15b]/60 hover:bg-white hover:shadow-xl hover:shadow-[#0a1411]/5 sm:p-8">
        <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0a1411] text-sm font-bold text-[#e0bd78]">
            {icon}
            </div>

            <span className="text-sm font-bold tracking-widest text-[#c3c8c1]">
            {number}
            </span>
        </div>

        <h3 className="mt-8 text-xl font-bold text-[#0a1411]">{title}</h3>

        <p className="mt-4 leading-7 text-[#68736d]">{description}</p>

        <div className="mt-8 h-1 w-10 rounded-full bg-[#c6a15b] transition-all duration-300 group-hover:w-20" />
        </div>
    );
    }
