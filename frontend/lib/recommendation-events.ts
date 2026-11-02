import { apiFetch } from "./api";
import type { RecommendationEvent } from "./recommendation-types";

/**
 * Log a click or booking against a served recommendation list.
 * Fire-and-forget: never awaited by navigation, and failures are dropped
 * because analytics must not break the booking flow.
 */
export function postRecommendationEvent(event: RecommendationEvent): void {
  apiFetch("/recommendation-events", { method: "POST", body: event }).catch(
    () => undefined
  );
}

/** Read `rid`/`pos` from a /bookings/create URL; null when absent or malformed. */
export function recommendationContext(
  params: URLSearchParams | { get(name: string): string | null }
): { requestId: string; position?: number } | null {
  const requestId = params.get("rid");
  if (!requestId) return null;

  const position = Number(params.get("pos"));
  return {
    requestId,
    position: Number.isInteger(position) && position > 0 ? position : undefined,
  };
}

/** Booking URL that carries the recommendation context forward. */
export function recommendedBookingHref(
  carId: number,
  requestId: string,
  position: number
): string {
  const query = new URLSearchParams({
    car_id: String(carId),
    rid: requestId,
    pos: String(position),
  });
  return `/bookings/create?${query}`;
}
