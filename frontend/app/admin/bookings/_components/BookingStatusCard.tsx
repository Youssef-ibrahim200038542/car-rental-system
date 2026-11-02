"use client";

import { useState } from "react";
import type { BookingStatus } from "@/lib/types";
import { humanize } from "../../_lib/format";
import { BOOKING_TRANSITIONS } from "../../_lib/status";
import { buttonClass, inputClass } from "../../_lib/ui";
import { DetailCard } from "./BookingDetailCards";

/**
 * Pick the booking's next status. Only the moves the API allows are offered;
 * completed and cancelled bookings are final.
 */
export function BookingStatusCard({
  status,
  updating,
  onSave,
}: {
  status: BookingStatus;
  updating: boolean;
  onSave: (next: BookingStatus) => void;
}) {
  const options = BOOKING_TRANSITIONS[status] ?? [];
  const [selected, setSelected] = useState<BookingStatus | "">("");

  return (
    <DetailCard eyebrow="Workflow" title="Update Status">
      {options.length === 0 ? (
        <p className="text-sm leading-6 text-[#73786f]">
          This booking is {status}. No further status changes are possible.
        </p>
      ) : (
        <>
          <p className="text-sm leading-6 text-[#73786f]">
            Move this booking to its next step. Cancelling refunds any paid amount.
          </p>

          <label
            htmlFor="booking-status"
            className="mt-5 block text-xs font-semibold uppercase tracking-wider text-[#85867c]"
          >
            Next Status
          </label>
          <select
            id="booking-status"
            value={selected}
            onChange={(event) => setSelected(event.target.value as BookingStatus)}
            className={`mt-2 ${inputClass}`}
          >
            <option value="" disabled>
              Currently {humanize(status)}, choose the next step
            </option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option === "cancelled" ? "Cancel booking" : humanize(option)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => selected && onSave(selected)}
            disabled={updating || !selected}
            className={`mt-4 w-full ${buttonClass.submit}`}
          >
            {updating && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a1411]/30 border-t-[#0a1411]" />
            )}
            {updating ? "Updating..." : "Save Changes"}
          </button>

          <p className="mt-3 text-center text-xs leading-5 text-[#85867c]">
            Status changes depend on your account permissions.
          </p>
        </>
      )}
    </DetailCard>
  );
}
