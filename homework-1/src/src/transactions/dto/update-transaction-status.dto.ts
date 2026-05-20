import { IsIn } from 'class-validator';

export class UpdateTransactionStatusDto {
  @IsIn(['pending', 'completed', 'failed'], {
    message: 'Status must be one of: pending, completed, failed',
  })
  status!: 'pending' | 'completed' | 'failed';
}
