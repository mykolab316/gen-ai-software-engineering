import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FilterTransactionsDto } from './dto/filter-transactions.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';

@Injectable()
export class TransactionsService implements OnModuleInit {
  private readonly transactions: Transaction[] = [];

  onModuleInit() {
    this.seed();
  }

  private seed() {
    const seedData: Transaction[] = [
      {
        id: randomUUID(),
        fromAccount: undefined,
        toAccount: 'ACC-11111',
        amount: 5000,
        currency: 'USD',
        type: 'deposit',
        timestamp: '2026-01-15T10:30:00.000Z',
        status: 'completed',
      },
      {
        id: randomUUID(),
        fromAccount: undefined,
        toAccount: 'ACC-22222',
        amount: 3000,
        currency: 'EUR',
        type: 'deposit',
        timestamp: '2026-02-01T09:00:00.000Z',
        status: 'completed',
      },
      {
        id: randomUUID(),
        fromAccount: 'ACC-11111',
        toAccount: 'ACC-22222',
        amount: 750.50,
        currency: 'USD',
        type: 'transfer',
        timestamp: '2026-03-10T14:20:00.000Z',
        status: 'completed',
      },
      {
        id: randomUUID(),
        fromAccount: 'ACC-11111',
        toAccount: undefined,
        amount: 200,
        currency: 'USD',
        type: 'withdrawal',
        timestamp: '2026-04-05T16:45:00.000Z',
        status: 'completed',
      },
      {
        id: randomUUID(),
        fromAccount: 'ACC-22222',
        toAccount: 'ACC-33333',
        amount: 500,
        currency: 'EUR',
        type: 'transfer',
        timestamp: '2026-04-20T11:15:00.000Z',
        status: 'completed',
      },
      {
        id: randomUUID(),
        fromAccount: undefined,
        toAccount: 'ACC-33333',
        amount: 1000,
        currency: 'GBP',
        type: 'deposit',
        timestamp: '2026-05-01T08:00:00.000Z',
        status: 'completed',
      },
      {
        id: randomUUID(),
        fromAccount: 'ACC-11111',
        toAccount: 'ACC-33333',
        amount: 300,
        currency: 'USD',
        type: 'transfer',
        timestamp: '2026-05-10T13:30:00.000Z',
        status: 'pending',
      },
    ];

    this.transactions.push(...seedData);
    console.log(`Seeded ${seedData.length} test transactions`);
  }

  create(dto: CreateTransactionDto): Transaction {
    const accountErrors: { field: string; message: string }[] = [];

    if (dto.type === 'transfer') {
      if (!dto.fromAccount) accountErrors.push({ field: 'fromAccount', message: 'Transfer requires fromAccount' });
      if (!dto.toAccount) accountErrors.push({ field: 'toAccount', message: 'Transfer requires toAccount' });
    } else if (dto.type === 'deposit') {
      if (!dto.toAccount) accountErrors.push({ field: 'toAccount', message: 'Deposit requires toAccount' });
    } else if (dto.type === 'withdrawal') {
      if (!dto.fromAccount) accountErrors.push({ field: 'fromAccount', message: 'Withdrawal requires fromAccount' });
    }

    if (accountErrors.length > 0) {
      throw new BadRequestException({
        error: 'Validation failed',
        details: accountErrors,
      });
    }

    const transaction: Transaction = {
      id: randomUUID(),
      fromAccount: dto.fromAccount,
      toAccount: dto.toAccount,
      amount: dto.amount,
      currency: dto.currency,
      type: dto.type,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    this.transactions.push(transaction);

    setTimeout(() => {
      transaction.status = 'completed';
    }, 2000);

    return transaction;
  }

  findAll(filters: FilterTransactionsDto): Transaction[] {
    let result = [...this.transactions];

    if (filters.accountId) {
      result = result.filter(
        (t) =>
          t.fromAccount === filters.accountId ||
          t.toAccount === filters.accountId,
      );
    }

    if (filters.type) {
      result = result.filter((t) => t.type === filters.type);
    }

    if (filters.from) {
      const fromDate = new Date(filters.from);
      result = result.filter((t) => new Date(t.timestamp) >= fromDate);
    }

    if (filters.to) {
      const toDate = new Date(filters.to);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter((t) => new Date(t.timestamp) <= toDate);
    }

    return result;
  }

  findOne(id: string): Transaction | undefined {
    return this.transactions.find((t) => t.id === id);
  }

  updateStatus(id: string, dto: UpdateTransactionStatusDto): Transaction | undefined {
    const transaction = this.transactions.find((t) => t.id === id);
    if (transaction) {
      transaction.status = dto.status;
    }
    return transaction;
  }

  findByAccount(accountId: string): Transaction[] {
    return this.transactions.filter(
      (t) => t.fromAccount === accountId || t.toAccount === accountId,
    );
  }
}
