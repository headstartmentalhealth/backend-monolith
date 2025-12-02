import { Logger, Module } from '@nestjs/common';
import { OnboardService } from './onboard.service';
import { OnboardController } from './onboard.controller';
import { LogService } from '@/log/log.service';
import { PaystackService } from '@/generic/providers/paystack/paystack.provider';
import { MailService } from '@/notification/mail/mail.service';
import { UploadModule } from '@/multimedia/upload/upload.module';
import { CartService } from '@/cart/cart.service';
import { NotificationDispatchModule } from '@/notification/dispatch/dispatch.module';

@Module({
  imports: [UploadModule, NotificationDispatchModule],
  controllers: [OnboardController],
  providers: [
    OnboardService,
    LogService,
    PaystackService,
    MailService,
    CartService,
    Logger,
  ],
  exports: [OnboardService],
})
export class OnboardModule {}
