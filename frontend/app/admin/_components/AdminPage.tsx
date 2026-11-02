import type { ReactNode } from "react";

const WIDTHS = {
  wide: "max-w-[1600px]",
  list: "max-w-7xl",
  detail: "max-w-5xl",
  form: "max-w-3xl",
};

export type PageWidth = keyof typeof WIDTHS;

/** The outer frame of every admin screen: background, top offset, max width. */
export function AdminPage({
  width = "list",
  children,
}: {
  width?: PageWidth;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f8f8f7] px-4 pb-16 pt-28 text-[#0a1411] sm:px-6">
      <div className={`mx-auto ${WIDTHS[width]}`}>{children}</div>
    </main>
  );
}
