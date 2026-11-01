import type { Car } from "./types";

/**
 * Mirrors Car::UNBOOKABLE_STATUSES on the backend. Bookings no longer set
 * "reserved"/"rented", so only fleet states block a car; date conflicts are
 * checked by GET /cars/{id}/availability.
 */
const UNBOOKABLE_STATUSES = ["maintenance", "inactive"];

export function isCarBookable(car: Pick<Car, "status">): boolean {
  return !UNBOOKABLE_STATUSES.includes(car.status?.toLowerCase() ?? "");
}
