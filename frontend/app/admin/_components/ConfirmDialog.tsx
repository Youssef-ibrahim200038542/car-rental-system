"use client";

import { useEffect, useId, useRef } from "react";
import { buttonClass } from "../_lib/ui";

/**
 * Modal confirmation built on <dialog>: showModal() gives the focus trap,
 * Escape and the backdrop for free. Escape and Cancel are ignored while busy.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  busyLabel = "Deleting...",
  busy = false,
  destructive = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busyLabel?: string;
  busy?: boolean;
  /** Red confirm button for deletes/refunds; gold for a non-destructive change. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-[#e9e5dc] bg-white p-6 text-[#0a1411] shadow-xl backdrop:bg-[#0a1411]/40 sm:p-8"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-xl font-bold text-red-600">
        !
      </div>
      <h2 id={titleId} className="mt-5 text-lg font-bold">
        {title}
      </h2>
      <p id={messageId} className="mt-2 text-sm leading-6 text-[#73786f]">
        {message}
      </p>

      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          autoFocus
          className={buttonClass.secondary}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={destructive ? buttonClass.danger : buttonClass.submit}
        >
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
