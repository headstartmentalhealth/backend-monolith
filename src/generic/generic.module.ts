import { Global, Module } from '@nestjs/common';
import { GenericService } from './generic.service';
import { PaystackService } from './providers/paystack/paystack.provider';
import { FlutterwaveService } from './providers/flutterwave/flutterwave.provider';

@Global()
@Module({
  providers: [GenericService, PaystackService, FlutterwaveService],
  exports: [GenericService, PaystackService, FlutterwaveService],
})
export class GenericModule {}
