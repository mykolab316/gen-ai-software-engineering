import type { Summary } from "../types";
import { STATUS_META } from "../theme";

// Four hero-number tiles: total + one per status. Numbers wear ink tokens;
// the status color appears only as a small marker beside the label.
export function StatTiles({ summary }: { summary: Summary }) {
  const by = summary.by_status;
  const tiles: { key: string; label: string; value: number; color?: string }[] = [
    { key: "total", label: "Total", value: summary.total },
    { key: "settled", label: STATUS_META.settled.label, value: by.settled ?? 0, color: STATUS_META.settled.color },
    { key: "flagged", label: STATUS_META.flagged.label, value: by.flagged ?? 0, color: STATUS_META.flagged.color },
    { key: "rejected", label: STATUS_META.rejected.label, value: by.rejected ?? 0, color: STATUS_META.rejected.color },
  ];

  return (
    <div className="tiles">
      {tiles.map((t) => (
        <div className="tile" key={t.key}>
          <div className="tile__label">
            {t.color && (
              <span className="tile__dot" style={{ background: t.color }} aria-hidden="true" />
            )}
            {t.label}
          </div>
          <div className="tile__value">{t.value}</div>
        </div>
      ))}
    </div>
  );
}
