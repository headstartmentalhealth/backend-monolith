import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { OnboardModule } from './onboard/onboard.module';
import { ContactModule } from './contact/contact.module';
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [AuthModule, OnboardModule, ContactModule, BillingModule],
})
export class AccountModule {}
