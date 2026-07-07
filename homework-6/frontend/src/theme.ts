// Status palette from the dataviz reference palette (fixed — never themed).
// Status is a *state*, so these are reserved status colors, always paired with
// an icon + label so meaning is never carried by color alone.
import type { Status } from "./types";

export const STATUS_META: Record<
  Status,
  { label: string; color: string; icon: string }
> = {
  settled: { label: "Settled", color: "#0ca30c", icon: "✓" }, // good
  flagged: { label: "Flagged", color: "#fab219", icon: "⚑" }, // warning
  rejected: { label: "Rejected", color: "#d03b3b", icon: "✕" }, // critical
};

// Sequential blue (magnitude) for the risk bars — single hue, light→dark.
export const RISK_HUE = "#2a78d6";
