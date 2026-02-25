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
exports.CurrencyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const generic_utils_1 = require("../generic/generic.utils");
let CurrencyService = class CurrencyService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAvailableCurrencies(req) {
        const [system, account, product] = await Promise.all([
            this.prisma.allowedCurrency.findMany({
                where: { enabled: true, deleted_at: null },
                orderBy: { currency: 'asc' },
            }),
            this.prisma.businessAccountCurrency.findMany({
                where: { business_id: req['Business-Id'], deleted_at: null },
                orderBy: { currency: 'asc' },
            }),
            this.prisma.businessProductEnabledCurrency.findMany({
                where: { business_id: req['Business-Id'], deleted_at: null },
                orderBy: { currency: 'asc' },
            }),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: {
                system: (0, generic_utils_1.prioritizeNGN)(system),
                account: (0, generic_utils_1.prioritizeNGN)(account),
                product: (0, generic_utils_1.prioritizeNGN)(product),
            },
        };
    }
    async toggleBusinessAccountCurrency(req, toggleCurrencyDto) {
        const businessId = req['Business-Id'];
        const { currency } = toggleCurrencyDto;
        const allowed = await this.prisma.allowedCurrency.findFirst({
            where: { currency, enabled: true, deleted_at: null },
        });
        if (!allowed) {
            throw new common_1.BadRequestException(`Currency ${currency} is not allowed.`);
        }
        const existing = await this.prisma.businessAccountCurrency.findFirst({
            where: { business_id: businessId, currency, deleted_at: null },
        });
        if (existing) {
            await this.prisma.businessAccountCurrency.delete({
                where: { id: existing.id },
            });
            return {
                statusCode: common_1.HttpStatus.OK,
                message: `Currency ${currency} removed successfully.`,
                data: { action: 'removed', currency, data: {} },
            };
        }
        else {
            const response = await this.prisma.businessAccountCurrency.create({
                data: { business_id: businessId, currency },
            });
            return {
                statusCode: common_1.HttpStatus.OK,
                message: `Currency ${currency} added successfully.`,
                data: {
                    action: 'added',
                    currency,
                    data: response,
                },
            };
        }
    }
    async toggleBusinessProductEnabledCurrency(req, toggleCurrencyDto) {
        const businessId = req['Business-Id'];
        const { currency } = toggleCurrencyDto;
        const existing = await this.prisma.businessProductEnabledCurrency.findFirst({
            where: { business_id: businessId, currency, deleted_at: null },
        });
        if (existing) {
            await this.prisma.businessProductEnabledCurrency.delete({
                where: { id: existing.id },
            });
            return {
                statusCode: common_1.HttpStatus.OK,
                message: `Currency ${currency} removed from product-enabled currencies.`,
                data: { action: 'removed', currency, data: {} },
            };
        }
        else {
            const response = await this.prisma.businessProductEnabledCurrency.create({
                data: { business_id: businessId, currency },
            });
            return {
                statusCode: common_1.HttpStatus.OK,
                message: `Currency ${currency} added to product-enabled currencies.`,
                data: { action: 'added', currency, data: response },
            };
        }
    }
    async getBusinessAccountCurrencies(businessDto) {
        const { business_id } = businessDto;
        const currencies = await this.prisma.businessAccountCurrency.findMany({
            where: {
                OR: [
                    { business: { id: business_id } },
                    { business: { business_slug: business_id } },
                ],
                deleted_at: null,
            },
            select: {
                id: true,
                currency: true,
                created_at: true,
                updated_at: true,
            },
            orderBy: { created_at: 'asc' },
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Business account currencies fetched successfully',
            data: {
                details: (0, generic_utils_1.prioritizeNGN)(currencies),
                currencies: (0, generic_utils_1.prioritizeShorthandNGN)(currencies.map((c) => c.currency)),
            },
        };
    }
    async fetchCurrencyRatesAndAllowedCurrencies() {
        const [rates, allowed] = await Promise.all([
            this.prisma.currencyRate.findMany({
                where: { deleted_at: null },
                include: { creator: true },
                orderBy: { created_at: 'asc' },
            }),
            this.prisma.allowedCurrency.findMany({
                where: { enabled: true, deleted_at: null },
                include: { creator: true },
                orderBy: { created_at: 'asc' },
            }),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Currency rates and allowed currencies fetched successfully',
            data: {
                rates,
                allowed,
                allowed_currencies: allowed.map((c) => c.currency),
            },
        };
    }
};
exports.CurrencyService = CurrencyService;
exports.CurrencyService = CurrencyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CurrencyService);
//# sourceMappingURL=currency.service.js.map