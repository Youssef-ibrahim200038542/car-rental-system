import CarImage from "@/app/components/CarImage";
import { carDisplayName, carImages } from "@/lib/cars";
import { formatDate, formatMoney, pluralise } from "@/lib/format";
import type { Booking } from "@/lib/types";

/** Sticky sidebar: the car, dates, price breakdown and the total to pay. */
export default function ReservationSummary({ booking }: { booking: Booking }) {
  const carName = carDisplayName(booking.car);
  const { src, fallbackSrc } = carImages(booking.car);
  const hasDiscount = Number(booking.discount) > 0;

  const rows: { label: string; value: string; valueClass?: string }[] = [
    { label: "Pickup Date", value: formatDate(booking.pickup_date) },
    { label: "Return Date", value: formatDate(booking.return_date) },
    { label: "Duration", value: `${booking.total_days} ${pluralise(booking.total_days, "Day")}` },
    { label: "Daily Rate", value: `${formatMoney(booking.daily_rate)} EGP` },
    ...(hasDiscount
      ? [
          { label: "Subtotal", value: `${formatMoney(booking.subtotal)} EGP` },
          { label: "Discount", value: `−${formatMoney(booking.discount)} EGP`, valueClass: "text-[#497354]" },
        ]
      : []),
  ];

  return (
    <aside className="h-fit min-w-0 rounded-3xl border border-[#e8e4db] bg-white p-5 shadow-[0_12px_40px_rgba(10,20,17,0.04)] sm:p-6 lg:sticky lg:top-28">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#9a783c]">
        <span className="h-px w-6 bg-[#c6a15b]" />
        Reservation Summary
      </p>

      <div className="relative mt-5 h-48 overflow-hidden rounded-2xl bg-[#f2f1ec] sm:h-44">
        <CarImage src={src} fallbackSrc={fallbackSrc} alt={carName} sizes="370px" className="object-cover" />
      </div>

      <h2 className="mt-5 text-2xl font-bold tracking-tight">{carName}</h2>
      {booking.car?.year && <p className="mt-1 text-sm text-[#77776f]">{booking.car.year}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        {booking.pickup_branch?.name && (
          <span className="rounded-lg bg-[#f8f8f7] px-3 py-2 text-xs font-medium text-[#55594f]">
            Pickup: {booking.pickup_branch.name}
          </span>
        )}
        {booking.dropoff_branch?.name && (
          <span className="rounded-lg bg-[#f8f8f7] px-3 py-2 text-xs font-medium text-[#55594f]">
            Return: {booking.dropoff_branch.name}
          </span>
        )}
      </div>

      <div className="my-6 h-px bg-[#e8e4db]" />

      <dl className="space-y-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-4">
            <dt className="text-sm text-[#77776f]">{row.label}</dt>
            <dd className={`text-right text-sm font-semibold ${row.valueClass ?? ""}`}>{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="my-6 h-px bg-[#e8e4db]" />

      <div className="rounded-2xl bg-[#0a1411] p-5 text-white">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/60">Total Amount</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-[#e0c48b]">
          {formatMoney(booking.total_amount)}
          <span className="ml-2 text-sm font-semibold text-white/70">EGP</span>
        </p>
        <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-white/60">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4 shrink-0 text-[#e0c48b]"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden="true"
          >
            <path d="m12 3 8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <span>Booking #{booking.id}</span>
        </div>
      </div>

      <p className="mt-4 text-center text-xs leading-5 text-[#898981]">
        Please review your dates and total before confirming.
      </p>
    </aside>
  );
}
