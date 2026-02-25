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
exports.OwnerService = void 0;
const generic_utils_1 = require("../../generic/generic.utils");
const prisma_base_repository_1 = require("../../prisma/prisma.base.repository");
const prisma_service_1 = require("../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
let OwnerService = class OwnerService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.paymentRepository = new prisma_base_repository_1.PrismaBaseRepository('payment', prisma);
        this.businessInformationRepository = new prisma_base_repository_1.PrismaBaseRepository('businessInformation', prisma);
    }
    async getMetrics() {
        return this.prisma.$transaction(async (prisma) => {
            const total_organizations = await prisma.businessInformation.count({
                where: {
                    ...(0, generic_utils_1.withDeleted)(),
                },
            });
            const revenueResult = await prisma.payment.aggregate({
                _sum: {
                    amount: true,
                },
                where: {
                    payment_status: client_1.PaymentStatus.SUCCESS,
                    ...(0, generic_utils_1.withDeleted)(),
                },
            });
            const total_revenue = (0, generic_utils_1.formatMoney)(+revenueResult._sum.amount || 0, this.configService.get('DEFAULT_CURRENCY'));
            const total_product_orders = await prisma.payment.count({
                where: {
                    purchase_type: client_1.PurchaseType.PRODUCT,
                    payment_status: client_1.PaymentStatus.SUCCESS,
                    ...(0, generic_utils_1.withDeleted)(),
                },
            });
            const total_withdrawals = await prisma.payment.count({
                where: {
                    transaction_type: client_1.TransactionType.WITHDRAWAL,
                    ...(0, generic_utils_1.withDeleted)(),
                },
            });
            const total_library_materials = await prisma.multimedia.count({
                where: {
                    type: client_1.MultimediaType.DOCUMENT,
                    ...(0, generic_utils_1.withDeleted)(),
                },
            });
            const total_audio_contents = await prisma.multimedia.count({
                where: {
                    type: client_1.MultimediaType.AUDIO,
                    ...(0, generic_utils_1.withDeleted)(),
                },
            });
            const total_blog_posts = await prisma.product.count({
                where: {
                    type: client_1.ProductType.DIGITAL_PRODUCT,
                    ...(0, generic_utils_1.withDeleted)(),
                },
            });
            return {
                statusCode: common_1.HttpStatus.OK,
                data: {
                    total_organizations,
                    total_revenue,
                    total_product_orders,
                    total_withdrawals,
                    total_library_materials,
                    total_audio_contents,
                    total_blog_posts,
                },
            };
        });
    }
    async getYearlyRevenueBreakdown(filterByYearDto) {
        const { year } = filterByYearDto;
        return this.prisma.$transaction(async (prisma) => {
            if (year < 2000 || year > new Date().getFullYear()) {
                throw new common_1.BadRequestException('Invalid year specified');
            }
            const getMonthRange = (month) => {
                const start = new Date(year, month, 1);
                const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
                return { start, end };
            };
            const monthlyQueries = Array.from({ length: 12 }, async (_, month) => {
                const { start, end } = getMonthRange(month);
                return await Promise.all([
                    prisma.payment.aggregate({
                        _sum: { amount: true },
                        where: {
                            payment_status: client_1.PaymentStatus.SUCCESS,
                            purchase_type: client_1.PurchaseType.PRODUCT,
                            created_at: { gte: start, lte: end },
                            ...(0, generic_utils_1.withDeleted)(),
                        },
                    }),
                    prisma.payment.aggregate({
                        _sum: { amount: true },
                        where: {
                            payment_status: client_1.PaymentStatus.SUCCESS,
                            purchase_type: client_1.PurchaseType.SUBSCRIPTION,
                            created_at: { gte: start, lte: end },
                            ...(0, generic_utils_1.withDeleted)(),
                        },
                    }),
                    prisma.payment.aggregate({
                        _sum: { amount: true },
                        where: {
                            transaction_type: client_1.TransactionType.WITHDRAWAL,
                            created_at: { gte: start, lte: end },
                            ...(0, generic_utils_1.withDeleted)(),
                        },
                    }),
                ]);
            });
            const monthlyResults = await Promise.all(monthlyQueries);
            const monthlyBreakdown = monthlyResults.map(([product, subscription, withdrawal], index) => ({
                month: new Date(year, index).toLocaleString('default', {
                    month: 'short',
                }),
                product_revenue: (0, generic_utils_1.formatMoney)(+(product._sum.amount || 0), this.configService.get('DEFAULT_CURRENCY')),
                subscription_revenue: (0, generic_utils_1.formatMoney)(+(subscription._sum.amount || 0), this.configService.get('DEFAULT_CURRENCY')),
                withdrawals: (0, generic_utils_1.formatMoney)(+(withdrawal._sum.amount || 0), this.configService.get('DEFAULT_CURRENCY')),
            }));
            const totals = monthlyBreakdown.reduce((acc, month) => ({
                product_revenue: acc.product_revenue +
                    +month.product_revenue.replace(/[^0-9.-]+/g, ''),
                subscription_revenue: acc.subscription_revenue +
                    +month.subscription_revenue.replace(/[^0-9.-]+/g, ''),
                withdrawals: acc.withdrawals + +month.withdrawals.replace(/[^0-9.-]+/g, ''),
            }), { product_revenue: 0, subscription_revenue: 0, withdrawals: 0 });
            return {
                statusCode: common_1.HttpStatus.OK,
                data: {
                    year,
                    monthly_breakdown: monthlyBreakdown,
                    totals: {
                        product_revenue: (0, generic_utils_1.formatMoney)(totals.product_revenue, this.configService.get('DEFAULT_CURRENCY')),
                        subscription_revenue: (0, generic_utils_1.formatMoney)(totals.subscription_revenue, this.configService.get('DEFAULT_CURRENCY')),
                        withdrawals: (0, generic_utils_1.formatMoney)(totals.withdrawals, this.configService.get('DEFAULT_CURRENCY')),
                    },
                },
            };
        });
    }
    async getProductCountByType() {
        return this.prisma.$transaction(async (prisma) => {
            const [courseCount, ticketCount] = await Promise.all([
                prisma.product.count({
                    where: {
                        type: 'COURSE',
                        deleted_at: null,
                    },
                }),
                prisma.product.count({
                    where: {
                        type: 'TICKET',
                        deleted_at: null,
                    },
                }),
            ]);
            return {
                statusCode: common_1.HttpStatus.OK,
                data: {
                    course: courseCount,
                    ticket: ticketCount,
                },
            };
        });
    }
};
exports.OwnerService = OwnerService;
exports.OwnerService = OwnerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], OwnerService);
//# sourceMappingURL=owner.service.js.map