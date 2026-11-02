import Icon from "@/app/components/icons";
import StatTile from "@/app/components/StatTile";

type BookingStatsProps = {
  total: number;
  active: number;
  spent: number;
};

/** Three summary tiles above the booking list. */
export default function BookingStats({ total, active, spent }: BookingStatsProps) {
  return (
    <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatTile
        label="Total Bookings"
        value={total}
        note="All reservations"
        icon={
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f6f0e3] text-[#9a783c]">
            <Icon name="calendar" />
          </div>
        }
      />
      <StatTile
        label="Active Trips"
        value={active}
        valueClass="text-[#356847]"
        note="Current reservations"
        hoverClass="hover:border-[#b9d8c0]"
        icon={
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf6ee]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#4d8b5e]" />
          </div>
        }
      />
      <StatTile
        label="Total Spent"
        value={
          <>
            {spent.toLocaleString()}
            <span className="ml-1 text-sm font-medium text-[#898981]">EGP</span>
          </>
        }
        valueClass="text-[#9a783c]"
        note="Paid so far"
        className="sm:col-span-2 lg:col-span-1"
        icon={
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f6f0e3] text-[#9a783c]">
            <Icon name="money" />
          </div>
        }
      />
    </section>
  );
}
