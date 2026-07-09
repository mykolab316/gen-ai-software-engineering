import type { Status } from "../types";
import { STATUS_META } from "../theme";

// Status pill: color + icon + label together (never color alone).
export function StatusBadge({ status }: { status: Status }) {
  const meta = STATUS_META[status] ?? {
    label: status,
    color: "#898781",
    icon: "•",
  };
  return (
    <span className="badge" style={{ ["--badge" as string]: meta.color }}>
      <span className="badge__icon" aria-hidden="true">
        {meta.icon}
      </span>
      {meta.label}
    </span>
  );
}
