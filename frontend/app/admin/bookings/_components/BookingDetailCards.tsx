import Link from "next/link";
import type { ReactNode } from "react";
import type { Booking, Branch } from "@/lib/types";
import { CarIllustration } from "../../_components/icons";
import { formatDate, formatDays, humanize, initial } from "../../_lib/format";
import { cardClass } from "../../_lib/ui";

export function DetailCard({
  eyebrow,
  title,
  aside,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  /** Shown at the right of the heading (avatar, count pill...). */
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={cardClass}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="text-sm font-medium text-[#73786f]">{eyebrow}</p>}
          <h2 className="mt-1 text-xl font-bold tracking-tight text-[#0a1411]">{title}</h2>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function InfoItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#85867c]">{label}</p>
      <div className="mt-2 break-words text-sm font-medium text-[#0a1411]">{value || "—"}</div>
    </div>
  );
}

const infoGrid = "grid gap-5 border-t border-[#eeeae2] pt-5 sm:grid-cols-3";

export function CustomerCard({ booking }: { booking: Booking }) {
  return (
    <DetailCard
      eyebrow="Customer Information"
      title={booking.user?.name || "Unknown Customer"}
      aside={
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0a1411] text-lg font-bold text-[#d8b979]">
          {initial(booking.user?.name, "?")}
        </div>
      }
    >
      <div className={infoGrid}>
        <InfoItem label="Email Address" value={booking.user?.email} />
        <InfoItem label="Phone Number" value={booking.user?.phone} />
        <InfoItem label="Customer ID" value={`#${booking.user_id}`} />
      </div>
    </DetailCard>
  );
}

export function VehicleCard({ booking }: { booking: Booking }) {
  return (
    <DetailCard
      eyebrow="Reserved Vehicle"
      title={`${booking.car?.brand || "Unknown"} ${booking.car?.model || ""}`}
      aside={
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f3ead7] text-[#96743b]">
          <CarIllustration className="h-8 w-10" wheelFill="#f3ead7" />
        </div>
      }
    >
      {booking.car?.status && (
        <p className="-mt-4 mb-5 text-xs text-[#85867c]">
          Fleet status: {humanize(booking.car.status)}
        </p>
      )}
      <div className={infoGrid}>
        <InfoItem label="Model Year" value={booking.car?.year} />
        <InfoItem label="Color" value={booking.car?.color} />
        <InfoItem label="Vehicle ID" value={`#${booking.car_id}`} />
      </div>
      <Link
        href={`/cars/${booking.car_id}`}
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#9a783c] transition hover:text-[#0a1411]"
      >
        View Vehicle
        <span aria-hidden="true">→</span>
      </Link>
    </DetailCard>
  );
}

function RentalLeg({
  heading,
  dateLabel,
  date,
  branch,
  fallbackBranch,
}: {
  heading: string;
  dateLabel: string;
  date: string;
  branch?: Branch | null;
  fallbackBranch: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e9e5dc] bg-[#fcfbf8] p-5">
      <p className="text-sm font-semibold text-[#9a783c]">{heading}</p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#85867c]">
        {dateLabel}
      </p>
      <p className="mt-2 text-lg font-bold">{formatDate(date)}</p>
      <p className="mt-3 text-sm text-[#73786f]">{branch?.name || fallbackBranch}</p>
      {branch?.address && (
        <p className="mt-1 text-xs leading-5 text-[#85867c]">{branch.address}</p>
      )}
    </div>
  );
}

export function RentalPeriodCard({ booking }: { booking: Booking }) {
  return (
    <DetailCard title="Rental Period">
      <div className="grid gap-4 sm:grid-cols-2">
        <RentalLeg
          heading="↗ Pick-up"
          dateLabel="Pick-up Date"
          date={booking.pickup_date}
          branch={booking.pickup_branch}
          fallbackBranch="Pickup Branch"
        />
        <RentalLeg
          heading="↙ Drop-off"
          dateLabel="Return Date"
          date={booking.return_date}
          branch={booking.dropoff_branch}
          fallbackBranch="Drop-off Branch"
        />
      </div>
      <div className={`mt-6 ${infoGrid}`}>
        <InfoItem label="Duration" value={formatDays(booking.total_days)} />
        <InfoItem label="Pickup Branch" value={booking.pickup_branch?.name} />
        <InfoItem label="Drop-off Branch" value={booking.dropoff_branch?.name} />
      </div>
    </DetailCard>
  );
}

export function NotesCard({ notes }: { notes: string }) {
  return (
    <DetailCard title="Booking Notes">
      <p className="whitespace-pre-wrap text-sm leading-7 text-[#59645c]">{notes}</p>
    </DetailCard>
  );
}
