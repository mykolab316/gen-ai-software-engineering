import { CsvParser } from '../services/csvParser';
import * as fs from 'fs';
import * as path from 'path';

describe('CSV Parser', () => {
  it('should parse valid CSV file', async () => {
    const csvPath = path.join(__dirname, 'fixtures', 'sample_tickets.csv');
    const buffer = fs.readFileSync(csvPath);
    const result = await CsvParser.parse(buffer);
    expect(result.tickets.length).toBe(50);
    expect(result.errors.length).toBe(0);
  });

  it('should return ticket data with correct fields', async () => {
    const csvPath = path.join(__dirname, 'fixtures', 'sample_tickets.csv');
    const buffer = fs.readFileSync(csvPath);
    const result = await CsvParser.parse(buffer);
    expect(result.tickets[0].customer_id).toBe('CUST001');
    expect(result.tickets[0].customer_email).toBe('john@example.com');
  });

  it('should handle invalid tickets and report errors', async () => {
    const csvPath = path.join(__dirname, 'fixtures', 'invalid_tickets.csv');
    const buffer = fs.readFileSync(csvPath);
    const result = await CsvParser.parse(buffer);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should handle empty CSV file', async () => {
    const buffer = Buffer.from('customer_id,customer_email,customer_name,subject,description\n');
    const result = await CsvParser.parse(buffer);
    expect(result.tickets.length).toBe(0);
    expect(result.errors.length).toBe(0);
  });

  it('should parse tags separated by semicolons', async () => {
    const csvPath = path.join(__dirname, 'fixtures', 'sample_tickets.csv');
    const buffer = fs.readFileSync(csvPath);
    const result = await CsvParser.parse(buffer);
    expect(result.tickets[0].tags).toContain('login');
  });

  it('should handle CSV with missing optional fields', async () => {
    const csv = 'customer_id,customer_email,customer_name,subject,description\nCUST001,john@example.com,John Doe,Test Subject,This is a valid test description\n';
    const buffer = Buffer.from(csv);
    const result = await CsvParser.parse(buffer);
    expect(result.tickets.length).toBe(1);
    expect(result.tickets[0].category).toBeUndefined();
  });
});
