import Link from "next/link";
import type { Car } from "@/lib/types";
import { DataRow, DataTable } from "../../_components/DataTable";
import { StatusBadge } from "../../_components/StatusBadge";
import { CarIllustration } from "../../_components/icons";
import { formatEGP } from "../../_lib/format";
import { cellClass, rowActionClass } from "../../_lib/ui";

type RowProps = {
  car: Car;
  deleting: boolean;
  onDelete: (car: Car) => void;
};

function CarThumb() {
  return (
    <div className="flex h-14 w-[72px] shrink-0 items-center justify-center rounded-2xl border border-[#e9e5dc] bg-[#f8f8f5] text-[#8d9b8d]">
      <CarIllustration />
    </div>
  );
}

function CarActions({ car, deleting, onDelete }: RowProps) {
  return (
    <>
      <Link href={`/admin/cars/${car.id}`} className={rowActionClass.view}>
        View
      </Link>
      <Link href={`/admin/cars/edit/${car.id}`} className={rowActionClass.edit}>
        Edit
      </Link>
      <button
        type="button"
        onClick={() => onDelete(car)}
        disabled={deleting}
        className={rowActionClass.delete}
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </>
  );
}

function CarRow(props: RowProps) {
  const { car } = props;

  return (
    <DataRow>
      <td className={cellClass}>
        <div className="flex items-center gap-3">
          <CarThumb />
          <div>
            <p className="font-bold text-[#0a1411]">
              {car.brand} {car.model}
            </p>
            <p className="mt-1 text-xs text-[#85867c]">
              {car.year} · ID #{car.id}
            </p>
          </div>
        </div>
      </td>
      <td className={`${cellClass} text-sm text-[#59645c]`}>{car.category?.name || "—"}</td>
      <td className={`${cellClass} text-sm text-[#59645c]`}>{car.branch?.name || "—"}</td>
      <td className={cellClass}>
        <p className="font-bold text-[#0a1411]">{formatEGP(car.daily_rate)}</p>
        <p className="mt-1 text-xs text-[#85867c]">per day</p>
      </td>
      <td className={cellClass}>
        <StatusBadge kind="car" status={car.status} />
      </td>
      <td className={cellClass}>
        <div className="flex items-center justify-end gap-2">
          <CarActions {...props} />
        </div>
      </td>
    </DataRow>
  );
}

function CarCard(props: RowProps) {
  const { car } = props;

  return (
    <article className="rounded-2xl border border-[#e9e5dc] bg-white p-4">
      <div className="flex items-start gap-3">
        <CarThumb />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[#0a1411]">
            {car.brand} {car.model}
          </h3>
          <p className="mb-3 mt-1 text-xs text-[#85867c]">
            {car.year} · ID #{car.id}
          </p>
          <StatusBadge kind="car" status={car.status} />
        </div>
      </div>

      <dl className="my-4 grid grid-cols-2 gap-3 rounded-xl bg-[#fcfbf8] p-3">
        <div>
          <dt className="text-xs text-[#85867c]">Category</dt>
          <dd className="mt-1 text-sm font-semibold text-[#34443b]">
            {car.category?.name || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[#85867c]">Branch</dt>
          <dd className="mt-1 text-sm font-semibold text-[#34443b]">
            {car.branch?.name || "—"}
          </dd>
        </div>
        <div className="col-span-2 border-t border-[#e9e5dc] pt-3">
          <dt className="text-xs text-[#85867c]">Daily Rate</dt>
          <dd className="mt-1 font-bold text-[#0a1411]">
            {formatEGP(car.daily_rate)}
            <span className="ml-1 text-xs font-normal text-[#85867c]">/ day</span>
          </dd>
        </div>
      </dl>

      <div className="grid grid-cols-3 gap-2">
        <CarActions {...props} />
      </div>
    </article>
  );
}

export function CarsTable({
  cars,
  deletingId,
  onDelete,
}: {
  cars: Car[];
  deletingId: number | null;
  onDelete: (car: Car) => void;
}) {
  const rowProps = (car: Car) => ({ car, deleting: deletingId === car.id, onDelete });

  return (
    <DataTable
      columns={["Vehicle", "Category", "Branch", "Daily Rate", "Status", "Actions"]}
      minWidth="min-w-[900px]"
      mobile={cars.map((car) => (
        <CarCard key={car.id} {...rowProps(car)} />
      ))}
    >
      {cars.map((car) => (
        <CarRow key={car.id} {...rowProps(car)} />
      ))}
    </DataTable>
  );
}
