import { TicketModel, createTicketSchema, updateTicketSchema } from '../models/ticket';
import { CreateTicketInput } from '../types/ticket';

describe('Ticket Model', () => {
  const validInput: CreateTicketInput = {
    customer_id: 'CUST001',
    customer_email: 'john@example.com',
    customer_name: 'John Doe',
    subject: 'Test Subject',
    description: 'This is a valid description for testing',
    category: 'technical_issue',
    priority: 'medium',
  };

  describe('validateCreate', () => {
    it('should validate a valid ticket input', () => {
      const result = TicketModel.validateCreate(validInput);
      expect(result.error).toBeUndefined();
      expect(result.value).toBeDefined();
    });

    it('should reject invalid email format', () => {
      const result = TicketModel.validateCreate({ ...validInput, customer_email: 'not-an-email' });
      expect(result.error).toBeDefined();
    });

    it('should reject subject longer than 200 chars', () => {
      const result = TicketModel.validateCreate({ ...validInput, subject: 'a'.repeat(201) });
      expect(result.error).toBeDefined();
    });

    it('should reject description shorter than 10 chars', () => {
      const result = TicketModel.validateCreate({ ...validInput, description: 'short' });
      expect(result.error).toBeDefined();
    });

    it('should reject invalid category enum', () => {
      const result = TicketModel.validateCreate({ ...validInput, category: 'invalid_category' });
      expect(result.error).toBeDefined();
    });

    it('should reject invalid priority enum', () => {
      const result = TicketModel.validateCreate({ ...validInput, priority: 'super_high' });
      expect(result.error).toBeDefined();
    });

    it('should reject missing required fields', () => {
      const result = TicketModel.validateCreate({ customer_id: 'CUST001' });
      expect(result.error).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create a ticket with UUID and timestamps', () => {
      const ticket = TicketModel.create(validInput);
      expect(ticket.id).toBeDefined();
      expect(ticket.created_at).toBeInstanceOf(Date);
      expect(ticket.updated_at).toBeInstanceOf(Date);
      expect(ticket.resolved_at).toBeNull();
    });

    it('should set default values for optional fields', () => {
      const minInput: CreateTicketInput = {
        customer_id: 'CUST001',
        customer_email: 'john@example.com',
        customer_name: 'John Doe',
        subject: 'Test Subject',
        description: 'This is a valid description for testing',
      };
      const ticket = TicketModel.create(minInput);
      expect(ticket.category).toBe('other');
      expect(ticket.priority).toBe('medium');
      expect(ticket.status).toBe('new');
      expect(ticket.tags).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update ticket fields and set updated_at', () => {
      const ticket = TicketModel.create(validInput);
      const original = { ...ticket };
      
      const updated = TicketModel.update(ticket, { subject: 'Updated Subject' });
      expect(updated.subject).toBe('Updated Subject');
      expect(updated.updated_at.getTime()).toBeGreaterThanOrEqual(original.updated_at.getTime());
    });

    it('should set resolved_at when status changes to resolved', () => {
      const ticket = TicketModel.create(validInput);
      const updated = TicketModel.update(ticket, { status: 'resolved' });
      expect(updated.resolved_at).not.toBeNull();
    });

    it('should merge metadata on update', () => {
      const ticket = TicketModel.create({ ...validInput, metadata: { source: 'web_form', device_type: 'desktop' } });
      const updated = TicketModel.update(ticket, { metadata: { browser: 'Chrome' } });
      expect(updated.metadata?.source).toBe('web_form');
      expect(updated.metadata?.browser).toBe('Chrome');
    });
  });

  describe('validateUpdate', () => {
    it('should return error for invalid update fields', () => {
      const result = TicketModel.validateUpdate({ priority: 'super_high' });
      expect(result.error).toBeDefined();
    });

    it('should accept valid update fields', () => {
      const result = TicketModel.validateUpdate({ subject: 'New subject', priority: 'high' });
      expect(result.error).toBeUndefined();
    });
  });
});
