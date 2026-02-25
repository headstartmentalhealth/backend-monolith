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
exports.BusinessAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const generic_utils_1 = require("../../generic/generic.utils");
const prisma_base_repository_1 = require("../../prisma/prisma.base.repository");
const generic_data_1 = require("../../generic/generic.data");
let BusinessAnalyticsService = class BusinessAnalyticsService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.paymentRepository = new prisma_base_repository_1.PrismaBaseRepository('payment', prisma);
        this.subscriptionRepository = new prisma_base_repository_1.PrismaBaseRepository('subscription', prisma);
        this.enrolledCourseRepository = new prisma_base_repository_1.PrismaBaseRepository('enrolledCourse', prisma);
        this.businessContactRepository = new prisma_base_repository_1.PrismaBaseRepository('businessContact', prisma);
    }
    async getBusinessAnalytics(payload, query) {
        const businessId = payload['Business-Id'];
        const totalRevenue = await this.getTotalRevenue(this.prisma, businessId);
        const activeSubscriptions = await this.getActiveSubscriptions(this.prisma, businessId);
        const allClients = await this.getAllClients(this.prisma, businessId);
        const courseCompletions = await this.getCourseCompletions(this.prisma, businessId);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: {
                total_revenue: totalRevenue,
                active_subscriptions: activeSubscriptions,
                all_clients: allClients,
                course_completions: courseCompletions,
            },
        };
    }
    async fetchTotalRevenue(prisma, businessId) {
        const currencies = await prisma.businessAccountCurrency.findMany({
            where: {
                business_id: businessId,
                deleted_at: null,
            },
            select: {
                currency: true,
                currency_sign: true,
            },
        });
        const groupedPayments = await prisma.payment.groupBy({
            by: ['currency'],
            where: {
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
                amount: true,
                discount_applied: true,
            },
            _count: {
                id: true,
            },
        });
        const byCurrency = currencies.map((currencyRecord) => {
            const stats = groupedPayments.find((p) => p.currency === currencyRecord.currency);
            const gross_amount = stats?._sum.amount ?? 0;
            const discount = stats?._sum.discount_applied ?? 0;
            const net_earnings = +gross_amount - +discount;
            return {
                currency: currencyRecord.currency,
                currency_sign: currencyRecord.currency_sign || '',
                total_payments: stats?._count.id ?? 0,
                gross_amount: (0, generic_utils_1.formatMoney)(+gross_amount, currencyRecord.currency),
                total_discount: (0, generic_utils_1.formatMoney)(+discount, currencyRecord.currency),
                net_earnings: (0, generic_utils_1.formatMoney)(net_earnings, currencyRecord.currency),
                raw: {
                    gross_amount: +gross_amount,
                    total_discount: +discount,
                    net_earnings,
                },
            };
        });
        const overallTotals = byCurrency.reduce((acc, curr) => ({
            total_payments: acc.total_payments + curr.total_payments,
            gross_amount: acc.gross_amount + curr.raw.gross_amount,
            total_discount: acc.total_discount + curr.raw.total_discount,
            net_earnings: acc.net_earnings + curr.raw.net_earnings,
        }), {
            total_payments: 0,
            gross_amount: 0,
            total_discount: 0,
            net_earnings: 0,
        });
        return {
            business_id: businessId,
            by_currency: byCurrency,
            overall: {
                total_payments: overallTotals.total_payments,
                gross_amount: (0, generic_utils_1.formatMoney)(overallTotals.gross_amount, 'NGN'),
                total_discount: (0, generic_utils_1.formatMoney)(overallTotals.total_discount, 'NGN'),
                net_earnings: (0, generic_utils_1.formatMoney)(overallTotals.net_earnings, 'NGN'),
            },
        };
    }
    async getTotalRevenue(prisma, businessId, currency = 'NGN') {
        const [enrolledCourses, subscriptions, purchasedTickets, purchasedDigitalProducts, totalRevenue,] = await Promise.all([
            prisma.enrolledCourse.findMany({
                where: { course: { business_id: businessId }, ...(0, generic_utils_1.withDeleted)() },
                select: { course: { select: { price: true } }, quantity: true },
            }),
            prisma.subscription.findMany({
                where: {
                    subscription_plan: { business_id: businessId },
                    is_active: true,
                    ...(0, generic_utils_1.withDeleted)(),
                },
                select: { plan_price_at_subscription: true },
            }),
            prisma.purchasedTicket.findMany({
                where: {
                    ticket: { product: { business_id: businessId } },
                    ...(0, generic_utils_1.withDeleted)(),
                },
                include: { ticket_tier: true },
            }),
            prisma.purchasedDigitalProduct.findMany({
                where: { product: { business_id: businessId }, ...(0, generic_utils_1.withDeleted)() },
                select: { product: { select: { price: true } }, quantity: true },
            }),
            this.fetchTotalRevenue(prisma, businessId),
        ]);
        const courseRevenue = enrolledCourses.reduce((sum, { course, quantity }) => sum + (course.price?.toNumber() || 0) * (quantity || 1), 0);
        const subscriptionRevenue = subscriptions.reduce((sum, sub) => sum + Number(sub.plan_price_at_subscription || 0), 0);
        const ticketRevenue = purchasedTickets.reduce((sum, purchased) => sum +
            (purchased.ticket_tier.amount?.toNumber() || 0) *
                (purchased.quantity || 1), 0);
        const digitalRevenue = purchasedDigitalProducts.reduce((sum, { product, quantity }) => sum + (product?.price?.toNumber() || 0) * (quantity || 1), 0);
        const totalAmount = courseRevenue + subscriptionRevenue + ticketRevenue + digitalRevenue;
        return {
            total: (0, generic_utils_1.formatMoney)(totalAmount, currency),
            raw_total: totalAmount,
            details: totalRevenue,
            breakdown: {
                courses: {
                    amount: courseRevenue,
                    formatted: (0, generic_utils_1.formatMoney)(courseRevenue, currency),
                },
                subscriptions: {
                    amount: subscriptionRevenue,
                    formatted: (0, generic_utils_1.formatMoney)(subscriptionRevenue, currency),
                },
                tickets: {
                    amount: ticketRevenue,
                    formatted: (0, generic_utils_1.formatMoney)(ticketRevenue, currency),
                },
                digital: {
                    amount: digitalRevenue,
                    formatted: (0, generic_utils_1.formatMoney)(digitalRevenue, currency),
                },
            },
        };
    }
    async getActiveSubscriptions(prisma, businessId) {
        const now = new Date();
        const activeSubscriptions = await prisma.subscription.findMany({
            where: {
                is_active: true,
                end_date: {
                    gte: now,
                },
                subscription_plan: {
                    business_id: businessId,
                },
                ...(0, generic_utils_1.withDeleted)(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                subscription_plan: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        const subscriptionStats = await Promise.all([
            prisma.subscription.count({
                where: {
                    subscription_plan: {
                        business_id: businessId,
                    },
                    ...(0, generic_utils_1.withDeleted)(),
                },
            }),
            prisma.subscription.count({
                where: {
                    is_active: true,
                    end_date: {
                        gte: now,
                    },
                    subscription_plan: {
                        business_id: businessId,
                    },
                    ...(0, generic_utils_1.withDeleted)(),
                },
            }),
            prisma.subscription.count({
                where: {
                    end_date: {
                        lt: now,
                    },
                    subscription_plan: {
                        business_id: businessId,
                    },
                    ...(0, generic_utils_1.withDeleted)(),
                },
            }),
        ]);
        return {
            active_subscriptions: activeSubscriptions,
            statistics: {
                total: subscriptionStats[0],
                active: subscriptionStats[1],
                expired: subscriptionStats[2],
            },
        };
    }
    async getAllClients(prisma, businessId) {
        const clients = await prisma.user.findMany({
            where: {
                OR: [
                    {
                        payments: {
                            some: {
                                payment_status: client_1.PaymentStatus.SUCCESS,
                                OR: [
                                    {
                                        purchase: {
                                            path: ['business_id'],
                                            string_contains: businessId,
                                        },
                                    },
                                    {
                                        subscription_plan: {
                                            business_id: businessId,
                                        },
                                    },
                                ],
                            },
                        },
                    },
                    {
                        business_contacts: {
                            some: {
                                role: generic_data_1.Role.USER,
                                business_id: businessId,
                                status: client_1.MemberStatus.active,
                            },
                        },
                    },
                    {
                        enrolled_courses: {
                            some: {
                                course: {
                                    business_id: businessId,
                                },
                            },
                        },
                    },
                ],
                ...(0, generic_utils_1.withDeleted)(),
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                created_at: true,
                is_email_verified: true,
                is_phone_verified: true,
                business_contacts: {
                    where: {
                        business_id: businessId,
                    },
                    select: {
                        id: true,
                        role: true,
                        status: true,
                        joined_at: true,
                    },
                },
                payments: {
                    where: {
                        payment_status: client_1.PaymentStatus.SUCCESS,
                        OR: [
                            {
                                purchase: {
                                    path: ['business_id'],
                                    string_contains: businessId,
                                },
                            },
                            {
                                subscription_plan: {
                                    business_id: businessId,
                                },
                            },
                        ],
                    },
                    select: {
                        id: true,
                        amount: true,
                        purchase_type: true,
                        created_at: true,
                    },
                },
                enrolled_courses: {
                    where: {
                        course: {
                            business_id: businessId,
                        },
                    },
                    select: {
                        id: true,
                        progress: true,
                        status: true,
                        enrolled_at: true,
                        course: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
            },
        });
        const clientStats = {
            total: clients.length,
            verified_email: clients.filter((client) => client.is_email_verified)
                .length,
            verified_phone: clients.filter((client) => client.is_phone_verified)
                .length,
            with_payments: clients.filter((client) => client.payments.length > 0)
                .length,
            with_enrollments: clients.filter((client) => client.enrolled_courses.length > 0).length,
            business_contacts: clients.filter((client) => client.business_contacts.length > 0).length,
        };
        return {
            clients,
            statistics: clientStats,
        };
    }
    async getCourseCompletions(prisma, businessId) {
        const courses = await prisma.product.findMany({
            where: {
                business_id: businessId,
                type: 'COURSE',
                ...(0, generic_utils_1.withDeleted)(),
            },
            select: {
                id: true,
                title: true,
                created_at: true,
                enrolled: {
                    select: {
                        id: true,
                        progress: true,
                        status: true,
                        completed_lessons: true,
                        total_lessons: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
                modules: {
                    select: {
                        id: true,
                        title: true,
                        contents: {
                            select: {
                                id: true,
                                title: true,
                                progress: {
                                    select: {
                                        id: true,
                                        user_id: true,
                                        completed_at: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        const completionStats = await Promise.all(courses.map(async (course) => {
            const totalEnrollments = course.enrolled.length;
            const completedEnrollments = course.enrolled.filter((enrollment) => enrollment.progress === 100).length;
            const activeEnrollments = course.enrolled.filter((enrollment) => enrollment.status === client_1.EnrollmentStatus.ACTIVE).length;
            const averageProgress = totalEnrollments > 0
                ? course.enrolled.reduce((sum, enrollment) => sum + enrollment.progress, 0) / totalEnrollments
                : 0;
            return {
                course_id: course.id,
                course_title: course.title,
                total_enrollments: totalEnrollments,
                completed_enrollments: completedEnrollments,
                active_enrollments: activeEnrollments,
                completion_rate: totalEnrollments > 0
                    ? (completedEnrollments / totalEnrollments) * 100
                    : 0,
                average_progress: Math.round(averageProgress),
                total_lessons: course.modules.reduce((sum, module) => sum + module.contents.length, 0),
            };
        }));
        const overallStats = {
            total_courses: courses.length,
            total_enrollments: courses.reduce((sum, course) => sum + course.enrolled.length, 0),
            total_completions: courses.reduce((sum, course) => sum +
                course.enrolled.filter((enrollment) => enrollment.progress === 100)
                    .length, 0),
            overall_completion_rate: courses.reduce((sum, course) => sum + course.enrolled.length, 0) > 0
                ? (courses.reduce((sum, course) => sum +
                    course.enrolled.filter((enrollment) => enrollment.progress === 100).length, 0) /
                    courses.reduce((sum, course) => sum + course.enrolled.length, 0)) *
                    100
                : 0,
        };
        return {
            courses,
            completion_statistics: completionStats,
            overall_statistics: overallStats,
        };
    }
    async getProductRevenueBreakdown(payload) {
        const businessId = payload['Business-Id'];
        const currency = this.configService.get('DEFAULT_CURRENCY') || 'NGN';
        return await this.prisma.$transaction(async (prisma) => {
            const courseRevenue = await prisma.enrolledCourse.findMany({
                where: { course: { business_id: businessId } },
                select: { course: { select: { price: true } }, quantity: true },
            });
            const course = courseRevenue.reduce((sum, { course, quantity }) => sum + (course.price?.toNumber() || 0) * (quantity || 1), 0);
            const ticketRevenue = await prisma.purchasedTicket.findMany({
                where: { ticket: { product: { business_id: businessId } } },
                include: { ticket_tier: true },
            });
            const ticket = ticketRevenue.reduce((sum, purchased) => sum +
                (purchased.ticket_tier.amount?.toNumber() * purchased.quantity || 0), 0);
            const subscriptionRevenue = await prisma.subscription.findMany({
                where: {
                    subscription_plan: { business_id: businessId },
                    is_active: true,
                },
                select: { plan_price_at_subscription: true },
            });
            const subscription = subscriptionRevenue.reduce((sum, sub) => sum + (sub.plan_price_at_subscription?.toNumber() || 0), 0);
            const digitalRevenue = await prisma.purchasedDigitalProduct.findMany({
                where: { product: { business_id: businessId } },
                include: { product: true },
            });
            const digital = digitalRevenue.reduce((sum, purchased) => sum +
                (purchased.product.price?.toNumber() || 0) *
                    (purchased.quantity || 1), 0);
            return {
                statusCode: 200,
                data: {
                    course: {
                        amount: course,
                        formatted: `${currency} ${course.toLocaleString()}`,
                    },
                    ticket: {
                        amount: ticket,
                        formatted: `${currency} ${ticket.toLocaleString()}`,
                    },
                    subscription: {
                        amount: subscription,
                        formatted: `${currency} ${subscription.toLocaleString()}`,
                    },
                    digital: {
                        amount: digital,
                        formatted: `${currency} ${digital.toLocaleString()}`,
                    },
                },
            };
        });
    }
    async getMonthlyProductRevenueBreakdown(payload, year) {
        const businessId = payload['Business-Id'];
        const now = new Date();
        const targetYear = year || now.getFullYear();
        const currencies = await this.prisma.businessAccountCurrency.findMany({
            where: { business_id: businessId, deleted_at: null },
            select: { currency: true, currency_sign: true },
        });
        if (!currencies.length) {
            currencies.push({ currency: 'NGN', currency_sign: '₦' });
        }
        const getMonthRange = (month) => {
            const start = new Date(targetYear, month, 1);
            const end = new Date(targetYear, month + 1, 0, 23, 59, 59, 999);
            return { start, end };
        };
        const getRevenue = async (purchaseType, month, currency) => {
            const { start, end } = getMonthRange(month);
            if (purchaseType === client_1.PurchaseType.SUBSCRIPTION) {
                const subs = await this.prisma.subscriptionPayment.findMany({
                    where: {
                        created_at: { gte: start, lte: end },
                        subscription: { business_id: businessId },
                        currency,
                    },
                    select: { amount: true },
                });
                const sub_amount = subs.reduce((sum, s) => sum + (s.amount?.toNumber() || 0), 0);
                return sub_amount;
            }
            if (purchaseType === client_1.PurchaseType.COURSE) {
                const enrolled = await this.prisma.enrolledCourse.findMany({
                    where: {
                        created_at: { gte: start, lte: end },
                        course: { business_id: businessId },
                        currency,
                    },
                    select: {
                        amount: true,
                        quantity: true,
                    },
                });
                return enrolled.reduce((sum, { amount, quantity }) => sum + (amount.toNumber() || 0) * (quantity || 1), 0);
            }
            if (purchaseType === client_1.PurchaseType.TICKET) {
                const tickets = await this.prisma.purchasedTicket.findMany({
                    where: {
                        created_at: { gte: start, lte: end },
                        ticket: { product: { business_id: businessId } },
                        currency,
                    },
                });
                return tickets.reduce((sum, t) => sum + (t.amount?.toNumber() * t.quantity || 0), 0);
            }
            if (purchaseType === client_1.PurchaseType.DIGITAL_PRODUCT) {
                const digital = await this.prisma.purchasedDigitalProduct.findMany({
                    where: {
                        created_at: { gte: start, lte: end },
                        product: { business_id: businessId },
                        currency,
                    },
                    select: { amount: true, quantity: true },
                });
                return digital.reduce((sum, { amount, quantity }) => sum + (amount?.toNumber() || 0) * (quantity || 1), 0);
            }
            return 0;
        };
        const monthNames = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
        ];
        const dataByCurrency = await Promise.all(currencies.map(async (c) => {
            const months = await Promise.all(monthNames.map(async (_, month) => {
                const [course, ticket, subscription, digital] = await Promise.all([
                    getRevenue(client_1.PurchaseType.COURSE, month, c.currency),
                    getRevenue(client_1.PurchaseType.TICKET, month, c.currency),
                    getRevenue(client_1.PurchaseType.SUBSCRIPTION, month, c.currency),
                    getRevenue(client_1.PurchaseType.DIGITAL_PRODUCT, month, c.currency),
                ]);
                return {
                    month: monthNames[month],
                    course: {
                        amount: course,
                        formatted: (0, generic_utils_1.formatMoney)(+course, c.currency),
                    },
                    ticket: {
                        amount: ticket,
                        formatted: (0, generic_utils_1.formatMoney)(+ticket, c.currency),
                    },
                    subscription: {
                        amount: subscription,
                        formatted: (0, generic_utils_1.formatMoney)(+subscription, c.currency),
                    },
                    digital: {
                        amount: digital,
                        formatted: (0, generic_utils_1.formatMoney)(+digital, c.currency),
                    },
                };
            }));
            return {
                currency: c.currency,
                currency_sign: c.currency_sign,
                months,
            };
        }));
        return {
            statusCode: 200,
            data: {
                year: targetYear,
                currencies: dataByCurrency,
            },
        };
    }
};
exports.BusinessAnalyticsService = BusinessAnalyticsService;
exports.BusinessAnalyticsService = BusinessAnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], BusinessAnalyticsService);
//# sourceMappingURL=business.service.js.map