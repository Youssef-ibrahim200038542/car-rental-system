import Link from "next/link";
import type { ReactNode } from "react";
import Icon, { type IconName } from "./icons";

/** Shared loading / error / empty states, so every async surface reads the same. */

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#0a1411] px-6 py-3 font-semibold text-white transition hover:bg-[#1a3027] focus:outline-none focus:ring-2 focus:ring-[#c6a15b] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[#e8e4db] bg-white px-5 py-2.5 text-sm font-semibold text-[#365747] transition hover:border-[#c6a15b] hover:bg-[#fbf8f0] focus:outline-none focus:ring-2 focus:ring-[#c6a15b] focus:ring-offset-2";

export function Spinner({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <div
      className={`mx-auto animate-spin rounded-full border-4 border-[#e8e4db] border-t-[#c6a15b] ${className}`}
    />
  );
}

/** Full-height centred spinner for a page that cannot render anything yet. */
export function PageLoading({ message }: { message?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f8f7] px-6 pt-24">
      <div className="text-center" role="status">
        <Spinner />
        {message && <p className="mt-5 text-sm text-[#77776f]">{message}</p>}
      </div>
    </main>
  );
}

type StateAction =
  | { label: string; href: string; onClick?: never }
  | { label: string; onClick: () => void; href?: never };

function ActionButton({ action }: { action: StateAction }) {
  if (action.href) {
    return (
      <Link href={action.href} className={`mt-7 ${primaryButtonClass}`}>
        {action.label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={action.onClick} className={`mt-7 ${primaryButtonClass}`}>
      {action.label}
    </button>
  );
}

type StateCardProps = {
  tone: "error" | "empty";
  icon?: IconName;
  title: string;
  message: ReactNode;
  action?: StateAction;
};

/** A centred card explaining what happened and the one thing to do next. */
export function StateCard({ tone, icon, title, message, action }: StateCardProps) {
  const isError = tone === "error";

  return (
    <div
      role={isError ? "alert" : undefined}
      className={`rounded-3xl border bg-white px-6 py-12 text-center sm:px-10 sm:py-14 ${
        isError ? "border-[#e8caca]" : "border-[#e8e4db]"
      }`}
    >
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
          isError ? "bg-[#fbefef] text-[#a34444]" : "bg-[#f6f0e3] text-[#9a783c]"
        }`}
      >
        <Icon name={icon ?? (isError ? "alert" : "inbox")} className="h-8 w-8" strokeWidth={1.5} />
      </div>

      <h2 className="mt-5 text-xl font-bold text-[#0a1411]">{title}</h2>
      <div
        className={`mx-auto mt-2 max-w-md text-sm leading-6 ${
          isError ? "text-[#a34444]" : "text-[#77776f]"
        }`}
      >
        {message}
      </div>

      {action && <ActionButton action={action} />}
    </div>
  );
}

/** StateCard centred on its own page (a page whose main data failed to load). */
export function PageState(props: StateCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f8f7] px-5 py-28 text-[#0a1411]">
      <div className="w-full max-w-lg">
        <StateCard {...props} />
      </div>
    </main>
  );
}

/** Inline banner for an action that failed while the page stays usable. */
export function InlineError({ message, className = "mt-6" }: { message: string; className?: string }) {
  return (
    <div
      role="alert"
      className={`rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700 ${className}`}
    >
      {message}
    </div>
  );
}
