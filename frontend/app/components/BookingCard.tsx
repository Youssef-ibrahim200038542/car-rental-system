import Link from "next/link";
import type { ReactNode } from "react";
import BookingTimeline from "./BookingTimeline";
import CarImage from "./CarImage";
import StatusBadge from "./StatusBadge";
import { carDisplayName, carImages } from "@/lib/cars";
import { formatPrice, pluralise } from "@/lib/format";
import type { Booking } from "@/lib/types";

type BookingCardProps = {
  booking: Booking;
  /** Buttons/links for the footer (pay, cancel, review, view car). */
  actions: ReactNode;
};

/** A reservation with photo, timeline, price breakdown and footer actions. */
export default function BookingCard({ booking, actions }: BookingCardProps) {
  const carName = carDisplayName(booking.car);
  const { src, fallbackSrc } = carImages(booking.car);

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-[#e8e4db] bg-white shadow-[0_10px_35px_rgba(10,20,17,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c6a15b]/60 hover:shadow-[0_18px_45px_rgba(10,20,17,0.08)]">
      <div className="flex flex-col lg:flex-row">
        <div className="relative h-64 overflow-hidden bg-[#eeede8] lg:min-h-[420px] lg:w-72 lg:shrink-0">
          <CarImage
            src={src}
            fallbackSrc={fallbackSrc}
            alt={carName}
            sizes="(min-width: 1024px) 288px, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1411]/50 via-transparent to-transparent" />
          <div className="absolute left-5 top-5">
            <StatusBadge status={booking.status} overlay />
          </div>
          <div className="absolute bottom-5 left-5 text-xs font-semibold tracking-wide text-white">
            BOOKING #{booking.id}
          </div>
        </div>

        <div className="min-w-0 flex-1 p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a783c]">
                Reservation #{booking.id}
              </p>
              <h2 className="mt-2 break-words text-2xl font-bold tracking-tight text-[#0a1411] md:text-3xl">
                {carName}
              </h2>
              {booking.car?.year && (
                <p className="mt-1 text-sm text-[#898981]">{booking.car.year} Model</p>
              )}
            </div>

            <div className="sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#898981]">
                Total Amount
              </p>
              <p className="mt-1 text-2xl font-bold text-[#9a783c] sm:text-3xl">
                {formatPrice(booking.total_amount)}
                <span className="ml-1 text-sm font-medium text-[#898981]">EGP</span>
              </p>
            </div>
          </div>

          <div className="mt-6">
            <BookingTimeline booking={booking} />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Detail
              label="Duration"
              value={`${booking.total_days} ${pluralise(booking.total_days, "Day")}`}
            />
            <Detail label="Daily Rate" value={`${formatPrice(booking.daily_rate)} EGP`} />
            <Detail label="Subtotal" value={`${formatPrice(booking.subtotal)} EGP`} />
            <Detail
              label="Discount"
              value={`${formatPrice(booking.discount)} EGP`}
              valueClass="text-[#356847]"
            />
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-[#e8e4db] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#898981]">Booking ID #{booking.id}</p>
            <div className="flex flex-col gap-3 sm:flex-row">{actions}</div>
          </div>
        </div>
      </div>
    </article>
  );
}

function Detail({
  label,
  value,
  valueClass = "text-[#0a1411]",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-[#e8e4db] bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#898981]">{label}</p>
      <p className={`mt-1 text-sm font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

const actionBase =
  "inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

/** Footer action styles: gold (pay/review), danger (cancel), green (view car). */
export const bookingActionClass = {
  gold: `${actionBase} border-[#e7d7ac] bg-[#fcf6e5] text-[#87662f] hover:border-[#c6a15b] hover:bg-[#f6f0e3] focus:ring-[#c6a15b]`,
  danger: `${actionBase} border-[#e8caca] bg-[#fbefef] text-[#a34444] hover:border-[#c45a5a] focus:ring-[#c45a5a]`,
  green: `${actionBase} border-[#d9e2db] bg-[#edf3ee] text-[#365747] hover:border-[#c6a15b] hover:bg-[#c6a15b] hover:text-[#0a1411] focus:ring-[#c6a15b]`,
};

export function BookingActionLink({
  href,
  tone,
  children,
}: {
  href: string;
  tone: keyof typeof bookingActionClass;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={bookingActionClass[tone]}>
      {children}
      <span aria-hidden="true">→</span>
    </Link>
  );
}
