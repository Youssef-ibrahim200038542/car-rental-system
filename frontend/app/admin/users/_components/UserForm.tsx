"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import type { Role } from "@/lib/types";
import { FormActions, FormCard } from "../../_components/FormCard";
import { SelectField, TextField } from "../../_components/form";
import { humanize } from "../../_lib/format";

export type UserFormValues = {
  name: string;
  email: string;
  phone: string;
  role: Role;
};

function RoleWarning() {
  return (
    <div className="mt-4 flex gap-3 rounded-2xl border border-[#e7dcc4] bg-[#fbf7eb] p-4 sm:col-span-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f2e7c9] text-lg text-[#806331]">
        !
      </div>
      <div>
        <p className="text-sm font-bold text-[#795d2e]">Role Permissions</p>
        <p className="mt-1 text-xs leading-5 text-[#7e7562]">
          Admins can access the administration dashboard and manage platform data.
          Staff have operational access according to the backend permissions.
          Customers use the regular rental experience. Assign elevated roles only to
          trusted users.
        </p>
      </div>
    </div>
  );
}

/**
 * Edit a user's profile and, unless it is the signed-in admin's own account
 * (the backend refuses that), their role.
 */
export function UserForm({
  userId,
  initialValues,
  canChangeRole,
  saving,
  onSubmit,
}: {
  userId: string;
  initialValues: UserFormValues;
  canChangeRole: boolean;
  saving: boolean;
  onSubmit: (values: UserFormValues) => void;
}) {
  const [values, setValues] = useState(initialValues);

  const field = (name: keyof UserFormValues) => ({
    name,
    value: values[name],
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      setValues((current) => ({ ...current, [name]: value }));
    },
  });

  return (
    <FormCard
      icon="user"
      title={values.name || "User"}
      subtitle={`User ID #${userId} · ${humanize(values.role)}`}
      footnote="DriveX Admin · User Management"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values);
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          {...field("name")}
          label="Full Name"
          placeholder="Enter full name"
          autoComplete="name"
          maxLength={255}
          required
          wide
        />
        <TextField
          {...field("email")}
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          autoComplete="email"
          maxLength={255}
          required
          wide
        />
        <TextField
          {...field("phone")}
          label="Phone Number"
          type="tel"
          placeholder="Enter phone number"
          autoComplete="tel"
          maxLength={30}
          hint="Optional. Leave blank if no phone number is available."
          wide
        />

        {canChangeRole && (
          <>
            <SelectField
              {...field("role")}
              label="User Role"
              hint="Choose the role that determines this user's access."
            >
              <option value="customer">Customer</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </SelectField>
            <RoleWarning />
          </>
        )}
      </div>

      <FormActions
        cancelHref="/admin/users"
        saving={saving}
        label="Save Changes"
        savingLabel="Saving Changes..."
      />
    </FormCard>
  );
}
