/**
 * Class strings shared by every admin screen. Kept as literals so Tailwind's
 * source scan sees each one; compose them, never build them from pieces.
 */

export const buttonClass = {
  /** Dark call to action: retry, edit. */
  primary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-[#0a1411] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1a3027] disabled:cursor-not-allowed disabled:opacity-60",
  /** White bordered: refresh, cancel, back. */
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-[#dedbd2] bg-white px-5 py-3 text-sm font-semibold text-[#34443b] transition hover:bg-[#f3f1eb] disabled:cursor-not-allowed disabled:opacity-60",
  /** Sage "add new" link in a page header. */
  create:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-[#e8eee7] px-6 py-3 text-sm font-bold text-[#17251e] shadow-lg shadow-[#0a1411]/10 transition hover:bg-[#d5e1d3]",
  /** Gold form submit. */
  submit:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-[#c6a15b] px-7 py-3 text-sm font-bold text-[#0a1411] shadow-sm transition hover:bg-[#d4b474] focus:outline-none focus:ring-4 focus:ring-[#c6a15b]/25 disabled:cursor-not-allowed disabled:opacity-60",
  /** Red confirm inside the delete dialog. */
  danger:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60",
  /** Text-only "Clear filters" style action. */
  link: "text-sm font-bold text-[#96743b] transition hover:text-[#806331]",
};

/** Small buttons in a table row or card footer. */
export const rowActionClass = {
  view: "inline-flex items-center justify-center gap-2 rounded-lg border border-[#dedbd2] bg-white px-3 py-2 text-xs font-bold text-[#59645c] transition hover:border-[#c6a15b] hover:text-[#806331]",
  edit: "inline-flex items-center justify-center gap-2 rounded-lg border border-[#e7dcc4] bg-[#f8f0df] px-3 py-2 text-xs font-bold text-[#806331] transition hover:bg-[#f1e5c9]",
  delete:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50",
  select:
    "rounded-lg border border-[#dedbd2] bg-white px-2 py-2 text-xs text-[#34443b] outline-none focus:border-[#c6a15b] disabled:opacity-50",
};

/** One table cell; every admin table uses the same padding. */
export const cellClass = "px-5 py-4";

/** Bordered white card used for detail pages and mobile list cards. */
export const cardClass =
  "rounded-3xl border border-[#e9e5dc] bg-white p-6 shadow-[0_8px_35px_rgba(10,20,17,0.035)] sm:p-8";

export const inputClass =
  "w-full rounded-xl border border-[#e3e1d9] bg-[#fcfcfa] px-4 py-3.5 text-sm text-[#0a1411] outline-none transition placeholder:text-[#a3aaa4] focus:border-[#c6a15b] focus:bg-white focus:ring-4 focus:ring-[#c6a15b]/10 disabled:cursor-not-allowed disabled:opacity-60";

export const labelClass = "mb-2 block text-sm font-semibold text-[#26352d]";
