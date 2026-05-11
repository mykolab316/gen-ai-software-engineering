import { Injectable, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FilterTransactionsDto } from './dto/filter-transactions.dto';

@Injectable()
export class TransactionsService {
  private readonly transactions: Transaction[] = [];

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

  findByAccount(accountId: string): Transaction[] {
    return this.transactions.filter(
      (t) => t.fromAccount === accountId || t.toAccount === accountId,
    );
  }
}
