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
exports.SubscriptionPlanService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const log_service_1 = require("../../log/log.service");
const client_1 = require("@prisma/client");
const generic_utils_1 = require("../../generic/generic.utils");
const prisma_base_repository_1 = require("../../prisma/prisma.base.repository");
const generic_service_1 = require("../../generic/generic.service");
let SubscriptionPlanService = class SubscriptionPlanService {
    constructor(prisma, logService, genericService) {
        this.prisma = prisma;
        this.logService = logService;
        this.genericService = genericService;
        this.select = {
            id: true,
            name: true,
            description: true,
            cover_image: true,
            created_at: true,
            business_id: true,
            subscriptions: { take: 1, select: { id: true, plan_id: true } },
            creator: {
                select: {
                    id: true,
                    name: true,
                    role: { select: { name: true, role_id: true } },
                },
            },
            subscription_plan_prices: {
                where: { deleted_at: null },
                select: {
                    id: true,
                    price: true,
                    period: true,
                    currency: true,
                    subscription_plan: {
                        select: { subscriptions: { take: 1, select: { id: true } } },
                    },
                    other_currencies: true,
                },
            },
            subscription_plan_roles: {
                select: {
                    title: true,
                    role_id: true,
                    selected: true,
                },
            },
            product: { include: { multimedia: true, category: true } },
        };
        this.subscriptionPlanRepository = new prisma_base_repository_1.PrismaBaseRepository('subscriptionPlan', prisma);
    }
    async create(request, dto) {
        const auth = request.user;
        const { name, slug, business_id, category_id, status, multimedia_id } = dto;
        return this.prisma.$transaction(async (prisma) => {
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id,
            });
            const product_slug = await prisma.product.findFirst({ where: { slug } });
            if (product_slug) {
                throw new common_1.ConflictException('Shortlink already exists.');
            }
            const category = await prisma.productCategory.findUnique({
                where: { id: category_id },
            });
            if (!category) {
                throw new common_1.NotFoundException('Category not found.');
            }
            const existingPlan = await prisma.subscriptionPlan.findUnique({
                where: { name_business_id: { name, business_id } },
            });
            if (existingPlan) {
                throw new common_1.BadRequestException('A subscription plan with this name already exists.');
            }
            const existingProduct = await prisma.product.findFirst({
                where: { title: name, business_id },
            });
            if (existingProduct) {
                throw new common_1.BadRequestException('A product with this title already exists.');
            }
            const product = await prisma.product.create({
                data: {
                    business_info: { connect: { id: business_id } },
                    title: name,
                    slug,
                    type: client_1.ProductType.SUBSCRIPTION,
                    status,
                    creator: { connect: { id: auth.sub } },
                    category: { connect: { id: category_id } },
                    multimedia: { connect: { id: multimedia_id } },
                },
                include: { business_info: { include: { onboarding_status: true } } },
            });
            delete dto.slug;
            const plan = await prisma.subscriptionPlan.create({
                data: {
                    ...dto,
                    creator_id: auth.sub,
                    product_id: product.id,
                },
            });
            if (product.business_info.onboarding_status.current_step < 5) {
                await prisma.onboardingStatus.upsert({
                    where: {
                        user_id_business_id: {
                            user_id: auth.sub,
                            business_id,
                        },
                    },
                    create: {
                        user_id: auth.sub,
                        business_id,
                        current_step: 5,
                    },
                    update: {
                        current_step: 5,
                    },
                });
            }
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.SUBSCRIPTION_PLAN,
                entity: 'SubscriptionPlan',
                entity_id: plan.id,
                metadata: `User with ID ${auth.sub} created a subscription plan "${plan.name}".`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.CREATED,
                message: 'Subscription plan created successfully.',
            };
        });
    }
    async fetch(payload, param, queryDto) {
        const auth = payload.user;
        const { business_id } = param;
        await this.genericService.isUserLinkedToBusiness(this.prisma, {
            user_id: auth.sub,
            business_id,
        }, true);
        const pagination_filters = (0, generic_utils_1.pageFilter)(queryDto);
        const filters = {
            ...(business_id && { business_id }),
            ...(queryDto.q && {
                OR: [
                    { id: { contains: queryDto.q, mode: 'insensitive' } },
                    {
                        name: { contains: queryDto.q, mode: 'insensitive' },
                    },
                ],
            }),
            ...pagination_filters.filters,
            tz: payload.timezone,
        };
        const select = {
            ...this.select,
            subscription_plan_roles: true,
            business: true,
        };
        const plans = await this.subscriptionPlanRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, select);
        const total = await this.subscriptionPlanRepository.count(filters);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: plans,
            count: total,
        };
    }
    async findOne(id) {
        const select = this.select;
        const filters = {
            id,
        };
        const plan = await this.subscriptionPlanRepository.findOne(filters, undefined, select);
        if (!plan) {
            throw new common_1.NotFoundException('Subscription plan not found for your business.');
        }
        return plan;
    }
    async findSingle(param) {
        const plan = await this.findOne(param.id);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: plan,
        };
    }
    async update(request, param, dto) {
        const auth = request.user;
        const { id } = param;
        return this.prisma.$transaction(async (prisma) => {
            const existing_plan = await this.findOne(id);
            await this.genericService.isUserLinkedToBusiness(this.prisma, {
                user_id: auth.sub,
                business_id: existing_plan.business_id,
            });
            await prisma.subscriptionPlan.update({
                where: { id: existing_plan.id },
                data: {
                    ...dto,
                },
            });
            await prisma.product.update({
                where: { id: existing_plan.product.id },
                data: {
                    ...(dto.status && { status: dto.status }),
                    ...(dto.slug && { slug: dto.slug }),
                    ...(dto.category_id && { category_id: dto.category_id }),
                    ...(dto.multimedia_id && { multimedia_id: dto.multimedia_id }),
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.SUBSCRIPTION_PLAN,
                entity: 'SubscriptionPlan',
                entity_id: existing_plan.id,
                metadata: `User with ID ${auth.sub} just created a subscription plan.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Subscription plan updated successfully.',
            };
        });
    }
    async hasRelatedRecords(prisma, subscription_plan_id) {
        const relatedTables = [
            { model: prisma.subscription, field: 'plan_id' },
        ];
        for (const { model, field } of relatedTables) {
            const count = await model.count({
                where: { [field]: subscription_plan_id },
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
            const existing_plan = await this.findOne(id);
            await this.genericService.isUserLinkedToBusiness(this.prisma, {
                user_id: auth.sub,
                business_id: existing_plan.business_id,
            });
            await this.hasRelatedRecords(prisma, existing_plan.id);
            await prisma.subscriptionPlan.update({
                where: { id: existing_plan.id },
                data: {
                    name: `${existing_plan.name} [Deleted - ${new Date().getTime()}]`,
                    deleted_at: new Date(),
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.SUBSCRIPTION_PLAN,
                entity: 'SubscriptionPlan',
                entity_id: existing_plan.id,
                metadata: `User with ID ${auth.sub} just deleted a subscription plan ID ${existing_plan.id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Subscription plan deleted successfully.',
            };
        });
    }
    async publicFetch(payload, param, queryDto) {
        const { business_id } = param;
        const pagination_filters = (0, generic_utils_1.pageFilter)(queryDto);
        const filters = {
            ...(business_id && { business_id }),
            ...pagination_filters.filters,
            tz: payload.timezone,
        };
        delete this.select.creator;
        const select = this.select;
        const [plans, total] = await Promise.all([
            this.subscriptionPlanRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, select),
            this.subscriptionPlanRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: plans,
            count: total,
        };
    }
    async fetchBusinessPlans(payload, filterDto) {
        const { business_id } = filterDto;
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterDto);
        const filters = {
            ...(filterDto.q && {
                OR: [
                    {
                        id: { contains: filterDto.q, mode: 'insensitive' },
                    },
                    {
                        name: { contains: filterDto.q, mode: 'insensitive' },
                    },
                ],
            }),
            ...(business_id && { business_id }),
            ...pagination_filters.filters,
            tz: payload.timezone,
        };
        const include = {
            business: true,
            subscription_plan_prices: true,
            subscription_plan_roles: true,
            creator: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    is_email_verified: true,
                    is_phone_verified: true,
                    created_at: true,
                    role: true,
                },
            },
        };
        const [plans, total] = await Promise.all([
            this.subscriptionPlanRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, include, undefined),
            this.subscriptionPlanRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: plans,
            count: total,
        };
    }
    async createSubscriptionPlan(request, data) {
        const auth = request.user;
        const { name, slug, description, cover_image, business_id, creator_id, category_id, status, multimedia_id, subscription_plan_prices, subscription_plan_roles, } = data;
        return await this.prisma.$transaction(async (tx) => {
            const found_plan = await tx.subscriptionPlan.findFirst({
                where: {
                    name,
                    business_id,
                },
            });
            if (found_plan) {
                throw new common_1.BadRequestException('Plan name already exists.');
            }
            const product_slug = await tx.product.findFirst({ where: { slug } });
            if (product_slug) {
                throw new common_1.BadRequestException('Shortlink already exists.');
            }
            const product_category = await tx.productCategory.findUnique({
                where: { id: category_id },
            });
            if (!product_category) {
                throw new common_1.NotFoundException('Product category not found.');
            }
            const multimedia = await tx.multimedia.findUnique({
                where: { id: multimedia_id },
            });
            if (!multimedia) {
                throw new common_1.NotFoundException('Multimedia not found.');
            }
            const product = await tx.product.create({
                data: {
                    business_info: { connect: { id: business_id } },
                    title: name,
                    slug,
                    type: client_1.ProductType.SUBSCRIPTION,
                    status,
                    creator: { connect: { id: auth.sub } },
                    category: { connect: { id: category_id } },
                    multimedia: { connect: { id: multimedia_id } },
                },
                include: { business_info: { include: { onboarding_status: true } } },
            });
            const subscriptionPlan = await tx.subscriptionPlan.create({
                data: {
                    name,
                    description,
                    business_id,
                    creator_id,
                    product_id: product.id,
                    cover_image,
                },
            });
            const prices = subscription_plan_prices.map((price) => ({
                ...price,
                creator_id,
                subscription_plan_id: subscriptionPlan.id,
                ...(price.other_currencies && {
                    other_currencies: price.other_currencies
                        ? JSON.parse(JSON.stringify(price.other_currencies))
                        : undefined,
                }),
            }));
            const roles = subscription_plan_roles.map((role) => ({
                ...role,
                creator_id,
                subscription_plan_id: subscriptionPlan.id,
                selected: role.selected ?? false,
            }));
            const uniqueRoles = [
                ...new Map(roles.map((r) => [`${r.title}-${r.role_id}`, r])).values(),
            ];
            await tx.subscriptionPlanPrice.createMany({
                data: prices,
                skipDuplicates: true,
            });
            await tx.subscriptionPlanRole.createMany({
                data: uniqueRoles,
                skipDuplicates: true,
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.SUBSCRIPTION_PLAN,
                entity: 'SubscriptionPlan',
                entity_id: subscriptionPlan.id,
                metadata: `User with ID ${auth.sub} just created a subscription plan.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, tx.log);
            const saved = await tx.subscriptionPlan.findFirst({
                where: { id: subscriptionPlan.id },
                select: { ...this.select },
            });
            return {
                statusCode: common_1.HttpStatus.CREATED,
                message: 'Subscription plan created successfully.',
                data: saved,
            };
        });
    }
    async updateSubscriptionPlan(id, dto, request) {
        const auth = request.user;
        const { name, slug, description, cover_image, subscription_plan_prices, subscription_plan_roles, status, multimedia_id, category_id, } = dto;
        await this.prisma.$transaction(async (tx) => {
            const updatedPlan = await tx.subscriptionPlan.update({
                where: { id },
                data: {
                    ...(name && { name }),
                    ...(description && { description }),
                    ...(cover_image && { cover_image }),
                },
            });
            if (!updatedPlan.product_id) {
                throw new common_1.BadRequestException(`Subscription plan '${id}' is not linked to any product.`);
            }
            const updatedProduct = await tx.product.update({
                where: { id: updatedPlan.product_id },
                data: {
                    type: client_1.ProductType.SUBSCRIPTION,
                    ...(name && { title: name }),
                    ...(slug && { slug }),
                    ...(description && { description }),
                    ...(multimedia_id && { multimedia_id }),
                    ...(category_id && { category_id }),
                    ...(status && { status }),
                },
            });
            if (subscription_plan_prices) {
                const existingPriceIds = subscription_plan_prices
                    .filter((p) => p.id)
                    .map((p) => p.id);
                await tx.subscriptionPlanPrice.deleteMany({
                    where: {
                        subscription_plan_id: id,
                        ...(existingPriceIds.length && {
                            NOT: { id: { in: existingPriceIds } },
                        }),
                    },
                });
                for (const price of subscription_plan_prices) {
                    if (price.id) {
                        await tx.subscriptionPlanPrice.update({
                            where: { id: price.id },
                            data: {
                                price: price.price,
                                currency: price.currency,
                                period: price.period,
                                updated_at: new Date(),
                                ...(price.other_currencies && {
                                    other_currencies: price.other_currencies
                                        ? JSON.parse(JSON.stringify(price.other_currencies))
                                        : undefined,
                                }),
                            },
                        });
                    }
                    else {
                        const plan_details = await tx.subscriptionPlanPrice.findFirst({
                            where: { period: price.period, subscription_plan_id: id },
                        });
                        if (plan_details) {
                            throw new common_1.BadRequestException(`The period '${price.period}' already exists.`);
                        }
                        await tx.subscriptionPlanPrice.create({
                            data: {
                                ...price,
                                creator_id: auth.sub,
                                subscription_plan_id: id,
                                ...(price.other_currencies && {
                                    other_currencies: price.other_currencies
                                        ? JSON.parse(JSON.stringify(price.other_currencies))
                                        : undefined,
                                }),
                            },
                        });
                    }
                }
            }
            if (subscription_plan_roles) {
                const existingRoleIds = subscription_plan_roles
                    .filter((r) => r.id)
                    .map((r) => r.id);
                await tx.subscriptionPlanRole.deleteMany({
                    where: {
                        subscription_plan_id: id,
                        ...(existingRoleIds.length && {
                            NOT: { id: { in: existingRoleIds } },
                        }),
                    },
                });
                for (const role of subscription_plan_roles) {
                    if (role.id) {
                        await tx.subscriptionPlanRole.update({
                            where: { id: role.id },
                            data: {
                                title: role.title,
                                role_id: role.role_id,
                                selected: role.selected,
                                updated_at: new Date(),
                            },
                        });
                    }
                    else {
                        await tx.subscriptionPlanRole.create({
                            data: {
                                ...role,
                                selected: role.selected ?? false,
                                creator_id: auth.sub,
                                subscription_plan_id: id,
                            },
                        });
                    }
                }
            }
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.SUBSCRIPTION_PLAN,
                entity: 'SubscriptionPlan',
                entity_id: id,
                metadata: `User with ID ${auth.sub} updated a subscription plan.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, tx.log);
            return updatedPlan;
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Subscription plan updated successfully.',
        };
    }
    async fetchPublicSubscriptionPlans(businessId, filterDto) {
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterDto);
        const filters = {
            ...(filterDto.id && { id: filterDto.id }),
            ...(businessId && {
                business_id: businessId,
            }),
            ...(filterDto.q && {
                OR: [
                    {
                        name: {
                            contains: filterDto.q,
                            mode: 'insensitive',
                        },
                    },
                ],
            }),
            ...pagination_filters.filters,
            deleted_at: null,
        };
        const [subscription_plans, total] = await Promise.all([
            this.prisma.subscriptionPlan.findMany({
                where: filters,
                include: { subscription_plan_prices: true },
                skip: (pagination_filters.pagination_options.page - 1) *
                    pagination_filters.pagination_options.limit,
                take: pagination_filters.pagination_options.limit,
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.subscriptionPlan.count({ where: filters }),
        ]);
        return {
            statusCode: 200,
            data: subscription_plans,
            count: total,
        };
    }
};
exports.SubscriptionPlanService = SubscriptionPlanService;
exports.SubscriptionPlanService = SubscriptionPlanService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        log_service_1.LogService,
        generic_service_1.GenericService])
], SubscriptionPlanService);
//# sourceMappingURL=plan.service.js.map