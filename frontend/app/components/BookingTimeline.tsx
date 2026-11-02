import { formatDate } from "@/lib/format";
import type { Booking } from "@/lib/types";

/** Pick-up → return panel with dates and branches. */
export default function BookingTimeline({ booking }: { booking: Booking }) {
  return (
    <div className="rounded-2xl border border-[#e8e4db] bg-[#f8f8f7] p-4 sm:p-5">
      <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <Stop
          label="Pick-up"
          dotClass="bg-[#4d8b5e]"
          date={booking.pickup_date}
          branch={booking.pickup_branch?.name || "Pickup Branch"}
          city={booking.pickup_branch?.city}
        />

        <div className="hidden h-px w-16 bg-gradient-to-r from-[#4d8b5e]/50 via-[#d9d3c6] to-[#c6a15b]/70 md:block" />

        <Stop
          label="Return"
          dotClass="bg-[#c6a15b]"
          date={booking.return_date}
          branch={booking.dropoff_branch?.name || "Drop-off Branch"}
          city={booking.dropoff_branch?.city}
          alignEnd
        />
      </div>
    </div>
  );
}

type StopProps = {
  label: string;
  dotClass: string;
  date: string;
  branch: string;
  city?: string;
  alignEnd?: boolean;
};

function Stop({ label, dotClass, date, branch, city, alignEnd = false }: StopProps) {
  return (
    <div className={alignEnd ? "md:text-right" : undefined}>
      <div className={`flex items-center gap-2 ${alignEnd ? "md:flex-row-reverse md:justify-start" : ""}`}>
        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#898981]">{label}</p>
      </div>

      <p className="mt-2 text-lg font-bold text-[#0a1411]">{formatDate(date)}</p>
      <p className="mt-1 text-sm text-[#77776f]">{branch}</p>
      {city && <p className="mt-0.5 text-xs text-[#898981]">{city}</p>}
    </div>
  );
}
