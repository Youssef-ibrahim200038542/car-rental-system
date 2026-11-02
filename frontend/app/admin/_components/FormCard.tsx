import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { buttonClass } from "../_lib/ui";
import { Icon, type IconName } from "./icons";

/** The white card around an admin form, with its dark title strip on top. */
export function FormCard({
  icon,
  title,
  subtitle,
  onSubmit,
  footnote,
  children,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  footnote?: string;
  children: ReactNode;
}) {
  return (
    <>
      <form
        onSubmit={onSubmit}
        className="overflow-hidden rounded-3xl border border-[#e8e5dc] bg-white shadow-[0_12px_40px_rgba(10,20,17,0.04)]"
      >
        <div className="bg-[#0a1411] px-6 py-6 sm:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#c6a15b]/30 bg-[#c6a15b]/10 text-[#c6a15b]">
              <Icon name={icon} className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-white">{title}</h2>
              <p className="mt-1 text-sm text-white/75">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">{children}</div>
      </form>

      {footnote && (
        <p className="mt-5 text-center text-xs text-[#929990]">{footnote}</p>
      )}
    </>
  );
}

/** Cancel link + submit button with a spinner while saving. */
export function FormActions({
  cancelHref,
  saving,
  disabled = false,
  label,
  savingLabel,
}: {
  cancelHref: string;
  saving: boolean;
  disabled?: boolean;
  label: string;
  savingLabel: string;
}) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#eeece5] pt-6 sm:flex-row sm:justify-end">
      <Link href={cancelHref} className={buttonClass.secondary}>
        Cancel
      </Link>

      <button type="submit" disabled={saving || disabled} className={buttonClass.submit}>
        {saving ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a1411]/25 border-t-[#0a1411]" />
            {savingLabel}
          </>
        ) : (
          <>
            {label}
            <span aria-hidden="true">→</span>
          </>
        )}
      </button>
    </div>
  );
}
