"use client";

import { useEffect, useState } from "react";
import { errorMessage } from "@/lib/api";
import type { RecommendationResult } from "@/lib/recommendation-types";
import type { Branch, CarCategory } from "@/lib/types";
import RecommendationCard from "./RecommendationCard";
import RecommendationForm, { EMPTY_FORM, type FormValues } from "./RecommendationForm";
import {
  fetchBranches,
  fetchCategories,
  fetchRecommendations,
  type RecommendationRequest,
} from "./recommendations-api";

function toRequest(values: FormValues): RecommendationRequest {
  const optionalNumber = (value: string) => (value.trim() ? Number(value) : undefined);
  const optionalText = (value: string) => value || undefined;

  return {
    budget: optionalNumber(values.budget),
    category: optionalText(values.category),
    fuel_type: optionalText(values.fuelType) as RecommendationRequest["fuel_type"],
    transmission: optionalText(values.transmission) as RecommendationRequest["transmission"],
    seats: optionalNumber(values.seats),
    branch_id: optionalNumber(values.branchId),
    pickup_date: optionalText(values.pickupDate),
    return_date: optionalText(values.returnDate),
    limit: Number(values.limit),
  };
}

function validate(values: FormValues): string {
  if (values.budget.trim() && !(Number(values.budget) >= 0)) {
    return "Please enter a valid budget.";
  }
  if (Boolean(values.pickupDate) !== Boolean(values.returnDate)) {
    return "Choose both a pickup and a return date, or neither.";
  }
  if (values.pickupDate && values.returnDate < values.pickupDate) {
    return "The return date must be on or after the pickup date.";
  }
  return "";
}

export default function RecommendationsPage() {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [categories, setCategories] = useState<CarCategory[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchCategories(), fetchBranches()])
      .then(([loadedCategories, loadedBranches]) => {
        setCategories(loadedCategories);
        setBranches(loadedBranches);
      })
      .catch(() => setError("Could not load categories and branches. Filters may be incomplete."));
  }, []);

  const aiRanked = result?.method === "ai-knn-demand-hybrid";

  function handleChange(patch: Partial<FormValues>) {
    setValues((current) => ({ ...current, ...patch }));
  }

  async function handleSubmit() {
    const validationError = validate(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await fetchRecommendations(toRequest(values));
      // Older servers send no `position`; fall back to the order shown.
      setResult({
        ...data,
        recommendations: data.recommendations.map((item, index) => ({
          ...item,
          position: item.position ?? index + 1,
        })),
      });
    } catch (err) {
      setResult(null);
      setError(errorMessage(err, "Unable to load recommendations."));
    } finally {
      setLoading(false);
    }
  }

  function resetSearch() {
    setValues(EMPTY_FORM);
    setResult(null);
    setError("");
  }

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
              Smart Recommendations
            </div>

            <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Find your
              <span className="block bg-gradient-to-r from-[#9a783c] via-[#c6a15b] to-[#80612d] bg-clip-text text-transparent">
                perfect car.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#68736d] sm:text-lg">
              Our AI finds the cars closest to what you ask for, then ranks them by how likely
              renters are to love them. Only cars you can book right now, with the reasons behind each pick.
            </p>
          </div>

          <RecommendationForm
            values={values}
            categories={categories}
            branches={branches}
            loading={loading}
            error={error}
            onChange={handleChange}
            onSubmit={handleSubmit}
          />
        </div>
      </section>

      {result && (
        <section className="border-t border-[#e5e6e1] bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-col gap-5 border-b border-[#e5e6e1] pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#9a783c]">
                  Recommendation results
                </p>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Your best matches</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#68736d]">
                  {result.recommendations.length} car{result.recommendations.length === 1 ? "" : "s"}{" "}
                  {aiRanked ? "ranked by our AI model." : "ranked by match score."}
                </p>
                <p
                  className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                    aiRanked
                      ? "border-[#c6a15b]/40 bg-[#c6a15b]/10 text-[#80612d]"
                      : "border-[#e1e3dc] bg-[#f8f8f7] text-[#68736d]"
                  }`}
                >
                  <span aria-hidden="true" className={`h-2 w-2 rounded-full ${aiRanked ? "bg-[#9a783c]" : "bg-[#929a94]"}`} />
                  {aiRanked
                    ? "AI ranking: KNN similarity + learned demand model"
                    : "AI service offline: showing rule-based ranking"}
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

            {result.recommendations.length === 0 ? (
              <div className="mt-8 rounded-3xl border border-[#e5e6e1] bg-[#f8f8f7] p-10 text-center">
                <h3 className="text-xl font-bold">No cars available</h3>
                <p className="mt-2 text-sm leading-6 text-[#68736d]">
                  Every car is booked or in maintenance for these dates. Try different dates.
                </p>
              </div>
            ) : (
              <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {result.recommendations.map((recommendation) => (
                  <RecommendationCard
                    key={recommendation.car.id}
                    recommendation={recommendation}
                    requestId={result.request_id}
                    aiRanked={aiRanked}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
