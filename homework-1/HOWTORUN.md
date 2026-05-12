# ▶️ How to Run the Application

## Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

## Installation

```bash
cd homework-1/src
npm install
```

## Start the Server

```bash
npx nest start
```

The API will be running at **http://localhost:3000**

## Start in Watch Mode (auto-restart on changes)

```bash
npx nest start --watch
```

## Build for Production

```bash
npx nest build
node dist/main.js
```

## Verify It's Working

Once the server is running, you should see:

```
Seeded 7 test transactions
Server running on http://localhost:3000
```

Test with:

```bash
curl http://localhost:3000/transactions
```

## Sample Requests

### Create a transaction

```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccount": "ACC-12345",
    "toAccount": "ACC-67890",
    "amount": 100.50,
    "currency": "USD",
    "type": "transfer"
  }'
```

### Get account balance

```bash
curl http://localhost:3000/accounts/ACC-11111/balance
```

### Get account summary

```bash
curl http://localhost:3000/accounts/ACC-11111/summary
```

### Calculate interest

```bash
curl "http://localhost:3000/accounts/ACC-11111/interest?rate=0.05&days=30"
```

### Export transactions as CSV

```bash
curl "http://localhost:3000/transactions/export?format=csv"
```

### Filter transactions

```bash
curl "http://localhost:3000/transactions?accountId=ACC-11111"
curl "http://localhost:3000/transactions?type=transfer"
curl "http://localhost:3000/transactions?from=2026-03-01&to=2026-04-30"
```