import { Logger, Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { PaystackService } from '@/generic/providers/paystack/paystack.provider';
import { SubscriptionPlanPriceService } from '@/subscription_plan/price/price.service';
import { BillingService } from '@/account/billing/billing.service';
import { MailService } from '@/notification/mail/mail.service';

@Module({
  controllers: [SubscriptionController],
  providers: [
    SubscriptionService,
    SubscriptionPlanPriceService,
    BillingService,
    MailService,
    Logger,
  ],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
