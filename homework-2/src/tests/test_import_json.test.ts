import { JsonParser } from '../services/jsonParser';
import * as fs from 'fs';
import * as path from 'path';

describe('JSON Parser', () => {
  it('should parse valid JSON file', async () => {
    const jsonPath = path.join(__dirname, 'fixtures', 'sample_tickets.json');
    const buffer = fs.readFileSync(jsonPath);
    const result = await JsonParser.parse(buffer);
    expect(result.tickets.length).toBe(20);
    expect(result.errors.length).toBe(0);
  });

  it('should handle invalid tickets and report errors', async () => {
    const jsonPath = path.join(__dirname, 'fixtures', 'invalid_tickets.json');
    const buffer = fs.readFileSync(jsonPath);
    const result = await JsonParser.parse(buffer);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should throw error for malformed JSON', async () => {
    const buffer = Buffer.from('{ invalid json }');
    await expect(JsonParser.parse(buffer)).rejects.toThrow('Invalid JSON');
  });

  it('should handle single object as well as array', async () => {
    const json = JSON.stringify({
      customer_id: 'CUST001',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      subject: 'Single Ticket',
      description: 'This is a single ticket in non-array format',
    });
    const result = await JsonParser.parse(Buffer.from(json));
    expect(result.tickets.length).toBe(1);
  });

  it('should correctly map nested metadata', async () => {
    const jsonPath = path.join(__dirname, 'fixtures', 'sample_tickets.json');
    const buffer = fs.readFileSync(jsonPath);
    const result = await JsonParser.parse(buffer);
    expect(result.tickets[0].metadata?.source).toBe('web_form');
  });
});
