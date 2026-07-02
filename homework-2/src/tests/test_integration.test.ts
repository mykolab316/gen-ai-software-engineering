import request from 'supertest';
import app from '../app';
import { ticketStore } from '../services/ticketStore';

const validTicket = {
  customer_id: 'CUST001',
  customer_email: 'john@example.com',
  customer_name: 'John Doe',
  subject: 'Cannot login to account',
  description: 'I have been trying to login for the past hour but keep getting an error message',
  category: 'account_access',
  priority: 'high',
};

describe('Integration Tests', () => {
  beforeEach(() => {
    ticketStore.clear();
  });

  describe('Test 1: Complete Ticket Lifecycle Workflow', () => {
    it('should complete full create → update → auto-classify → delete cycle', async () => {
      const createRes = await request(app).post('/tickets').send(validTicket);
      expect(createRes.status).toBe(201);
      const ticketId = createRes.body.id;
      expect(ticketId).toBeDefined();
      expect(createRes.body.status).toBe('new');

      const updateRes = await request(app)
        .put(`/tickets/${ticketId}`)
        .send({ status: 'in_progress', assigned_to: 'AGENT001' });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.status).toBe('in_progress');
      expect(updateRes.body.assigned_to).toBe('AGENT001');

      const classifyRes = await request(app).post(`/tickets/${ticketId}/auto-classify`);
      expect(classifyRes.status).toBe(200);
      expect(classifyRes.body.ticket).toBeDefined();
      expect(classifyRes.body.classification).toBeDefined();
      expect(classifyRes.body.classification.category).toBeDefined();
      expect(classifyRes.body.classification.priority).toBeDefined();

      const resolveRes = await request(app)
        .put(`/tickets/${ticketId}`)
        .send({ status: 'resolved' });
      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.status).toBe('resolved');
      expect(resolveRes.body.resolved_at).not.toBeNull();

      const deleteRes = await request(app).delete(`/tickets/${ticketId}`);
      expect(deleteRes.status).toBe(204);

      const getRes = await request(app).get(`/tickets/${ticketId}`);
      expect(getRes.status).toBe(404);
    });
  });

  describe('Test 2: Bulk Import with Filter Verification', () => {
    it('should import tickets from JSON and correctly filter by category', async () => {
      const jsonContent = JSON.stringify([
        {
          customer_id: 'CUST_A1',
          customer_email: 'a1@example.com',
          customer_name: 'User A1',
          subject: 'Cannot login to my account at all',
          description: 'I cannot login to my account and keep getting authentication errors',
          category: 'account_access',
          priority: 'high',
        },
        {
          customer_id: 'CUST_B1',
          customer_email: 'b1@example.com',
          customer_name: 'User B1',
          subject: 'Duplicate charge on my invoice',
          description: 'I was charged twice for the same subscription renewal this month',
          category: 'billing_question',
          priority: 'medium',
        },
        {
          customer_id: 'CUST_B2',
          customer_email: 'b2@example.com',
          customer_name: 'User B2',
          subject: 'Wrong tax amount on invoice',
          description: 'The tax calculation on my latest invoice is incorrect for my region',
          category: 'billing_question',
          priority: 'low',
        },
      ]);

      const importRes = await request(app)
        .post('/tickets/import')
        .attach('file', Buffer.from(jsonContent), 'tickets.json');
      expect(importRes.status).toBe(201);
      expect(importRes.body.summary.successful).toBe(3);
      expect(importRes.body.summary.failed).toBe(0);

      const allRes = await request(app).get('/tickets');
      expect(allRes.body.length).toBe(3);

      const billingRes = await request(app).get('/tickets?category=billing_question');
      expect(billingRes.status).toBe(200);
      expect(billingRes.body.length).toBe(2);
      billingRes.body.forEach((t: any) => expect(t.category).toBe('billing_question'));

      const accessRes = await request(app).get('/tickets?category=account_access');
      expect(accessRes.body.length).toBe(1);
      expect(accessRes.body[0].customer_id).toBe('CUST_A1');
    });
  });

  describe('Test 3: Concurrent Operations', () => {
    it('should handle 20 simultaneous POST requests without data corruption', async () => {
      const requests = Array.from({ length: 20 }, (_, i) =>
        request(app).post('/tickets').send({
          ...validTicket,
          customer_id: `CUST_CONCURRENT_${i}`,
          customer_email: `concurrent${i}@example.com`,
        })
      );

      const responses = await Promise.all(requests);

      responses.forEach((res) => {
        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
      });

      const ids = responses.map((r) => r.body.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(20);

      const allRes = await request(app).get('/tickets');
      expect(allRes.body.length).toBe(20);
    });
  });

  describe('Test 4: Combined Multi-Filter Query', () => {
    it('should return correct results when filtering by category and priority simultaneously', async () => {
      const tickets = [
        { ...validTicket, customer_id: 'CUST_F1', category: 'billing_question', priority: 'high' },
        { ...validTicket, customer_id: 'CUST_F2', category: 'billing_question', priority: 'low' },
        { ...validTicket, customer_id: 'CUST_F3', category: 'technical_issue', priority: 'high' },
        { ...validTicket, customer_id: 'CUST_F4', category: 'account_access', priority: 'high' },
      ];
      for (const t of tickets) {
        await request(app).post('/tickets').send(t);
      }

      const filtered = await request(app).get('/tickets?category=billing_question&priority=high');
      expect(filtered.status).toBe(200);
      expect(filtered.body.length).toBe(1);
      expect(filtered.body[0].customer_id).toBe('CUST_F1');
      expect(filtered.body[0].category).toBe('billing_question');
      expect(filtered.body[0].priority).toBe('high');

      const highOnly = await request(app).get('/tickets?priority=high');
      expect(highOnly.body.length).toBe(3);

      const billingOnly = await request(app).get('/tickets?category=billing_question');
      expect(billingOnly.body.length).toBe(2);
    });
  });

  describe('Test 5: Import with Partial Failures and Error Reporting', () => {
    it('should import valid tickets, reject invalid ones, and report detailed errors', async () => {
      const jsonContent = JSON.stringify([
        {
          customer_id: 'CUST_OK1',
          customer_email: 'ok1@example.com',
          customer_name: 'Valid User 1',
          subject: 'Valid ticket subject here',
          description: 'This is a valid description with sufficient length to pass validation',
          category: 'technical_issue',
          priority: 'medium',
        },
        {
          customer_id: 'CUST_BAD1',
          customer_email: 'not-an-email',
          customer_name: 'Bad Email User',
          subject: 'Invalid email ticket',
          description: 'This ticket has an invalid email address and should fail validation',
        },
        {
          customer_id: 'CUST_OK2',
          customer_email: 'ok2@example.com',
          customer_name: 'Valid User 2',
          subject: 'Another valid ticket subject',
          description: 'Another valid ticket with a description that meets the minimum length requirement',
          category: 'billing_question',
          priority: 'low',
        },
        {
          customer_id: 'CUST_BAD2',
          customer_email: 'bad2@example.com',
          customer_name: 'Short Description User',
          subject: 'Short description ticket',
          description: 'Too short',
        },
      ]);

      const importRes = await request(app)
        .post('/tickets/import')
        .attach('file', Buffer.from(jsonContent), 'mixed.json');

      expect(importRes.status).toBe(201);
      expect(importRes.body.summary.total).toBe(4);
      expect(importRes.body.summary.successful).toBe(2);
      expect(importRes.body.summary.failed).toBe(2);
      expect(importRes.body.summary.errors.length).toBe(2);
      expect(importRes.body.tickets.length).toBe(2);

      const allRes = await request(app).get('/tickets');
      expect(allRes.body.length).toBe(2);

      const ids = allRes.body.map((t: any) => t.customer_id);
      expect(ids).toContain('CUST_OK1');
      expect(ids).toContain('CUST_OK2');
    });
  });
});
