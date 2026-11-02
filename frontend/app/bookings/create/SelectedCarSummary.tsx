import Link from "next/link";
import CarImage from "@/app/components/CarImage";
import { carDisplayName, carImages } from "@/lib/cars";
import { formatPrice, pluralise } from "@/lib/format";
import type { Car } from "@/lib/types";

type SelectedCarSummaryProps = {
  car: Car & { name?: string };
  days: number;
  total: number;
};

/** Sticky sidebar with the chosen car, its rate and the running estimate. */
export default function SelectedCarSummary({ car, days, total }: SelectedCarSummaryProps) {
  const name = carDisplayName(car);
  const { src, fallbackSrc } = carImages(car);
  const available = car.status?.toLowerCase() === "available";

  return (
    <aside className="h-fit overflow-hidden rounded-3xl border border-[#e8e4db] bg-white shadow-[0_8px_30px_rgba(10,20,17,0.03)] lg:sticky lg:top-28">
      <div className="bg-[#0a1411] px-6 py-5 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af6a]">Selected Car</p>
        <p className="mt-2 text-sm text-white/65">Your chosen DriveX vehicle</p>
      </div>

      <div className="p-6">
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#eeece6]">
          <CarImage src={src} fallbackSrc={fallbackSrc} alt={name} sizes="380px" className="object-cover" />
        </div>

        <div className="mt-5">
          <h2 className="text-2xl font-bold tracking-tight text-[#0a1411]">{name}</h2>
          {car.category?.name && <p className="mt-2 text-sm text-[#9a783c]">{car.category.name}</p>}

          <span
            className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
              available ? "bg-[#e5f3e9] text-[#216b42]" : "bg-red-50 text-red-700"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${available ? "bg-[#2c8b52]" : "bg-red-500"}`} />
            {available ? "Available" : "Unavailable"}
          </span>
        </div>

        <div className="mt-6 rounded-2xl bg-[#fafaf8] p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-[#77776f]">Daily Rate</span>
            <span className="font-semibold text-[#0a1411]">{formatPrice(car.daily_rate)} EGP</span>
          </div>

          <div className="my-4 h-px bg-[#e8e4db]" />

          <div className="flex items-start justify-between gap-3">
            <span className="text-sm text-[#77776f]">Default Branch</span>
            <span className="max-w-[160px] text-right text-sm font-semibold text-[#0a1411]">
              {car.branch?.name || "Choose your branch"}
            </span>
          </div>

          {days > 0 && (
            <>
              <div className="my-4 h-px bg-[#e8e4db]" />
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-[#77776f]">
                  {days} {pluralise(days, "day")}
                </span>
                <span className="font-bold text-[#9a783c]">{formatPrice(total)} EGP</span>
              </div>
            </>
          )}
        </div>

        <Link
          href={`/cars/${car.id}`}
          className="mt-5 block text-center text-sm font-semibold text-[#77776f] transition hover:text-[#9a783c]"
        >
          ← Back to Car Details
        </Link>
      </div>
    </aside>
  );
}
