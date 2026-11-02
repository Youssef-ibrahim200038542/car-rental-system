"use client";

import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { AdminPage } from "../../_components/AdminPage";
import { PageHeader } from "../../_components/PageHeader";
import { ErrorAlert } from "../../_components/states";
import { useAdminSubmit } from "../../_lib/useAdminSubmit";
import {
  BranchForm,
  EMPTY_BRANCH_FORM,
  type BranchFormValues,
} from "../_components/BranchForm";

export default function CreateBranchPage() {
  const router = useRouter();

  const { saving, error, setError, submit } = useAdminSubmit(
    async (values: BranchFormValues) => {
      await apiFetch("/branches", { method: "POST", body: values });
      router.push("/admin/branches");
    },
    "Failed to create branch."
  );

  return (
    <AdminPage width="form">
      <PageHeader
        back={{ href: "/admin/branches", label: "Back to Branches" }}
        eyebrow="Branch Management"
        title="Add New Branch"
        description="Add a new rental location to your DriveX network. Enter the branch details below to get started."
      />

      <ErrorAlert message={error} onDismiss={() => setError("")} />

      <BranchForm
        initialValues={EMPTY_BRANCH_FORM}
        header={{
          icon: "branch",
          title: "Branch Information",
          subtitle: "Provide the location's contact details.",
        }}
        saving={saving}
        submitLabel="Create Branch"
        savingLabel="Creating..."
        onSubmit={(values) => void submit(values)}
      />
    </AdminPage>
  );
}
