import type { ReactNode } from "react";
import type { Car } from "@/lib/types";
import { StatusBadge } from "../../_components/StatusBadge";
import { CarIllustration } from "../../_components/icons";
import { formatDate, formatEGP, humanize } from "../../_lib/format";

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  const present = value !== null && value !== undefined && value !== "";

  return (
    <div className="rounded-xl border border-[#e9e5dc] bg-[#fcfbf8] p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-[#85867c]">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-[#0a1411]">
        {present ? value : "Not specified"}
      </p>
    </div>
  );
}

function DetailGroup({
  title,
  columns = 3,
  children,
}: {
  title: string;
  columns?: 2 | 3;
  children: ReactNode;
}) {
  const grid =
    columns === 2
      ? "grid gap-4 sm:grid-cols-2"
      : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="mb-8 last:mb-0">
      <h3 className="mb-4 text-lg font-bold">{title}</h3>
      <div className={grid}>{children}</div>
    </div>
  );
}

export function CarSummary({ car }: { car: Car }) {
  return (
    <div className="border-b border-[#e9e5dc] bg-[#fcfbf8] p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-[#e9e5dc] bg-[#f3ead7] text-[#96743b]">
          <CarIllustration className="h-14 w-16" wheelFill="#f3ead7" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-[#85867c]">
            Vehicle ID #{car.id}
          </p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
            {car.brand} {car.model}
          </h2>
          <p className="mt-2 text-sm text-[#73786f]">Model year {car.year}</p>
        </div>

        <StatusBadge kind="car" status={car.status || "inactive"} size="lg" />
      </div>
    </div>
  );
}

export function CarDetailGroups({ car }: { car: Car }) {
  const mileage =
    car.mileage !== null && car.mileage !== undefined
      ? `${Number(car.mileage).toLocaleString("en-US")} km`
      : undefined;

  return (
    <div className="p-5 sm:p-8">
      <DetailGroup title="General Information">
        <DetailItem label="Brand" value={car.brand} />
        <DetailItem label="Model" value={car.model} />
        <DetailItem label="Year" value={car.year} />
        <DetailItem label="Category" value={car.category?.name} />
        <DetailItem label="Branch" value={car.branch?.name} />
        <DetailItem label="Plate Number" value={car.license_plate} />
      </DetailGroup>

      <DetailGroup title="Rental Information">
        <div className="rounded-xl border border-[#e7dcc4] bg-[#f8f0df] p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-[#806331]">
            Daily Rate
          </p>
          <p className="mt-2 text-xl font-bold text-[#0a1411]">{formatEGP(car.daily_rate)}</p>
          <p className="mt-1 text-xs text-[#806331]">Per day</p>
        </div>
        <DetailItem label="Current Status" value={humanize(car.status || "inactive")} />
        <DetailItem label="Car ID" value={`#${car.id}`} />
      </DetailGroup>

      <DetailGroup title="Vehicle Specifications">
        <DetailItem label="Transmission" value={car.transmission} />
        <DetailItem label="Fuel Type" value={car.fuel_type} />
        <DetailItem label="Seats" value={car.seats} />
        <DetailItem label="Color" value={car.color} />
        <DetailItem label="Mileage" value={mileage} />
      </DetailGroup>

      {car.description && (
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-bold">Description</h3>
          <div className="rounded-xl border border-[#e9e5dc] bg-[#fcfbf8] p-5">
            <p className="whitespace-pre-wrap text-sm leading-7 text-[#59645c]">
              {car.description}
            </p>
          </div>
        </div>
      )}

      <DetailGroup title="Record Information" columns={2}>
        <DetailItem label="Created At" value={formatDate(car.created_at)} />
        <DetailItem label="Last Updated" value={formatDate(car.updated_at)} />
      </DetailGroup>
    </div>
  );
}
