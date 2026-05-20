# 🏦 Homework 1: Banking Transactions API

> **Student Name**: Mykola Bernadskyi 
> **Date Submitted**: May 12, 2026
> **AI Tools Used**: Windsurf Cascade (Claude AI)

---

## 📋 Project Overview

A RESTful Banking Transactions API built with **NestJS** and **TypeScript**. The API provides full transaction management with in-memory storage, input validation, and account analytics.

### Key Features

- **Transaction Management** — Create, list, and retrieve transactions (deposits, withdrawals, transfers)
- **Input Validation** — Strict validation for account format (`ACC-XXXXX`), ISO 4217 currency codes, positive amounts with max 2 decimal places, and cross-field rules per transaction type
- **Transaction Filtering** — Filter by account ID, transaction type, and date range with support for combining multiple filters
- **Account Balance** — Real-time balance calculation across multiple currencies (only completed transactions count)
- **Account Summary** — Aggregated view with total deposits, withdrawals, transaction count, and most recent activity date
- **Simple Interest Calculator** — Calculates interest on current balance given a rate and number of days
- **CSV Export** — Export all transactions as a downloadable CSV file
- **Seed Data** — 7 pre-loaded test transactions for immediate testing

### Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| NestJS | Framework |
| TypeScript | Language |
| class-validator | Input validation |
| class-transformer | DTO transformation |
| In-memory array | Storage (no database required) |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/transactions` | Create a new transaction |
| `GET` | `/transactions` | List all transactions (with optional filters) |
| `GET` | `/transactions/export?format=csv` | Export transactions as CSV |
| `GET` | `/transactions/:id` | Get a specific transaction |
| `PATCH` | `/transactions/:id/status` | Update transaction status |
| `GET` | `/accounts/:accountId/balance` | Get account balance |
| `GET` | `/accounts/:accountId/summary` | Get transaction summary |
| `GET` | `/accounts/:accountId/interest?rate=0.05&days=30` | Calculate simple interest |

---

<div align="center">

*This project was completed as part of the AI-Assisted Development course.*

</div>
