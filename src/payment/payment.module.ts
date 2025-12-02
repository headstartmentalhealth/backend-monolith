import { Logger, Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { MailService } from '@/notification/mail/mail.service';
import { BillingService } from '@/account/billing/billing.service';
import { CouponUsageService } from '@/coupon/usage/usage.service';
import { CouponManagementService } from '@/coupon/management/management.service';
import { CartService } from '@/cart/cart.service';

@Module({
  controllers: [PaymentController],
  providers: [
    PaymentService,
    MailService,
    BillingService,
    Logger,
    CouponUsageService,
    CouponManagementService,
    CartService,
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
