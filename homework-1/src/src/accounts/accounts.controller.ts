import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { AccountsService } from './accounts.service';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get(':accountId/balance')
  getBalance(@Param('accountId') accountId: string) {
    const result = this.accountsService.getBalance(accountId);
    if (!result) {
      throw new NotFoundException(
        `No transactions found for account "${accountId}"`,
      );
    }
    return result;
  }
}
