"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const Joi = require("joi");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ping_module_1 = require("./ping/ping.module");
const prisma_module_1 = require("./prisma/prisma.module");
const log_module_1 = require("./log/log.module");
const generic_module_1 = require("./generic/generic.module");
const rbac_module_1 = require("./rbac/rbac.module");
const account_module_1 = require("./account/account.module");
const mail_module_1 = require("./notification/mail/mail.module");
const notification_module_1 = require("./notification/notification.module");
const schedule_1 = require("@nestjs/schedule");
const timezone_middleware_1 = require("./timezone.middleware");
const subscription_plan_module_1 = require("./subscription_plan/subscription_plan.module");
const coupon_module_1 = require("./coupon/coupon.module");
const subscription_module_1 = require("./subscription/subscription.module");
const webhook_module_1 = require("./webhook/webhook.module");
const multimedia_module_1 = require("./multimedia/multimedia.module");
const payment_module_1 = require("./payment/payment.module");
const cart_module_1 = require("./cart/cart.module");
const product_module_1 = require("./product/product.module");
const analytics_module_1 = require("./analytics/analytics.module");
const chat_module_1 = require("./chat/chat.module");
const withdraw_module_1 = require("./withdraw/withdraw.module");
const currency_module_1 = require("./currency/currency.module");
const resource_module_1 = require("./resource/resource.module");
const blog_post_module_1 = require("./blog-post/blog-post.module");
const mood_check_in_module_1 = require("./mood-check-in/mood-check-in.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(timezone_middleware_1.TimezoneMiddleware)
            .forRoutes({ path: '*', method: common_1.RequestMethod.ALL });
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            config_1.ConfigModule.forRoot({
                validationSchema: Joi.object({
                    NODE_ENV: Joi.string()
                        .valid('development', 'production', 'test', 'provision')
                        .default('development'),
                    PORT: Joi.number().port().default(3001),
                }),
                isGlobal: true,
            }),
            ping_module_1.PingModule,
            prisma_module_1.PrismaModule,
            log_module_1.LogModule,
            generic_module_1.GenericModule,
            rbac_module_1.RbacModule,
            account_module_1.AccountModule,
            mail_module_1.MailModule,
            notification_module_1.NotificationModule,
            subscription_plan_module_1.SubscriptionPlanModule,
            coupon_module_1.CouponModule,
            subscription_module_1.SubscriptionModule,
            webhook_module_1.WebhookModule,
            multimedia_module_1.MultimediaModule,
            payment_module_1.PaymentModule,
            cart_module_1.CartModule,
            product_module_1.ProductModule,
            analytics_module_1.AnalyticsModule,
            chat_module_1.ChatModule,
            withdraw_module_1.WithdrawModule,
            currency_module_1.CurrencyModule,
            resource_module_1.ResourceModule,
            blog_post_module_1.BlogPostModule,
            mood_check_in_module_1.MoodCheckInModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map