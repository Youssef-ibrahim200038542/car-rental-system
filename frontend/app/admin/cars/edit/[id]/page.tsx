"use client";

import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { EDITABLE_CAR_STATUSES } from "@/lib/types";
import type { Car } from "@/lib/types";
import { AdminPage } from "../../../_components/AdminPage";
import { PageHeader } from "../../../_components/PageHeader";
import { ErrorAlert, ErrorState, LoadingState } from "../../../_components/states";
import { useCarFormOptions } from "../../../_lib/resources";
import { useAdminRecord } from "../../../_lib/useAdminRecord";
import { useAdminSubmit } from "../../../_lib/useAdminSubmit";
import { CarForm } from "../../_components/CarForm";
import { carToFormValues, carUpdatePayload, type CarFormValues } from "../../_lib/car-form";

const BACK = { href: "/admin/cars", label: "Back to Manage Cars" };

export default function EditCarPage() {
  const router = useRouter();
  const { id: carId } = useParams<{ id: string }>();
  const car = useAdminRecord<Car>(`/cars/${carId}`, "Failed to load car information.");
  const options = useCarFormOptions();

  const { saving, error, setError, submit } = useAdminSubmit(
    async (values: CarFormValues) => {
      await apiFetch(`/cars/${carId}`, { method: "PUT", body: carUpdatePayload(values) });
      router.push("/admin/cars");
    },
    "Failed to update car. Please try again."
  );

  if (car.loading || options.loading) {
    return <LoadingState message="Loading vehicle details..." width="detail" />;
  }

  if (!car.data || car.error || options.loadError) {
    return (
      <ErrorState
        title="Unable to load car"
        message={car.error || options.loadError || "The requested car could not be found."}
        onRetry={() => {
          car.reload();
          options.reload();
        }}
        back={BACK}
        width="detail"
      />
    );
  }

  // Legacy reserved/rented rows keep their value visible but cannot be re-selected.
  const legacyStatus = (EDITABLE_CAR_STATUSES as readonly string[]).includes(car.data.status)
    ? undefined
    : car.data.status;

  return (
    <AdminPage width="detail">
      <PageHeader
        back={BACK}
        eyebrow="Fleet Management"
        title="Edit Vehicle"
        description="Update vehicle specifications, availability, and rental pricing."
      />

      <ErrorAlert message={error} onDismiss={() => setError("")} />

      <CarForm
        initialValues={carToFormValues(car.data)}
        categories={options.categories}
        branches={options.branches}
        legacyStatus={legacyStatus}
        header={{
          icon: "pencil",
          title: `${car.data.brand} ${car.data.model}`,
          subtitle: `Vehicle ID #${car.data.id} · Update the details below and save your changes.`,
        }}
        saving={saving}
        submitLabel="Save Changes"
        savingLabel="Saving Changes..."
        footnote={`DriveX Fleet Management · Vehicle #${carId}`}
        onSubmit={(values) => void submit(values)}
      />
    </AdminPage>
  );
}
