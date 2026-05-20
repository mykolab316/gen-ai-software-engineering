# ▶️ How to Run the Application

## Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

## Installation

```bash
cd homework-2/src
npm install
```

## Start the Server

```bash
npm start
```

The API will be running at **http://localhost:3000**

## Start in Dev Mode (auto-restart on changes)

```bash
npm run dev
```

## Build for Production

```bash
npm run build
node dist/index.js
```

## Run Tests

```bash
npm test
```

Run tests with coverage report:

```bash
npm test -- --coverage
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Verify It's Working

Once the server is running, you should see:

```
Server running on port 3000
```

Test with:

```bash
curl http://localhost:3000/tickets
```

## Sample Requests

### Create a ticket

```bash
curl -X POST http://localhost:3000/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUST001",
    "customer_email": "john@example.com",
    "customer_name": "John Doe",
    "subject": "Cannot login to account",
    "description": "I have been trying to login for the past hour but keep getting an error message",
    "category": "account_access",
    "priority": "high"
  }'
```

### Get all tickets

```bash
curl http://localhost:3000/tickets
```

### Get ticket by ID

```bash
curl http://localhost:3000/tickets/{ticket-id}
```

### Update a ticket

```bash
curl -X PUT http://localhost:3000/tickets/{ticket-id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "assigned_to": "AGENT001"
  }'
```

### Delete a ticket

```bash
curl -X DELETE http://localhost:3000/tickets/{ticket-id}
```

### Auto-classify a ticket

```bash
curl -X POST http://localhost:3000/tickets/{ticket-id}/auto-classify
```

### Import tickets from CSV

```bash
curl -X POST http://localhost:3000/tickets/import \
  -F "file=@sample_tickets.csv"
```

### Import tickets from JSON

```bash
curl -X POST http://localhost:3000/tickets/import \
  -F "file=@sample_tickets.json"
```

### Import tickets from XML

```bash
curl -X POST http://localhost:3000/tickets/import \
  -F "file=@sample_tickets.xml"
```

### Filter tickets

```bash
curl "http://localhost:3000/tickets?category=account_access"
curl "http://localhost:3000/tickets?priority=high"
curl "http://localhost:3000/tickets?status=new"
curl "http://localhost:3000/tickets?customer_id=CUST001"
curl "http://localhost:3000/tickets?category=billing_question&priority=high"
```

## Sample Data Files

Sample data files are available in `src/tests/fixtures/`:
- `sample_tickets.csv` - 50 sample tickets in CSV format
- `sample_tickets.json` - 20 sample tickets in JSON format
- `sample_tickets.xml` - 30 sample tickets in XML format

Invalid data files for testing:
- `invalid_tickets.csv`
- `invalid_tickets.json`
- `invalid_tickets.xml`
