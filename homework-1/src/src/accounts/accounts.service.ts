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
}
