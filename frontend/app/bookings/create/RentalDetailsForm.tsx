import DateRangePicker, { type DateRange } from "@/app/components/DateRangePicker";
import PriceSummary from "@/app/components/PriceSummary";
import { InlineError } from "@/app/components/StateViews";
import { formatPrice, pluralise } from "@/lib/format";
import type { Branch, Money } from "@/lib/types";

export type RentalDetails = {
  pickupBranchId: string;
  dropoffBranchId: string;
  dates: DateRange;
  notes: string;
};

type RentalDetailsFormProps = {
  values: RentalDetails;
  branches: Branch[];
  dailyRate: Money;
  days: number;
  total: number;
  availability: { hasRange: boolean; checking: boolean; available?: boolean; reason?: string };
  error: string;
  submitting: boolean;
  onChange: (next: RentalDetails) => void;
  onSubmit: () => void;
};

const fieldClass =
  "h-12 w-full rounded-xl border border-[#e8e4db] bg-[#fafaf8] px-4 text-sm text-[#202020] outline-none transition focus:border-[#c6a15b]";
const labelClass = "mb-2 block text-sm font-semibold text-[#343830]";

/** Branches, dates, notes, availability, estimate and the confirm button. */
export default function RentalDetailsForm({
  values,
  branches,
  dailyRate,
  days,
  total,
  availability,
  error,
  submitting,
  onChange,
  onSubmit,
}: RentalDetailsFormProps) {
  const set = (patch: Partial<RentalDetails>) => onChange({ ...values, ...patch });
  const { hasRange, checking, available, reason } = availability;

  return (
    <section className="rounded-3xl border border-[#e8e4db] bg-white p-6 shadow-[0_8px_30px_rgba(10,20,17,0.03)] sm:p-8">
      <h2 className="text-2xl font-bold text-[#0a1411]">Rental Details</h2>
      <p className="mt-2 text-sm text-[#898981]">Select your pickup and return information.</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <BranchSelect
          label="Pickup Location"
          placeholder="Select pickup location"
          value={values.pickupBranchId}
          branches={branches}
          onChange={(pickupBranchId) => set({ pickupBranchId })}
        />
        <BranchSelect
          label="Drop-off Location"
          placeholder="Select drop-off location"
          value={values.dropoffBranchId}
          branches={branches}
          onChange={(dropoffBranchId) => set({ dropoffBranchId })}
        />
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <DateRangePicker
          value={values.dates}
          onChange={(dates) => set({ dates })}
          startLabel="Pickup Date"
          endLabel="Return Date"
          labelClassName={labelClass}
          inputClassName={fieldClass}
        />
      </div>

      <label className="mt-6 block">
        <span className={labelClass}>
          Notes <span className="font-normal text-[#898981]">(optional)</span>
        </span>
        <textarea
          rows={3}
          maxLength={1000}
          value={values.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Anything we should know about your rental?"
          className="w-full rounded-xl border border-[#e8e4db] bg-[#fafaf8] px-4 py-3 text-sm text-[#202020] outline-none transition focus:border-[#c6a15b]"
        />
      </label>

      {hasRange && (
        <div
          role="status"
          className={`mt-6 rounded-xl border px-4 py-3 text-sm leading-6 ${
            checking
              ? "border-[#e8e4db] bg-[#fafaf8] text-[#77776f]"
              : available
                ? "border-[#cfe5d6] bg-[#e5f3e9] text-[#216b42]"
                : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {checking
            ? "Checking availability for these dates..."
            : available
              ? "This car is available for your selected dates."
              : reason || "This car is not available for your selected dates."}
        </div>
      )}

      {error && <InlineError message={error} />}

      <div className="mt-8">
        <PriceSummary
          rows={[
            { label: "Rental Duration", value: days > 0 ? `${days} ${pluralise(days, "Day")}` : "--" },
            { label: "Daily Rate", value: `${formatPrice(dailyRate)} EGP` },
          ]}
          total={{ label: "Estimated Total", value: `${formatPrice(total)} EGP` }}
          note="This is an estimate. The final total and availability are confirmed by the server when you book, and shown on the payment page."
        />
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting || branches.length === 0 || checking || available === false}
        className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#0a1411] px-5 text-base font-semibold text-white transition hover:bg-[#1a3027] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? (
          <>
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Confirming Booking...
          </>
        ) : (
          <>
            Confirm Booking <span aria-hidden="true">→</span>
          </>
        )}
      </button>
    </section>
  );
}

type BranchSelectProps = {
  label: string;
  placeholder: string;
  value: string;
  branches: Branch[];
  onChange: (value: string) => void;
};

function BranchSelect({ label, placeholder, value, branches, onChange }: BranchSelectProps) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
        <option value="">{placeholder}</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
    </label>
  );
}
