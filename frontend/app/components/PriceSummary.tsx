import { Fragment, type ReactNode } from "react";

export type PriceRow = {
  label: string;
  value: ReactNode;
  /** Tailwind classes for the value, e.g. a green discount. */
  valueClass?: string;
};

type PriceSummaryProps = {
  rows: PriceRow[];
  total: { label: string; value: ReactNode };
  note?: ReactNode;
};

/** Label/value rows separated by rules, ending in a highlighted total. */
export default function PriceSummary({ rows, total, note }: PriceSummaryProps) {
  return (
    <div className="rounded-2xl border border-[#e8e4db] bg-[#fafaf8] p-5 sm:p-6">
      {rows.map((row) => (
        <Fragment key={row.label}>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-[#77776f]">{row.label}</span>
            <span className={`text-right font-semibold ${row.valueClass ?? "text-[#0a1411]"}`}>
              {row.value}
            </span>
          </div>
          <div className="my-4 h-px bg-[#e8e4db]" />
        </Fragment>
      ))}

      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold text-[#0a1411]">{total.label}</span>
        <span className="text-2xl font-bold text-[#9a783c]">{total.value}</span>
      </div>

      {note && <p className="mt-3 text-xs leading-5 text-[#898981]">{note}</p>}
    </div>
  );
}
