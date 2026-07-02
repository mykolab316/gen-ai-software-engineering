import { TicketStore } from '../services/ticketStore';
import { CreateTicketInput } from '../types/ticket';

const baseInput: CreateTicketInput = {
  customer_id: 'CUST001',
  customer_email: 'john@example.com',
  customer_name: 'John Doe',
  subject: 'Test Subject',
  description: 'This is a valid description for store testing',
  category: 'technical_issue',
  priority: 'medium',
};

describe('TicketStore', () => {
  let store: TicketStore;

  beforeEach(() => {
    store = new TicketStore();
  });

  describe('findAll with filters', () => {
    it('should filter by priority', () => {
      store.create({ ...baseInput, priority: 'high' });
      store.create({ ...baseInput, priority: 'low' });
      const result = store.findAll({ priority: 'high' });
      expect(result.length).toBe(1);
      expect(result[0].priority).toBe('high');
    });

    it('should filter by status', () => {
      const ticket = store.create(baseInput);
      store.update(ticket.id, { status: 'resolved' });
      store.create(baseInput);
      const result = store.findAll({ status: 'resolved' });
      expect(result.length).toBe(1);
      expect(result[0].status).toBe('resolved');
    });

    it('should filter by customer_id', () => {
      store.create({ ...baseInput, customer_id: 'CUST_A' });
      store.create({ ...baseInput, customer_id: 'CUST_B' });
      const result = store.findAll({ customer_id: 'CUST_A' });
      expect(result.length).toBe(1);
      expect(result[0].customer_id).toBe('CUST_A');
    });

    it('should return all tickets when no filter is provided', () => {
      store.create(baseInput);
      store.create(baseInput);
      const result = store.findAll();
      expect(result.length).toBe(2);
    });
  });

  describe('count', () => {
    it('should return the number of tickets in the store', () => {
      expect(store.count()).toBe(0);
      store.create(baseInput);
      store.create(baseInput);
      expect(store.count()).toBe(2);
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple tickets at once', () => {
      const inputs = [baseInput, { ...baseInput, customer_id: 'CUST002' }];
      const tickets = store.bulkCreate(inputs);
      expect(tickets.length).toBe(2);
      expect(store.count()).toBe(2);
    });
  });
});
