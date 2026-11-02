import type { ReactNode } from "react";

/**
 * The card around an admin list: title + "Showing X of Y" + filters on top,
 * the rows (or EmptyState) in the middle, the same count again in the footer.
 */
export function ListPanel({
  title,
  shown,
  total,
  noun,
  filters,
  footerNote,
  children,
}: {
  title: string;
  shown: number;
  total: number;
  /** Plural noun for the count, e.g. "vehicles". */
  noun: string;
  filters: ReactNode;
  footerNote: string;
  children: ReactNode;
}) {
  const count = `Showing ${shown} of ${total} ${noun}`;

  return (
    <section className="overflow-hidden rounded-3xl border border-[#e9e5dc] bg-white shadow-[0_8px_35px_rgba(10,20,17,0.035)]">
      <div className="flex flex-col gap-4 border-b border-[#e9e5dc] px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0a1411]">{title}</h2>
          <p className="mt-1 text-sm text-[#85867c]">{count}</p>
        </div>
        {filters}
      </div>

      {children}

      {shown > 0 && (
        <div className="flex flex-col gap-2 border-t border-[#e9e5dc] bg-[#fcfbf8] px-5 py-4 text-xs text-[#85867c] sm:flex-row sm:items-center sm:justify-between">
          <span>{count}</span>
          <span>{footerNote}</span>
        </div>
      )}
    </section>
  );
}
