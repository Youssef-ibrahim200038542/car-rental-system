"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { AdminPage } from "../../_components/AdminPage";
import { PageHeader } from "../../_components/PageHeader";
import { ErrorAlert, ErrorState, LoadingState } from "../../_components/states";
import { useCarFormOptions } from "../../_lib/resources";
import { useAdminSubmit } from "../../_lib/useAdminSubmit";
import { CarForm } from "../_components/CarForm";
import { CarImagePicker } from "../_components/CarImagePicker";
import { EMPTY_CAR_FORM, carCreatePayload, type CarFormValues } from "../_lib/car-form";

const BACK = { href: "/admin/cars", label: "Back to Manage Cars" };

export default function CreateCarPage() {
  const router = useRouter();
  const options = useCarFormOptions();
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { saving, error, setError, submit } = useAdminSubmit(
    async (values: CarFormValues) => {
      await apiFetch("/cars", { method: "POST", body: carCreatePayload(values, imageFile) });
      router.push("/admin/cars");
    },
    "Failed to create car."
  );

  if (options.loading) {
    return <LoadingState message="Preparing vehicle form..." width="detail" />;
  }

  if (options.loadError) {
    return (
      <ErrorState
        title="Unable to prepare the form"
        message={options.loadError}
        onRetry={options.reload}
        back={BACK}
        width="detail"
      />
    );
  }

  return (
    <AdminPage width="detail">
      <PageHeader
        back={BACK}
        eyebrow="Fleet Management"
        title="Add New Car"
        description="Add a vehicle to your DriveX fleet and configure its specifications, location, and rental pricing."
      />

      <ErrorAlert message={error} onDismiss={() => setError("")} />

      <CarForm
        initialValues={EMPTY_CAR_FORM}
        categories={options.categories}
        branches={options.branches}
        header={{
          icon: "car",
          title: "Vehicle Registration",
          subtitle: "Complete the details below to register a new vehicle.",
        }}
        saving={saving}
        submitLabel="Add Car to Fleet"
        savingLabel="Adding Car..."
        footnote="DriveX Fleet Management · All required fields must be completed."
        onSubmit={(values) => void submit(values)}
      >
        <CarImagePicker file={imageFile} onChange={setImageFile} onError={setError} />
      </CarForm>
    </AdminPage>
  );
}
