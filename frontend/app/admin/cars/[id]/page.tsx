"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { Car } from "@/lib/types";
import { AdminPage } from "../../_components/AdminPage";
import { Icon } from "../../_components/icons";
import { PageHeader } from "../../_components/PageHeader";
import { ErrorState, LoadingState } from "../../_components/states";
import { useAdminRecord } from "../../_lib/useAdminRecord";
import { buttonClass } from "../../_lib/ui";
import { CarDetailGroups, CarSummary } from "../_components/CarDetails";

const BACK = { href: "/admin/cars", label: "Back to Cars" };

export default function AdminCarDetailsPage() {
  const { id: carId } = useParams<{ id: string }>();
  const car = useAdminRecord<Car>(`/cars/${carId}`, "An unexpected error occurred.");

  if (car.loading) {
    return <LoadingState message="Loading car details..." width="detail" />;
  }

  if (car.error || !car.data) {
    return (
      <ErrorState
        title="Unable to Load Car"
        message={car.error || "The requested car could not be found."}
        onRetry={car.reload}
        back={BACK}
        width="detail"
      />
    );
  }

  const editHref = `/admin/cars/edit/${car.data.id}`;

  return (
    <AdminPage width="detail">
      <PageHeader
        back={BACK}
        eyebrow="Fleet Management"
        title="Car Details"
        description="View vehicle information and manage its fleet record."
        actions={
          <Link href={editHref} className={buttonClass.primary}>
            <Icon name="pencil" className="h-4 w-4" strokeWidth={1.8} />
            Edit Car
          </Link>
        }
      />

      <section className="overflow-hidden rounded-3xl border border-[#e9e5dc] bg-white shadow-[0_8px_35px_rgba(10,20,17,0.035)]">
        <CarSummary car={car.data} />
        <CarDetailGroups car={car.data} />

        <div className="flex flex-col gap-3 border-t border-[#e9e5dc] bg-[#fcfbf8] p-5 sm:flex-row sm:justify-between sm:px-8">
          <Link href="/admin/cars" className={buttonClass.secondary}>
            Back to Inventory
          </Link>
          <Link href={editHref} className={buttonClass.create}>
            Edit This Car
          </Link>
        </div>
      </section>
    </AdminPage>
  );
}
