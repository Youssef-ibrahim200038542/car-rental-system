import type { FormEvent } from "react";
import type { Branch, CarCategory } from "@/lib/types";
import { FUEL_TYPES, TRANSMISSIONS } from "./recommendations-api";

export type FormValues = {
  budget: string;
  category: string;
  fuelType: string;
  transmission: string;
  seats: string;
  branchId: string;
  pickupDate: string;
  returnDate: string;
  limit: string;
};

export const EMPTY_FORM: FormValues = {
  budget: "",
  category: "",
  fuelType: "",
  transmission: "",
  seats: "",
  branchId: "",
  pickupDate: "",
  returnDate: "",
  limit: "6",
};

type Props = {
  values: FormValues;
  categories: CarCategory[];
  branches: Branch[];
  loading: boolean;
  error: string;
  onChange: (field: keyof FormValues, value: string) => void;
  onSubmit: () => void;
};

const inputClass =
  "mt-2 w-full rounded-xl border border-[#e5e6e1] bg-white px-4 py-3.5 text-sm text-[#0a1411] outline-none transition focus:border-[#c6a15b] focus:ring-2 focus:ring-[#c6a15b]/20";

const labelClass = "text-sm font-semibold text-[#526057]";

const capitalise = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export default function RecommendationForm({
  values,
  categories,
  branches,
  loading,
  error,
  onChange,
  onSubmit,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-12 max-w-4xl rounded-[2rem] border border-[#e5e6e1] bg-white p-5 shadow-xl shadow-[#0a1411]/5 sm:p-8"
    >
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a783c]">
          Personalize your search
        </p>
        <h2 className="mt-2 text-2xl font-bold">Your ideal rental</h2>
        <p className="mt-2 text-sm leading-6 text-[#68736d]">
          Every field is optional. Add dates to see only cars that are free for your trip.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <label className={labelClass}>
          Maximum daily budget (EGP)
          <input
            type="number"
            min="0"
            step="any"
            value={values.budget}
            onChange={(event) => onChange("budget", event.target.value)}
            placeholder="Any budget"
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          Car category
          <select
            value={values.category}
            onChange={(event) => onChange("category", event.target.value)}
            className={inputClass}
          >
            <option value="">Any category</option>
            {categories.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Fuel type
          <select
            value={values.fuelType}
            onChange={(event) => onChange("fuelType", event.target.value)}
            className={inputClass}
          >
            <option value="">Any fuel type</option>
            {FUEL_TYPES.map((fuel) => (
              <option key={fuel} value={fuel}>
                {capitalise(fuel)}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Transmission
          <select
            value={values.transmission}
            onChange={(event) => onChange("transmission", event.target.value)}
            className={inputClass}
          >
            <option value="">Any transmission</option>
            {TRANSMISSIONS.map((item) => (
              <option key={item} value={item}>
                {capitalise(item)}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Passengers
          <input
            type="number"
            min="1"
            max="20"
            value={values.seats}
            onChange={(event) => onChange("seats", event.target.value)}
            placeholder="Any"
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          Pickup branch
          <select
            value={values.branchId}
            onChange={(event) => onChange("branchId", event.target.value)}
            className={inputClass}
          >
            <option value="">Any branch</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Pickup date
          <input
            type="date"
            min={today}
            value={values.pickupDate}
            onChange={(event) => onChange("pickupDate", event.target.value)}
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          Return date
          <input
            type="date"
            min={values.pickupDate || today}
            value={values.returnDate}
            onChange={(event) => onChange("returnDate", event.target.value)}
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          Number of results
          <select
            value={values.limit}
            onChange={(event) => onChange("limit", event.target.value)}
            className={inputClass}
          >
            {["3", "6", "10", "20"].map((count) => (
              <option key={count} value={count}>
                {count} cars
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-7 flex flex-col gap-4 border-t border-[#e5e6e1] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-[#929a94]">
          Scores combine budget, category, fuel, gearbox, seats, branch, reviews and rental history.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#0a1411] px-7 py-4 font-semibold text-white transition hover:bg-[#c6a15b] hover:text-[#0a1411] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Scoring cars...
            </>
          ) : (
            <>
              Find matching cars <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
        >
          {error}
        </div>
      )}
    </form>
  );
}
