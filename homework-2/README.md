# � Homework 2: Customer Support Ticket Management System

> **Student Name**: Mykola Bernadskyi
> **Date Submitted**: May 20, 2026
> **AI Tools Used**: Cascade (Claude)

---

## 📋 Project Overview

Built an intelligent customer support ticket management system using Express.js, TypeScript, and Node.js. The system provides RESTful APIs for ticket management, multi-format data import (CSV, JSON, XML), and AI-powered auto-classification using keyword-based matching. The project follows a layered architecture with clear separation of concerns between controllers, services, models, and parsers.

### Key Features Implemented

- **Complete CRUD API** — Create, read, update, delete tickets with full validation
- **Multi-Format Bulk Import** — Support for CSV (50 tickets), JSON (20 tickets), and XML (30 tickets) file imports
- **Auto-Classification Service** — Keyword-based AI that assigns category and priority with confidence scoring
- **Advanced Filtering** — Filter tickets by category, priority, status, and customer ID
- **Comprehensive Validation** — Joi-based validation for all inputs (email format, length constraints, enum values)
- **In-Memory Data Store** — Fast Map-based storage with full CRUD and filtering operations
- **File Upload Handling** — Multer middleware for multipart form data processing
- **Error Handling Middleware** — Centralized error handling with custom responses

### Implementation Summary

**Step 1–7: Core Implementation**
- Project structure created with TypeScript, Express, and Jest
- Ticket model with Joi validation schemas for create/update operations
- TicketStore service with in-memory Map storage and filtering
- Parsers for CSV, JSON, and XML with normalization and error collection
- TicketController with all CRUD operations and import endpoint
- Routes configured with multer for file uploads
- Classifier service with keyword mapping and confidence scoring
- Express app configured with middleware and route mounting

**Step 8: Test Suite (93.93% Coverage)**
- 80 tests across 8 test suites
- Model validation tests (9 tests)
- Store CRUD and filtering tests (6 tests)
- API endpoint integration tests (11 tests)
- Parser tests for CSV/JSON/XML (21 tests)
- Auto-classification tests (10 tests)
- Integration workflow tests (5 tests)

**Step 9: Sample Data Generation**
- 50 valid tickets in CSV format
- 20 valid tickets in JSON format
- 30 valid tickets in XML format
- Invalid data files for negative testing

**Step 10: Documentation**
- README.md with architecture diagram and setup instructions
- API_REFERENCE.md with all endpoints, examples, and cURL commands
- ARCHITECTURE.md with component descriptions, sequence diagrams, and design decisions
- TESTING_GUIDE.md with test pyramid, coverage summary, and performance benchmarks

**Step 11: Integration Tests**
- Complete ticket lifecycle workflow test
- Bulk import with filter verification test
- Concurrent operations test (20 simultaneous requests)
- Combined multi-filter query test
- Import with partial failures and error reporting test

**Step 12: Coverage Report**
- Generated HTML coverage report showing 94.5% statement coverage
- Screenshot saved to docs/screenshots/test_coverage.png

### Technology Stack

- **Web Framework**: Express.js
- **Language**: TypeScript
- **Validation**: Joi
- **File Upload**: Multer
- **Parsers**: csv-parser, xml2js
- **UUID**: uuid v9 (CommonJS compatible)
- **Testing**: Jest, Supertest, ts-jest
- **Development**: ts-node, nodemon

### Test Results

```
Test Suites: 8 passed, 8 total
Tests:       80 passed, 80 total
Coverage:    94.5% statements, 72.5% branches, 98.21% functions, 96.73% lines
```

All tests pass and coverage exceeds the 85% target.

### Project Structure

```
homework-2/
├── src/
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Error handling
│   ├── models/           # Data models and validation
│   ├── routes/           # API routes
│   ├── services/         # Business logic (parsers, classifier, store)
│   ├── tests/            # Test files and fixtures
│   │   └── fixtures/     # Sample data (CSV/JSON/XML)
│   ├── types/            # TypeScript definitions
│   ├── app.ts            # Express configuration
│   ├── index.ts          # Entry point
│   ├── jest.config.ts    # Jest configuration
│   ├── package.json      # Dependencies
│   └── tsconfig.json     # TypeScript config
├── docs/                 # Documentation
│   ├── README.md         # Project documentation
│   ├── API_REFERENCE.md  # API endpoint reference
│   ├── ARCHITECTURE.md   # System architecture
│   ├── TESTING_GUIDE.md  # Testing guide
│   └── screenshots/      # Coverage screenshot
└── README.md             # This file
```

<div align="center">

*This project was completed as part of the AI-Assisted Development course.*

</div>
