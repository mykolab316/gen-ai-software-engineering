import { IsOptional, IsString, IsIn, IsDateString } from 'class-validator';

export class FilterTransactionsDto {
  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsIn(['deposit', 'withdrawal', 'transfer'], {
    message: 'Type must be one of: deposit, withdrawal, transfer',
  })
  type?: string;

  @IsOptional()
  @IsDateString({}, { message: 'from must be a valid ISO 8601 date string' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'to must be a valid ISO 8601 date string' })
  to?: string;
}
