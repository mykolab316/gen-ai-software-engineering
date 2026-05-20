# API Reference

Complete API endpoint documentation for the Customer Support Ticket Management System.

**Base URL**: `http://localhost:3000`

**Content-Type**: `application/json`

---

## POST /tickets

Create a new support ticket.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| customer_id | string | Yes | Customer identifier |
| customer_email | string | Yes | Customer email address (must be valid email) |
| customer_name | string | Yes | Customer full name |
| subject | string | Yes | Ticket subject (1-200 characters) |
| description | string | Yes | Ticket description (10-2000 characters) |
| category | string | No | One of: `account_access`, `technical_issue`, `billing_question`, `feature_request`, `bug_report`, `other` |
| priority | string | No | One of: `urgent`, `high`, `medium`, `low` |
| status | string | No | One of: `new`, `in_progress`, `waiting_customer`, `resolved`, `closed` |
| tags | string[] | No | Array of tag strings |
| metadata | object | No | Metadata with optional `source` and `device_type` fields |

### Example Request

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
    "priority": "high",
    "tags": ["login", "error"],
    "metadata": { "source": "web_form", "device_type": "desktop" }
  }'
```

### Success Response (201)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customer_id": "CUST001",
  "customer_email": "john@example.com",
  "customer_name": "John Doe",
  "subject": "Cannot login to account",
  "description": "I have been trying to login for the past hour but keep getting an error message",
  "category": "account_access",
  "priority": "high",
  "status": "new",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z",
  "resolved_at": null,
  "assigned_to": null,
  "tags": ["login", "error"],
  "metadata": {
    "source": "web_form",
    "device_type": "desktop"
  }
}
```

### Error Response (400)

```json
{
  "error": "\"customer_email\" must be a valid email"
}
```

---

## POST /tickets/import

Bulk import tickets from a file (CSV, JSON, or XML).

### Request

**Content-Type**: `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | File with extension `.csv`, `.json`, or `.xml` |

### Example Request (CSV)

```bash
curl -X POST http://localhost:3000/tickets/import \
  -F "file=@sample_tickets.csv"
```

### Example Request (JSON)

```bash
curl -X POST http://localhost:3000/tickets/import \
  -F "file=@sample_tickets.json"
```

### Example Request (XML)

```bash
curl -X POST http://localhost:3000/tickets/import \
  -F "file=@sample_tickets.xml"
```

### Success Response (201)

```json
{
  "summary": {
    "total": 50,
    "successful": 48,
    "failed": 2,
    "errors": [
      { "index": 5, "error": "\"customer_email\" must be a valid email" },
      { "index": 23, "error": "\"description\" length must be at least 10 characters long" }
    ]
  },
  "tickets": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "customer_id": "CUST001",
      "customer_email": "john@example.com",
      ...
    }
  ]
}
```

### Error Responses

**No file uploaded (400)**
```json
{
  "error": "No file uploaded"
}
```

**Unsupported format (400)**
```json
{
  "error": "Unsupported file format. Use CSV, JSON, or XML"
}
```

**Malformed file (400)**
```json
{
  "error": "Invalid JSON: Unexpected token i in JSON at position 2"
}
```

---

## GET /tickets

List all tickets with optional filtering.

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| priority | string | Filter by priority |
| status | string | Filter by status |
| customer_id | string | Filter by customer ID |

### Example Request

```bash
# Get all tickets
curl http://localhost:3000/tickets

# Filter by category
curl http://localhost:3000/tickets?category=account_access

# Filter by priority
curl http://localhost:3000/tickets?priority=urgent

# Multiple filters
curl http://localhost:3000/tickets?category=billing_question&status=new
```

### Success Response (200)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "customer_id": "CUST001",
    "customer_email": "john@example.com",
    "customer_name": "John Doe",
    "subject": "Cannot login to account",
    "description": "I have been trying to login for the past hour but keep getting an error message",
    "category": "account_access",
    "priority": "high",
    "status": "new",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "resolved_at": null,
    "assigned_to": null,
    "tags": ["login", "error"],
    "metadata": {
      "source": "web_form",
      "device_type": "desktop"
    }
  }
]
```

