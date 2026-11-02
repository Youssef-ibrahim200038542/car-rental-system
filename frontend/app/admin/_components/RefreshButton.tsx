import { buttonClass } from "../_lib/ui";
import { Icon } from "./icons";

export function RefreshButton({
  onClick,
  refreshing,
  label = "Refresh",
}: {
  onClick: () => void;
  refreshing: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={refreshing}
      className={buttonClass.secondary}
    >
      <Icon
        name="refresh"
        strokeWidth={1.8}
        className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
      />
      {label}
    </button>
  );
}
