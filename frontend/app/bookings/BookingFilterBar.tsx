import { pluralise } from "@/lib/format";

export type BookingFilter = "all" | "active" | "completed" | "cancelled";

const FILTERS: { value: BookingFilter; label: string }[] = [
  { value: "all", label: "All Bookings" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

type BookingFilterBarProps = {
  filter: BookingFilter;
  count: number;
  onChange: (filter: BookingFilter) => void;
};

export default function BookingFilterBar({ filter, count, onChange }: BookingFilterBarProps) {
  return (
    <section className="mb-7 flex flex-col gap-4 rounded-2xl border border-[#e8e4db] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div>
        <p className="font-semibold text-[#0a1411]">Reservation History</p>
        <p className="mt-1 text-xs text-[#898981]">
          {count} {pluralise(count, "reservation")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            aria-pressed={filter === item.value}
            className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#c6a15b] focus:ring-offset-2 ${
              filter === item.value
                ? "bg-[#365747] text-white shadow-sm"
                : "border border-[#e8e4db] bg-white text-[#77776f] hover:border-[#c6a15b] hover:bg-[#fbf8f0] hover:text-[#0a1411]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}
