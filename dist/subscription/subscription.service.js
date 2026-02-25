"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const paystack_provider_1 = require("../generic/providers/paystack/paystack.provider");
const price_service_1 = require("../subscription_plan/price/price.service");
const auth_service_1 = require("../account/auth/auth.service");
const client_1 = require("@prisma/client");
const billing_service_1 = require("../account/billing/billing.service");
const log_service_1 = require("../log/log.service");
const generic_utils_1 = require("../generic/generic.utils");
const mail_service_1 = require("../notification/mail/mail.service");
const schedule_1 = require("@nestjs/schedule");
const subscription_utils_1 = require("./subscription.utils");
const generic_service_1 = require("../generic/generic.service");
const config_1 = require("@nestjs/config");
let SubscriptionService = class SubscriptionService {
    constructor(prisma, paystackService, subscriptionPlanPriceService, authService, billingService, logService, mailService, logger, genericService, configService) {
        this.prisma = prisma;
        this.paystackService = paystackService;
        this.subscriptionPlanPriceService = subscriptionPlanPriceService;
        this.authService = authService;
        this.billingService = billingService;
        this.logService = logService;
        this.mailService = mailService;
        this.logger = logger;
        this.genericService = genericService;
        this.configService = configService;
        this.model = 'Subscription';
    }
    async createSubscription(request, createSubscriptionDto) {
        const { email, plan_price_id, payment_method, billing_id, auto_renew, currency, } = createSubscriptionDto;
        return this.prisma.$transaction(async (prisma) => {
            const plan_price = await this.genericService.find_subscription_plan_price((await this.subscriptionPlanPriceService.findOne(plan_price_id)), currency);
            const user = await this.authService.getUserByEmail(prisma.user, email);
            if (user.subscriptions.length) {
                throw new common_1.ConflictException('This account already has an active subscription.');
            }
            let billing_details = null;
            if (billing_id) {
                billing_details = await this.billingService.findOne(billing_id, user.id);
            }
            const payment = await this.paystackService.initializeTransaction({
                email: user.email,
                amount: +plan_price.price,
                metadata: {
                    user_id: user.id,
                    plan_id: plan_price.subscription_plan.id,
                    plan: plan_price.subscription_plan.name,
                    interval: plan_price.period,
                },
            });
            const final_amount_breakdown = this.genericService.finalAmountToBusinessWallet(+plan_price.price, currency, +0);
            const paymentRecord = await prisma.payment.create({
                data: {
                    user_id: user.id,
                    business_id: plan_price.subscription_plan.business_id,
                    purchase_type: client_1.PurchaseType.SUBSCRIPTION,
                    purchase_id: plan_price.subscription_plan.id,
                    amount: final_amount_breakdown.net_amount,
                    gross_amount: +plan_price.price,
                    final_amount: final_amount_breakdown.fee_amount,
                    fee_percent: this.configService.get(`DOEXCESS_${currency}_CHARGE`),
                    currency: plan_price.currency,
                    payment_status: client_1.PaymentStatus.PENDING,
                    payment_method,
                    transaction_id: payment.data.reference,
                    ...(billing_details && { billing_id: billing_details.id }),
                    ...(billing_details && { billing_at_payment: billing_details }),
                    interval: plan_price.period,
                    auto_renew,
                },
            });
            await this.logService.createWithTrx({
                user_id: user.id,
                action: client_1.Action.SUBSCRIPTION_INITIATION,
                entity: this.model,
                entity_id: paymentRecord.id,
                metadata: `User with ID ${user.id} just initated a subscription payment for subscription plan ID ${plan_price.subscription_plan.id} of business ID ${plan_price.subscription_plan.business_id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: 200,
                message: 'Payment initialized successfully.',
                data: {
                    authorization_url: payment.data.authorization_url,
                    payment_id: paymentRecord.id,
                },
            };
        });
    }
    async verifyPayment(request, verifySubscriptionDto) {
        const { payment_id } = verifySubscriptionDto;
        try {
            const { payment, subscription } = await this.prisma.$transaction(async (prisma) => {
                const payment = await prisma.payment.findUnique({
                    where: { id: payment_id },
                    include: {
                        user: true,
                        subscription_plan: {
                            select: {
                                name: true,
                                business_id: true,
                                business: {
                                    include: {
                                        business_contacts: {
                                            where: { is_owner: true },
                                            include: { user: true },
                                        },
                                        business_wallet: true,
                                    },
                                },
                            },
                        },
                    },
                });
                if (!payment) {
                    throw new common_1.NotFoundException('Payment record not found.');
                }
                const business_wallet = await prisma.businessWallet.findUnique({
                    where: {
                        business_id_currency: {
                            business_id: payment.subscription_plan.business_id,
                            currency: payment.currency,
                        },
                    },
                });
                if (!business_wallet)
                    return;
                if (payment.payment_status === client_1.PaymentStatus.SUCCESS) {
                    throw new common_1.ConflictException('Subscription payment has already been verified.');
                }
                const verification = await this.paystackService.verifyTransaction(payment.id);
                if (verification.data.status === 'success') {
                    await prisma.payment.update({
                        where: { id: payment_id },
                        data: { payment_status: 'SUCCESS' },
                    });
                    let next_payment_days_from_now = null;
                    const existing_active_subscription = await prisma.subscription.findFirst({
                        where: {
                            user_id: payment.user_id,
                            plan_id: payment.purchase_id,
                            billing_interval: payment.interval,
                            is_active: true,
                            next_payment_date: { gt: new Date() },
                        },
                    });
                    if (existing_active_subscription) {
                        await prisma.subscription.update({
                            where: { id: existing_active_subscription.id },
                            data: { is_active: false, charge_auth_code: null },
                        });
                        const next_payment_date = existing_active_subscription.next_payment_date;
                        next_payment_days_from_now =
                            (0, generic_utils_1.getDaysUntilNextPayment)(next_payment_date);
                    }
                    let end_date = (0, generic_utils_1.calculateEndDate)(payment.interval);
                    if (next_payment_days_from_now) {
                        end_date = (0, generic_utils_1.getEndDateFromDays)(end_date, next_payment_days_from_now);
                    }
                    const subscription = await prisma.subscription.create({
                        data: {
                            user: { connect: { id: payment.user_id } },
                            subscription_plan: { connect: { id: payment.purchase_id } },
                            plan_name_at_subscription: payment.subscription_plan.name,
                            plan_price_at_subscription: payment.amount,
                            next_payment_amount: payment.amount,
                            start_date: new Date(),
                            end_date: end_date,
                            grace_end_date: (0, generic_utils_1.addGracePeriod)(end_date),
                            is_active: true,
                            payment_method: client_1.PaymentMethod.PAYSTACK,
                            billing_interval: payment.interval,
                            next_payment_date: end_date,
                            auto_renew: payment.auto_renew,
                            charge_auth_code: this.genericService.encrypt(verification.data.authorization.authorization_code),
                            business_info: {
                                connect: { id: payment.subscription_plan.business_id },
                            },
                        },
                    });
                    await prisma.subscriptionPayment.create({
                        data: {
                            subscription_id: subscription.id,
                            amount: payment.amount,
                            currency: payment.currency,
                            payment_id: payment.id,
                        },
                    });
                    await prisma.businessWallet.update({
                        where: {
                            business_id_currency: {
                                business_id: payment.subscription_plan.business_id,
                                currency: business_wallet.currency,
                            },
                        },
                        data: {
                            balance: {
                                increment: payment.final_amount,
                            },
                            previous_balance: business_wallet.balance,
                        },
                    });
                    let metadata = `User with ID ${payment.user_id} just made a subscription payment for subscription plan ID ${payment.purchase_id} of business ID ${payment.subscription_plan.business_id}.`;
                    if (payment.is_renewal) {
                        metadata = `Subscription ID ${subscription.id} renewed successfully for user ${payment.user_id}.`;
                    }
                    else if (payment.is_upgrade) {
                        metadata = `User with ID ${payment.user_id} upgraded their subscription from plan ID ${payment.metadata['old_subscription']['plan_id']} to plan ID ${subscription.id}.`;
                    }
                    await this.logService.createWithTrx({
                        user_id: payment.user_id,
                        action: client_1.Action.SUBSCRIPTION_PAYMENT,
                        entity: this.model,
                        entity_id: payment.id,
                        metadata: metadata,
                        ip_address: (0, generic_utils_1.getIpAddress)(request),
                        user_agent: (0, generic_utils_1.getUserAgent)(request),
                    }, prisma.log);
                    return { payment, subscription };
                }
                else {
                    await prisma.payment.update({
                        where: { id: payment_id },
                        data: { payment_status: client_1.PaymentStatus.FAILED },
                    });
                    throw new common_1.BadGatewayException('Payment verification failed.');
                }
            });
            if (payment.is_renewal) {
                await this.mailService.subscriptionRenewalEmail(payment.user, {
                    business_name: payment.subscription_plan.business.business_name,
                    subscription: {
                        id: subscription.id,
                        created_at: (0, generic_utils_1.toTimezone)(subscription.created_at, '', 'MMM Do, YYYY'),
                        plan_name: subscription.plan_name_at_subscription,
                        amount: (0, generic_utils_1.formatMoney)(+payment.amount, payment.currency),
                        interval: payment.interval,
                        next_renewal_date: (0, generic_utils_1.toTimezone)(subscription.next_payment_date, '', 'MMM Do, YYYY'),
                        payment_method: payment.payment_method,
                        auto_renew: payment.auto_renew ? 'Enabled' : 'Disabled',
                    },
                });
                await this.mailService.subscriptionRenewalNotificationEmail(payment.subscription_plan.business.business_contacts[0].user, {
                    subscriber_name: payment.user.name,
                    subscription: {
                        id: subscription.id,
                        created_at: (0, generic_utils_1.toTimezone)(subscription.created_at, '', 'MMM Do, YYYY'),
                        plan_name: subscription.plan_name_at_subscription,
                        amount: (0, generic_utils_1.formatMoney)(+payment.amount, payment.currency),
                        interval: payment.interval,
                        end_date: (0, generic_utils_1.toTimezone)(subscription.next_payment_date, '', 'MMM Do, YYYY'),
                        payment_method: payment.payment_method,
                        auto_renew: payment.auto_renew ? 'Enabled' : 'Disabled',
                        payment_status: payment.payment_status,
                    },
                });
            }
            else if (payment.is_upgrade) {
                await this.mailService.subscriptionUpgradeEmail(payment.user, {
                    business_name: payment.subscription_plan.business.business_name,
                    subscription: {
                        id: subscription.id,
                        created_at: (0, generic_utils_1.toTimezone)(subscription.created_at, '', 'MMM Do, YYYY'),
                        old_plan_name: payment.metadata['old_subscription']['plan_name_at_subscription'],
                        old_plan_period: payment.metadata['old_subscription']['billing_interval'],
                        new_plan_name: subscription.plan_name_at_subscription,
                        amount: (0, generic_utils_1.formatMoney)(+payment.amount, payment.currency),
                        interval: payment.interval,
                        next_renewal_date: (0, generic_utils_1.toTimezone)(subscription.next_payment_date, '', 'MMM Do, YYYY'),
                        payment_method: payment.payment_method,
                        auto_renew: payment.auto_renew ? 'Enabled' : 'Disabled',
                    },
                });
                await this.mailService.subscriptionUpgradeNotificationEmail(payment.subscription_plan.business.business_contacts[0].user, {
                    subscriber_name: payment.user.name,
                    subscription: {
                        id: subscription.id,
                        created_at: (0, generic_utils_1.toTimezone)(subscription.created_at, '', 'MMM Do, YYYY'),
                        old_plan_name: payment.metadata['old_subscription']['plan_name_at_subscription'],
                        old_plan_period: payment.metadata['old_subscription']['billing_interval'],
                        new_plan_name: subscription.plan_name_at_subscription,
                        amount: (0, generic_utils_1.formatMoney)(+payment.amount, payment.currency),
                        interval: payment.interval,
                        end_date: (0, generic_utils_1.toTimezone)(subscription.next_payment_date, '', 'MMM Do, YYYY'),
                        payment_method: payment.payment_method,
                        auto_renew: payment.auto_renew ? 'Enabled' : 'Disabled',
                        payment_status: payment.payment_status,
                    },
                });
            }
            else {
                await this.mailService.subscriptionEmail(payment.user, {
                    business_name: payment.subscription_plan.business.business_name,
                    subscription: {
                        id: subscription.id,
                        created_at: (0, generic_utils_1.toTimezone)(subscription.created_at, request?.timezone, 'MMM Do, YYYY'),
                        plan_name: subscription.plan_name_at_subscription,
                        amount: (0, generic_utils_1.formatMoney)(+subscription.plan_price_at_subscription, subscription.currency),
                        interval: subscription.billing_interval,
                        renewal_date: (0, generic_utils_1.toTimezone)(subscription.next_payment_date, request?.timezone, 'MMM Do, YYYY'),
                        payment_method: subscription.payment_method,
                        auto_renew: subscription.auto_renew ? 'Enabled' : 'Disabled',
                    },
                });
                await this.mailService.subscriptionNotificationEmail(payment.subscription_plan.business.business_contacts[0].user, {
                    subscriber_name: payment.user.name,
                    subscription: {
                        id: subscription.id,
                        created_at: (0, generic_utils_1.toTimezone)(subscription.created_at, request?.timezone, 'MMM Do, YYYY'),
                        plan_name: subscription.plan_name_at_subscription,
                        amount: (0, generic_utils_1.formatMoney)(+subscription.plan_price_at_subscription, subscription.currency),
                        interval: subscription.billing_interval,
                        end_date: (0, generic_utils_1.toTimezone)(subscription.next_payment_date, request?.timezone, 'MMM Do, YYYY'),
                        payment_method: subscription.payment_method,
                        auto_renew: subscription.auto_renew ? 'Enabled' : 'Disabled',
                        payment_status: client_1.PaymentStatus.SUCCESS,
                    },
                });
            }
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Payment verified and subscription created successfully.',
            };
        }
        catch (error) {
            (0, generic_utils_1.TransactionError)(error, this.logger);
        }
    }
    async processAutoRenewals() {
        this.logger.log('[AUTO_RENEWAL]: Processing auto-renewals...');
        const batchSize = 10;
        const waitTime = 5000;
        let offset = 0;
        let hasMoreSubscriptions = true;
        try {
            while (hasMoreSubscriptions) {
                const now = new Date();
                const subscriptions = await this.prisma.subscription.findMany({
                    where: {
                        is_active: true,
                        auto_renew: true,
                        AND: [
                            { next_payment_date: { lte: now } },
                            { grace_end_date: { gte: now } },
                        ],
                    },
                    include: {
                        user: true,
                        subscription_plan: {
                            include: {
                                business: { include: { user: true, business_wallet: true } },
                            },
                        },
                    },
                    take: batchSize,
                    skip: offset,
                });
                if (subscriptions.length === 0) {
                    this.logger.log('[AUTO_RENEWAL]: No subscriptions due for renewal.');
                    hasMoreSubscriptions = false;
                }
                for (const subscription of subscriptions) {
                    try {
                        const subscription_plan_price = await this.genericService.find_subscription_plan_price((await this.prisma.subscriptionPlanPrice.findFirst({
                            where: {
                                subscription_plan_id: subscription.plan_id,
                                period: subscription.billing_interval,
                            },
                        })), subscription.currency);
                        const previous_payment_record = await this.prisma.payment.findFirst({
                            where: {
                                user_id: subscription.user_id,
                                purchase_id: subscription.plan_id,
                                purchase_type: client_1.PurchaseType.SUBSCRIPTION,
                            },
                        });
                        if (!subscription_plan_price || !previous_payment_record) {
                            this.logger.warn(`[AUTO_RENEWAL]: Skipping subscription ${subscription.id}: Missing plan price or payment record.`);
                            continue;
                        }
                        const payment = await this.paystackService.chargeAuthorization(subscription.user.email, +subscription_plan_price.price, this.genericService.decrypt(subscription?.charge_auth_code));
                        if (payment.status !== true) {
                            this.logger.error(`[AUTO_RENEWAL]: Failed to charge user ${subscription.user_id} for subscription ${subscription.id}.`);
                            continue;
                        }
                        const new_end_date = (0, generic_utils_1.calculateEndDate)(subscription.billing_interval);
                        await this.prisma.$transaction(async (prisma) => {
                            await prisma.subscription.update({
                                where: { id: subscription.id },
                                data: {
                                    end_date: new_end_date,
                                    next_payment_date: new_end_date,
                                    next_payment_amount: subscription_plan_price.price,
                                },
                            });
                            await prisma.subscriptionPayment.create({
                                data: {
                                    subscription_id: subscription.id,
                                    amount: subscription.next_payment_amount,
                                    currency: subscription.currency,
                                },
                            });
                            const business_wallet = await prisma.businessWallet.findUnique({
                                where: {
                                    business_id_currency: {
                                        business_id: subscription.subscription_plan.business_id,
                                        currency: subscription.currency,
                                    },
                                },
                            });
                            const saved_payment = await prisma.payment.create({
                                data: {
                                    user_id: subscription.user_id,
                                    business_id: subscription.subscription_plan.business_id,
                                    purchase_type: client_1.PurchaseType.SUBSCRIPTION,
                                    purchase_id: subscription.plan_id,
                                    amount: subscription.next_payment_amount,
                                    payment_status: client_1.PaymentStatus.SUCCESS,
                                    payment_method: client_1.PaymentMethod.PAYSTACK,
                                    currency: payment.data.currency,
                                    transaction_id: payment.data.reference,
                                    billing_id: previous_payment_record.billing_id,
                                    billing_at_payment: previous_payment_record.billing_at_payment,
                                    auto_renew: subscription.auto_renew,
                                    interval: subscription.billing_interval,
                                },
                            });
                            await prisma.businessWallet.update({
                                where: {
                                    business_id_currency: {
                                        business_id: subscription.subscription_plan.business_id,
                                        currency: subscription.currency,
                                    },
                                },
                                data: {
                                    balance: {
                                        increment: subscription_plan_price.price,
                                    },
                                    previous_balance: business_wallet.balance,
                                },
                            });
                            await this.logService.createWithTrx({
                                user_id: subscription.user_id,
                                action: client_1.Action.SUBSCRIPTION_PAYMENT,
                                entity: this.model,
                                entity_id: subscription.id,
                                metadata: `Automation: Subscription ${subscription.id} of business ID ${subscription.subscription_plan.business_id} renewed for user ${subscription.user_id}.`,
                            }, prisma.log);
                            await this.mailService.subscriptionRenewalEmail(subscription.user, {
                                business_name: subscription.subscription_plan.business.business_name,
                                subscription: {
                                    id: subscription.id,
                                    created_at: (0, generic_utils_1.toTimezone)(subscription.created_at, '', 'MMM Do, YYYY'),
                                    plan_name: subscription.plan_name_at_subscription,
                                    amount: (0, generic_utils_1.formatMoney)(+subscription_plan_price.price, subscription.currency),
                                    interval: subscription.billing_interval,
                                    next_renewal_date: (0, generic_utils_1.toTimezone)(new_end_date, '', 'MMM Do, YYYY'),
                                    payment_method: saved_payment.payment_method,
                                    auto_renew: saved_payment.auto_renew
                                        ? 'Enabled'
                                        : 'Disabled',
                                },
                            });
                            await this.mailService.subscriptionRenewalNotificationEmail(subscription.subscription_plan.business.user, {
                                subscriber_name: subscription.user.name,
                                subscription: {
                                    id: subscription.id,
                                    created_at: (0, generic_utils_1.toTimezone)(subscription.created_at, '', 'MMM Do, YYYY'),
                                    plan_name: subscription.plan_name_at_subscription,
                                    amount: (0, generic_utils_1.formatMoney)(+subscription_plan_price.price, subscription.currency),
                                    interval: subscription.billing_interval,
                                    end_date: (0, generic_utils_1.toTimezone)(new_end_date, '', 'MMM Do, YYYY'),
                                    payment_method: saved_payment.payment_method,
                                    auto_renew: saved_payment.auto_renew
                                        ? 'Enabled'
                                        : 'Disabled',
                                    payment_status: saved_payment.payment_status,
                                },
                            });
                        });
                        this.logger.log(`[AUTO_RENEWAL]: Subscription ${subscription.id} renewed successfully for user ${subscription.user_id}.`);
                    }
                    catch (error) {
                        await this.mailService.paymentFailure(subscription.user, {
                            subscription: {
                                id: subscription.id,
                                grace_period_days: (0, generic_utils_1.getRemainingDays)(new Date((0, generic_utils_1.toTimezone)(subscription.grace_end_date))),
                                plan_name: subscription.plan_name_at_subscription,
                            },
                        });
                        this.logger.error(`[AUTO_RENEWAL]: Error processing subscription ${subscription.id}: ${error.message}`);
                    }
                }
                offset += batchSize;
                this.logger.log(`[AUTO_RENEWAL]: Waiting ${waitTime / 1000} seconds before fetching the next batch...`);
                await (0, generic_utils_1.sleep)(waitTime);
            }
        }
        catch (error) {
            this.logger.error(`[AUTO_RENEWAL]: Critical error in processAutoRenewals: ${error.message}`);
        }
    }
    async processElapsedGracePeriodSubscriptions() {
        this.logger.log('[ELAPSED_GRACE_PERIOD_SUBSCRIPTIONS]: Processing elapsed grace period subscriptions...');
        const batchSize = 10;
        const waitTime = 5000;
        let offset = 0;
        let hasMoreSubscriptions = true;
        try {
            while (hasMoreSubscriptions) {
                const now = new Date();
                const expired_subscriptions = await this.prisma.subscription.findMany({
                    where: {
                        is_active: true,
                        grace_end_date: { lt: now },
                    },
                    include: {
                        user: true,
                    },
                    take: batchSize,
                    skip: offset,
                });
                if (expired_subscriptions.length === 0) {
                    this.logger.log('[ELAPSED_GRACE_PERIOD_SUBSCRIPTIONS]: No subscriptions has elapsed the grace period yet.');
                    hasMoreSubscriptions = false;
                }
                for (const subscription of expired_subscriptions) {
                    return this.prisma.$transaction(async (prisma) => {
                        await prisma.subscription.update({
                            where: { id: subscription.id },
                            data: { is_active: false },
                        });
                        await this.mailService.subscriptionDeactivated(subscription.user, {
                            subscription: {
                                id: subscription.id,
                                plan_name: subscription.plan_name_at_subscription,
                            },
                        });
                        this.logger.log(`[ELAPSED_GRACE_PERIOD_SUBSCRIPTIONS]: Subscription ${subscription.id} deactivated for user ${subscription.user_id}.`);
                    });
                }
                offset += batchSize;
                this.logger.log(`[ELAPSED_GRACE_PERIOD_SUBSCRIPTIONS]: Waiting ${waitTime / 1000} seconds before fetching the next batch...`);
                await (0, generic_utils_1.sleep)(waitTime);
            }
        }
        catch (error) {
            this.logger.error(`[ELAPSED_GRACE_PERIOD_SUBSCRIPTIONS]: Critical error in processElapsedGracePeriodSubscriptions: ${error.message}`);
        }
    }
    async initiateSubscriptionRenewal(request, renewSubscriptionDto) {
        const { subscription_id } = renewSubscriptionDto;
        return this.prisma.$transaction(async (prisma) => {
            const subscription = await prisma.subscription.findUnique({
                where: { id: subscription_id },
                include: {
                    user: true,
                    subscription_plan: {
                        include: {
                            subscription_plan_prices: true,
                        },
                    },
                },
            });
            if (!subscription) {
                throw new common_1.NotFoundException('Subscription not found.');
            }
            const plan_price = subscription.subscription_plan.subscription_plan_prices.find((price) => price.period === subscription.billing_interval);
            if (!plan_price) {
                throw new common_1.NotFoundException('Subscription plan price not found.');
            }
            const payment = await this.paystackService.initializeTransaction({
                email: subscription.user.email,
                amount: +plan_price.price,
                metadata: {
                    user_id: subscription.user_id,
                    plan_id: subscription.plan_id,
                    plan: subscription.subscription_plan.name,
                    interval: subscription.billing_interval,
                },
            });
            const paymentRecord = await prisma.payment.create({
                data: {
                    user_id: subscription.user_id,
                    purchase_type: client_1.PurchaseType.SUBSCRIPTION,
                    purchase_id: subscription.plan_id,
                    amount: +plan_price.price,
                    payment_status: client_1.PaymentStatus.PENDING,
                    payment_method: client_1.PaymentMethod.PAYSTACK,
                    transaction_id: payment.data.reference,
                    interval: subscription.billing_interval,
                    auto_renew: subscription.auto_renew,
                    is_renewal: true,
                },
            });
            await this.logService.createWithTrx({
                user_id: subscription.user_id,
                action: client_1.Action.SUBSCRIPTION_RENEWAL_INITIATION,
                entity: this.model,
                entity_id: paymentRecord.id,
                metadata: `User with ID ${subscription.user_id} initiated a subscription renewal for subscription ID ${subscription.id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: 200,
                message: 'Subscription renewal initiated successfully.',
                data: {
                    authorization_url: payment.data.authorization_url,
                    payment_id: paymentRecord.id,
                },
            };
        });
    }
    async initiateSubscriptionUpgrade(request, subscriptionId, upgradeSubscriptionDto) {
        const { new_plan_price_id, payment_method } = upgradeSubscriptionDto;
        return this.prisma.$transaction(async (prisma) => {
            const current_subscription = await prisma.subscription.findUnique({
                where: { id: subscriptionId, is_active: true },
                include: {
                    user: true,
                    subscription_plan: {
                        include: {
                            subscription_plan_prices: true,
                            business: { include: { user: true } },
                        },
                    },
                },
            });
            if (!current_subscription) {
                throw new common_1.NotFoundException('Subscription not found.');
            }
            const new_plan_price = await this.subscriptionPlanPriceService.findOne(new_plan_price_id);
            if (!new_plan_price) {
                throw new common_1.NotFoundException('New subscription plan price not found.');
            }
            const prorated_amount = (0, subscription_utils_1.calculateProratedAmount)(current_subscription, new_plan_price);
            const payment = await this.paystackService.initializeTransaction({
                email: current_subscription.user.email,
                amount: +prorated_amount,
                metadata: {
                    user_id: current_subscription.user_id,
                    plan_id: new_plan_price.subscription_plan.id,
                    plan: new_plan_price.subscription_plan.name,
                    interval: new_plan_price.period,
                },
            });
            const payment_record = await prisma.payment.create({
                data: {
                    user_id: current_subscription.user_id,
                    purchase_type: client_1.PurchaseType.SUBSCRIPTION,
                    purchase_id: new_plan_price.subscription_plan.id,
                    amount: +prorated_amount,
                    payment_status: client_1.PaymentStatus.PENDING,
                    payment_method: payment_method || client_1.PaymentMethod.PAYSTACK,
                    transaction_id: payment.data.reference,
                    interval: new_plan_price.period,
                    auto_renew: current_subscription.auto_renew,
                    metadata: {
                        old_subscription: {
                            id: current_subscription.id,
                            plan_name_at_subscription: current_subscription.plan_name_at_subscription,
                            billing_interval: current_subscription.billing_interval,
                            plan_price_at_subscription: current_subscription.plan_price_at_subscription,
                        },
                    },
                    is_upgrade: true,
                },
            });
            await this.logService.createWithTrx({
                user_id: current_subscription.user_id,
                action: client_1.Action.SUBSCRIPTION_UPGRADE_INITIATION,
                entity: this.model,
                entity_id: payment_record.id,
                metadata: `User with ID ${current_subscription.user_id} upgraded their subscription from plan ID ${current_subscription.plan_id} to plan ID ${new_plan_price.subscription_plan.id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: 200,
                message: 'Subscription upgrade initiated successfully.',
                data: {
                    authorization_url: payment.data.authorization_url,
                    payment_id: payment_record.id,
                },
            };
        });
    }
};
exports.SubscriptionService = SubscriptionService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_12_HOURS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubscriptionService.prototype, "processAutoRenewals", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_12_HOURS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubscriptionService.prototype, "processElapsedGracePeriodSubscriptions", null);
exports.SubscriptionService = SubscriptionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        paystack_provider_1.PaystackService,
        price_service_1.SubscriptionPlanPriceService,
        auth_service_1.AuthService,
        billing_service_1.BillingService,
        log_service_1.LogService,
        mail_service_1.MailService,
        common_1.Logger,
        generic_service_1.GenericService,
        config_1.ConfigService])
], SubscriptionService);
//# sourceMappingURL=subscription.service.js.map