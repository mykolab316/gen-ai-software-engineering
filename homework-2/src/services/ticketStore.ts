import { Ticket, TicketFilter, CreateTicketInput, UpdateTicketInput } from '../types/ticket';
import { TicketModel } from '../models/ticket';

export class TicketStore {
  private tickets: Map<string, Ticket> = new Map();

  create(input: CreateTicketInput): Ticket {
    const ticket = TicketModel.create(input);
    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  findById(id: string): Ticket | null {
    return this.tickets.get(id) || null;
  }

  findAll(filter?: TicketFilter): Ticket[] {
    let tickets = Array.from(this.tickets.values());

    if (filter) {
      if (filter.category) {
        tickets = tickets.filter((t) => t.category === filter.category);
      }
      if (filter.priority) {
        tickets = tickets.filter((t) => t.priority === filter.priority);
      }
      if (filter.status) {
        tickets = tickets.filter((t) => t.status === filter.status);
      }
      if (filter.customer_id) {
        tickets = tickets.filter((t) => t.customer_id === filter.customer_id);
      }
    }

    return tickets.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  update(id: string, input: UpdateTicketInput): Ticket | null {
    const ticket = this.findById(id);
    if (!ticket) return null;

    const updated = TicketModel.update(ticket, input);
    this.tickets.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.tickets.delete(id);
  }

  count(): number {
    return this.tickets.size;
  }

  clear(): void {
    this.tickets.clear();
  }

  bulkCreate(inputs: CreateTicketInput[]): Ticket[] {
    return inputs.map((input) => this.create(input));
  }
}

export const ticketStore = new TicketStore();
