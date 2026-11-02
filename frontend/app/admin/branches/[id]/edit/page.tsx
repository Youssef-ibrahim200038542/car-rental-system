"use client";

import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { Branch } from "@/lib/types";
import { AdminPage } from "../../../_components/AdminPage";
import { PageHeader } from "../../../_components/PageHeader";
import { ErrorAlert, ErrorState, LoadingState } from "../../../_components/states";
import { useAdminRecord } from "../../../_lib/useAdminRecord";
import { useAdminSubmit } from "../../../_lib/useAdminSubmit";
import {
  BranchForm,
  branchToFormValues,
  type BranchFormValues,
} from "../../_components/BranchForm";

const BACK = { href: "/admin/branches", label: "Back to Branches" };

export default function EditBranchPage() {
  const router = useRouter();
  const { id: branchId } = useParams<{ id: string }>();
  const branch = useAdminRecord<Branch>(
    `/branches/${branchId}`,
    "Failed to load branch details."
  );

  const { saving, error, setError, submit } = useAdminSubmit(
    async (values: BranchFormValues) => {
      await apiFetch(`/branches/${branchId}`, { method: "PUT", body: values });
      router.push("/admin/branches");
      router.refresh();
    },
    "Failed to update branch."
  );

  if (branch.loading) {
    return <LoadingState message="Loading branch details..." width="form" />;
  }

  if (branch.error || !branch.data) {
    return (
      <ErrorState
        title="Unable to load branch"
        message={branch.error || "The requested branch could not be found."}
        onRetry={branch.reload}
        back={BACK}
        width="form"
      />
    );
  }

  return (
    <AdminPage width="form">
      <PageHeader
        back={BACK}
        eyebrow="Branch Management"
        title="Edit Branch"
        description="Update your rental location details below and save your changes."
      />

      <ErrorAlert message={error} onDismiss={() => setError("")} />

      <BranchForm
        initialValues={branchToFormValues(branch.data)}
        header={{
          icon: "pencil",
          title: "Branch Information",
          subtitle: "Update the location's contact details.",
        }}
        saving={saving}
        submitLabel="Save Changes"
        savingLabel="Saving Changes..."
        onSubmit={(values) => void submit(values)}
      />
    </AdminPage>
  );
}
