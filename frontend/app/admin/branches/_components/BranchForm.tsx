"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import type { Branch } from "@/lib/types";
import { FormActions, FormCard } from "../../_components/FormCard";
import { TextField } from "../../_components/form";
import type { IconName } from "../../_components/icons";

export type BranchFormValues = Pick<Branch, "name" | "address" | "city"> & {
  phone: string;
};

export const EMPTY_BRANCH_FORM: BranchFormValues = {
  name: "",
  address: "",
  city: "",
  phone: "",
};

export function branchToFormValues(branch: Branch): BranchFormValues {
  return {
    name: branch.name ?? "",
    address: branch.address ?? "",
    city: branch.city ?? "",
    phone: branch.phone ?? "",
  };
}

/** The one branch form, shared by create and edit. */
export function BranchForm({
  initialValues,
  header,
  saving,
  submitLabel,
  savingLabel,
  onSubmit,
}: {
  initialValues: BranchFormValues;
  header: { icon: IconName; title: string; subtitle: string };
  saving: boolean;
  submitLabel: string;
  savingLabel: string;
  onSubmit: (values: BranchFormValues) => void;
}) {
  const [values, setValues] = useState(initialValues);

  const field = (name: keyof BranchFormValues) => ({
    name,
    value: values[name],
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      setValues((current) => ({ ...current, [name]: value }));
    },
  });

  return (
    <FormCard
      {...header}
      footnote="Fields marked with * are required."
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values);
      }}
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          {...field("name")}
          label="Branch Name"
          placeholder="e.g. Cairo Main Branch"
          autoComplete="organization"
          required
          wide
        />
        <TextField
          {...field("address")}
          label="Street Address"
          placeholder="e.g. 123 Main Street"
          autoComplete="street-address"
          required
          wide
        />
        <TextField
          {...field("city")}
          label="City"
          placeholder="e.g. Cairo"
          autoComplete="address-level2"
          required
        />
        <TextField
          {...field("phone")}
          label="Phone Number"
          type="tel"
          placeholder="e.g. 01000000000"
          autoComplete="tel"
          maxLength={20}
          required
        />
      </div>

      <FormActions
        cancelHref="/admin/branches"
        saving={saving}
        label={submitLabel}
        savingLabel={savingLabel}
      />
    </FormCard>
  );
}
