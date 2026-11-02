import { EDITABLE_CAR_STATUSES } from "@/lib/types";
import type { Car, CarStatus } from "@/lib/types";
import { humanize } from "../../_lib/format";
import type { FilterOption } from "../../_components/SearchFilterBar";

/** Bookings no longer set these; old rows may still carry them. */
const LEGACY_STATUSES: readonly CarStatus[] = ["reserved", "rented"];

/** The fleet states, plus a legacy status only while some car still has it. */
export function carStatusOptions(cars: Car[]): FilterOption[] {
  const legacyInUse = LEGACY_STATUSES.filter((status) =>
    cars.some((car) => car.status === status)
  );

  return [
    { value: "all", label: "All statuses" },
    ...[...EDITABLE_CAR_STATUSES, ...legacyInUse].map((status) => ({
      value: status,
      label: humanize(status),
    })),
  ];
}

export function filterCars(cars: Car[], search: string, status: string): Car[] {
  const query = search.trim().toLowerCase();

  return cars.filter((car) => {
    const matchesSearch =
      !query ||
      `${car.brand} ${car.model}`.toLowerCase().includes(query) ||
      String(car.id).includes(query) ||
      Boolean(car.category?.name.toLowerCase().includes(query)) ||
      Boolean(car.branch?.name.toLowerCase().includes(query));

    return matchesSearch && (status === "all" || car.status === status);
  });
}

export const carName = (car: Pick<Car, "brand" | "model">) => `${car.brand} ${car.model}`;
