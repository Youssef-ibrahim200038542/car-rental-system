import type { ReactNode } from "react";

type TileProps = {
  label: string;
  value: ReactNode;
  note: string;
  icon: ReactNode;
  valueClass?: string;
  hoverClass?: string;
  className?: string;
};

/** A labelled number with a note and an icon — the stat rhythm on customer and staff pages. */
export default function StatTile({
  label,
  value,
  note,
  icon,
  valueClass = "text-[#0a1411]",
  hoverClass = "hover:border-[#c6a15b]/60",
  className = "",
}: TileProps) {
  return (
    <div className={`rounded-2xl border border-[#e8e4db] bg-white p-5 transition-colors ${hoverClass} ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#898981]">{label}</p>
          <p className={`mt-3 text-3xl font-bold ${valueClass}`}>{value}</p>
          <p className="mt-1 text-sm text-[#77776f]">{note}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}
