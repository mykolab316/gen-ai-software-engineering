import {
  IsString,
  IsNumber,
  IsPositive,
  IsIn,
  IsOptional,
  Matches,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

const VALID_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD',
  'CNY', 'INR', 'BRL', 'KRW', 'MXN', 'SGD', 'HKD', 'NOK',
  'SEK', 'DKK', 'ZAR', 'TRY', 'RUB', 'PLN', 'THB', 'IDR',
  'MYR', 'PHP', 'CZK', 'ILS', 'CLP', 'ARS', 'COP', 'PEN',
  'SAR', 'AED', 'EGP', 'TWD', 'HUF', 'RON', 'BGN', 'HRK',
];

const ACCOUNT_REGEX = /^ACC-[A-Za-z0-9]{5}$/;

@ValidatorConstraint({ name: 'maxDecimalPlaces', async: false })
class MaxTwoDecimalPlaces implements ValidatorConstraintInterface {
  validate(value: number): boolean {
    if (typeof value !== 'number') return false;
    const decimalPart = value.toString().split('.')[1];
    return !decimalPart || decimalPart.length <= 2;
  }

  defaultMessage(): string {
    return 'Amount must have at most 2 decimal places';
  }
}

export class CreateTransactionDto {
  @IsOptional()
  @IsString({ message: 'fromAccount must be a string' })
  @Matches(ACCOUNT_REGEX, { message: 'fromAccount must follow format ACC-XXXXX (X is alphanumeric)' })
  fromAccount?: string;

  @IsOptional()
  @IsString({ message: 'toAccount must be a string' })
  @Matches(ACCOUNT_REGEX, { message: 'toAccount must follow format ACC-XXXXX (X is alphanumeric)' })
  toAccount?: string;

  @IsNumber({}, { message: 'Amount must be a number' })
  @IsPositive({ message: 'Amount must be a positive number' })
  @Validate(MaxTwoDecimalPlaces)
  amount!: number;

  @IsString({ message: 'Currency must be a string' })
  @IsIn(VALID_CURRENCIES, { message: 'Invalid currency code. Must be a valid ISO 4217 code' })
  currency!: string;

  @IsIn(['deposit', 'withdrawal', 'transfer'], {
    message: 'Type must be one of: deposit, withdrawal, transfer',
  })
  type!: 'deposit' | 'withdrawal' | 'transfer';

}
