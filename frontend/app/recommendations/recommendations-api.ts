import { apiFetch } from "@/lib/api";
import type { RecommendationResult } from "@/lib/recommendation-types";
import type { Branch, CarCategory, FuelType, Transmission } from "@/lib/types";

export const FUEL_TYPES: readonly FuelType[] = ["petrol", "diesel", "hybrid", "electric"];
export const TRANSMISSIONS: readonly Transmission[] = ["automatic", "manual"];

export type RecommendationRequest = {
  budget?: number;
  category?: string;
  fuel_type?: FuelType;
  transmission?: Transmission;
  seats?: number;
  branch_id?: number;
  pickup_date?: string;
  return_date?: string;
  limit?: number;
};

export function fetchCategories(): Promise<CarCategory[]> {
  return apiFetch<CarCategory[]>("/car-categories", { auth: false });
}

export function fetchBranches(): Promise<Branch[]> {
  return apiFetch<Branch[]>("/branches", { auth: false });
}

/** Ranked cars plus the request id that click/book events refer back to. */
export function fetchRecommendations(body: RecommendationRequest): Promise<RecommendationResult> {
  return apiFetch<RecommendationResult>("/ml/recommendations", {
    method: "POST",
    body,
    auth: false,
  });
}
