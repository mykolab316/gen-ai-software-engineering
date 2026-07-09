import { useEffect, useState } from "react";
import { fetchResults, runPipeline } from "./api";
import type { PipelineResponse } from "./types";
import { StatTiles } from "./components/StatTiles";
import { RiskChart } from "./components/RiskChart";
import { TransactionTable } from "./components/TransactionTable";
import { formatRunTime, fromNow } from "./time";

export default function App() {
  const [data, setData] = useState<PipelineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load any existing results on first render (no re-run).
  useEffect(() => {
    fetchResults()
      .then(setData)
      .catch(() => setError("Backend not reachable. Start it on :8000."));
  }, []);

  async function handleRun() {
    setLoading(true);
    setError(null);
    try {
      setData(await runPipeline());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Run failed");
    } finally {
      setLoading(false);
    }
  }

  const summary = data?.summary ?? null;
  const results = data?.results ?? [];

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1 className="app__title">Transaction Pipeline Dashboard</h1>
          <p className="app__subtitle">
            Validation → Fraud Detection → Settlement
          </p>
        </div>
        <button className="run-btn" onClick={handleRun} disabled={loading}>
          {loading ? "Running…" : "▶ Run Pipeline"}
        </button>
      </header>

      {error && <div className="banner banner--error">{error}</div>}

      {summary ? (
        <>
          <StatTiles summary={summary} />
          <div className="grid">
            <RiskChart results={results} />
            <TransactionTable results={results} />
          </div>
          <footer className="app__footer">
            Last run: {formatRunTime(summary.generated_at)} ({fromNow(summary.generated_at)})
            · Created by Mykola Bernadskyi
          </footer>
        </>
      ) : (
        !error && <div className="banner">No results yet — click Run Pipeline.</div>
      )}
    </div>
  );
}
