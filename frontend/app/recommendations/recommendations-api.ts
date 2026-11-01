import { apiFetch } from "@/lib/api";
import type { Branch, Car, CarCategory, FuelType, Transmission } from "@/lib/types";

export const FUEL_TYPES: readonly FuelType[] = ["petrol", "diesel", "hybrid", "electric"];
export const TRANSMISSIONS: readonly Transmission[] = ["automatic", "manual"];

export type Recommendation = {
  car: Car;
  score: number;
  reasons: string[];
};

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

export async function fetchRecommendations(
  body: RecommendationRequest
): Promise<Recommendation[]> {
  const data = await apiFetch<{ recommendations: Recommendation[] }>(
    "/ml/recommendations",
    { method: "POST", body, auth: false }
  );

  return data.recommendations;
}
