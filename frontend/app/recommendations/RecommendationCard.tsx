/* eslint-disable @next/next/no-img-element -- matches the cars page, which uses plain <img> with a local fallback */
import Link from "next/link";
import { getCarImageUrl, getLocalCarImage } from "@/lib/car-images";
import type { Recommendation } from "./recommendations-api";

type Props = {
  recommendation: Recommendation;
  rank: number;
};

export default function RecommendationCard({ recommendation, rank }: Props) {
  const { car, score, reasons } = recommendation;
  const title = `${car.brand} ${car.model}`;

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-[#e5e6e1] bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#c6a15b]/60 hover:shadow-xl">
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-[#17251f] to-[#35463c]">
        <img
          src={getCarImageUrl(car.image, car.brand, car.model, title)}
          onError={(event) => {
            event.currentTarget.src = getLocalCarImage(car.brand, car.model, title);
          }}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

        <span className="absolute left-4 top-4 rounded-full bg-[#c6a15b] px-3 py-1.5 text-xs font-bold text-[#0a1411]">
          {rank === 1 ? "Top match" : `Option ${rank}`}
        </span>

        <span
          className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-xs font-semibold text-white"
          title="Match score out of 100"
        >
          {score}/100
        </span>

        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-xs font-bold uppercase tracking-wider text-white/80">
            {car.category?.name ?? "Car"} · {car.year}
          </p>
          <h3 className="mt-1 text-2xl font-bold text-white drop-shadow">{title}</h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {car.branch && (
          <p className="text-sm text-[#68736d]">
            {car.branch.name}
            {car.branch.city ? ` · ${car.branch.city}` : ""}
          </p>
        )}

        <div className="mt-4 border-b border-[#e5e6e1] pb-4">
          <p className="text-xs text-[#929a94]">Daily rate</p>
          <p className="mt-1 text-2xl font-bold">
            {Number(car.daily_rate).toLocaleString()} EGP
          </p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Spec label="Fuel" value={car.fuel_type} />
          <Spec label="Gearbox" value={car.transmission} />
          <Spec label="Seats" value={String(car.seats)} />
        </div>

        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#929a94]">
            Why this car
          </p>
          <ul className="mt-2 space-y-1.5 text-sm leading-6 text-[#526057]">
            {reasons.map((reason) => (
              <li key={reason} className="flex gap-2">
                <span aria-hidden="true" className="text-[#9a783c]">•</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>

        <Link
          href={`/bookings/create?car_id=${car.id}`}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#0a1411] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c6a15b] hover:text-[#0a1411]"
        >
          Book this car
        </Link>
      </div>
    </article>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#e5e6e1] bg-[#f8f8f7] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#929a94]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold capitalize text-[#0a1411]">
        {value || "N/A"}
      </p>
    </div>
  );
}
