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
exports.SubscriptionPlanRoleService = void 0;
const generic_service_1 = require("../../generic/generic.service");
const log_service_1 = require("../../log/log.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const generic_utils_1 = require("../../generic/generic.utils");
const role_utils_1 = require("./role.utils");
const client_1 = require("@prisma/client");
const prisma_base_repository_1 = require("../../prisma/prisma.base.repository");
let SubscriptionPlanRoleService = class SubscriptionPlanRoleService {
    constructor(prisma, logService, genericService) {
        this.prisma = prisma;
        this.logService = logService;
        this.genericService = genericService;
        this.select = {
            id: true,
            title: true,
            role_id: true,
            selected: true,
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
        this.subscriptionPlanRoleRepository = new prisma_base_repository_1.PrismaBaseRepository('subscriptionPlanRole', prisma);
        this.subscriptionPlanRepository = new prisma_base_repository_1.PrismaBaseRepository('subscriptionPlan', prisma);
    }
    async create(request, dto) {
        const auth = request.user;
        let { title, subscription_plan_id } = dto;
        return this.prisma.$transaction(async (prisma) => {
            const subscription_plan = await prisma.subscriptionPlan.findUnique({
                where: { id: subscription_plan_id },
                include: { subscription_plan_roles: { where: { deleted_at: null } } },
            });
            (0, generic_utils_1.verifySubscriptionPlan)(subscription_plan);
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id: subscription_plan.business_id,
            });
            const role_id = (0, role_utils_1.composeRoleID)(title);
            const sub_plan_role = await prisma.subscriptionPlanRole.findUnique({
                where: {
                    title_role_id: {
                        title,
                        role_id,
                    },
                    subscription_plan_id,
                },
            });
            if (sub_plan_role) {
                throw new common_1.ConflictException("Subscription plan's role exists.");
            }
            const role = await prisma.subscriptionPlanRole.create({
                data: {
                    ...dto,
                    creator_id: auth.sub,
                    role_id,
                    selected: !subscription_plan.subscription_plan_roles.length && true,
                },
                select: {
                    id: true,
                    subscription_plan: { select: { business_id: true } },
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.SUBSCRIPTION_PLAN_ROLE,
                entity: 'SubscriptionPlanRole',
                entity_id: role.id,
                metadata: `User with ID ${auth.sub} just created a role for subscription plan ID ${subscription_plan_id} of Business ID ${role.subscription_plan.business_id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.CREATED,
                message: "Subscription plan's role created successfully.",
            };
        });
    }
    async fetch(payload, param, queryDto) {
        const auth = payload.user;
        const { subscription_plan_id } = param;
        let select = {
            business_id: true,
        };
        const subscription_plan = await this.subscriptionPlanRepository.findOne({ id: subscription_plan_id }, undefined, select);
        (0, generic_utils_1.verifySubscriptionPlan)(subscription_plan);
        await this.genericService.isUserLinkedToBusiness(this.prisma, {
            user_id: auth.sub,
            business_id: subscription_plan.business_id,
        });
        const pagination_filters = (0, generic_utils_1.pageFilter)(queryDto);
        let filters = {
            ...(subscription_plan_id && { subscription_plan_id }),
            ...pagination_filters.filters,
            tz: payload.timezone,
        };
        select = this.select;
        const [plan_roles, total] = await Promise.all([
            this.subscriptionPlanRoleRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, select),
            this.subscriptionPlanRoleRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: plan_roles,
            count: total,
        };
    }
    async findOne(id) {
        const select = this.select;
        const filters = {
            id,
        };
        const role = await this.subscriptionPlanRoleRepository.findOne(filters, undefined, select);
        if (!role) {
            throw new common_1.NotFoundException(`Subscription plan's role not found for this subscription plan`);
        }
        return role;
    }
    async update(request, param, dto) {
        const auth = request.user;
        const { id } = param;
        return this.prisma.$transaction(async (prisma) => {
            const existing_plan_role = await this.findOne(id);
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id: existing_plan_role.subscription_plan.business_id,
            });
            await prisma.subscriptionPlanRole.update({
                where: { id: existing_plan_role.id },
                data: {
                    ...dto,
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.SUBSCRIPTION_PLAN_ROLE,
                entity: 'SubscriptionPlanRole',
                entity_id: existing_plan_role.id,
                metadata: `User with ID ${auth.sub} just updated a subscription plan role for subscription plan ID ${existing_plan_role.subscription_plan.id} of business ID ${existing_plan_role.subscription_plan.business_id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: "Subscription plan's role updated successfully.",
            };
        });
    }
    async delete(request, param) {
        const auth = request.user;
        const { id } = param;
        return this.prisma.$transaction(async (prisma) => {
            const existing_plan_role = await this.findOne(id);
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id: existing_plan_role.subscription_plan.business_id,
            });
            await prisma.subscriptionPlanRole.update({
                where: { id: existing_plan_role.id },
                data: {
                    title: (0, generic_utils_1.deletionRename)(existing_plan_role.title),
                    role_id: (0, generic_utils_1.deletionRename)(existing_plan_role.role_id),
                    deleted_at: new Date(),
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.SUBSCRIPTION_PLAN_ROLE,
                entity: 'SubscriptionPlanRole',
                entity_id: existing_plan_role.id,
                metadata: `User with ID ${auth.sub} just deleted a subscription plan role ID ${existing_plan_role.id} from subscription plan ${existing_plan_role.subscription_plan.id} of business ID ${existing_plan_role.subscription_plan.business_id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: "Subscription plan's role deleted successfully.",
            };
        });
    }
};
exports.SubscriptionPlanRoleService = SubscriptionPlanRoleService;
exports.SubscriptionPlanRoleService = SubscriptionPlanRoleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        log_service_1.LogService,
        generic_service_1.GenericService])
], SubscriptionPlanRoleService);
//# sourceMappingURL=role.service.js.map