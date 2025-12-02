import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { SubscriptionModule } from '@/subscription/subscription.module';
import { PaymentModule } from '@/payment/payment.module';
import { PaymentService } from '@/payment/payment.service';

@Module({
  imports: [SubscriptionModule, PaymentModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
