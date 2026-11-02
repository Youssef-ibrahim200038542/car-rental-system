import { humanize } from "../_lib/format";
import { TONE_CLASSES, statusTone, type StatusKind } from "../_lib/status";

const SIZES = {
  md: "gap-2 px-3 py-1.5 text-xs",
  lg: "gap-2 px-4 py-2 text-sm",
};

/** Coloured pill for a car, booking, payment, booking-payment or role status. */
export function StatusBadge({
  kind,
  status,
  size = "md",
}: {
  kind: StatusKind;
  status: string;
  size?: keyof typeof SIZES;
}) {
  const normalized = status.toLowerCase();

  return (
    <span
      className={`inline-flex w-fit items-center whitespace-nowrap rounded-full border font-bold ${SIZES[size]} ${
        TONE_CLASSES[statusTone(kind, normalized)]
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {humanize(normalized)}
    </span>
  );
}
