"use client";

import { useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { EDITABLE_CAR_STATUSES } from "@/lib/types";
import type { Branch, CarCategory, CarStatus } from "@/lib/types";
import { FormActions, FormCard } from "../../_components/FormCard";
import { FormField, FormSection, SelectField, TextField } from "../../_components/form";
import type { IconName } from "../../_components/icons";
import { humanize } from "../../_lib/format";
import { inputClass } from "../../_lib/ui";
import type { CarFormValues } from "../_lib/car-form";
import { MissingOptionsNotice } from "./MissingOptionsNotice";

/** The one car form, shared by create and edit. Extra sections go in `children`. */
export function CarForm({
  initialValues,
  categories,
  branches,
  legacyStatus,
  header,
  saving,
  submitLabel,
  savingLabel,
  footnote,
  onSubmit,
  children,
}: {
  initialValues: CarFormValues;
  categories: CarCategory[];
  branches: Branch[];
  /** A reserved/rented status loaded from an old row: shown, not selectable. */
  legacyStatus?: CarStatus;
  header: { icon: IconName; title: string; subtitle: string };
  saving: boolean;
  submitLabel: string;
  savingLabel: string;
  footnote: string;
  onSubmit: (values: CarFormValues) => void;
  children?: ReactNode;
}) {
  const [values, setValues] = useState(initialValues);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const field = (name: keyof CarFormValues) => ({
    name,
    value: values[name],
    onChange: handleChange,
  });

  return (
    <>
      <MissingOptionsNotice categories={categories.length} branches={branches.length} />

      <FormCard
        {...header}
        footnote={footnote}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(values);
        }}
      >
        <FormSection
          icon="car"
          title="Vehicle Information"
          description="Identify the vehicle and assign it to a category and branch."
        >
          <TextField {...field("brand")} label="Brand" placeholder="e.g. BMW" autoComplete="off" required />
          <TextField {...field("model")} label="Model" placeholder="e.g. X5" required />
          <TextField {...field("year")} label="Model Year" type="number" placeholder="e.g. 2024" min="1900" max="2100" required />
          <TextField {...field("color")} label="Exterior Color" placeholder="e.g. Black" />
          <SelectField {...field("category_id")} label="Category" required disabled={categories.length === 0}>
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>
          <SelectField {...field("branch_id")} label="Rental Branch" required disabled={branches.length === 0}>
            <option value="" disabled>
              Select a branch
            </option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </SelectField>
        </FormSection>

        <FormSection
          icon="details"
          title="Vehicle Details"
          description="Enter the registration details and technical specifications."
        >
          <TextField {...field("license_plate")} label="License Plate" placeholder="e.g. ABC-1234" required />
          <TextField {...field("vin")} label="VIN" placeholder="Vehicle identification number" required />
          <TextField {...field("mileage")} label="Mileage (km)" type="number" min="0" required />
          <TextField {...field("seats")} label="Number of Seats" type="number" min="1" max="20" required />
          <SelectField {...field("fuel_type")} label="Fuel Type" required>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Electric</option>
          </SelectField>
          <SelectField {...field("transmission")} label="Transmission" required>
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
          </SelectField>
        </FormSection>

        <FormSection
          icon="settings"
          title="Rental Settings"
          description="Set the daily rental price and current vehicle status."
        >
          <FormField id="daily_rate" label="Daily Rate (EGP)" required>
            <div className="relative">
              <input
                id="daily_rate"
                type="number"
                {...field("daily_rate")}
                placeholder="e.g. 1500"
                min="0.01"
                step="0.01"
                required
                className={`${inputClass} pr-24`}
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#9a783c]">
                EGP / day
              </span>
            </div>
          </FormField>
          <SelectField
            {...field("status")}
            label="Vehicle Status"
            required
            hint="Controls the current availability shown in the fleet."
          >
            {legacyStatus && (
              <option value={legacyStatus} disabled>
                {humanize(legacyStatus)} (legacy)
              </option>
            )}
            {EDITABLE_CAR_STATUSES.map((status) => (
              <option key={status} value={status}>
                {humanize(status)}
              </option>
            ))}
          </SelectField>
        </FormSection>

        {children}

        <section className="pt-7 sm:pt-8">
          <FormField
            id="description"
            label="Vehicle Description"
            hint="Add useful information about the vehicle, its features, or special equipment."
          >
            <textarea
              id="description"
              {...field("description")}
              rows={5}
              placeholder="Describe the vehicle and its key features..."
              className={`${inputClass} resize-y`}
            />
          </FormField>
        </section>

        <FormActions
          cancelHref="/admin/cars"
          saving={saving}
          disabled={categories.length === 0 || branches.length === 0}
          label={submitLabel}
          savingLabel={savingLabel}
        />
      </FormCard>
    </>
  );
}
