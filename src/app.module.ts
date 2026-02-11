import * as Joi from 'joi';
import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PingModule } from './ping/ping.module';
import { PrismaModule } from './prisma/prisma.module';
import { LogModule } from './log/log.module';
import { GenericModule } from './generic/generic.module';
import { RbacModule } from './rbac/rbac.module';
import { AccountModule } from './account/account.module';
import { MailModule } from './notification/mail/mail.module';
import { NotificationModule } from './notification/notification.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TimezoneMiddleware } from './timezone.middleware';
import { SubscriptionPlanModule } from './subscription_plan/subscription_plan.module';
import { CouponModule } from './coupon/coupon.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { WebhookModule } from './webhook/webhook.module';
import { BullModule } from '@nestjs/bullmq';
import { CourseModule } from './product/course/course.module';
import { MultimediaModule } from './multimedia/multimedia.module';
import { PaymentModule } from './payment/payment.module';
import { CartModule } from './cart/cart.module';
import { TicketModule } from './product/ticket/ticket.module';
import { ProductModule } from './product/product.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ChatModule } from './chat/chat.module';
import { ReviewModule } from './review/review.module';
import { WithdrawModule } from './withdraw/withdraw.module';
import { CurrencyModule } from './currency/currency.module';
import { ResourceModule } from './resource/resource.module';
import { BlogPostModule } from './blog-post/blog-post.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Enable the scheduler
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'provision')
          .default('development'),
        PORT: Joi.number().port().default(3001),
      }),
      isGlobal: true,
    }),
    PingModule,
    PrismaModule,
    LogModule,
    GenericModule,
    RbacModule,
    AccountModule,
    MailModule,
    NotificationModule,
    SubscriptionPlanModule,
    CouponModule,
    SubscriptionModule,
    WebhookModule,

    MultimediaModule,
    PaymentModule,
    CartModule,
    ProductModule,

    AnalyticsModule,

    ChatModule,

    WithdrawModule,
    CurrencyModule,
    ResourceModule,
    BlogPostModule,
    // ReviewModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TimezoneMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
