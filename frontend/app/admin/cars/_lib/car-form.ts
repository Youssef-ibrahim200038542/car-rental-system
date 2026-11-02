import type { Car } from "@/lib/types";

/** The car form keeps every field as the string its <input> holds. */
export type CarFormValues = {
  category_id: string;
  branch_id: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  license_plate: string;
  vin: string;
  mileage: string;
  fuel_type: string;
  transmission: string;
  seats: string;
  daily_rate: string;
  status: string;
  description: string;
};

export const EMPTY_CAR_FORM: CarFormValues = {
  category_id: "",
  branch_id: "",
  brand: "",
  model: "",
  year: "",
  color: "",
  license_plate: "",
  vin: "",
  mileage: "0",
  fuel_type: "petrol",
  transmission: "automatic",
  seats: "5",
  daily_rate: "",
  status: "available",
  description: "",
};

export function carToFormValues(car: Car): CarFormValues {
  return {
    category_id: String(car.category_id),
    branch_id: String(car.branch_id),
    brand: car.brand || "",
    model: car.model || "",
    year: String(car.year ?? ""),
    color: car.color || "",
    license_plate: car.license_plate || "",
    vin: car.vin || "",
    mileage: String(car.mileage ?? 0),
    fuel_type: car.fuel_type || "petrol",
    transmission: car.transmission || "automatic",
    seats: String(car.seats ?? 5),
    daily_rate: String(car.daily_rate ?? ""),
    status: car.status || "available",
    description: car.description || "",
  };
}

/** POST /cars is multipart so it can carry the image. */
export function carCreatePayload(values: CarFormValues, image: File | null): FormData {
  const payload = new FormData();
  const trimmed = new Set(["brand", "model", "color", "license_plate", "vin", "description"]);

  for (const [key, value] of Object.entries(values)) {
    payload.append(key, trimmed.has(key) ? value.trim() : value);
  }

  if (image) payload.append("image", image);
  return payload;
}

/** PUT /cars/{id} is JSON; empty optional text becomes null. */
export function carUpdatePayload(values: CarFormValues) {
  return {
    category_id: Number(values.category_id),
    branch_id: Number(values.branch_id),
    brand: values.brand.trim(),
    model: values.model.trim(),
    year: Number(values.year),
    color: values.color.trim() || null,
    license_plate: values.license_plate.trim(),
    vin: values.vin.trim(),
    mileage: Number(values.mileage),
    fuel_type: values.fuel_type,
    transmission: values.transmission,
    seats: Number(values.seats),
    daily_rate: Number(values.daily_rate),
    status: values.status,
    description: values.description.trim() || null,
  };
}
