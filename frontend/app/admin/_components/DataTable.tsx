import type { ReactNode } from "react";

/**
 * Table shell for an admin list. The last column (actions or amount) is
 * right-aligned. Pass `mobile` to swap the table for cards below `md`.
 */
export function DataTable({
  columns,
  minWidth,
  mobile,
  children,
}: {
  columns: string[];
  /** A literal Tailwind class such as "min-w-[900px]". */
  minWidth: string;
  mobile?: ReactNode;
  children: ReactNode;
}) {
  const lastIndex = columns.length - 1;

  return (
    <>
      <div className={mobile ? "hidden overflow-x-auto md:block" : "overflow-x-auto"}>
        <table className={`w-full ${minWidth} text-left`}>
          <thead className="border-b border-[#e9e5dc] bg-[#fcfbf8]">
            <tr>
              {columns.map((heading, index) => (
                <th
                  key={heading}
                  className={`whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#73786f] ${
                    index === lastIndex ? "text-right" : ""
                  }`}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eeeae2]">{children}</tbody>
        </table>
      </div>

      {mobile && <div className="grid gap-4 p-4 md:hidden">{mobile}</div>}
    </>
  );
}

/** One row of DataTable; keeps the hover colour in one place. */
export function DataRow({ children }: { children: ReactNode }) {
  return <tr className="transition hover:bg-[#fcfbf8]">{children}</tr>;
}
