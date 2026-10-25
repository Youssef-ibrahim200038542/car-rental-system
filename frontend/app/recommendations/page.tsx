
"use client";

import { useState } from "react";
import { getLocalCarImage } from "@/lib/car-images";

type Recommendation = {
  vehicle_id: number;
  manufacturer: string;
  model_name: string;
  category: string;
  vehicle_year: number;
  vehicle_color: string;
  fuel_type: string;
  transmission: string;
  vehicle_mileage: number;
  branch_name: string;
  city: string;
  source_daily_rate: number;
  features: string;
  average_rating: number | null;
  review_count: number;
  matched_features?: string;
  feature_score?: number;
  result_type: string;
  differences?: string;
};

type RecommendationResponse = {
  success: boolean;
  result_type?: string;
  count?: number;
  message?: string;
  recommendations?: Recommendation[];
  error?: string;
};

const categories = [
  "Economy",
  "Compact",
  "Midsize",
  "SUV",
  "Minivan",
  "Luxury",
];

const inputClass =
  "mt-2 w-full rounded-xl border border-[#e5e6e1] bg-white px-4 py-3.5 text-sm text-[#0a1411] outline-none transition focus:border-[#c6a15b] focus:ring-2 focus:ring-[#c6a15b]/20";

const labelClass = "text-sm font-semibold text-[#526057]";