**Empty array** (200) — No tickets found:
```json
[]
```

---

## GET /tickets/:id

Get a specific ticket by ID.

### Example Request

```bash
curl http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000
```

### Success Response (200)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customer_id": "CUST001",
  "customer_email": "john@example.com",
  "customer_name": "John Doe",
  "subject": "Cannot login to account",
  "description": "I have been trying to login for the past hour but keep getting an error message",
  "category": "account_access",
  "priority": "high",
  "status": "new",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z",
  "resolved_at": null,
  "assigned_to": null,
  "tags": ["login", "error"],
  "metadata": {
    "source": "web_form",
    "device_type": "desktop"
  }
}
```

### Error Response (404)

```json
{
  "error": "Ticket not found"
}
```

---

## PUT /tickets/:id

Update an existing ticket.

### Request Body

All fields are optional. Only provided fields will be updated.

| Field | Type | Description |
|-------|------|-------------|
| customer_id | string | Customer identifier |
| customer_email | string | Customer email address |
| customer_name | string | Customer full name |
| subject | string | Ticket subject (1-200 characters) |
| description | string | Ticket description (10-2000 characters) |
| category | string | One of the valid category values |
| priority | string | One of the valid priority values |
| status | string | One of the valid status values |
| assigned_to | string | Assigned user ID |
| tags | string[] | Array of tag strings |
| metadata | object | Metadata to merge with existing |

### Example Request

```bash
curl -X PUT http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Updated Subject",
    "status": "in_progress",
    "assigned_to": "AGENT001"
  }'
```

### Success Response (200)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customer_id": "CUST001",
  "customer_email": "john@example.com",
  "customer_name": "John Doe",
  "subject": "Updated Subject",
  "description": "I have been trying to login for the past hour but keep getting an error message",
  "category": "account_access",
  "priority": "high",
  "status": "in_progress",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:35:00.000Z",
  "resolved_at": null,
  "assigned_to": "AGENT001",
  "tags": ["login", "error"],
  "metadata": {
    "source": "web_form",
    "device_type": "desktop"
  }
}
```

### Error Responses

**Ticket not found (404)**
```json
{
  "error": "Ticket not found"
}
```

**Validation error (400)**
```json
{
  "error": "\"priority\" must be one of [urgent, high, medium, low]"
}
```

---

## DELETE /tickets/:id

Delete a ticket by ID.

### Example Request

```bash
curl -X DELETE http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000
```

### Success Response (204)

No content body.

### Error Response (404)

```json
{
  "error": "Ticket not found"
}
```

---

## POST /tickets/:id/auto-classify

Automatically classify a ticket using AI-powered keyword matching.

### Example Request

```bash
curl -X POST http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000/auto-classify
```

### Success Response (200)

```json
{
  "ticket": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "customer_id": "CUST001",
    "customer_email": "john@example.com",
    "customer_name": "John Doe",
    "subject": "Cannot login to account",
    "description": "I have been trying to login for the past hour but keep getting an error message",
    "category": "account_access",
    "priority": "high",
    "status": "new",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:35:00.000Z",
    "resolved_at": null,
    "assigned_to": null,
    "tags": ["login", "error"],
    "metadata": {
      "source": "web_form",
      "device_type": "desktop"
    }
  },
  "classification": {
    "category": "account_access",
    "priority": "high",
    "confidence": 0.85,
    "matched_keywords": ["login", "account"]
  }
}
```

### Error Response (404)

```json
{
  "error": "Ticket not found"
}
```

---

## Enum Values Reference

### Categories
- `account_access`
- `technical_issue`
- `billing_question`
- `feature_request`
- `bug_report`
- `other`

### Priorities
- `urgent`
- `high`
- `medium`
- `low`

### Statuses
- `new`
- `in_progress`
- `waiting_customer`
- `resolved`
- `closed`

### Sources (metadata.source)
- `web_form`
- `email`
- `api`
- `chat`
- `phone`

### Device Types (metadata.device_type)
- `desktop`
- `mobile`
- `tablet`

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Resource created |
| 204 | No content (successful delete) |
| 400 | Bad request (validation error, invalid input) |
| 404 | Resource not found |
| 500 | Internal server error |
