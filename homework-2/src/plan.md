# Step-by-Step Implementation Plan (Express)

## Project Overview
Build a customer support ticket management system with multi-format import, auto-classification, comprehensive tests, and multi-level documentation.

---

## Step 1: Project Setup
- Initialize Node.js project with `npm init`
- Install dependencies: `express`, `uuid`, `csv-parser`, `xml2js`, `joi` (validation), `jest` (testing), `supertest` (API testing), `nodemon` (dev)
- Create project structure:
  ```
  src/
    ├── models/
    ├── routes/
    ├── controllers/
    ├── middleware/
    ├── services/
    └── utils/
  tests/
    ├── fixtures/
    └── test files
  docs/
  ```

## Step 2: Ticket Model & Validation
- Create `src/models/ticket.js` with the ticket schema
- Implement Joi validation for:
  - Email format
  - String length constraints (subject: 1-200, description: 10-2000)
  - Enum validation (category, priority, status, source, device_type)
- Add UUID generation for ticket IDs
- Implement timestamp management (created_at, updated_at, resolved_at)

## Step 3: In-Memory Data Store
- Create `src/services/ticketStore.js` for ticket storage
- Implement CRUD operations with in-memory array
- Add filtering methods (by category, priority, status)

## Step 4: File Parsing Services
- **CSV Parser**: `src/services/csvParser.js` using `csv-parser`
- **JSON Parser**: `src/services/jsonParser.js` with JSON.parse
- **XML Parser**: `src/services/xmlParser.js` using `xml2js`
- Each parser should handle errors gracefully and return standardized format

## Step 5: API Routes & Controllers
- Create `src/routes/tickets.js` with all endpoints:
  - `POST /tickets` - Create single ticket
  - `POST /tickets/import` - Bulk import
  - `GET /tickets` - List with filters
  - `GET /tickets/:id` - Get by ID
  - `PUT /tickets/:id` - Update
  - `DELETE /tickets/:id` - Delete
- Create `src/controllers/ticketController.js` with business logic
- Add error handling middleware

## Step 6: Auto-Classification Service
- Create `src/services/classifier.js`
- Implement keyword-based classification:
  - Define keyword mappings for each category
  - Define priority rules based on keywords
- Add confidence scoring based on keyword matches
- Create `POST /tickets/:id/auto-classify` endpoint
- Log all classification decisions
- Add optional auto-run on creation flag

## Step 7: API Integration
- Create `src/app.js` to configure Express
- Mount routes, add error handling, JSON body parser
- Add file upload middleware for `/tickets/import`
- Create `src/index.js` as entry point

## Step 8: Test Suite (>85% Coverage)
Create tests in `tests/` directory:
- `test_ticket_api.js` - 11 tests for all endpoints
- `test_ticket_model.js` - 9 validation tests
- `test_import_csv.js` - 6 CSV parsing tests
- `test_import_json.js` - 5 JSON parsing tests
- `test_import_xml.js` - 5 XML parsing tests
- `test_categorization.js` - 10 classification tests
- `test_integration.js` - 5 end-to-end workflow tests
- `test_performance.js` - 5 benchmark tests
- Create fixture files in `tests/fixtures/`

## Step 9: Sample Data Generation
- `sample_tickets.csv` - 50 valid tickets
- `sample_tickets.json` - 20 valid tickets
- `sample_tickets.xml` - 30 valid tickets
- Invalid data files for negative testing (malformed CSV, invalid email, wrong enum values, missing fields)

## Step 10: Documentation
Create 4 documentation files:
1. **README.md** - Project overview, Mermaid architecture diagram, setup instructions, test running guide
2. **API_REFERENCE.md** - All endpoints with request/response examples, cURL commands, error formats
3. **ARCHITECTURE.md** - High-level architecture, component descriptions, Mermaid sequence diagrams, design decisions
4. **TESTING_GUIDE.md** - Test pyramid diagram, how to run tests, sample data locations, manual checklist, performance benchmarks

## Step 11: Integration Tests
- Complete ticket lifecycle workflow test
- Bulk import with auto-classification verification
- Concurrent operations test (20+ simultaneous requests)
- Combined filtering test (category + priority)

## Step 12: Coverage Report
- Run `npm test -- --coverage`
- Generate coverage report
- Screenshot coverage >85% to `docs/screenshots/test_coverage.png`

---

## Recommended Dependencies
```json
{
  "express": "^4.18.2",
  "uuid": "^9.0.0",
  "csv-parser": "^3.0.0",
  "xml2js": "^0.6.2",
  "joi": "^17.9.2",
  "multer": "^1.4.5-lts.1",
  "jest": "^29.6.0",
  "supertest": "^6.3.3",
  "nodemon": "^3.0.1"
}
```
