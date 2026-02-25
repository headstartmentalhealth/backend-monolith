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
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const paystack_provider_1 = require("../generic/providers/paystack/paystack.provider");
const auth_service_1 = require("../account/auth/auth.service");
const log_service_1 = require("../log/log.service");
const mail_service_1 = require("../notification/mail/mail.service");
const generic_service_1 = require("../generic/generic.service");
const client_1 = require("@prisma/client");
const lodash_1 = require("lodash");
const billing_service_1 = require("../account/billing/billing.service");
const usage_service_1 = require("../coupon/usage/usage.service");
const generic_utils_1 = require("../generic/generic.utils");
const cart_service_1 = require("../cart/cart.service");
const prisma_base_repository_1 = require("../prisma/prisma.base.repository");
const flutterwave_provider_1 = require("../generic/providers/flutterwave/flutterwave.provider");
const flutterwave_utils_1 = require("../generic/providers/flutterwave/flutterwave.utils");
const date_fns_1 = require("date-fns");
const config_1 = require("@nestjs/config");
let PaymentService = class PaymentService {
    constructor(prisma, paystackService, flutterwaveService, authService, logService, mailService, logger, billingService, couponUsageService, cartService, genericService, configService) {
        this.prisma = prisma;
        this.paystackService = paystackService;
        this.flutterwaveService = flutterwaveService;
        this.authService = authService;
        this.logService = logService;
        this.mailService = mailService;
        this.logger = logger;
        this.billingService = billingService;
        this.couponUsageService = couponUsageService;
        this.cartService = cartService;
        this.genericService = genericService;
        this.configService = configService;
        this.model = 'Payment';
        this.paymentRepository = new prisma_base_repository_1.PrismaBaseRepository('payment', prisma);
        this.businessInformationRepository = new prisma_base_repository_1.PrismaBaseRepository('payment', prisma);
    }
    async purchaseByType(user_id, purchase_id, purchase_type, quantity, business_id, currency, prisma, metadata) {
        let details = {};
        if (purchase_type === client_1.ProductType.COURSE ||
            purchase_type === client_1.ProductType.DIGITAL_PRODUCT ||
            purchase_type === client_1.ProductType.PHYSICAL_PRODUCT) {
            let purchase_details = (await prisma.product.findUnique({
                where: {
                    id: purchase_id,
                    type: purchase_type,
                    status: client_1.ProductStatus.PUBLISHED,
                    business_id,
                },
            }));
            if (!purchase_details) {
                throw new common_1.NotFoundException(`${(0, lodash_1.capitalize)(purchase_type)} with ID ${purchase_id} not found.`);
            }
            purchase_details = await this.genericService.find_product(purchase_details, currency);
            details = {
                name: purchase_details.title,
                price: purchase_details.price,
                quantity,
                id: purchase_details.id,
                product_id: purchase_details.id,
                created_at: purchase_details.created_at,
                ...(purchase_type === client_1.ProductType.PHYSICAL_PRODUCT && { metadata }),
            };
        }
        else if (purchase_type === client_1.ProductType.TICKET) {
            let purchase_details = (await prisma.ticketTier.findUnique({
                where: {
                    id: purchase_id,
                    status: client_1.TicketTierStatus.OPEN,
                    ticket: { product: { business_id } },
                },
                include: { ticket: { include: { product: true } } },
            }));
            if (!purchase_details) {
                throw new common_1.NotFoundException(`${(0, lodash_1.capitalize)(purchase_type)} with ID ${purchase_id} not found.`);
            }
            if (purchase_details.max_per_purchase &&
                quantity > purchase_details.max_per_purchase) {
                throw new common_1.UnprocessableEntityException(`Ticket tier quantity provided exceeds the maximum quantity per purchase of ${purchase_details.max_per_purchase}. Try to reduce a little.`);
            }
            purchase_details = await this.genericService.find_ticket_tier_price(purchase_details, currency);
            details = {
                name: purchase_details.ticket.product.title,
                tier_name: (0, lodash_1.capitalize)((0, generic_utils_1.reformatText)(purchase_details.name, '_')),
                price: purchase_details.amount,
                quantity,
                id: purchase_details.id,
                product_id: purchase_details.ticket.product_id,
                created_at: purchase_details.created_at,
            };
        }
        else if (purchase_type === client_1.ProductType.SUBSCRIPTION) {
            let purchase_details = (await prisma.subscriptionPlanPrice.findUnique({
                where: {
                    id: purchase_id,
                    subscription_plan: { business: { id: business_id } },
                },
                include: { subscription_plan: true },
            }));
            if (!purchase_details) {
                throw new common_1.NotFoundException(`${(0, lodash_1.capitalize)(purchase_type)} with ID ${purchase_id} not found.`);
            }
            purchase_details = await this.genericService.find_subscription_plan_price(purchase_details, currency);
            const has_subscribed = await prisma.subscription.findFirst({
                where: {
                    user_id,
                    plan_id: purchase_details.id,
                },
            });
            if (has_subscribed) {
                throw new common_1.ConflictException(`This subscription plan ${purchase_details.subscription_plan.name} has already been subscribed to.`);
            }
            details = {
                name: purchase_details.subscription_plan.name,
                tier_name: (0, lodash_1.capitalize)((0, generic_utils_1.reformatText)(purchase_details.period, '_')),
                price: purchase_details.price,
                quantity,
                id: purchase_details.id,
                product_id: purchase_details.subscription_plan.id,
                created_at: purchase_details.created_at,
                interval: purchase_details.period,
            };
        }
        else {
            throw new common_1.UnprocessableEntityException(`Purchase type ${purchase_type} not recognized.`);
        }
        return { ...details, purchase_type };
    }
    async getTodayEarningsAndPayments(businessId) {
        const now = new Date();
        const todayStart = (0, date_fns_1.startOfDay)(now);
        const todayEnd = (0, date_fns_1.endOfDay)(now);
        const yesterdayStart = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(now, 1));
        const yesterdayEnd = (0, date_fns_1.endOfDay)((0, date_fns_1.subDays)(now, 1));
        const getGroupedPayments = async (start, end) => {
            return this.prisma.payment.groupBy({
                by: ['currency'],
                where: {
                    created_at: { gte: start, lte: end },
                    payment_status: client_1.PaymentStatus.SUCCESS,
                    deleted_at: null,
                    OR: [
                        { purchase_type: client_1.PurchaseType.PRODUCT },
                        { transaction_type: client_1.TransactionType.CREDIT },
                    ],
                    AND: [
                        {
                            OR: [
                                { business_id: businessId },
                                {
                                    purchase: {
                                        path: ['business_id'],
                                        string_contains: businessId,
                                    },
                                },
                                {
                                    subscription_plan: {
                                        business_id: { equals: businessId },
                                    },
                                },
                            ],
                        },
                    ],
                },
                _sum: {
                    final_amount: true,
                    discount_applied: true,
                },
                _count: {
                    id: true,
                },
            });
        };
        const [currencies, todayGrouped, yesterdayGrouped] = await Promise.all([
            this.prisma.businessAccountCurrency.findMany({
                where: { business_id: businessId, deleted_at: null },
                select: { currency: true, currency_sign: true },
                distinct: ['currency'],
            }),
            getGroupedPayments(todayStart, todayEnd),
            getGroupedPayments(yesterdayStart, yesterdayEnd),
        ]);
        const percentageChange = (today, yesterday) => {
            if (!yesterday || yesterday === 0)
                return today > 0 ? 100 : 0;
            return Math.round(((today - yesterday) / yesterday) * 100);
        };
        const byCurrency = currencies.map((c) => {
            const todayStats = todayGrouped.find((p) => p.currency === c.currency);
            const yesterdayStats = yesterdayGrouped.find((p) => p.currency === c.currency);
            const grossAmount = +todayStats?._sum.final_amount || 0;
            const totalDiscount = +todayStats?._sum.discount_applied || 0;
            const netEarnings = grossAmount - totalDiscount;
            const yesterdayGross = +yesterdayStats?._sum.final_amount || 0;
            const yesterdayDiscount = +yesterdayStats?._sum.discount_applied || 0;
            const yesterdayNet = yesterdayGross - yesterdayDiscount;
            return {
                currency: c.currency,
                currency_sign: c.currency_sign || '',
                total_payments: todayStats?._count.id ?? 0,
                gross_amount: (0, generic_utils_1.formatMoney)(grossAmount, c.currency),
                total_discount: (0, generic_utils_1.formatMoney)(totalDiscount, c.currency),
                net_earnings: (0, generic_utils_1.formatMoney)(netEarnings, c.currency),
                performance: {
                    gross_change: percentageChange(grossAmount, yesterdayGross),
                    net_change: percentageChange(netEarnings, yesterdayNet),
                    payments_change: percentageChange(todayStats?._count.id ?? 0, yesterdayStats?._count.id ?? 0),
                },
            };
        });
        const sumTotals = (payments) => payments.reduce((acc, curr) => {
            const gross = +curr._sum.amount || 0;
            const discount = +curr._sum.discount_applied || 0;
            const net = gross - discount;
            return {
                total_payments: acc.total_payments + curr._count.id,
                gross_amount: acc.gross_amount + gross,
                total_discount: acc.total_discount + discount,
                net_earnings: acc.net_earnings + net,
            };
        }, {
            total_payments: 0,
            gross_amount: 0,
            total_discount: 0,
            net_earnings: 0,
        });
        const todayTotals = sumTotals(todayGrouped);
        const yesterdayTotals = sumTotals(yesterdayGrouped);
        const overall = {
            total_payments: todayTotals.total_payments,
            gross_amount: (0, generic_utils_1.formatMoney)(todayTotals.gross_amount),
            total_discount: (0, generic_utils_1.formatMoney)(todayTotals.total_discount),
            net_earnings: (0, generic_utils_1.formatMoney)(todayTotals.net_earnings),
            performance: {
                gross_change: percentageChange(todayTotals.gross_amount, yesterdayTotals.gross_amount),
                net_change: percentageChange(todayTotals.net_earnings, yesterdayTotals.net_earnings),
                payments_change: percentageChange(todayTotals.total_payments, yesterdayTotals.total_payments),
            },
        };
        return {
            date: todayStart.toISOString().split('T')[0],
            by_currency: byCurrency,
            overall,
        };
    }
    computeTotalAmount(purchase_details_list) {
        return purchase_details_list.reduce((total, purchase) => total + purchase.price * purchase.quantity, 0);
    }
    compareAmounts(computed_amount, passed_amount) {
        if (computed_amount !== passed_amount) {
            throw new common_1.UnprocessableEntityException('Amount passed is not equal to the computed amount for the items about to be purchased.');
        }
    }
    async verifyProductAlreadyPurchased(user_id, items, prisma) {
        for (let index = 0; index < items.length; index++) {
            const item = items[index];
            if (item.purchase_type === client_1.ProductType.COURSE) {
                const found = await prisma.enrolledCourse.findUnique({
                    where: { user_id_course_id: { user_id, course_id: item.id } },
                });
                if (found) {
                    throw new common_1.ConflictException(`Product ID ${item.id} of type ${item.purchase_type} has been purchased.`);
                }
            }
            else if (item.purchase_type === client_1.ProductType.TICKET) {
            }
        }
    }
    async createPaystackPayment(request, createPaymentDto) {
        let { email, purchases, payment_method, coupon_code, amount, billing_id, metadata, business_id, currency, } = createPaymentDto;
        return this.prisma.$transaction(async (prisma) => {
            const user = await this.authService.getUserByEmail(prisma.user, email);
            let billing_details = null;
            if (billing_id) {
                billing_details = await this.billingService.findOne(billing_id, user.id);
            }
            const purchase_details_list = await Promise.all(purchases.map(({ purchase_id, purchase_type, quantity, metadata }) => this.purchaseByType(user.id, purchase_id, purchase_type, quantity, business_id, currency, prisma, metadata)));
            let computed_total_amount = this.computeTotalAmount(purchase_details_list);
            let coupon_value = null;
            let coupon_type = null;
            let coupon_id = null;
            if (coupon_code) {
                const coupon_details = await this.couponUsageService.validateCouponUsage({ coupon_code, user_id: user.id }, computed_total_amount);
                computed_total_amount = this.couponUsageService.getDiscountedAmount(computed_total_amount, coupon_details.value, coupon_details.type);
                coupon_value = coupon_details.value;
                coupon_type = coupon_details.type;
                coupon_id = coupon_details.id;
            }
            this.compareAmounts(computed_total_amount, amount);
            const paymentRecord = await prisma.payment.create({
                data: {
                    user_id: user.id,
                    business_id,
                    purchase_type: client_1.PurchaseType.PRODUCT,
                    purchase: {
                        items: purchase_details_list,
                        coupon_id,
                        coupon_code,
                        coupon_value,
                        coupon_type,
                        business_id,
                    },
                    amount: computed_total_amount,
                    discount_applied: this.couponUsageService.getDiscountValue(computed_total_amount, coupon_value, coupon_type),
                    payment_status: client_1.PaymentStatus.PENDING,
                    ...(payment_method
                        ? { payment_method }
                        : { payment_method: client_1.PaymentMethod.PAYSTACK }),
                    ...(billing_details && { billing_id: billing_details.id }),
                    ...(billing_details && { billing_at_payment: billing_details }),
                    metadata,
                },
            });
            const payment = await this.paystackService.initializeTransaction({
                email: user.email,
                amount: computed_total_amount,
                metadata: {
                    user_id: user.id,
                    business_id,
                    purchases,
                    coupon_id,
                    coupon_code,
                    coupon_value,
                    coupon_type,
                },
            });
            await this.logService.createWithTrx({
                user_id: user.id,
                action: client_1.Action.PRODUCT_PAYMENT_INITIATION,
                entity: this.model,
                entity_id: paymentRecord.id,
                metadata: `User with ID ${user.id} just initated a product payment.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: 200,
                message: 'Payment initialized successfully.',
                data: {
                    authorization_url: payment.data.authorization_url,
                    payment_id: payment.data.reference,
                    access: payment.data.access_code,
                },
            };
        });
    }
    async createPayment(request, createPaymentDto) {
        const { email, purchases, payment_method, coupon_code, amount, billing_id, metadata, business_id, currency, } = createPaymentDto;
        const business = await this.prisma.businessInformation.findFirst({
            where: { OR: [{ id: business_id }, { business_slug: business_id }] },
        });
        if (!business)
            throw new common_1.NotFoundException('Business info not found.');
        const user = await this.authService.getUserByEmail(this.prisma.user, email);
        let billing_details = null;
        if (billing_id) {
            billing_details = await this.billingService.findOne(billing_id, user.id);
        }
        const purchase_details_list = await Promise.all(purchases.map(({ purchase_id, purchase_type, quantity, metadata }) => this.purchaseByType(user.id, purchase_id, purchase_type, quantity, business.id, currency, this.prisma, metadata)));
        let computed_total_amount = this.computeTotalAmount(purchase_details_list);
        const gross_amount = computed_total_amount;
        let coupon_value = null;
        let coupon_type = null;
        let coupon_id = null;
        if (coupon_code) {
            const coupon_details = await this.couponUsageService.validateCouponUsage({ coupon_code, user_id: user.id }, computed_total_amount);
            computed_total_amount = this.couponUsageService.getDiscountedAmount(computed_total_amount, coupon_details.value, coupon_details.type);
            coupon_value = coupon_details.value;
            coupon_type = coupon_details.type;
            coupon_id = coupon_details.id;
        }
        this.compareAmounts(computed_total_amount, amount);
        const final_amount_breakdown = this.genericService.finalAmountToBusinessWallet(+computed_total_amount, currency, +coupon_value, business.enable_special_offer);
        const paymentRecord = await this.prisma.$transaction(async (tx) => {
            return tx.payment.create({
                data: {
                    user_id: user.id,
                    business_id: business.id,
                    purchase_type: client_1.PurchaseType.PRODUCT,
                    purchase: {
                        items: purchase_details_list,
                        coupon_id,
                        coupon_code,
                        coupon_value,
                        coupon_type,
                        currency,
                        business_id: business.id,
                    },
                    gross_amount,
                    amount: computed_total_amount,
                    final_amount: final_amount_breakdown.final_amount,
                    fee_amount: final_amount_breakdown.fee_amount,
                    fee_percent: this.configService.get(`DOEXCESS_${currency}_CHARGE`),
                    currency,
                    discount_applied: this.couponUsageService.getDiscountValue(computed_total_amount, coupon_value, coupon_type),
                    payment_status: client_1.PaymentStatus.PENDING,
                    payment_method: payment_method || client_1.PaymentMethod.FLUTTERWAVE,
                    ...(billing_details && { billing_id: billing_details.id }),
                    ...(billing_details && { billing_at_payment: billing_details }),
                    metadata,
                },
            });
        });
        const paymentInit = await this.flutterwaveService.initializePayment({
            email: user.email,
            amount: computed_total_amount,
            tx_ref: paymentRecord.id,
        });
        await this.logService.createLog({
            user_id: user.id,
            action: client_1.Action.PRODUCT_PAYMENT_INITIATION,
            entity: this.model,
            entity_id: paymentRecord.id,
            metadata: `User with ID ${user.id} just initiated a product payment.`,
            ip_address: (0, generic_utils_1.getIpAddress)(request),
            user_agent: (0, generic_utils_1.getUserAgent)(request),
        });
        return {
            statusCode: 200,
            message: 'Payment initialized successfully.',
            data: {
                payment_id: paymentRecord.id,
                authorization_url: paymentInit.data?.link ?? null,
            },
        };
    }
    async cancelPayment(request, payment_id) {
        return this.prisma.$transaction(async (prisma) => {
            const payment = await prisma.payment.findUnique({
                where: { id: payment_id },
            });
            if (!payment) {
                throw new common_1.NotFoundException('Payment record not found.');
            }
            if (payment.payment_status !== client_1.PaymentStatus.PENDING &&
                payment.payment_status !== client_1.PaymentStatus.SUCCESS) {
                throw new common_1.BadRequestException(`Cannot cancel an order with status: ${payment.payment_status}`);
            }
            const updatedPayment = await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    payment_status: client_1.PaymentStatus.CANCELLED,
                },
            });
            const purchase_details = payment
                .purchase;
            if (purchase_details?.coupon_id) {
                await this.couponUsageService.rollbackCouponUsage(purchase_details.coupon_id, payment.user_id, prisma);
            }
            await this.logService.createWithTrx({
                user_id: payment.user_id,
                action: client_1.Action.PRODUCT_PAYMENT_CANCELLATION,
                entity: this.model,
                entity_id: payment.id,
                metadata: `User with ID ${payment.user_id} cancelled payment ${payment.id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: 200,
                message: 'Payment cancelled successfully.',
                data: {
                    payment_id: updatedPayment.id,
                    status: updatedPayment.payment_status,
                },
            };
        });
    }
    formatEachPrice(items, currency) {
        return items.map((item) => ({
            ...item,
            price: (0, generic_utils_1.formatMoney)(+item.price, currency),
        }));
    }
    async createPurchaseRecord(prisma, args) {
        const { purchase, payment, verification, payment_method } = args;
        let actual_total = 0;
        for (const item of purchase['items']) {
            const { id, purchase_type, price, quantity, product_id, interval, auto_renew, } = item;
            actual_total += price * quantity;
            if (purchase_type === client_1.ProductType.COURSE) {
                const existingEnrollment = await prisma.enrolledCourse.findUnique({
                    where: {
                        user_id_course_id: {
                            user_id: payment.user_id,
                            course_id: id,
                        },
                    },
                });
                if (existingEnrollment)
                    continue;
                const total_module_contents = await prisma.moduleContent.count({
                    where: { module: { course_id: id } },
                });
                await prisma.enrolledCourse.create({
                    data: {
                        user_id: payment.user_id,
                        course_id: item.id,
                        status: client_1.EnrollmentStatus.ACTIVE,
                        progress: 0,
                        completed_lessons: 0,
                        total_lessons: total_module_contents,
                        payment_id: payment.id,
                        amount: price,
                        currency: payment.currency,
                        quantity,
                    },
                    include: {
                        course: {
                            include: {
                                business_info: { include: { business_wallet: true } },
                            },
                        },
                    },
                });
            }
            else if (purchase_type === client_1.ProductType.TICKET) {
                const purchasedTicket = await prisma.purchasedTicket.findUnique({
                    where: {
                        user_id_ticket_tier_id: {
                            user_id: payment.user_id,
                            ticket_tier_id: item.id,
                        },
                    },
                });
                if (purchasedTicket)
                    continue;
                const ticket_tier = await prisma.ticketTier.update({
                    where: { id: item.id },
                    data: { remaining_quantity: { decrement: item.quantity } },
                });
                await prisma.purchasedTicket.create({
                    data: {
                        user_id: payment.user_id,
                        ticket_id: ticket_tier.ticket_id,
                        ticket_tier_id: item.id,
                        payment_id: payment.id,
                        quantity,
                        amount: price,
                        currency: payment.currency,
                    },
                });
            }
            else if (purchase_type === client_1.ProductType.SUBSCRIPTION) {
                const subscription_plan_price = await prisma.subscriptionPlanPrice.findFirst({
                    where: {
                        id,
                    },
                    include: { subscription_plan: { include: { product: true } } },
                });
                let next_payment_days_from_now = null;
                const existing_active_subscription = await prisma.subscription.findFirst({
                    where: {
                        user_id: payment.user_id,
                        plan_id: product_id,
                        billing_interval: interval,
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
                let end_date = (0, generic_utils_1.calculateEndDate)(interval);
                if (next_payment_days_from_now) {
                    end_date = (0, generic_utils_1.getEndDateFromDays)(end_date, next_payment_days_from_now);
                }
                const subscription = await prisma.subscription.create({
                    data: {
                        user: { connect: { id: payment.user_id } },
                        subscription_plan: {
                            connect: {
                                id: subscription_plan_price.subscription_plan_id,
                            },
                        },
                        plan_name_at_subscription: subscription_plan_price.subscription_plan.name,
                        plan_price_at_subscription: subscription_plan_price.price,
                        start_date: new Date(),
                        end_date: end_date,
                        grace_end_date: (0, generic_utils_1.addGracePeriod)(end_date),
                        is_active: true,
                        payment_method: payment_method,
                        billing_interval: interval,
                        next_payment_date: end_date,
                        next_payment_amount: price,
                        auto_renew: auto_renew,
                        ...(verification?.data?.authorization?.authorization_code && {
                            charge_auth_code: this.genericService.encrypt(verification?.data?.authorization?.authorization_code),
                        }),
                        business_info: {
                            connect: {
                                id: subscription_plan_price.subscription_plan.business_id,
                            },
                        },
                    },
                });
                await prisma.subscriptionPayment.create({
                    data: {
                        subscription_id: subscription.id,
                        amount: price,
                        currency: subscription.currency,
                        payment_id: payment.id,
                    },
                });
                let group_chat = await prisma.chatGroup.findFirst({
                    where: { subscription_plan_id: subscription.plan_id },
                });
                if (!group_chat) {
                    group_chat = await prisma.chatGroup.create({
                        data: {
                            name: `${subscription.plan_name_at_subscription} Group`,
                            description: subscription_plan_price.subscription_plan.description,
                            multimedia_id: subscription_plan_price.subscription_plan.product.multimedia_id,
                            auto_created: true,
                            subscription_plan_id: subscription.plan_id,
                        },
                    });
                }
                const group_member = await prisma.chatGroupMember.findFirst({
                    where: {
                        group_id: group_chat.id,
                        member_id: payment.user_id,
                    },
                });
                if (!group_member) {
                    await prisma.chatGroupMember.create({
                        data: {
                            member_id: payment.user_id,
                            group_id: group_chat.id,
                        },
                    });
                }
            }
            else if (purchase_type === client_1.ProductType.DIGITAL_PRODUCT) {
                const existingDigitalProduct = await prisma.purchasedDigitalProduct.findUnique({
                    where: {
                        user_id_product_id: {
                            user_id: payment.user_id,
                            product_id: id,
                        },
                    },
                });
                if (existingDigitalProduct)
                    continue;
                await prisma.purchasedDigitalProduct.create({
                    data: {
                        user_id: payment.user_id,
                        product_id: item.id,
                        quantity: item.quantity,
                        payment_id: payment.id,
                        amount: price,
                        currency: payment.currency,
                    },
                    include: {
                        product: {
                            include: {
                                business_info: { include: { business_wallet: true } },
                            },
                        },
                    },
                });
            }
        }
        return { actual_total };
    }
    async verifyPaystackPayment(request, verifyPaymentDto) {
        const { payment_id } = verifyPaymentDto;
        try {
            const { payment, business_name, business_owner, actual_total } = await this.prisma.$transaction(async (prisma) => {
                const payment = await prisma.payment.findUnique({
                    where: { id: payment_id },
                    include: {
                        user: true,
                    },
                });
                if (!payment) {
                    throw new common_1.NotFoundException('Payment record not found.');
                }
                if (payment.payment_status === client_1.PaymentStatus.SUCCESS) {
                    throw new common_1.ConflictException(`Payment has already been verified.`);
                }
                const verification = await this.paystackService.verifyTransaction(payment_id);
                if (verification.data.status !== 'success') {
                    await prisma.payment.update({
                        where: { id: payment_id },
                        data: { payment_status: client_1.PaymentStatus.FAILED },
                    });
                    throw new common_1.BadGatewayException('Payment verification failed.');
                }
                await prisma.payment.update({
                    where: { id: payment_id },
                    data: { payment_status: client_1.PaymentStatus.SUCCESS },
                });
                const purchase = payment.purchase || [];
                if (!Object.values(purchase).length) {
                    throw new common_1.BadRequestException('No purchases found.');
                }
                const products = [];
                const { actual_total } = await this.createPurchaseRecord(prisma, {
                    purchase,
                    payment,
                    verification,
                    payment_method: client_1.PaymentMethod.PAYSTACK,
                });
                if (purchase['coupon_value']) {
                    await this.couponUsageService.createWithTrx({
                        coupon_id: purchase.coupon_id,
                        user_id: payment.user_id,
                        discount_applied: payment.discount_applied,
                    }, prisma.couponUsage);
                }
                const business_wallet = await prisma.businessWallet.findUnique({
                    where: {
                        business_id_currency: {
                            business_id: purchase['business_id'],
                            currency: payment.currency,
                        },
                    },
                    include: { business: { include: { user: true } } },
                });
                await prisma.businessWallet.update({
                    where: {
                        business_id_currency: {
                            business_id: purchase['business_id'],
                            currency: payment.currency,
                        },
                    },
                    data: {
                        balance: {
                            increment: +payment.amount,
                        },
                        previous_balance: business_wallet.balance,
                    },
                });
                await this.cartService.removeItemsFromCart({
                    user_id: payment.user_id,
                    product_ids: purchase['items'].map((item) => item.id),
                }, prisma);
                await this.logService.createWithTrx({
                    user_id: payment.user_id,
                    action: client_1.Action.PRODUCT_PAYMENT_CONFIRMATION,
                    entity: this.model,
                    entity_id: payment.id,
                    metadata: `User with ID ${payment.user_id} completed payment for product(s) under business ID ${purchase['business_id']}.`,
                    ip_address: (0, generic_utils_1.getIpAddress)(request),
                    user_agent: (0, generic_utils_1.getUserAgent)(request),
                }, prisma.log);
                return {
                    payment,
                    business_name: business_wallet.business.business_name,
                    business_owner: business_wallet.business.user,
                    actual_total,
                };
            });
            const formatted_items = this.formatEachPrice(payment.purchase.items, payment.currency);
            await this.mailService.purchaseConfirmation(payment.user, {
                business_name,
                gateway: (0, lodash_1.capitalize)(payment.payment_method),
                payment_status: (0, lodash_1.capitalize)(client_1.PaymentStatus.SUCCESS),
                currency: payment.currency,
                total: (0, generic_utils_1.formatMoney)(+payment.amount, payment.currency),
                discount_applied: payment.purchase
                    .coupon_value
                    ? (0, generic_utils_1.formatMoney)(+payment.discount_applied, payment.currency)
                    : '',
                sub_total: (0, generic_utils_1.formatMoney)(+actual_total, payment.currency),
                items: formatted_items,
                payment_date: (0, generic_utils_1.toTimezone)(payment.created_at, '', 'MMM Do, YYYY'),
                payment_id: payment.id,
            });
            await this.mailService.purchaseConfirmationNotificationEmail(business_owner, {
                buyer_name: payment.user.name,
                gateway: (0, lodash_1.capitalize)(payment.payment_method),
                payment_status: (0, lodash_1.capitalize)(client_1.PaymentStatus.SUCCESS),
                currency: payment.currency,
                total: (0, generic_utils_1.formatMoney)(+payment.amount, payment.currency),
                discount_applied: payment.purchase
                    .coupon_value
                    ? (0, generic_utils_1.formatMoney)(+payment.discount_applied, payment.currency)
                    : '',
                sub_total: (0, generic_utils_1.formatMoney)(+actual_total, payment.currency),
                items: formatted_items,
                payment_date: (0, generic_utils_1.toTimezone)(payment.created_at, '', 'MMM Do, YYYY'),
                payment_id: payment.id,
            });
            return {
                statusCode: common_1.HttpStatus.OK,
                message: `Payment verified successfully.`,
            };
        }
        catch (error) {
            (0, generic_utils_1.TransactionError)(error, this.logger);
        }
    }
    async verifyFlwPayment(request, verifyPaymentDto) {
        const { payment_id } = verifyPaymentDto;
        try {
            const verification = await this.flutterwaveService.verifyPayment(payment_id);
            const { payment, business_name, business_owner, actual_total } = await this.prisma.$transaction(async (prisma) => {
                if (verification.status !== flutterwave_utils_1.FlutterwaveStatus.SUCCESS) {
                    await prisma.payment.update({
                        where: { id: payment_id },
                        data: { payment_status: client_1.PaymentStatus.FAILED },
                    });
                    throw new common_1.BadGatewayException('Payment verification failed.');
                }
                const payment = await prisma.payment.findUnique({
                    where: { id: verification.data.tx_ref },
                    include: {
                        user: {
                            include: { profile: { select: { profile_picture: true } } },
                        },
                    },
                });
                if (!payment) {
                    throw new common_1.NotFoundException('Payment record not found.');
                }
                if (payment.payment_status === client_1.PaymentStatus.SUCCESS) {
                    throw new common_1.ConflictException(`Payment has already been verified.`);
                }
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        payment_status: client_1.PaymentStatus.SUCCESS,
                    },
                });
                const purchase = payment.purchase || [];
                if (!Object.values(purchase).length) {
                    throw new common_1.BadRequestException('No purchases found.');
                }
                const products = [];
                const { actual_total } = await this.createPurchaseRecord(prisma, {
                    purchase,
                    payment,
                    verification: verification.data,
                });
                if (purchase['coupon_value']) {
                    await this.couponUsageService.createWithTrx({
                        coupon_id: purchase.coupon_id,
                        user_id: payment.user_id,
                        discount_applied: payment.discount_applied,
                    }, prisma.couponUsage);
                }
                const business_wallet = await prisma.businessWallet.findUnique({
                    where: {
                        business_id_currency: {
                            business_id: purchase['business_id'],
                            currency: payment.currency,
                        },
                    },
                    include: { business: { include: { user: true } } },
                });
                await prisma.businessWallet.update({
                    where: {
                        business_id_currency: {
                            business_id: purchase['business_id'],
                            currency: payment.currency,
                        },
                    },
                    data: {
                        balance: {
                            increment: +payment.final_amount,
                        },
                        previous_balance: business_wallet.balance,
                    },
                });
                await prisma.notification.create({
                    data: {
                        title: 'New Payment Received',
                        message: `You’ve received a new payment of ${(0, generic_utils_1.formatMoney)(+payment.final_amount, payment.currency)} from ${payment.user.name} for recent purchase(s).`,
                        icon_url: payment.user?.profile?.profile_picture,
                        business_id: purchase['business_id'],
                        type: client_1.NotificationType.PUSH,
                    },
                });
                await this.cartService.removeItemsFromCart({
                    user_id: payment.user_id,
                    product_ids: purchase['items'].map((item) => item.id),
                }, prisma);
                await this.logService.createWithTrx({
                    user_id: payment.user_id,
                    action: client_1.Action.PRODUCT_PAYMENT_CONFIRMATION,
                    entity: this.model,
                    entity_id: payment.id,
                    metadata: `User ${payment.user_id} completed payment for product(s) under business ${purchase['business_id']}. Gross: ${payment.gross_amount}, Discount: ${payment.discount_applied}, Net: ${payment.amount}`,
                    ip_address: (0, generic_utils_1.getIpAddress)(request),
                    user_agent: (0, generic_utils_1.getUserAgent)(request),
                }, prisma.log);
                return {
                    payment,
                    business_name: business_wallet.business.business_name,
                    business_owner: business_wallet.business.user,
                    actual_total,
                };
            });
            const formatted_items = this.formatEachPrice(payment.purchase.items, payment.currency);
            await this.mailService.purchaseConfirmation(payment.user, {
                business_name,
                gateway: (0, lodash_1.capitalize)(payment.payment_method),
                payment_status: (0, lodash_1.capitalize)(client_1.PaymentStatus.SUCCESS),
                currency: payment.currency,
                total: (0, generic_utils_1.formatMoney)(+payment.amount, payment.currency),
                discount_applied: payment.purchase
                    .coupon_value
                    ? (0, generic_utils_1.formatMoney)(+payment.discount_applied, payment.currency)
                    : '',
                sub_total: (0, generic_utils_1.formatMoney)(+actual_total, payment.currency),
                items: formatted_items,
                payment_date: (0, generic_utils_1.toTimezone)(payment.created_at, '', 'MMM Do, YYYY'),
                payment_id: payment.id,
            });
            await this.mailService.purchaseConfirmationNotificationEmail(business_owner, {
                buyer_name: payment.user.name,
                gateway: (0, lodash_1.capitalize)(payment.payment_method),
                payment_status: (0, lodash_1.capitalize)(client_1.PaymentStatus.SUCCESS),
                currency: payment.currency,
                total: (0, generic_utils_1.formatMoney)(+payment.amount, payment.currency),
                discount_applied: payment.purchase
                    .coupon_value
                    ? (0, generic_utils_1.formatMoney)(+payment.discount_applied, payment.currency)
                    : '',
                sub_total: (0, generic_utils_1.formatMoney)(+actual_total, payment.currency),
                items: formatted_items,
                payment_date: (0, generic_utils_1.toTimezone)(payment.created_at, '', 'MMM Do, YYYY'),
                payment_id: payment.id,
            });
            return {
                statusCode: common_1.HttpStatus.OK,
                message: `Payment verified successfully.`,
            };
        }
        catch (error) {
            (0, generic_utils_1.TransactionError)(error, this.logger);
        }
    }
    async verifyPayment(request, verifyPaymentDto) {
        const { payment_id } = verifyPaymentDto;
        try {
            const verification = await this.paystackService.verifyTransaction(payment_id);
            const { payment, business_name, business_owner, actual_total } = await this.prisma.$transaction(async (prisma) => {
                if (verification.data.status !== 'success') {
                    await prisma.payment.update({
                        where: { id: payment_id },
                        data: { payment_status: client_1.PaymentStatus.FAILED },
                    });
                    throw new common_1.BadGatewayException('Payment verification failed.');
                }
                const payment = await prisma.payment.findUnique({
                    where: { id: verification.data.reference },
                    include: {
                        user: {
                            include: { profile: { select: { profile_picture: true } } },
                        },
                    },
                });
                if (!payment) {
                    throw new common_1.NotFoundException('Payment record not found.');
                }
                if (payment.payment_status === client_1.PaymentStatus.SUCCESS) {
                    throw new common_1.ConflictException(`Payment has already been verified.`);
                }
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        payment_status: client_1.PaymentStatus.SUCCESS,
                    },
                });
                const purchase = payment.purchase || [];
                if (!Object.values(purchase).length) {
                    throw new common_1.BadRequestException('No purchases found.');
                }
                const products = [];
                const { actual_total } = await this.createPurchaseRecord(prisma, {
                    purchase,
                    payment,
                    verification: verification.data,
                    payment_method: client_1.PaymentMethod.PAYSTACK,
                });
                if (purchase['coupon_value']) {
                    await this.couponUsageService.createWithTrx({
                        coupon_id: purchase.coupon_id,
                        user_id: payment.user_id,
                        discount_applied: payment.discount_applied,
                    }, prisma.couponUsage);
                }
                const business_wallet = await prisma.businessWallet.findUnique({
                    where: {
                        business_id_currency: {
                            business_id: purchase['business_id'],
                            currency: payment.currency,
                        },
                    },
                    include: { business: { include: { user: true } } },
                });
                await prisma.businessWallet.update({
                    where: {
                        business_id_currency: {
                            business_id: purchase['business_id'],
                            currency: payment.currency,
                        },
                    },
                    data: {
                        balance: {
                            increment: +payment.final_amount,
                        },
                        previous_balance: business_wallet.balance,
                    },
                });
                await prisma.notification.create({
                    data: {
                        title: 'New Payment Received',
                        message: `You’ve received a new payment of ${(0, generic_utils_1.formatMoney)(+payment.final_amount, payment.currency)} from ${payment.user.name} for recent purchase(s).`,
                        icon_url: payment.user?.profile?.profile_picture,
                        business_id: purchase['business_id'],
                        type: client_1.NotificationType.PUSH,
                    },
                });
                await this.cartService.removeItemsFromCart({
                    user_id: payment.user_id,
                    product_ids: purchase['items'].map((item) => item.id),
                }, prisma);
                await this.logService.createWithTrx({
                    user_id: payment.user_id,
                    action: client_1.Action.PRODUCT_PAYMENT_CONFIRMATION,
                    entity: this.model,
                    entity_id: payment.id,
                    metadata: `User ${payment.user_id} completed payment for product(s) under business ${purchase['business_id']}. Gross: ${payment.gross_amount}, Discount: ${payment.discount_applied}, Net: ${payment.amount}`,
                    ip_address: (0, generic_utils_1.getIpAddress)(request),
                    user_agent: (0, generic_utils_1.getUserAgent)(request),
                }, prisma.log);
                return {
                    payment,
                    business_name: business_wallet.business.business_name,
                    business_owner: business_wallet.business.user,
                    actual_total,
                };
            });
            const formatted_items = this.formatEachPrice(payment.purchase.items, payment.currency);
            await this.mailService.purchaseConfirmation(payment.user, {
                business_name,
                gateway: (0, lodash_1.capitalize)(payment.payment_method),
                payment_status: (0, lodash_1.capitalize)(client_1.PaymentStatus.SUCCESS),
                currency: payment.currency,
                total: (0, generic_utils_1.formatMoney)(+payment.amount, payment.currency),
                discount_applied: payment.purchase
                    .coupon_value
                    ? (0, generic_utils_1.formatMoney)(+payment.discount_applied, payment.currency)
                    : '',
                sub_total: (0, generic_utils_1.formatMoney)(+actual_total, payment.currency),
                items: formatted_items,
                payment_date: (0, generic_utils_1.toTimezone)(payment.created_at, '', 'MMM Do, YYYY'),
                payment_id: payment.id,
            });
            await this.mailService.purchaseConfirmationNotificationEmail(business_owner, {
                buyer_name: payment.user.name,
                gateway: (0, lodash_1.capitalize)(payment.payment_method),
                payment_status: (0, lodash_1.capitalize)(client_1.PaymentStatus.SUCCESS),
                currency: payment.currency,
                total: (0, generic_utils_1.formatMoney)(+payment.amount, payment.currency),
                discount_applied: payment.purchase
                    .coupon_value
                    ? (0, generic_utils_1.formatMoney)(+payment.discount_applied, payment.currency)
                    : '',
                sub_total: (0, generic_utils_1.formatMoney)(+actual_total, payment.currency),
                items: formatted_items,
                payment_date: (0, generic_utils_1.toTimezone)(payment.created_at, '', 'MMM Do, YYYY'),
                payment_id: payment.id,
            });
            return {
                statusCode: common_1.HttpStatus.OK,
                message: `Payment verified successfully.`,
            };
        }
        catch (error) {
            (0, generic_utils_1.TransactionError)(error, this.logger);
        }
    }
    async fetchPayments(request, filterPaymentDto) {
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterPaymentDto);
        const filters = {
            ...(filterPaymentDto.payment_status && {
                payment_status: filterPaymentDto.payment_status,
            }),
            ...(filterPaymentDto.business_id && {
                OR: (0, generic_utils_1.businessIdFilter)(filterPaymentDto.business_id),
            }),
            ...(filterPaymentDto.q && {
                OR: [
                    {
                        id: { contains: filterPaymentDto.q, mode: 'insensitive' },
                    },
                ],
            }),
            ...pagination_filters.filters,
            tz: request.timezone,
        };
        const include = {
            user: true,
            subscription_plan: true,
            billing_info: true,
            refunds: true,
            payment_gateway_logs: true,
        };
        const [payments, total] = await Promise.all([
            this.paymentRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, include, undefined),
            this.paymentRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: payments,
            count: total,
        };
    }
    async fetchPaymentsForBusiness(request, filterPaymentDto) {
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterPaymentDto);
        const filters = {
            ...(filterPaymentDto.payment_status && {
                payment_status: filterPaymentDto.payment_status,
            }),
            ...(request['Business-Id'] && {
                OR: [
                    {
                        business_id: request['Business-Id'],
                    },
                    {
                        purchase: {
                            path: ['business_id'],
                            equals: request['Business-Id'],
                        },
                    },
                    {
                        subscription_plan: {
                            business_id: { equals: request['Business-Id'] },
                        },
                    },
                ],
            }),
            ...(filterPaymentDto.q && {
                OR: [
                    {
                        id: { contains: filterPaymentDto.q, mode: 'insensitive' },
                    },
                ],
            }),
            ...pagination_filters.filters,
            tz: request.timezone,
        };
        const credit_filters = {
            payment_status: client_1.PaymentStatus.SUCCESS,
            OR: [
                {
                    purchase: {
                        path: ['business_id'],
                        equals: request['Business-Id'],
                    },
                },
                {
                    subscription_plan: {
                        business_id: { equals: request['Business-Id'] },
                    },
                },
            ],
        };
        const debit_filters = {
            payment_status: client_1.PaymentStatus.SUCCESS,
            transaction_type: client_1.TransactionType.WITHDRAWAL,
        };
        const total_filters = {
            payment_status: client_1.PaymentStatus.SUCCESS,
            OR: [
                {
                    purchase: {
                        path: ['business_id'],
                        equals: request['Business-Id'],
                    },
                },
                {
                    subscription_plan: {
                        business_id: { equals: request['Business-Id'] },
                    },
                },
            ],
        };
        const include = {
            user: { include: { profile: true } },
            subscription_plan: true,
            billing_info: true,
            refunds: true,
            payment_gateway_logs: true,
            business_info: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            profile: { select: { profile_picture: true } },
                        },
                    },
                },
            },
        };
        const [payments, total, details, total_credit, total_debit, total_trx] = await Promise.all([
            this.paymentRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, include, undefined),
            this.paymentRepository.count(filters),
            this.getTodayEarningsAndPayments(request['Business-Id']),
            this.paymentRepository.sum('amount', credit_filters),
            this.paymentRepository.sum('amount', debit_filters),
            this.paymentRepository.sum('amount', total_filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: payments,
            count: total,
            total_credit,
            total_debit,
            total_trx,
            details,
        };
    }
    async fetchPaymentByIDForBusiness(request, idDto) {
        const { id } = idDto;
        const filters = {
            id,
            OR: [
                {
                    purchase: {
                        path: ['business_id'],
                        equals: request['Business-Id'],
                    },
                },
                {
                    subscription_plan: {
                        business_id: { equals: request['Business-Id'] },
                    },
                },
            ],
            tz: request.timezone,
        };
        const include = {
            user: { include: { profile: true } },
            subscription_plan: true,
            billing_info: true,
            refunds: true,
            payment_gateway_logs: true,
        };
        const payment = await this.paymentRepository.findOne(filters, include, undefined);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: payment,
        };
    }
    async fetchDistinctCustomerPayments(request, filterPaymentDto) {
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterPaymentDto);
        const filters = {
            AND: [
                ...(filterPaymentDto.payment_status
                    ? [{ payment_status: filterPaymentDto.payment_status }]
                    : []),
                ...(filterPaymentDto.business_id
                    ? [
                        {
                            OR: [
                                {
                                    subscription_plan: {
                                        business_id: filterPaymentDto.business_id,
                                    },
                                },
                                {
                                    purchase: {
                                        path: ['business_id'],
                                        equals: filterPaymentDto.business_id,
                                    },
                                },
                            ],
                        },
                    ]
                    : []),
                ...(filterPaymentDto.purchase_type
                    ? [
                        {
                            OR: [
                                { purchase_type: filterPaymentDto.purchase_type },
                                {
                                    purchase: {
                                        path: ['purchase_type'],
                                        equals: filterPaymentDto.purchase_type,
                                    },
                                },
                            ],
                        },
                    ]
                    : []),
                ...(filterPaymentDto.q
                    ? [{ id: { contains: filterPaymentDto.q, mode: 'insensitive' } }]
                    : []),
                ...(Array.isArray(pagination_filters.filters)
                    ? pagination_filters.filters
                    : [pagination_filters.filters].filter(Boolean)),
            ].filter(Boolean),
            tz: request.timezone,
        };
        const include = {
            user: true,
            subscription_plan: true,
            billing_info: true,
            refunds: true,
            payment_gateway_logs: true,
        };
        const [customer_payments, total] = await Promise.all([
            this.paymentRepository.findManyDistinctWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, include, undefined, ['user_id']),
            this.paymentRepository.countDistinct(filters, ['user_id']),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: customer_payments,
            count: total,
        };
    }
    async initiateWithdrawal(request, initiateWithdrawalDto) {
        try {
            const { sub: user_id } = request.user;
            const { amount, currency } = initiateWithdrawalDto;
            await this.prisma.$transaction(async (prisma) => {
                const wallet = await prisma.businessWallet.findUnique({
                    where: {
                        business_id_currency: {
                            business_id: request['business_id'],
                            currency: 'NGN',
                        },
                    },
                    include: {
                        business: { include: { withdrawal_account: true } },
                    },
                });
                if (!wallet) {
                    throw new Error('Business wallet not found.');
                }
                if (Number(wallet.balance) < Number(amount)) {
                    throw new Error('Insufficient wallet balance.');
                }
                const new_balance = Number(wallet.balance) - Number(amount);
                await this.paystackService.initiateTransfer({
                    amount,
                    recipient_code: this.genericService.decrypt(wallet.business.withdrawal_account.recipient_code),
                    reason: 'Withdrawal',
                });
                await prisma.businessWallet.update({
                    where: {
                        business_id_currency: {
                            business_id: request['business_id'],
                            currency,
                        },
                    },
                    data: {
                        previous_balance: wallet.balance,
                        balance: new_balance,
                    },
                });
                const payment = await prisma.payment.create({
                    data: {
                        user_id,
                        business_id: request['business_id'] || request['Business-Id'],
                        amount: amount,
                        payment_status: client_1.PaymentStatus.PENDING,
                        transaction_type: client_1.TransactionType.WITHDRAWAL,
                        payment_method: client_1.PaymentMethod.PAYSTACK,
                        currency: wallet.currency,
                        metadata: {
                            reason: 'Business initiated withdrawal',
                            business_id: request['Business-Id'],
                        },
                    },
                    select: {
                        id: true,
                        user_id: true,
                        amount: true,
                        currency: true,
                        payment_status: true,
                        transaction_type: true,
                        payment_method: true,
                        metadata: true,
                        created_at: true,
                    },
                });
                await this.logService.createWithTrx({
                    user_id: null,
                    action: client_1.Action.BUSINESS_WITHDRAWAL,
                    entity: this.model,
                    entity_id: payment.id,
                    metadata: `User ID ${user_id} from Business with ID ${request['Business-Id']} withdrew ₦${amount}.`,
                    ip_address: (0, generic_utils_1.getIpAddress)(request),
                    user_agent: (0, generic_utils_1.getUserAgent)(request),
                }, prisma.log);
                return { payment };
            });
            return {
                statusCode: 200,
                message: 'Withdrawal initiated successfully.',
            };
        }
        catch (error) {
            (0, generic_utils_1.TransactionError)(error, this.logger);
        }
    }
    async fetchClientPayments(request, filterPaymentDto) {
        const { sub: user_id } = request.user;
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterPaymentDto);
        const filters = {
            user_id,
            ...(filterPaymentDto.payment_status && {
                payment_status: filterPaymentDto.payment_status,
            }),
            ...(filterPaymentDto.purchase_type && {
                purchase_type: filterPaymentDto.purchase_type,
            }),
            ...(filterPaymentDto.q && {
                OR: [
                    { id: { contains: filterPaymentDto.q, mode: 'insensitive' } },
                    {
                        transaction_id: {
                            contains: filterPaymentDto.q,
                            mode: 'insensitive',
                        },
                    },
                ],
            }),
            ...pagination_filters.filters,
            tz: request.timezone,
        };
        const include = {
            billing_info: true,
            refunds: true,
        };
        const [payments, total] = await Promise.all([
            this.paymentRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, include),
            this.paymentRepository.count(filters),
        ]);
        const enhancedPayments = await Promise.all(payments.map(async (payment) => {
            let purchases = null;
            if (payment.purchase) {
                try {
                    purchases =
                        payment.purchase;
                    const enrichedItems = await Promise.all(purchases.items.map(async (item) => {
                        if (item.purchase_type === client_1.ProductType.DIGITAL_PRODUCT) {
                            const details = await this.prisma.purchasedDigitalProduct.findFirst({
                                where: {
                                    user_id,
                                    product_id: item.product_id,
                                    quantity: item.quantity,
                                    payment_id: purchases.payment_id,
                                },
                                include: {
                                    product: {
                                        select: {
                                            multimedia: true,
                                            zip_file: true,
                                            title: true,
                                            description: true,
                                        },
                                    },
                                },
                            });
                            return {
                                ...item,
                                details,
                            };
                        }
                        if (item.purchase_type === client_1.ProductType.SUBSCRIPTION) {
                            const plan = await this.prisma.subscription.findFirst({
                                where: { user_id, plan_id: item.product_id },
                                include: {
                                    subscription_plan: true,
                                },
                            });
                            return {
                                ...item,
                                details: plan,
                            };
                        }
                        if (item.purchase_type === client_1.ProductType.COURSE) {
                            const course = await this.prisma.enrolledCourse.findFirst({
                                where: {
                                    user_id,
                                    course_id: item.product_id,
                                    quantity: item.quantity,
                                },
                            });
                            return {
                                ...item,
                                details: course,
                            };
                        }
                        if (item.purchase_type === client_1.ProductType.TICKET) {
                            const purchased_ticket = await this.prisma.purchasedTicket.findFirst({
                                where: {
                                    user_id,
                                    ticket_tier_id: item.id,
                                    quantity: item.quantity,
                                },
                            });
                            return {
                                ...item,
                                details: purchased_ticket,
                            };
                        }
                        return item;
                    }));
                    const business_info = await this.prisma.businessInformation.findFirst({
                        where: { id: purchases.business_id },
                        select: {
                            id: true,
                            business_name: true,
                            business_description: true,
                            business_size: true,
                            business_slug: true,
                        },
                    });
                    return {
                        ...payment,
                        business_info,
                        full_purchases_details: {
                            ...purchases,
                            items: enrichedItems,
                        },
                    };
                }
                catch (e) {
                    console.error('Error parsing purchases for payment:', payment.id, e);
                }
            }
            return payment;
        }));
        return {
            statusCode: common_1.HttpStatus.OK,
            data: enhancedPayments,
            count: total,
        };
    }
    async fetchClientPaymentByID(request, idDto) {
        const { sub: user_id } = request.user;
        const { id } = idDto;
        const filters = {
            id,
            user_id,
            tz: request.timezone,
        };
        const include = {
            subscription_plan: {
                include: {
                    business: {
                        select: {
                            id: true,
                            business_name: true,
                            logo_url: true,
                            industry: true,
                        },
                    },
                },
            },
            billing_info: true,
            refunds: {
                include: {
                    payment: true,
                },
            },
            payment_gateway_logs: {
                orderBy: {
                    created_at: client_1.Prisma.SortOrder.desc,
                },
                take: 10,
            },
        };
        const payment = await this.paymentRepository.findOne(filters, include, undefined);
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found.');
        }
        return {
            statusCode: common_1.HttpStatus.OK,
            data: payment,
        };
    }
    async fetchClientPaymentSummary(request) {
        const { sub: user_id } = request.user;
        const [total_payments, successful_payments, pending_payments, failed_payments, total_amount, total_discount,] = await Promise.all([
            this.paymentRepository.count({ user_id }),
            this.paymentRepository.count({
                user_id,
                payment_status: client_1.PaymentStatus.SUCCESS,
            }),
            this.paymentRepository.count({
                user_id,
                payment_status: client_1.PaymentStatus.PENDING,
            }),
            this.paymentRepository.count({
                user_id,
                payment_status: client_1.PaymentStatus.FAILED,
            }),
            this.paymentRepository.sum('amount', {
                user_id,
                payment_status: client_1.PaymentStatus.SUCCESS,
            }),
            this.paymentRepository.sum('discount_applied', {
                user_id,
                payment_status: client_1.PaymentStatus.SUCCESS,
            }),
        ]);
        const payment_types = await this.prisma.payment.groupBy({
            by: ['purchase_type'],
            where: {
                user_id,
                payment_status: client_1.PaymentStatus.SUCCESS,
            },
            _count: {
                purchase_type: true,
            },
            _sum: {
                amount: true,
            },
        });
        const top_businesses = await this.prisma.payment.findMany({
            where: {
                user_id,
                payment_status: client_1.PaymentStatus.SUCCESS,
                subscription_plan: {
                    isNot: null,
                },
            },
            select: {
                subscription_plan: {
                    select: {
                        id: true,
                        business: {
                            select: {
                                id: true,
                                business_name: true,
                                logo_url: true,
                            },
                        },
                    },
                },
                amount: true,
            },
            orderBy: {
                amount: 'desc',
            },
            take: 10,
        });
        const businessMap = new Map();
        top_businesses.forEach((payment) => {
            if (payment.subscription_plan) {
                const businessId = payment.subscription_plan.business.id;
                const existing = businessMap.get(businessId);
                if (existing) {
                    existing.total_spent += Number(payment.amount || 0);
                    existing.payment_count += 1;
                }
                else {
                    businessMap.set(businessId, {
                        business: payment.subscription_plan.business,
                        total_spent: Number(payment.amount || 0),
                        payment_count: 1,
                    });
                }
            }
        });
        const formatted_top_businesses = Array.from(businessMap.values())
            .sort((a, b) => b.total_spent - a.total_spent)
            .slice(0, 5);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: {
                summary: {
                    total_payments,
                    successful_payments,
                    pending_payments,
                    failed_payments,
                    total_amount: Number(total_amount || 0),
                    total_discount: Number(total_discount || 0),
                },
                payment_types: payment_types.map((type) => ({
                    type: type.purchase_type,
                    count: type._count.purchase_type,
                    total_amount: Number(type._sum.amount || 0),
                })),
                top_businesses: formatted_top_businesses.filter(Boolean),
            },
        };
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        paystack_provider_1.PaystackService,
        flutterwave_provider_1.FlutterwaveService,
        auth_service_1.AuthService,
        log_service_1.LogService,
        mail_service_1.MailService,
        common_1.Logger,
        billing_service_1.BillingService,
        usage_service_1.CouponUsageService,
        cart_service_1.CartService,
        generic_service_1.GenericService,
        config_1.ConfigService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map