import { getLocalToday } from "@/lib/dates";

export type DateRange = { start: string; end: string };

type DateRangePickerProps = {
  value: DateRange;
  onChange: (next: DateRange) => void;
  startLabel?: string;
  endLabel?: string;
  /** Classes for each field's <label> wrapper, its caption and its <input>. */
  fieldClassName?: string;
  labelClassName?: string;
  inputClassName: string;
};

/**
 * Pickup + return date inputs. Neither date may be in the past, the return
 * cannot precede the pickup, and moving the pickup past the return clears it.
 * Renders two sibling fields so the parent grid decides the layout.
 */
export default function DateRangePicker({
  value,
  onChange,
  startLabel = "Pickup date",
  endLabel = "Return date",
  fieldClassName = "block",
  labelClassName = "mb-2 block text-sm font-semibold text-[#343830]",
  inputClassName,
}: DateRangePickerProps) {
  const today = getLocalToday();

  const changeStart = (start: string) => {
    const end = value.end && start && value.end < start ? "" : value.end;
    onChange({ start, end });
  };

  return (
    <>
      <label className={fieldClassName}>
        <span className={labelClassName}>{startLabel}</span>
        <input
          type="date"
          min={today}
          value={value.start}
          onChange={(event) => changeStart(event.target.value)}
          className={inputClassName}
        />
      </label>

      <label className={fieldClassName}>
        <span className={labelClassName}>{endLabel}</span>
        <input
          type="date"
          min={value.start || today}
          value={value.end}
          onChange={(event) => onChange({ start: value.start, end: event.target.value })}
          className={inputClassName}
        />
      </label>
    </>
  );
}
