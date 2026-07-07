import type { PipelineResponse } from "./types";

const BASE = "http://localhost:8000";

/** Trigger a fresh pipeline run and return summary + results. */
export async function runPipeline(): Promise<PipelineResponse> {
  const res = await fetch(`${BASE}/api/run`, { method: "POST" });
  if (!res.ok) throw new Error(`Pipeline run failed (${res.status})`);
  return res.json();
}

/** Fetch the latest results without re-running the pipeline. */
export async function fetchResults(): Promise<PipelineResponse> {
  const res = await fetch(`${BASE}/api/results`);
  if (!res.ok) throw new Error(`Fetch results failed (${res.status})`);
  return res.json();
}
