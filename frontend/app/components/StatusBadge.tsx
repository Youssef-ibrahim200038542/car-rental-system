import { capitalise } from "@/lib/format";

/** Pill colours per booking status; unknown values use the "pending" look. */
const STATUS_STYLES: Record<string, { pill: string; dot: string }> = {
  pending: { pill: "border-[#e7d7ac] bg-[#fcf6e5] text-[#87662f]", dot: "bg-[#c6a15b]" },
  confirmed: { pill: "border-[#b9d8c0] bg-[#edf6ee] text-[#356847]", dot: "bg-[#4d8b5e]" },
  active: { pill: "border-[#c4d9cb] bg-[#e5f0e8] text-[#28583b]", dot: "bg-[#356847]" },
  completed: { pill: "border-[#ded1b5] bg-[#f8f1e3] text-[#87662f]", dot: "bg-[#c6a15b]" },
  cancelled: { pill: "border-[#e8caca] bg-[#fbefef] text-[#a34444]", dot: "bg-[#c45a5a]" },
};

type StatusBadgeProps = {
  status: string;
  /** Adds a blur + shadow for use on top of a photo. */
  overlay?: boolean;
};

export default function StatusBadge({ status, overlay = false }: StatusBadgeProps) {
  const style = STATUS_STYLES[status.toLowerCase()] ?? STATUS_STYLES.pending;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        overlay ? "shadow-sm backdrop-blur-md" : ""
      } ${style.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {capitalise(status)}
    </span>
  );
}
