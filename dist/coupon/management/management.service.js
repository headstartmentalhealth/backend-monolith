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
exports.CouponManagementService = void 0;
const generic_service_1 = require("../../generic/generic.service");
const log_service_1 = require("../../log/log.service");
const prisma_base_repository_1 = require("../../prisma/prisma.base.repository");
const prisma_service_1 = require("../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const generic_utils_1 = require("../../generic/generic.utils");
const moment = require("moment");
let CouponManagementService = class CouponManagementService {
    constructor(prisma, logService, genericService) {
        this.prisma = prisma;
        this.logService = logService;
        this.genericService = genericService;
        this.model = 'Coupon';
        this.select = {
            id: true,
            code: true,
            type: true,
            value: true,
            currency: true,
            start_date: true,
            end_date: true,
            usage_limit: true,
            user_limit: true,
            min_purchase: true,
            is_active: true,
            created_at: true,
            creator: {
                select: {
                    id: true,
                    name: true,
                    role: { select: { name: true, role_id: true } },
                },
            },
            business: {
                select: {
                    id: true,
                    business_name: true,
                    user_id: true,
                },
            },
        };
        this.couponRepository = new prisma_base_repository_1.PrismaBaseRepository('coupon', prisma);
    }
    async create(request, dto) {
        const auth = request.user;
        const { code, business_id, start_date, end_date } = dto;
        return this.prisma.$transaction(async (prisma) => {
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id,
            }, true);
            const existing_coupon = await prisma.coupon.findUnique({
                where: {
                    code_business_id: {
                        code,
                        business_id,
                    },
                },
            });
            if (existing_coupon) {
                throw new common_1.ConflictException('Coupon exists.');
            }
            const coupon = await prisma.coupon.create({
                data: {
                    ...dto,
                    start_date: moment(start_date).toDate(),
                    end_date: moment(end_date).toDate(),
                    creator_id: auth.sub,
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_COUPON,
                entity: this.model,
                entity_id: coupon.id,
                metadata: `User with ID ${auth.sub} just created a coupon ID ${coupon.id} for Business ID of ${coupon.business_id}`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.CREATED,
                message: 'Coupon created successfully.',
            };
        });
    }
    async fetch(payload, param, filterDto) {
        const auth = payload.user;
        const { business_id } = param;
        const { is_active, q } = filterDto;
        await this.genericService.isUserLinkedToBusiness(this.prisma, {
            user_id: auth.sub,
            business_id: business_id,
        }, true);
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterDto);
        const filters = {
            ...(q && {
                OR: [
                    {
                        code: { contains: q, mode: 'insensitive' },
                    },
                    isNaN(Number(q)) ? {} : { value: { equals: Number(q) } },
                ],
            }),
            ...(is_active && { is_active: (0, generic_utils_1.getBooleanOption)(is_active) }),
            ...(business_id && { business_id }),
            ...pagination_filters.filters,
            tz: payload.timezone,
        };
        const select = this.select;
        const [coupons, total] = await Promise.all([
            this.couponRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, select),
            this.couponRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: coupons,
            count: total,
        };
    }
    async findOne(id, business_id) {
        const select = this.select;
        const filters = {
            ...(business_id && { business_id }),
            id,
        };
        const coupon = await this.couponRepository.findOne(filters, undefined, select);
        if (!coupon) {
            throw new common_1.NotFoundException(`Coupon not found for this business`);
        }
        return coupon;
    }
    async fetchSingle(request, param) {
        const { id } = param;
        const coupon = await this.findOne(id, request['Business-Id']);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Coupon details fetched successfully.',
            data: coupon,
        };
    }
    async update(request, param, dto) {
        const auth = request.user;
        const { id } = param;
        const { start_date, end_date } = dto;
        return this.prisma.$transaction(async (prisma) => {
            const existing_coupon = await this.findOne(id);
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id: existing_coupon.business.id,
            });
            await prisma.coupon.update({
                where: { id: existing_coupon.id },
                data: {
                    ...dto,
                    ...(start_date && { start_date: moment(start_date).toDate() }),
                    ...(end_date && { end_date: moment(end_date).toDate() }),
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_COUPON,
                entity: this.model,
                entity_id: existing_coupon.id,
                metadata: `User with ID ${auth.sub} just updated a coupon ID ${existing_coupon.id} for the business ID ${existing_coupon.business.id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Coupon updated successfully.',
            };
        });
    }
    async delete(request, param) {
        const auth = request.user;
        const { id } = param;
        return this.prisma.$transaction(async (prisma) => {
            const existing_coupon = await this.findOne(id);
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id: existing_coupon.business.id,
            });
            await prisma.coupon.update({
                where: { id: existing_coupon.id },
                data: {
                    code: (0, generic_utils_1.deletionRename)(existing_coupon.code),
                    deleted_at: new Date(),
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_COUPON,
                entity: this.model,
                entity_id: existing_coupon.id,
                metadata: `User with ID ${auth.sub} just deleted a coupon ID ${existing_coupon.id} for the business ID ${existing_coupon.business.id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Coupon deleted successfully.',
            };
        });
    }
    async fetchAll(payload, filterDto) {
        const auth = payload.user;
        const { is_active, business_id } = filterDto;
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterDto);
        const filters = {
            ...(filterDto.q && {
                OR: [
                    {
                        code: { contains: filterDto.q, mode: 'insensitive' },
                    },
                ],
            }),
            ...(is_active && { is_active: (0, generic_utils_1.getBooleanOption)(is_active) }),
            ...(business_id && { business_id }),
            ...pagination_filters.filters,
            tz: payload.timezone,
        };
        const select = this.select;
        const [coupons, total] = await Promise.all([
            this.couponRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, select),
            this.couponRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: coupons,
            count: total,
        };
    }
    async validateAndApplyCoupon(email, code, amount) {
        const now = new Date();
        const user_details = await this.prisma.user.findFirst({ where: { email } });
        if (!user_details) {
            throw new common_1.NotFoundException('User account not found.');
        }
        const coupon = await this.prisma.coupon.findFirst({
            where: {
                code,
                is_active: true,
                deleted_at: null,
                start_date: { lte: now },
                end_date: { gte: now },
            },
        });
        if (!coupon) {
            throw new common_1.NotFoundException('Invalid or expired coupon.');
        }
        if (amount < coupon.min_purchase) {
            throw new common_1.ConflictException(`This coupon requires a minimum purchase of ${(0, generic_utils_1.formatMoney)(coupon.min_purchase, coupon.currency)}.`);
        }
        const totalUsages = await this.prisma.couponUsage.count({
            where: { coupon_id: coupon.id },
        });
        if (totalUsages >= coupon.usage_limit) {
            throw new common_1.ConflictException('This coupon has reached its usage limit.');
        }
        const userUsages = await this.prisma.couponUsage.count({
            where: {
                coupon_id: coupon.id,
                user_id: user_details.id,
            },
        });
        if (userUsages >= coupon.user_limit) {
            throw new common_1.ConflictException('You have exceeded the usage limit for this coupon.');
        }
        let discount = 0;
        if (coupon.type === client_1.CouponType.PERCENTAGE) {
            discount = (coupon.value / 100) * amount;
        }
        else if (coupon.type === client_1.CouponType.FLAT) {
            discount = coupon.value;
        }
        const discountedAmount = Math.max(amount - discount, 0);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: {
                discountedAmount,
                discount,
            },
            message: `Coupon applied successfully. You saved ${(0, generic_utils_1.formatMoney)(+discount.toFixed(2), coupon.currency)}.`,
        };
    }
};
exports.CouponManagementService = CouponManagementService;
exports.CouponManagementService = CouponManagementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        log_service_1.LogService,
        generic_service_1.GenericService])
], CouponManagementService);
//# sourceMappingURL=management.service.js.map