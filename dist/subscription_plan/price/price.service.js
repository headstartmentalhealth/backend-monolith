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
exports.SubscriptionPlanPriceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const prisma_base_repository_1 = require("../../prisma/prisma.base.repository");
const client_1 = require("@prisma/client");
const log_service_1 = require("../../log/log.service");
const generic_utils_1 = require("../../generic/generic.utils");
const generic_service_1 = require("../../generic/generic.service");
let SubscriptionPlanPriceService = class SubscriptionPlanPriceService {
    constructor(prisma, logService, genericService) {
        this.prisma = prisma;
        this.logService = logService;
        this.genericService = genericService;
        this.select = {
            id: true,
            price: true,
            period: true,
            created_at: true,
            creator: {
                select: {
                    id: true,
                    name: true,
                    role: { select: { name: true, role_id: true } },
                },
            },
            subscription_plan: {
                select: {
                    id: true,
                    name: true,
                    business_id: true,
                },
            },
        };
        this.subscriptionPlanPriceRepository = new prisma_base_repository_1.PrismaBaseRepository('subscriptionPlanPrice', prisma);
        this.subscriptionPlanRepository = new prisma_base_repository_1.PrismaBaseRepository('subscriptionPlan', prisma);
    }
    async create(request, dto) {
        const auth = request.user;
        let { period, subscription_plan_id } = dto;
        return this.prisma.$transaction(async (prisma) => {
            const subscription_plan = await prisma.subscriptionPlan.findUnique({
                where: { id: subscription_plan_id },
            });
            (0, generic_utils_1.verifySubscriptionPlan)(subscription_plan);
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id: subscription_plan.business_id,
            });
            const sub_plan_price = await prisma.subscriptionPlanPrice.findFirst({
                where: {
                    period,
                    subscription_plan_id,
                },
            });
            if (sub_plan_price) {
                throw new common_1.BadRequestException("Subscription plan's price exists.");
            }
            const price = await prisma.subscriptionPlanPrice.create({
                data: { ...dto, creator_id: auth.sub },
                select: {
                    id: true,
                    subscription_plan: { select: { business_id: true } },
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.SUBSCRIPTION_PLAN_PRICE,
                entity: 'SubscriptionPlanPrice',
                entity_id: price.id,
                metadata: `User with ID ${auth.sub} just created a price for subscription plan ID ${subscription_plan_id} of Business ID ${price.subscription_plan.business_id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.CREATED,
                message: "Subscription plan's price created successfully.",
            };
        });
    }
    async fetch(payload, param, queryDto) {
        const user = payload.user;
        const { subscription_plan_id } = param;
        const subscriptionPlan = await this.subscriptionPlanRepository.findOne({ id: subscription_plan_id }, undefined, { business_id: true });
        (0, generic_utils_1.verifySubscriptionPlan)(subscriptionPlan);
        await this.genericService.isUserLinkedToBusiness(this.prisma, {
            user_id: user.sub,
            business_id: subscriptionPlan.business_id,
        });
        const paginationFilters = (0, generic_utils_1.pageFilter)(queryDto);
        const filters = {
            subscription_plan_id,
            ...paginationFilters.filters,
            tz: payload.timezone,
        };
        const [planPrices, total] = await Promise.all([
            this.subscriptionPlanPriceRepository.findManyWithPagination(filters, paginationFilters.pagination_options, client_1.Prisma.SortOrder.desc, undefined, this.select),
            this.subscriptionPlanPriceRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: planPrices,
            count: total,
        };
    }
    async findOne(id) {
        const select = this.select;
        const filters = {
            id,
        };
        const price = await this.prisma.subscriptionPlanPrice.findFirst({
            where: filters,
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        role: { select: { name: true, role_id: true } },
                    },
                },
                subscription_plan: {
                    select: {
                        id: true,
                        name: true,
                        business_id: true,
                    },
                },
            },
        });
        if (!price) {
            throw new common_1.NotFoundException(`Subscription plan's price not found for your subscription plan`);
        }
        return price;
    }
    async update(request, param, dto) {
        const auth = request.user;
        const { id } = param;
        return this.prisma.$transaction(async (prisma) => {
            const existing_plan_price = await this.findOne(id);
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id: existing_plan_price.subscription_plan.business_id,
            });
            await prisma.subscriptionPlanPrice.update({
                where: { id: existing_plan_price.id },
                data: {
                    ...dto,
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.SUBSCRIPTION_PLAN_PRICE,
                entity: 'SubscriptionPlanPrice',
                entity_id: existing_plan_price.id,
                metadata: `User with ID ${auth.sub} just created a subscription plan price for subscription plan ID ${existing_plan_price.subscription_plan.id} of business ID ${existing_plan_price.subscription_plan.business_id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: "Subscription plan's price updated successfully.",
            };
        });
    }
    async hasRelatedRecords(prisma, plan_id, period) {
        const relatedTables = [
            {
                model: prisma.subscription,
                field1: 'plan_id',
                field2: 'billing_interval',
            },
        ];
        for (const { model, field1, field2 } of relatedTables) {
            const count = await model.count({
                where: { [field1]: plan_id, [field2]: period },
            });
            if (count > 0) {
                throw new common_1.ForbiddenException('Related records for this model exists.');
            }
        }
    }
    async delete(request, param) {
        const auth = request.user;
        const { id } = param;
        return this.prisma.$transaction(async (prisma) => {
            const existing_plan_price = await this.findOne(id);
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id: existing_plan_price.subscription_plan.business_id,
            });
            await this.hasRelatedRecords(prisma, existing_plan_price.subscription_plan.id, existing_plan_price.period);
            await prisma.subscriptionPlanPrice.update({
                where: { id: existing_plan_price.id },
                data: {
                    deleted_at: new Date(),
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.SUBSCRIPTION_PLAN_PRICE,
                entity: 'SubscriptionPlanPrice',
                entity_id: existing_plan_price.id,
                metadata: `User with ID ${auth.sub} just deleted a subscription plan price ID ${existing_plan_price.id} from subscription plan ${existing_plan_price.subscription_plan.id} of business ID ${existing_plan_price.subscription_plan.business_id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: "Subscription plan's price deleted successfully.",
            };
        });
    }
};
exports.SubscriptionPlanPriceService = SubscriptionPlanPriceService;
exports.SubscriptionPlanPriceService = SubscriptionPlanPriceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        log_service_1.LogService,
        generic_service_1.GenericService])
], SubscriptionPlanPriceService);
//# sourceMappingURL=price.service.js.map