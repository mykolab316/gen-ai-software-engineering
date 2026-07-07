import { useState } from "react";
import type { TxnResult } from "../types";
import { RISK_HUE } from "../theme";

// Horizontal bars = fraud risk magnitude per transaction. Single sequential
// hue; a 0.5 threshold line marks the flag cutoff (bars past it are flagged).
// Rejected transactions are never scored, so they are omitted here.
export function RiskChart({ results }: { results: TxnResult[] }) {
  const scored = results.filter((r) => typeof r.risk_score === "number");
  const [hover, setHover] = useState<{
    x: number;
    y: number;
    txn: TxnResult;
  } | null>(null);

  if (scored.length === 0) {
    return null;
  }

  return (
    <section className="chart" aria-label="Fraud risk by transaction">
      <h2 className="chart__title">Fraud risk by transaction</h2>
      <div className="chart__plot">
        <div className="chart__threshold" aria-hidden="true">
          <span className="chart__threshold-label">flag&nbsp;≥&nbsp;0.5</span>
        </div>
        {scored.map((r) => {
          const score = r.risk_score ?? 0;
          const flagged = score >= 0.5;
          return (
            <div
              className="riskrow"
              key={r.transaction_id}
              onMouseMove={(e) =>
                setHover({ x: e.clientX, y: e.clientY, txn: r })
              }
              onMouseLeave={() => setHover(null)}
            >
              <div className="riskrow__id">{r.transaction_id}</div>
              <div className="riskrow__track">
                <div
                  className="riskrow__fill"
                  style={{
                    width: `${Math.max(score * 100, 1.5)}%`,
                    background: RISK_HUE,
                  }}
                />
              </div>
              <div
                className="riskrow__val"
                style={{ fontWeight: flagged ? 600 : 400 }}
              >
                {score.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      {hover && (
        <div
          className="tooltip"
          style={{ left: hover.x + 14, top: hover.y + 14 }}
          role="tooltip"
        >
          <div className="tooltip__title">{hover.txn.transaction_id}</div>
          <div className="tooltip__row">
            <span>Amount</span>
            <span>
              {hover.txn.amount} {hover.txn.currency}
            </span>
          </div>
          <div className="tooltip__row">
            <span>Risk</span>
            <span>{(hover.txn.risk_score ?? 0).toFixed(2)}</span>
          </div>
          {hover.txn.risk_reasons && hover.txn.risk_reasons.length > 0 && (
            <div className="tooltip__row">
              <span>Signals</span>
              <span>{hover.txn.risk_reasons.join(", ")}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