export default function RecommendationsPage() {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

  const [budget, setBudget] = useState("80");
  const [category, setCategory] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [transmission, setTransmission] = useState("");
  const [city, setCity] = useState("");
  const [minYear, setMinYear] = useState("");
  const [limit, setLimit] = useState("5");

  const [results, setResults] = useState<Recommendation[]>([]);
  const [resultType, setResultType] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericBudget = Number(budget);

    if (
      !budget.trim() ||
      !Number.isFinite(numericBudget) ||
      numericBudget < 0
    ) {
      setError("Please enter a valid budget.");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(false);
    setResults([]);

    try {
      const response = await fetch(`${apiUrl}/ml/recommendations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          budget: numericBudget,
          category: category || null,
          fuel_type: fuelType || null,
          transmission: transmission || null,
          city: city.trim() || null,
          min_year: minYear ? Number(minYear) : null,
          limit: Number(limit),
        }),
      });

      const data: RecommendationResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to generate recommendations."
        );
      }

      setResults(data.recommendations || []);
      setResultType(data.result_type || "");
      setMessage(data.message || "Recommendations generated successfully.");
      setSearched(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the recommendation service."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetSearch() {
    setBudget("80");
    setCategory("");
    setFuelType("");
    setTransmission("");
    setCity("");
    setMinYear("");
    setLimit("5");
    setResults([]);
    setResultType("");
    setMessage("");
    setError("");
    setSearched(false);
  }

  const isAlternative = resultType.toLowerCase().includes("alternative");

  return (
    <main className="min-h-screen bg-[#f8f8f7] text-[#0a1411]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(198,161,91,0.16),transparent_55%)]" />
        <div className="absolute -left-40 top-40 h-96 w-96 rounded-full bg-[#c6a15b]/10 blur-[120px]" />
        <div className="absolute -right-40 top-72 h-96 w-96 rounded-full bg-[#1a3027]/10 blur-[120px]" />

        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-28 sm:px-8 sm:pt-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-[#c6a15b]/30 bg-white/80 px-5 py-2.5 text-sm font-semibold text-[#80612d] shadow-sm backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-[#9a783c]" />
              Content-Based Car Recommendations
            </div>

            <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Find your
              <span className="block bg-gradient-to-r from-[#9a783c] via-[#c6a15b] to-[#80612d] bg-clip-text text-transparent">
                perfect car.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#68736d] sm:text-lg">
              Tell us your budget and preferred specifications. Our
              recommendation system analyzes the available dataset and ranks
              cars based on your requirements.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="mx-auto mt-12 max-w-4xl rounded-[2rem] border border-[#e5e6e1] bg-white p-5 shadow-xl shadow-[#0a1411]/5 sm:p-8"
          >
            <div className="mb-7">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a783c]">
                Personalize your search
              </p>
              <h2 className="mt-2 text-2xl font-bold">Your ideal rental</h2>
              <p className="mt-2 text-sm leading-6 text-[#68736d]">
                Choose the details that matter to you. Optional fields can be
                left empty.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <label className={labelClass}>
                Maximum daily budget
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  placeholder="Enter your budget"
                  className={inputClass}
                />
              </label>

              <label className={labelClass}>
                Car category
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Any category</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className={labelClass}>
                Fuel type
                <select
                  value={fuelType}
                  onChange={(event) => setFuelType(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Any fuel type</option>
                  <option value="gasoline">Gasoline</option>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                </select>
              </label>

              <label className={labelClass}>
                Transmission
                <select
                  value={transmission}
                  onChange={(event) => setTransmission(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Any transmission</option>
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                </select>
              </label>

              <label className={labelClass}>
                Preferred city
                <input
                  type="text"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="e.g. Atlanta"
                  className={inputClass}
                />
              </label>

              <label className={labelClass}>
                Minimum model year
                <input
                  type="number"
                  min="1900"
                  max="2100"
                  value={minYear}
                  onChange={(event) => setMinYear(event.target.value)}
                  placeholder="Any year"
                  className={inputClass}
                />
              </label>

              <label className={labelClass}>
                Number of recommendations
                <select
                  value={limit}
                  onChange={(event) => setLimit(event.target.value)}
                  className={inputClass}
                >
                  <option value="5">5 cars</option>
                  <option value="10">10 cars</option>
                  <option value="15">15 cars</option>
                  <option value="20">20 cars</option>
                </select>
              </label>
            </div>

            <div className="mt-7 flex flex-col gap-4 border-t border-[#e5e6e1] pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-[#929a94]">
                Results are based on the current dataset and its daily rates.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#0a1411] px-7 py-4 font-semibold text-white transition hover:bg-[#c6a15b] hover:text-[#0a1411] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Finding recommendations...
                  </>
                ) : (
                  <>
                    Find My Perfect Car <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
              >
                {error}
              </div>
            )}
          </form>
        </div>
      </section>

      {searched && (
        <section className="border-t border-[#e5e6e1] bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-col gap-5 border-b border-[#e5e6e1] pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9a783c]">
                  Recommendation results
                </p>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                  {isAlternative
                    ? "Closest alternatives"
                    : "Your best matches"}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#68736d]">
                  {message}
                </p>
              </div>

              <button
                type="button"
                onClick={resetSearch}
                className="w-fit rounded-xl border border-[#e1e3dc] px-5 py-3 text-sm font-semibold transition hover:border-[#c6a15b] hover:bg-[#c6a15b]/10"
              >
                New Search
              </button>
            </div>

            {results.length === 0 ? (
              <div className="mt-8 rounded-3xl border border-[#e5e6e1] bg-[#f8f8f7] p-10 text-center">
                <div className="text-4xl">🚘</div>
                <h3 className="mt-4 text-xl font-bold">No cars found</h3>
                <p className="mt-2 text-sm leading-6 text-[#68736d]">
                  Try increasing your budget or relaxing some of your
                  preferences.
                </p>
              </div>
            ) : (
              <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {results.map((car, index) => (
                  <article
                    key={car.vehicle_id}
                    className="overflow-hidden rounded-3xl border border-[#e5e6e1] bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#c6a15b]/60 hover:shadow-xl"
                  >
                    {/* Local car image */}
                    <div className="relative h-52 overflow-hidden bg-gradient-to-br from-[#17251f] to-[#35463c]">
                      <img
                        src={getLocalCarImage(
                          car.manufacturer,
                          car.model_name,
                          `${car.manufacturer} ${car.model_name}`
                        )}
                        alt={`${car.manufacturer} ${car.model_name}`}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                      />

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

                      <span className="absolute left-4 top-4 rounded-full bg-[#c6a15b] px-3 py-1.5 text-xs font-bold text-[#0a1411]">
                        {index === 0
                          ? "Top recommendation"
                          : `Option ${index + 1}`}
                      </span>

                      <span className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-xs font-medium text-white">
                        {car.result_type?.toLowerCase().includes("alternative")
                          ? "Alternative"
                          : "Match"}
                      </span>

                      <div className="absolute bottom-4 left-4 right-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-white/80">
                          {car.category} · {car.vehicle_year}
                        </p>
                        <h3 className="mt-1 text-2xl font-bold text-white drop-shadow">
                          {car.manufacturer} {car.model_name}
                        </h3>
                      </div>
                    </div>

                    <div className="p-5">
                      <p className="text-sm text-[#68736d]">
                        {car.city} · {car.branch_name}
                      </p>

                      <div className="mt-5 flex items-end justify-between gap-3 border-b border-[#e5e6e1] pb-5">
                        <div>
                          <p className="text-xs text-[#929a94]">Daily rate</p>
                          <p className="mt-1 text-2xl font-bold">
                            {Number(car.source_daily_rate).toLocaleString()}
                          </p>
                          <p className="text-xs text-[#929a94]">
                            Dataset rate; currency unverified
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-[#929a94]">Rating</p>
                          <p className="mt-1 text-lg font-bold text-[#9a783c]">
                            {car.average_rating != null
                              ? `★ ${Number(car.average_rating).toFixed(1)}`
                              : "Not rated"}
                          </p>
                          <p className="text-xs text-[#929a94]">
                            {car.review_count} reviews
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <Spec label="Fuel" value={car.fuel_type} />
                        <Spec
                          label="Transmission"
                          value={car.transmission}
                        />
                        <Spec
                          label="Mileage"
                          value={Number(car.vehicle_mileage).toLocaleString()}
                        />
                        <Spec label="Color" value={car.vehicle_color} />
                      </div>

                      {car.features && (
                        <div className="mt-5">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#929a94]">
                            Features
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[#526057]">
                            {car.features}
                          </p>
                        </div>
                      )}

                      {car.matched_features && (
                        <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">
                          <span className="font-semibold">
                            Matched features:{" "}
                          </span>
                          {car.matched_features}
                        </div>
                      )}

                      {car.differences && (
                        <div className="mt-4 rounded-xl border border-[#c6a15b]/30 bg-[#c6a15b]/10 p-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#80612d]">
                            Differences from your request
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[#526057]">
                            {car.differences}
                          </p>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}

            <p className="mt-8 text-xs leading-6 text-[#929a94]">
              These recommendations come from the ML dataset. Vehicle
              availability and booking details must be verified against the
              live DriveX database before booking.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#e5e6e1] bg-[#f8f8f7] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#929a94]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold capitalize text-[#0a1411]">
        {value || "N/A"}
      </p>
    </div>
  );
}
