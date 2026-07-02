import request from 'supertest';
import app from '../app';
import { ticketStore } from '../services/ticketStore';

const validTicket = {
  customer_id: 'CUST001',
  customer_email: 'john@example.com',
  customer_name: 'John Doe',
  subject: 'Test Subject',
  description: 'This is a valid description for testing purposes',
  category: 'technical_issue',
  priority: 'medium',
};

describe('Ticket API Endpoints', () => {
  beforeEach(() => {
    ticketStore.clear();
  });

  describe('POST /tickets', () => {
    it('should create a new ticket', async () => {
      const res = await request(app).post('/tickets').send(validTicket);
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.customer_email).toBe('john@example.com');
    });

    it('should return 400 for invalid ticket data', async () => {
      const res = await request(app).post('/tickets').send({ customer_id: 'CUST001' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app).post('/tickets').send({ ...validTicket, customer_email: 'bad-email' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /tickets', () => {
    it('should return empty array initially', async () => {
      const res = await request(app).get('/tickets');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return all tickets', async () => {
      await request(app).post('/tickets').send(validTicket);
      await request(app).post('/tickets').send({ ...validTicket, customer_id: 'CUST002' });
      const res = await request(app).get('/tickets');
      expect(res.body.length).toBe(2);
    });

    it('should filter tickets by category', async () => {
      await request(app).post('/tickets').send(validTicket);
      await request(app).post('/tickets').send({ ...validTicket, category: 'billing_question' });
      const res = await request(app).get('/tickets?category=billing_question');
      expect(res.body.length).toBe(1);
      expect(res.body[0].category).toBe('billing_question');
    });
  });

  describe('GET /tickets/:id', () => {
    it('should return a ticket by ID', async () => {
      const createRes = await request(app).post('/tickets').send(validTicket);
      const res = await request(app).get(`/tickets/${createRes.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createRes.body.id);
    });

    it('should return 404 for non-existent ticket', async () => {
      const res = await request(app).get('/tickets/non-existent-id');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /tickets/:id', () => {
    it('should update a ticket', async () => {
      const createRes = await request(app).post('/tickets').send(validTicket);
      const res = await request(app).put(`/tickets/${createRes.body.id}`).send({ subject: 'Updated Subject' });
      expect(res.status).toBe(200);
      expect(res.body.subject).toBe('Updated Subject');
    });

    it('should return 404 when updating non-existent ticket', async () => {
      const res = await request(app).put('/tickets/non-existent-id').send({ subject: 'Updated' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /tickets/:id', () => {
    it('should delete a ticket', async () => {
      const createRes = await request(app).post('/tickets').send(validTicket);
      const res = await request(app).delete(`/tickets/${createRes.body.id}`);
      expect(res.status).toBe(204);
    });

    it('should return 404 when deleting non-existent ticket', async () => {
      const res = await request(app).delete('/tickets/non-existent-id');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /tickets/:id validation', () => {
    it('should return 400 for invalid update data', async () => {
      const createRes = await request(app).post('/tickets').send(validTicket);
      const res = await request(app).put(`/tickets/${createRes.body.id}`).send({ priority: 'invalid_priority' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('POST /tickets/:id/auto-classify', () => {
    it('should auto-classify a ticket', async () => {
      const createRes = await request(app).post('/tickets').send(validTicket);
      const res = await request(app).post(`/tickets/${createRes.body.id}/auto-classify`);
      expect(res.status).toBe(200);
      expect(res.body.ticket).toBeDefined();
      expect(res.body.classification).toBeDefined();
      expect(res.body.classification.category).toBeDefined();
      expect(res.body.classification.priority).toBeDefined();
    });

    it('should return 404 for non-existent ticket', async () => {
      const res = await request(app).post('/tickets/non-existent-id/auto-classify');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /tickets/import', () => {
    it('should return 400 when no file is uploaded', async () => {
      const res = await request(app).post('/tickets/import');
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should import tickets from JSON file', async () => {
      const jsonContent = JSON.stringify([{
        customer_id: 'CUST_IMP1',
        customer_email: 'import@example.com',
        customer_name: 'Import User',
        subject: 'Import Test Subject',
        description: 'This is an imported ticket description',
      }]);
      const res = await request(app)
        .post('/tickets/import')
        .attach('file', Buffer.from(jsonContent), 'tickets.json');
      expect(res.status).toBe(201);
      expect(res.body.summary.successful).toBe(1);
      expect(res.body.tickets.length).toBe(1);
    });

    it('should import tickets from CSV file', async () => {
      const csvContent = 'customer_id,customer_email,customer_name,subject,description\nCUST_CSV1,csv@example.com,CSV User,CSV Subject,This is a csv imported ticket description';
      const res = await request(app)
        .post('/tickets/import')
        .attach('file', Buffer.from(csvContent), 'tickets.csv');
      expect(res.status).toBe(201);
      expect(res.body.summary.successful).toBe(1);
    });

    it('should import tickets from XML file', async () => {
      const xmlContent = `<?xml version="1.0"?><tickets><ticket><customer_id>CUST_XML1</customer_id><customer_email>xml@example.com</customer_email><customer_name>XML User</customer_name><subject>XML Subject</subject><description>This is an xml imported ticket description</description></ticket></tickets>`;
      const res = await request(app)
        .post('/tickets/import')
        .attach('file', Buffer.from(xmlContent), 'tickets.xml');
      expect(res.status).toBe(201);
      expect(res.body.summary.successful).toBe(1);
    });

    it('should return 400 for unsupported file format', async () => {
      const res = await request(app)
        .post('/tickets/import')
        .attach('file', Buffer.from('data'), 'tickets.txt');
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Unsupported');
    });

    it('should return 400 for malformed JSON file', async () => {
      const res = await request(app)
        .post('/tickets/import')
        .attach('file', Buffer.from('{invalid json'), 'tickets.json');
      expect(res.status).toBe(400);
    });
  });
});
