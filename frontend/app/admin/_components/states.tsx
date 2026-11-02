import type { ReactNode } from "react";
import { buttonClass } from "../_lib/ui";
import { AdminPage, type PageWidth } from "./AdminPage";
import { BackLinkButton, type BackLink } from "./PageHeader";
import { Icon, type IconName } from "./icons";

/** Whole-page spinner shown until a page's first response arrives. */
export function LoadingState({
  message,
  width,
}: {
  message: string;
  width?: PageWidth;
}) {
  return (
    <AdminPage width={width}>
      <div
        role="status"
        className="rounded-3xl border border-[#e9e5dc] bg-white p-12 text-center shadow-sm"
      >
        <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-[#e9e5dc] border-t-[#c6a15b]" />
        <p className="font-medium text-[#59645c]">{message}</p>
      </div>
    </AdminPage>
  );
}

/** Whole-page failure: the data a page needs could not be loaded. */
export function ErrorState({
  title,
  message,
  onRetry,
  retrying = false,
  back,
  width,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
  back?: BackLink;
  width?: PageWidth;
}) {
  return (
    <AdminPage width={width}>
      {back && <BackLinkButton {...back} />}

      <div
        role="alert"
        className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm sm:p-12"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl font-bold text-red-600">
          !
        </div>
        <h1 className="mt-5 text-xl font-bold text-[#0a1411]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#73786f]">{message}</p>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className={`mt-6 ${buttonClass.primary}`}
          >
            {retrying ? "Retrying..." : "Try Again"}
          </button>
        )}
      </div>
    </AdminPage>
  );
}

/** Dismissable banner for a failed action on data that is already on screen. */
export function ErrorAlert({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800"
    >
      <div className="flex gap-3">
        <span className="font-bold">!</span>
        <p>{message}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="font-bold text-red-700 hover:text-red-900"
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </div>
  );
}

/** A list or section with nothing to show, and what the admin can do next. */
export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: IconName;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-6 py-16 text-center sm:py-20">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f3ead7] text-[#96743b]">
        <Icon name={icon} className="h-8 w-8" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-bold text-[#0a1411]">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#73786f]">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** The EmptyState action when filters hide every row. */
export function ClearFiltersButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={buttonClass.link}>
      Clear filters
    </button>
  );
}
