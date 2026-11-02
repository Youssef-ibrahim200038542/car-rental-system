import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";

const VALUE_TONES = {
  default: "text-[#0a1411]",
  success: "text-[#23764c]",
  gold: "text-[#9a783c]",
  sage: "text-[#405e48]",
};

export function StatCard({
  label,
  value,
  detail,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  detail: string;
  icon: IconName;
  tone?: keyof typeof VALUE_TONES;
}) {
  return (
    <div className="rounded-2xl border border-[#e9e5dc] bg-white p-5 shadow-[0_4px_20px_rgba(10,20,17,0.025)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[#73786f]">{label}</p>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f3ead7] text-[#96743b]">
          <Icon name={icon} />
        </div>
      </div>
      <p
        className={`mt-4 break-words text-3xl font-bold tracking-tight ${VALUE_TONES[tone]}`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-[#85867c]">{detail}</p>
    </div>
  );
}

/** The row of StatCards under a page header (3 or 4 across on wide screens). */
export function StatGrid({
  columns = 4,
  children,
}: {
  columns?: 3 | 4;
  children: ReactNode;
}) {
  const grid =
    columns === 3
      ? "mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      : "mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4";

  return <div className={grid}>{children}</div>;
}

/** A unit suffix inside a StatCard value, e.g. "EGP" or "/ 5". */
export function StatUnit({ children }: { children: ReactNode }) {
  return <span className="ml-1 text-base font-semibold text-[#73786f]">{children}</span>;
}
