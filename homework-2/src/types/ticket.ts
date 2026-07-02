export type Category = 'account_access' | 'technical_issue' | 'billing_question' | 'feature_request' | 'bug_report' | 'other';

export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export type Status = 'new' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';

export type Source = 'web_form' | 'email' | 'api' | 'chat' | 'phone';

export type DeviceType = 'desktop' | 'mobile' | 'tablet';

export interface Metadata {
  source: Source;
  browser?: string;
  device_type: DeviceType;
}

export interface Ticket {
  id: string;
  customer_id: string;
  customer_email: string;
  customer_name: string;
  subject: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  created_at: Date;
  updated_at: Date;
  resolved_at: Date | null;
  assigned_to: string | null;
  tags: string[];
  metadata: Metadata;
}

export interface CreateTicketInput {
  customer_id: string;
  customer_email: string;
  customer_name: string;
  subject: string;
  description: string;
  category?: Category;
  priority?: Priority;
  status?: Status;
  assigned_to?: string;
  tags?: string[];
  metadata?: Partial<Metadata>;
}

export interface UpdateTicketInput {
  customer_id?: string;
  customer_email?: string;
  customer_name?: string;
  subject?: string;
  description?: string;
  category?: Category;
  priority?: Priority;
  status?: Status;
  assigned_to?: string;
  tags?: string[];
  metadata?: Partial<Metadata>;
}

export interface ClassificationResult {
  category: Category;
  priority: Priority;
  confidence: number;
  reasoning: string;
  keywords_found: string[];
}

export interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ index: number; error: string }>;
}

export interface TicketFilter {
  category?: Category;
  priority?: Priority;
  status?: Status;
  customer_id?: string;
}
