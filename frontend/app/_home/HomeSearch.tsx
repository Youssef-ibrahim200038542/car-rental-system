"use client";

import { useState, type FormEvent } from "react";
import DateRangePicker from "@/app/components/DateRangePicker";

const fieldClass =
  "w-full rounded-xl border border-[#e7e0d2] bg-[#f8f6f0] px-4 py-3.5 text-sm text-[#12201b] outline-none transition placeholder:text-[#12201b]/40 focus:border-[#b8893f] focus:bg-white focus:ring-2 focus:ring-[#b8893f]/15";
const labelClass = "mb-2 block text-xs font-semibold text-[#12201b]/65";

/** Pickup / dates / seats search that opens the cars page with those filters. */
export default function HomeSearch({ onSearch }: { onSearch: (path: string) => void }) {
  const [pickup, setPickup] = useState("");
  const [dates, setDates] = useState({ start: "", end: "" });
  const [seats, setSeats] = useState("any");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    if (pickup.trim()) params.set("pickup", pickup.trim());
    if (dates.start) params.set("from", dates.start);
    if (dates.end) params.set("to", dates.end);
    if (seats !== "any") params.set("seats", seats);

    const query = params.toString();
    onSearch(query ? `/cars?${query}` : "/cars");
  };

  return (
    <section className="relative z-10 mx-auto -mt-24 max-w-[1300px] px-5 sm:px-8 lg:-mt-28 lg:px-12">
      <form
        onSubmit={submit}
        className="grid gap-4 rounded-3xl border border-[#e8e0d1] bg-white p-5 shadow-2xl shadow-[#12201b]/10 sm:grid-cols-2 sm:p-7 lg:grid-cols-[1.3fr_1fr_1fr_0.8fr_auto] lg:items-end"
      >
        <label className="block">
          <span className={labelClass}>Pickup branch</span>
          <input
            className={fieldClass}
            placeholder="City or branch"
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
          />
        </label>

        <DateRangePicker
          value={dates}
          onChange={setDates}
          labelClassName={labelClass}
          inputClassName={fieldClass}
        />

        <label className="block">
          <span className={labelClass}>Seats</span>
          <select className={fieldClass} value={seats} onChange={(e) => setSeats(e.target.value)}>
            <option value="any">Any</option>
            <option value="2">2 seats</option>
            <option value="4">4 seats</option>
            <option value="5">5 seats</option>
            <option value="7">7+ seats</option>
          </select>
        </label>

        <button
          type="submit"
          className="rounded-xl bg-[#12201b] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1f3a30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8893f] sm:col-span-2 lg:col-span-1"
        >
          Search cars
          <span className="ml-2 text-[#d4af6a]">→</span>
        </button>
      </form>
    </section>
  );
}
