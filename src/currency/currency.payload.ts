import {
  AllowedCurrency,
  BusinessAccountCurrency,
  BusinessProductEnabledCurrency,
} from '@prisma/client';
import { HttpStatus } from 'aws-sdk/clients/lambda';

export class CurrencyPayload {
  statusCode: number;
  data: {
    system: AllowedCurrency[];
    account: BusinessAccountCurrency[];
    product: BusinessProductEnabledCurrency[];
  };
}
