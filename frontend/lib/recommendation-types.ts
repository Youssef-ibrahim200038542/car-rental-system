import type { Car } from "./types";

/** One ranked car from POST /ml/recommendations. */
export type Recommendation = {
  car: Car;
  score: number;
  reasons: string[];
  /** 1-based order the server served it in. */
  position: number;
};

export type RecommendationResult = {
  recommendations: Recommendation[];
  /** Ties later click/book events to the impressions the server logged. */
  request_id?: string;
  explored?: boolean;
};

export type RecommendationEvent = {
  request_id: string;
  car_id: number;
  event: "click" | "book";
  position?: number;
};

/** One entry of GET /cars/{id}/similar. */
export type SimilarCar = {
  car: Car;
  /** Cosine similarity, 0..1. */
  similarity: number;
  reasons: string[];
};

export type SimilarCarsResult = {
  method: string;
  similar: SimilarCar[];
};
