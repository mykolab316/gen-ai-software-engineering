import { Controller, Get, Param, Query, NotFoundException, BadRequestException } from '@nestjs/common';
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

  @Get(':accountId/summary')
  getSummary(@Param('accountId') accountId: string) {
    const result = this.accountsService.getSummary(accountId);
    if (!result) {
      throw new NotFoundException(
        `No transactions found for account "${accountId}"`,
      );
    }
    return result;
  }

  @Get(':accountId/interest')
  getInterest(
    @Param('accountId') accountId: string,
    @Query('rate') rate: string,
    @Query('days') days: string,
  ) {
    const parsedRate = parseFloat(rate);
    const parsedDays = parseInt(days, 10);

    if (isNaN(parsedRate) || parsedRate <= 0) {
      throw new BadRequestException('rate must be a positive number (e.g. 0.05 for 5%)');
    }
    if (isNaN(parsedDays) || parsedDays <= 0) {
      throw new BadRequestException('days must be a positive integer');
    }

    const result = this.accountsService.getInterest(accountId, parsedRate, parsedDays);
    if (!result) {
      throw new NotFoundException(
        `No transactions found for account "${accountId}"`,
      );
    }
    return result;
  }
}
