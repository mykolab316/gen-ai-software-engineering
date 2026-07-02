import { XmlParser } from '../services/xmlParser';
import * as fs from 'fs';
import * as path from 'path';

describe('XML Parser', () => {
  it('should parse valid XML file', async () => {
    const xmlPath = path.join(__dirname, 'fixtures', 'sample_tickets.xml');
    const buffer = fs.readFileSync(xmlPath);
    const result = await XmlParser.parse(buffer);
    expect(result.tickets.length).toBe(30);
    expect(result.errors.length).toBe(0);
  });

  it('should return ticket data with correct fields', async () => {
    const xmlPath = path.join(__dirname, 'fixtures', 'sample_tickets.xml');
    const buffer = fs.readFileSync(xmlPath);
    const result = await XmlParser.parse(buffer);
    expect(result.tickets[0].customer_id).toBe('CUST001');
    expect(result.tickets[0].customer_email).toBe('john@example.com');
  });

  it('should throw error for malformed XML', async () => {
    const xmlPath = path.join(__dirname, 'fixtures', 'invalid_tickets.xml');
    const buffer = fs.readFileSync(xmlPath);
    await expect(XmlParser.parse(buffer)).rejects.toThrow('Invalid XML');
  });

  it('should handle XML with metadata element', async () => {
    const xmlPath = path.join(__dirname, 'fixtures', 'sample_tickets.xml');
    const buffer = fs.readFileSync(xmlPath);
    const result = await XmlParser.parse(buffer);
    expect(result.tickets[0].metadata?.source).toBe('web_form');
    expect(result.tickets[0].metadata?.device_type).toBe('desktop');
  });

  it('should handle empty tickets element', async () => {
    const xml = '<?xml version="1.0"?><tickets></tickets>';
    const buffer = Buffer.from(xml);
    const result = await XmlParser.parse(buffer);
    expect(result.tickets.length).toBe(0);
  });

  it('should parse XML with root-level <ticket> element instead of <tickets>', async () => {
    const xml = `<?xml version="1.0"?><ticket><customer_id>CUST010</customer_id><customer_email>root@example.com</customer_email><customer_name>Root User</customer_name><subject>Root ticket subject</subject><description>This ticket uses a root ticket element instead of tickets wrapper</description></ticket>`;
    const buffer = Buffer.from(xml);
    const result = await XmlParser.parse(buffer);
    expect(result.tickets.length).toBe(1);
    expect(result.tickets[0].customer_id).toBe('CUST010');
  });

  it('should handle XML with validation error and collect it in errors', async () => {
    const xml = `<?xml version="1.0"?><tickets><ticket><customer_id>CUST011</customer_id><customer_email>bad-email</customer_email><customer_name>Bad User</customer_name><subject>Subject</subject><description>Short</description></ticket></tickets>`;
    const buffer = Buffer.from(xml);
    const result = await XmlParser.parse(buffer);
    expect(result.errors.length).toBe(1);
    expect(result.tickets.length).toBe(0);
  });

  it('should parse XML with tags as semicolon-separated string', async () => {
    const xml = `<?xml version="1.0"?><tickets><ticket><customer_id>CUST012</customer_id><customer_email>tags@example.com</customer_email><customer_name>Tags User</customer_name><subject>Tags Test Subject</subject><description>This ticket has tags as a semicolon separated string value</description><tags>login;error;urgent</tags></ticket></tickets>`;
    const buffer = Buffer.from(xml);
    const result = await XmlParser.parse(buffer);
    expect(result.tickets[0].tags).toEqual(['login', 'error', 'urgent']);
  });

  it('should parse XML with tags as child <tag> elements', async () => {
    const xml = `<?xml version="1.0"?><tickets><ticket><customer_id>CUST013</customer_id><customer_email>tagelems@example.com</customer_email><customer_name>Tag Elems User</customer_name><subject>Tag Elements Test</subject><description>This ticket has tags as individual tag child elements inside tags</description><tags><tag>billing</tag><tag>refund</tag></tags></ticket></tickets>`;
    const buffer = Buffer.from(xml);
    const result = await XmlParser.parse(buffer);
    expect(result.tickets[0].tags).toEqual(['billing', 'refund']);
  });

  it('should parse XML with root-level source and device_type fields', async () => {
    const xml = `<?xml version="1.0"?><tickets><ticket><customer_id>CUST014</customer_id><customer_email>meta@example.com</customer_email><customer_name>Meta User</customer_name><subject>Metadata Test Subject</subject><description>This ticket has source and device type as root level elements</description><source>web_form</source><device_type>desktop</device_type></ticket></tickets>`;
    const buffer = Buffer.from(xml);
    const result = await XmlParser.parse(buffer);
    expect(result.tickets[0].metadata?.source).toBe('web_form');
    expect(result.tickets[0].metadata?.device_type).toBe('desktop');
  });
});
