import type { ReactNode } from "react";
import type { PaymentMethod } from "@/lib/types";

type MethodOption = {
  value: PaymentMethod;
  title: string;
  description: string;
  icon: ReactNode;
};

const OPTIONS: MethodOption[] = [
  {
    value: "card",
    title: "Credit / Debit Card",
    description: "Card payment simulation",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="M3 10h18M7 15h4" />
      </>
    ),
  },
  {
    value: "online",
    title: "Online Payment",
    description: "Online payment simulation",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </>
    ),
  },
  {
    value: "cash",
    title: "Cash at Branch",
    description: "Pay when you collect the car.",
    icon: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M6 9h.01M18 15h.01" />
      </>
    ),
  },
];

type PaymentMethodPickerProps = {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
};

/** Three selectable cards for card / online / cash. */
export default function PaymentMethodPicker({ value, onChange }: PaymentMethodPickerProps) {
  return (
    <div className="mt-7 space-y-3">
      {OPTIONS.map((option) => {
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`w-full rounded-2xl border p-4 text-left transition duration-200 sm:p-5 ${
              selected
                ? "border-[#c6a15b] bg-[#fbf8f0] shadow-[0_0_0_1px_rgba(198,161,91,0.15)]"
                : "border-[#e8e4db] bg-white hover:border-[#c6a15b]/60 hover:bg-[#fcfbf8]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    selected ? "bg-[#0a1411] text-[#e0c48b]" : "bg-[#f2f1ec] text-[#55594f]"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-6 w-6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    aria-hidden="true"
                  >
                    {option.icon}
                  </svg>
                </div>

                <div className="min-w-0">
                  <p className="font-semibold">{option.title}</p>
                  <p className="mt-1 text-sm leading-5 text-[#77776f]">{option.description}</p>
                </div>
              </div>

              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  selected ? "border-[#9a783c] bg-[#9a783c] text-xs text-white" : "border-[#d8d5cb]"
                }`}
              >
                {selected && "✓"}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
