import { CreateTicketInput } from '../types/ticket';
import { TicketModel } from '../models/ticket';

interface ParseResult {
  tickets: CreateTicketInput[];
  errors: Array<{ index: number; error: string }>;
}

export class CsvParser {
  private static parseRow(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    values.push(current.trim());
    return values;
  }

  static async parse(buffer: Buffer): Promise<ParseResult> {
    const tickets: CreateTicketInput[] = [];
    const errors: Array<{ index: number; error: string }> = [];
    let index = 0;

    return new Promise((resolve, reject) => {
      const lines = buffer.toString().split('\n');
      
      if (lines.length === 0) {
        return reject(new Error('Empty CSV file'));
      }

      const headers = this.parseRow(lines[0]).map((h) => h.toLowerCase());

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        index++;
        const values = this.parseRow(line);
        
        try {
          const ticket: any = {};
          headers.forEach((header, idx) => {
            ticket[header] = values[idx] || '';
          });

          const normalizedTicket = this.normalizeTicket(ticket);
          const validation = TicketModel.validateCreate(normalizedTicket);
          
          if (validation.error) {
            errors.push({ index, error: validation.error });
          } else {
            tickets.push(normalizedTicket);
          }
        } catch (err: any) {
          errors.push({ index, error: err.message || 'Parse error' });
        }
      }

      resolve({ tickets, errors });
    });
  }

  private static normalizeTicket(raw: any): CreateTicketInput {
    return {
      customer_id: raw.customer_id || raw.customerid || '',
      customer_email: raw.customer_email || raw.customeremail || raw.email || '',
      customer_name: raw.customer_name || raw.customername || raw.name || '',
      subject: raw.subject || '',
      description: raw.description || raw.desc || '',
      category: raw.category || undefined,
      priority: raw.priority || undefined,
      status: raw.status || undefined,
      assigned_to: raw.assigned_to || raw.assignedto || undefined,
      tags: raw.tags ? raw.tags.split(';').map((t: string) => t.trim()) : undefined,
      metadata: raw.source || raw.device_type ? {
        source: raw.source || undefined,
        device_type: raw.device_type || raw.devicetype || undefined,
      } : undefined,
    };
  }
}
