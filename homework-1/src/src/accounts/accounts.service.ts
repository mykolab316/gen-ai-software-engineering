import { Injectable } from '@nestjs/common';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class AccountsService {
  constructor(private readonly transactionsService: TransactionsService) {}

  getBalance(accountId: string): { accountId: string; balance: number; currencies: Record<string, number> } | null {
    const transactions = this.transactionsService.findByAccount(accountId);

    if (transactions.length === 0) {
      return null;
    }

    const balances: Record<string, number> = {};

    for (const tx of transactions) {
      if (tx.status !== 'completed') continue;

      const currency = tx.currency;
      if (!balances[currency]) {
        balances[currency] = 0;
      }

      if (tx.toAccount === accountId) {
        balances[currency] += tx.amount;
      }

      if (tx.fromAccount === accountId) {
        balances[currency] -= tx.amount;
      }
    }

    return {
      accountId,
      balance: Object.values(balances).reduce((sum, val) => sum + val, 0),
      currencies: balances,
    };
  }

  getSummary(accountId: string) {
    const transactions = this.transactionsService.findByAccount(accountId);

    if (transactions.length === 0) {
      return null;
    }

    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let mostRecentDate = '';

    for (const tx of transactions) {
      if (tx.toAccount === accountId && (tx.type === 'deposit' || tx.type === 'transfer')) {
        totalDeposits += tx.amount;
      }

      if (tx.fromAccount === accountId && (tx.type === 'withdrawal' || tx.type === 'transfer')) {
        totalWithdrawals += tx.amount;
      }

      if (!mostRecentDate || tx.timestamp > mostRecentDate) {
        mostRecentDate = tx.timestamp;
      }
    }

    return {
      accountId,
      totalDeposits,
      totalWithdrawals,
      numberOfTransactions: transactions.length,
      mostRecentTransactionDate: mostRecentDate,
    };
  }

  getInterest(accountId: string, rate: number, days: number) {
    const balanceResult = this.getBalance(accountId);
    if (!balanceResult) {
      return null;
    }

    const interest = parseFloat(
      ((balanceResult.balance * rate * days) / 365).toFixed(2),
    );

    return {
      accountId,
      balance: balanceResult.balance,
      currencies: balanceResult.currencies,
      rate,
      days,
      interest,
      totalAfterInterest: parseFloat((balanceResult.balance + interest).toFixed(2)),
    };
  }
}
