// Shapes returned by the FastAPI backend (backend/api.py).

export type Status = "settled" | "flagged" | "rejected";

export interface TxnResult {
  transaction_id: string;
  timestamp: string;
  amount: string;
  currency: string;
  transaction_type: string;
  description: string;
  status: Status;
  risk_score?: number;
  risk_reasons?: string[];
  fee?: string;
  net_amount?: string;
  settled?: boolean;
  reason?: string;
  metadata?: { channel?: string; country?: string };
}

export interface Summary {
  generated_at: string;
  total: number;
  by_status: Record<string, number>;
  rejected: { transaction_id: string; reason: string }[];
  flagged: { transaction_id: string; risk_score: number }[];
}

export interface PipelineResponse {
  summary: Summary | null;
  results: TxnResult[];
}
