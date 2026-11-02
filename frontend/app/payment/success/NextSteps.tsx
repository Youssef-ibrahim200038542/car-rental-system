import type { ReactNode } from "react";

type Step = { title: string; text: string; icon: ReactNode };

function steps(cashPending: boolean): Step[] {
  return [
    {
      title: cashPending ? "Reservation Saved" : "Booking Recorded",
      text: "Your booking details have been submitted to the system.",
      icon: (
        <>
          <path d="M12 3 20 6v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
          <path d="m9 12 2 2 4-4" />
        </>
      ),
    },
    {
      title: "Car Reservation",
      text: "Review your selected vehicle and reservation dates in your bookings.",
      icon: (
        <>
          <path d="m3 13 1.5-5A3 3 0 0 1 7.4 6h9.2a3 3 0 0 1 2.9 2l1.5 5v5h-2v-2H5v2H3z" />
          <path d="M4.5 12h15" />
          <circle cx="7" cy="13" r="1.5" />
          <circle cx="17" cy="13" r="1.5" />
        </>
      ),
    },
    {
      title: cashPending ? "Payment Pending" : "Booking Details",
      text: cashPending
        ? "Complete your cash payment at the branch to finalize the payment process."
        : "You can view your reservation details from your bookings page.",
      icon: (
        <>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 8h6M9 12h6M9 16h3" />
        </>
      ),
    },
  ];
}

/** Three cards explaining what happens after checkout. */
export default function NextSteps({ cashPending }: { cashPending: boolean }) {
  return (
    <div className="mt-9 grid gap-4 text-left sm:grid-cols-3">
      {steps(cashPending).map((step) => (
        <div
          key={step.title}
          className="rounded-2xl border border-[#e8e4db] bg-white p-4 transition hover:border-[#c6a15b]/60 sm:p-5"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f6f0e3] text-[#9a783c]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-6 w-6"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              {step.icon}
            </svg>
          </div>
          <p className="mt-4 text-sm font-semibold">{step.title}</p>
          <p className="mt-2 text-xs leading-5 text-[#77776f]">{step.text}</p>
        </div>
      ))}
    </div>
  );
}
