import { CreateTicketInput } from '../types/ticket';
import { TicketModel } from '../models/ticket';

interface ParseResult {
  tickets: CreateTicketInput[];
  errors: Array<{ index: number; error: string }>;
}

export class JsonParser {
  static async parse(buffer: Buffer): Promise<ParseResult> {
    const tickets: CreateTicketInput[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    try {
      const content = buffer.toString();
      const data = JSON.parse(content);

      const ticketArray = Array.isArray(data) ? data : [data];

      ticketArray.forEach((raw: any, index: number) => {
        try {
          const normalizedTicket = this.normalizeTicket(raw);
          const validation = TicketModel.validateCreate(normalizedTicket);
          
          if (validation.error) {
            errors.push({ index, error: validation.error });
          } else {
            tickets.push(normalizedTicket);
          }
        } catch (err: any) {
          errors.push({ index, error: err.message || 'Parse error' });
        }
      });

      return { tickets, errors };
    } catch (err: any) {
      throw new Error(`Invalid JSON: ${err.message}`);
    }
  }

  private static normalizeTicket(raw: any): CreateTicketInput {
    return {
      customer_id: raw.customer_id || raw.customerId || '',
      customer_email: raw.customer_email || raw.customerEmail || raw.email || '',
      customer_name: raw.customer_name || raw.customerName || raw.name || '',
      subject: raw.subject || '',
      description: raw.description || raw.desc || '',
      category: raw.category || undefined,
      priority: raw.priority || undefined,
      status: raw.status || undefined,
      assigned_to: raw.assigned_to || raw.assignedTo || undefined,
      tags: Array.isArray(raw.tags) ? raw.tags : undefined,
      metadata: raw.metadata || (raw.source || raw.deviceType ? {
        source: raw.source || undefined,
        device_type: raw.deviceType || raw.device_type || undefined,
      } : undefined),
    };
  }
}
