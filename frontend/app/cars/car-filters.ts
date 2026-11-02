import type { Car as ApiCar } from "@/lib/types";

/** The API has no `name` column; kept optional so the brand/model fallbacks still read. */
export type Car = ApiCar & { name?: string };

export type CarFilterValues = {
  search: string;
  category: string;
  fuel: string;
  seats: string;
  pickup: string;
};

const categoryAliases: Record<string, string[]> = {
  luxury: ["luxury"],
  suv: ["suv", "suvs"],
  sedan: ["sedan", "sedans"],
  economy: ["economy", "economical"],
};

/** Category matching a home-page `type` shortcut, or null to fall back to text search. */
export function categoryForType(cars: Car[], type: string): string | null {
  const aliases = Object.hasOwn(categoryAliases, type) ? categoryAliases[type] : null;
  if (!aliases) return null;

  return (
    cars.find((car) =>
      aliases.some(
        (alias) =>
          car.category?.name.toLowerCase() === alias ||
          car.brand?.toLowerCase() === alias ||
          car.model?.toLowerCase() === alias
      )
    )?.category?.name ?? null
  );
}

/** "All" followed by each distinct non-empty value, in fleet order. */
export function optionsFrom(values: (string | null | undefined)[]): string[] {
  return ["All", ...new Set(values.filter((value): value is string => Boolean(value)))];
}

function searchableText(car: Car): string {
  return `${car.brand ?? ""} ${car.model ?? ""} ${car.name ?? ""} ${car.category?.name ?? ""}`.toLowerCase();
}

/** Branch name, city and address — what a typed pickup location is matched against. */
function branchText(car: Car): string {
  const branch = car.branch;
  return `${branch?.name ?? ""} ${branch?.city ?? ""} ${branch?.address ?? ""}`.toLowerCase();
}

function matchesSeats(car: Car, seats: string): boolean {
  if (seats === "any") return true;
  if (seats === "7") return (car.seats ?? 0) >= 7;
  return car.seats === Number(seats);
}

export function filterCars(cars: Car[], filters: CarFilterValues): Car[] {
  const query = filters.search.toLowerCase().trim();
  const pickup = filters.pickup.trim().toLowerCase();

  return cars.filter((car) => {
    const text = searchableText(car);

    return (
      (!query || text.includes(query)) &&
      (filters.category === "All" || car.category?.name === filters.category) &&
      (filters.fuel === "All" || car.fuel_type === filters.fuel) &&
      matchesSeats(car, filters.seats) &&
      (!pickup || branchText(car).includes(pickup))
    );
  });
}
