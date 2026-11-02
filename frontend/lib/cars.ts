import type { Car } from "./types";
import { getCarImageUrl, getLocalCarImage } from "./car-images";

/**
 * Mirrors Car::UNBOOKABLE_STATUSES on the backend. Bookings no longer set
 * "reserved"/"rented", so only fleet states block a car; date conflicts are
 * checked by GET /cars/{id}/availability.
 */
const UNBOOKABLE_STATUSES = ["maintenance", "inactive"];

export function isCarBookable(car: Pick<Car, "status">): boolean {
  return !UNBOOKABLE_STATUSES.includes(car.status?.toLowerCase() ?? "");
}

/** The API has no car `name` column; older payloads may still carry one. */
type NamedCar = Pick<Car, "brand" | "model" | "image"> & { name?: string };

/** "Toyota Corolla", or a generic label when the car is missing. */
export function carDisplayName(car?: NamedCar | null, fallback = "Rental Car"): string {
  return car?.name || `${car?.brand || ""} ${car?.model || ""}`.trim() || fallback;
}

/** The car's photo URL plus the bundled image to fall back to. */
export function carImages(car?: NamedCar | null): { src: string; fallbackSrc: string } {
  const name = carDisplayName(car);

  return {
    src: getCarImageUrl(car?.image, car?.brand, car?.model, name),
    fallbackSrc: getLocalCarImage(car?.brand, car?.model, name),
  };
}
