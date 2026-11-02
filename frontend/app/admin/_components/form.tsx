import type { ChangeEvent, InputHTMLAttributes, ReactNode } from "react";
import { inputClass, labelClass } from "../_lib/ui";
import { Icon, type IconName } from "./icons";

type FieldChange = (
  event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
) => void;

/** A titled group of fields in a two-column grid. */
export function FormSection({
  icon,
  title,
  description,
  children,
}: {
  icon: IconName;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-[#eeece5] py-7 first:pt-0 sm:py-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#c6a15b]/25 bg-[#c6a15b]/10 text-[#9a783c]">
          <Icon name={icon} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#0a1411]">{title}</h2>
          <p className="mt-1 text-sm leading-5 text-[#68736c]">{description}</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/** Label (with a gold * when required), the control, and an optional hint. */
export function FormField({
  id,
  label,
  required = false,
  hint,
  wide = false,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  /** Span both columns of a FormSection grid. */
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className={labelClass}>
        {label} {required && <span className="text-[#b58b43]">*</span>}
      </label>
      {children}
      {hint && <p className="mt-2 text-xs leading-5 text-[#929990]">{hint}</p>}
    </div>
  );
}

/** A FormField holding one text-like <input>; `name` doubles as its id. */
export function TextField({
  name,
  label,
  value,
  onChange,
  hint,
  wide,
  required,
  ...inputProps
}: Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  name: string;
  label: string;
  value: string;
  onChange: FieldChange;
  hint?: string;
  wide?: boolean;
}) {
  return (
    <FormField id={name} label={label} required={required} hint={hint} wide={wide}>
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        type="text"
        className={inputClass}
        {...inputProps}
      />
    </FormField>
  );
}

/** A FormField holding one <select>; `name` doubles as its id. */
export function SelectField({
  name,
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  hint,
  children,
}: {
  name: string;
  label: string;
  value: string;
  onChange: FieldChange;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
  /** The <option> elements. */
  children: ReactNode;
}) {
  return (
    <FormField id={name} label={label} required={required} hint={hint}>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={inputClass}
      >
        {children}
      </select>
    </FormField>
  );
}
