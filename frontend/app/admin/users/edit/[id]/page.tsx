"use client";

import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useSessionUser } from "@/lib/auth";
import type { User } from "@/lib/types";
import { AdminPage } from "../../../_components/AdminPage";
import { PageHeader } from "../../../_components/PageHeader";
import { ErrorAlert, ErrorState, LoadingState } from "../../../_components/states";
import { useAdminRecord } from "../../../_lib/useAdminRecord";
import { useAdminSubmit } from "../../../_lib/useAdminSubmit";
import { UserForm, type UserFormValues } from "../../_components/UserForm";

const BACK = { href: "/admin/users", label: "Back to Users" };

export default function EditUserPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const user = useAdminRecord<User>(`/users/${id}`, "Failed to load user.");

  // The backend rejects a role change on your own account, so hide it there.
  const sessionUser = useSessionUser();
  const editingSelf = sessionUser?.id === Number(id);

  const { saving, error, setError, submit } = useAdminSubmit(
    async ({ role, ...profile }: UserFormValues) => {
      await apiFetch(`/users/${id}`, {
        method: "PUT",
        body: {
          ...profile,
          ...(editingSelf ? {} : { role }),
          phone: profile.phone.trim() || null,
        },
      });
      router.push("/admin/users");
      router.refresh();
    },
    "Failed to update user."
  );

  if (user.loading) {
    return <LoadingState message="Loading user information..." width="form" />;
  }

  if (user.error || !user.data) {
    return (
      <ErrorState
        title="Unable to load user"
        message={user.error || "The requested user could not be found."}
        onRetry={user.reload}
        back={BACK}
        width="form"
      />
    );
  }

  return (
    <AdminPage width="form">
      <PageHeader
        back={BACK}
        eyebrow="User Management"
        title="Edit User"
        description="Update account information and manage the user's access permissions."
      />

      <ErrorAlert message={error} onDismiss={() => setError("")} />

      <UserForm
        userId={id}
        initialValues={{
          name: user.data.name || "",
          email: user.data.email || "",
          phone: user.data.phone || "",
          role: user.data.role || "customer",
        }}
        canChangeRole={!editingSelf}
        saving={saving}
        onSubmit={(values) => void submit(values)}
      />
    </AdminPage>
  );
}
