"use client";

import { useState, type ReactNode } from "react";

type PasswordFieldProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: "new-password" | "current-password";
  /** Accessible name of the Show/Hide toggle, e.g. "password". */
  toggleLabel: string;
  inputClassName: string;
  labelClassName: string;
  minLength?: number;
  hint?: ReactNode;
};

/** A required password input with a Show/Hide toggle. */
export default function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  toggleLabel,
  inputClassName,
  labelClassName,
  minLength,
  hint,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`${inputClassName} pr-20`}
        />

        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={`${visible ? "Hide" : "Show"} ${toggleLabel}`}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-[#68736d] transition hover:text-[#9a783c] focus:outline-none focus:ring-2 focus:ring-[#c6a15b]"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>

      {hint}
    </div>
  );
}
