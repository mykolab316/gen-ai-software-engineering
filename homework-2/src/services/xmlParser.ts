import xml2js from 'xml2js';
import { CreateTicketInput } from '../types/ticket';
import { TicketModel } from '../models/ticket';

interface ParseResult {
  tickets: CreateTicketInput[];
  errors: Array<{ index: number; error: string }>;
}

export class XmlParser {
  static async parse(buffer: Buffer): Promise<ParseResult> {
    const tickets: CreateTicketInput[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    try {
      const content = buffer.toString();
      const result = await xml2js.parseStringPromise(content);
      
      let ticketArray: any[] = [];

      if (result.tickets && result.tickets.ticket) {
        ticketArray = Array.isArray(result.tickets.ticket) 
          ? result.tickets.ticket 
          : [result.tickets.ticket];
      } else if (result.ticket) {
        ticketArray = Array.isArray(result.ticket) ? result.ticket : [result.ticket];
      }

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
      throw new Error(`Invalid XML: ${err.message}`);
    }
  }

  private static normalizeTicket(raw: any): CreateTicketInput {
    const getValue = (field: string): string => {
      if (raw[field]) {
        return Array.isArray(raw[field]) ? raw[field][0] : raw[field];
      }
      return '';
    };

    const getMetadata = () => {
      const metadata: any = {};
      if (raw.metadata) {
        const meta = raw.metadata[0];
        if (meta.source) metadata.source = Array.isArray(meta.source) ? meta.source[0] : meta.source;
        if (meta.browser) metadata.browser = Array.isArray(meta.browser) ? meta.browser[0] : meta.browser;
        if (meta.device_type || meta.deviceType) {
          metadata.device_type = Array.isArray(meta.device_type || meta.deviceType) 
            ? (meta.device_type || meta.deviceType)[0] 
            : (meta.device_type || meta.deviceType);
        }
      } else {
        if (raw.source) metadata.source = getValue('source');
        if (raw.device_type || raw.deviceType) {
          metadata.device_type = raw.device_type ? getValue('device_type') : getValue('deviceType');
        }
      }
      return Object.keys(metadata).length > 0 ? metadata : undefined;
    };

    const getTags = (): string[] | undefined => {
      if (raw.tags) {
        const tags = raw.tags[0];
        if (typeof tags === 'string') return tags.split(';').map(t => t.trim());
        if (Array.isArray(tags.tag)) return tags.tag;
        if (tags.tag) return [tags.tag];
      }
      return undefined;
    };

    return {
      customer_id: getValue('customer_id') || getValue('customerId') || '',
      customer_email: getValue('customer_email') || getValue('customerEmail') || getValue('email') || '',
      customer_name: getValue('customer_name') || getValue('customerName') || getValue('name') || '',
      subject: getValue('subject') || '',
      description: getValue('description') || getValue('desc') || '',
      category: (getValue('category') as any) || undefined,
      priority: (getValue('priority') as any) || undefined,
      status: (getValue('status') as any) || undefined,
      assigned_to: getValue('assigned_to') || getValue('assignedTo') || undefined,
      tags: getTags(),
      metadata: getMetadata(),
    };
  }
}
