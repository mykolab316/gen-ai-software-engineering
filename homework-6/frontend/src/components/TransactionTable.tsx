import type { TxnResult } from "../types";
import { StatusBadge } from "./StatusBadge";

// Full results table — the accessible "table view" companion to the chart.
export function TransactionTable({ results }: { results: TxnResult[] }) {
  return (
    <section className="table-wrap" aria-label="All transactions">
      <h2 className="chart__title">All transactions</h2>
      <div className="table-scroll">
        <table className="txn-table">
          <thead>
            <tr>
              <th>ID</th>
              <th className="num">Amount</th>
              <th>Cur</th>
              <th>Type</th>
              <th>Status</th>
              <th className="num">Risk</th>
              <th className="num">Fee</th>
              <th className="num">Net</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.transaction_id}>
                <td>{r.transaction_id}</td>
                <td className="num">{r.amount}</td>
                <td>{r.currency}</td>
                <td>{r.transaction_type}</td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                <td className="num">
                  {typeof r.risk_score === "number"
                    ? r.risk_score.toFixed(2)
                    : "—"}
                </td>
                <td className="num">{r.fee ?? "—"}</td>
                <td className="num">{r.net_amount ?? "—"}</td>
                <td className="note">{r.reason ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
