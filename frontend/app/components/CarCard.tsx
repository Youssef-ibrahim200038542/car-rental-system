import Link from "next/link";
import type { ReactNode } from "react";
import CarImage from "./CarImage";
import Icon, { type IconName } from "./icons";
import { carDisplayName, carImages, isCarBookable } from "@/lib/cars";
import { formatPrice } from "@/lib/format";
import type { Car } from "@/lib/types";

type CarCardProps = {
  /** The API has no `name` column; older payloads may still carry one. */
  car: Car & { name?: string };
  /** Top-left pill over the photo; defaults to the car's status. */
  badge?: ReactNode;
  /** Top-right pill over the photo; defaults to the category name. */
  tag?: ReactNode;
  /** Extra content under the specs, e.g. why the car was suggested. */
  children?: ReactNode;
  /** Main button; defaults to the car's details page. */
  action?: { label: string; href: string };
  /** Called when any link on the card is followed (before navigation). */
  onNavigate?: () => void;
};

/** The fleet card used by the cars grid, recommendations and similar-cars strip. */
export default function CarCard({ car, badge, tag, children, action, onNavigate }: CarCardProps) {
  const name = carDisplayName(car, "Premium Car");
  const { src, fallbackSrc } = carImages(car);
  const detailsHref = `/cars/${car.id}`;
  const button = action ?? { label: "View Details", href: detailsHref };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#e8e6e1] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#d8c49c] hover:shadow-[0_16px_40px_rgba(10,20,17,0.09)]">
      <Link
        href={detailsHref}
        onClick={onNavigate}
        className="relative block aspect-[16/10] overflow-hidden bg-[#efeee9]"
      >
        <CarImage
          src={src}
          fallbackSrc={fallbackSrc}
          alt={name}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

        <span className="absolute left-4 top-4">{badge ?? <AvailabilityPill car={car} />}</span>

        {(tag ?? car.category?.name) && (
          <span className="absolute right-4 top-4 max-w-[55%] truncate rounded-full border border-white/30 bg-black/35 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-md">
            {tag ?? car.category?.name}
          </span>
        )}

        <div className="absolute bottom-4 left-4 text-white">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/75">
            Starting from
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {formatPrice(car.daily_rate)}
            <span className="ml-1 text-xs font-normal text-white/80">EGP / day</span>
          </p>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="truncate text-xs font-bold uppercase tracking-[0.17em] text-[#a7833e]">
            {car.brand || car.category?.name || "DriveX Select"}
          </p>
          {car.year && <span className="shrink-0 text-xs text-[#888888]">{car.year}</span>}
        </div>

        <h3 className="text-xl font-semibold tracking-tight text-[#0a1411] transition group-hover:text-[#9a783c]">
          {name}
        </h3>

        <div className="mt-5 grid grid-cols-2 gap-3 border-y border-[#efeee9] py-4">
          <Spec icon="calendar" label="Year" value={car.year} />
          <Spec icon="seats" label="Seats" value={car.seats ? `${car.seats} Seats` : null} />
          <Spec icon="gearbox" label="Transmission" value={car.transmission} />
          <Spec icon="fuel" label="Fuel" value={car.fuel_type} />
        </div>

        {car.mileage !== undefined && car.mileage !== null && (
          <p className="mt-4 text-xs text-[#888888]">
            Mileage:{" "}
            <span className="font-medium text-[#555555]">{formatPrice(car.mileage)} km</span>
          </p>
        )}

        {children}

        <div className="mt-auto pt-5">
          <Link
            href={button.href}
            onClick={onNavigate}
            style={{ color: "#ffffff", backgroundColor: "#0a1411" }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition hover:!bg-[#c6a15b] hover:!text-white"
          >
            {button.label}
            <Icon
              name="arrow"
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              strokeWidth={1.8}
            />
          </Link>
        </div>
      </div>
    </article>
  );
}

function AvailabilityPill({ car }: { car: Car }) {
  const available = isCarBookable(car);

  return (
    <span
      className={`block rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide backdrop-blur-sm ${
        available ? "bg-[#e5f3e9]/95 text-[#216b42]" : "bg-white/90 text-[#555555]"
      }`}
    >
      <span
        className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
          available ? "bg-[#2c8b52]" : "bg-[#999999]"
        }`}
      />
      {car.status || "Unavailable"}
    </span>
  );
}

/** A small gold pill for a custom card badge (e.g. "Top match", "92% similar"). */
export function CarCardPill({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className="block rounded-full bg-[#c6a15b] px-3 py-1.5 text-[11px] font-bold tracking-wide text-[#0a1411]"
    >
      {children}
    </span>
  );
}

function Spec({ icon, label, value }: { icon: IconName; label: string; value?: string | number | null }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f5efdf] text-[#a7833e]">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-[#999999]">{label}</p>
        <p className="mt-0.5 truncate text-xs font-semibold capitalize text-[#333333]">
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
}
