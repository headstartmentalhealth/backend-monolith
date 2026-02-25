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
exports.CouponUsageService = void 0;
const generic_service_1 = require("../../generic/generic.service");
const log_service_1 = require("../../log/log.service");
const prisma_base_repository_1 = require("../../prisma/prisma.base.repository");
const prisma_service_1 = require("../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const management_service_1 = require("../management/management.service");
const generic_utils_1 = require("../../generic/generic.utils");
let CouponUsageService = class CouponUsageService {
    constructor(prisma, logService, genericService, couponManagementService) {
        this.prisma = prisma;
        this.logService = logService;
        this.genericService = genericService;
        this.couponManagementService = couponManagementService;
        this.model = 'CouponUsage';
        this.select = {
            id: true,
            discount_applied: true,
            created_at: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    role: { select: { name: true, role_id: true } },
                },
            },
            coupon: {
                select: {
                    id: true,
                    code: true,
                },
            },
        };
        this.couponUsageRepository = new prisma_base_repository_1.PrismaBaseRepository('couponUsage', prisma);
    }
    async createWithTrx(createCouponUsageDto, couponUsageRepo) {
        return await couponUsageRepo.create({
            data: { ...createCouponUsageDto },
        });
    }
    async fetch(payload, param, queryDto) {
        const auth = payload.user;
        const { coupon_id } = param;
        const found_coupon = await this.couponManagementService.findOne(coupon_id);
        await this.genericService.isUserLinkedToBusiness(this.prisma, {
            user_id: auth.sub,
            business_id: found_coupon.business.id,
        });
        const pagination_filters = (0, generic_utils_1.pageFilter)(queryDto);
        const filters = {
            ...(coupon_id && { coupon_id }),
            ...pagination_filters.filters,
            tz: payload.timezone,
        };
        const select = this.select;
        const [coupon_usages, total] = await Promise.all([
            this.couponUsageRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, select),
            this.couponUsageRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: coupon_usages,
            count: total,
        };
    }
    async validateCouponUsage(validateCouponUsageDto, purchaseAmount) {
        const { coupon_code, user_id, discount_applied } = validateCouponUsageDto;
        const currentDate = new Date();
        const coupon = await this.prisma.coupon.findUnique({
            where: { code: coupon_code },
            include: { coupon_usages: true },
        });
        if (!coupon || !coupon.is_active) {
            throw new common_1.HttpException('Coupon not found or inactive', common_1.HttpStatus.NOT_FOUND);
        }
        if (currentDate < coupon.start_date || currentDate > coupon.end_date) {
            throw new common_1.HttpException('Coupon is not valid at this time', common_1.HttpStatus.BAD_REQUEST);
        }
        if (coupon.usage_limit <= coupon.coupon_usages.length) {
            throw new common_1.HttpException('Coupon usage limit exceeded', common_1.HttpStatus.BAD_REQUEST);
        }
        const userUsageCount = coupon.coupon_usages.filter((usage) => usage.user_id === user_id).length;
        if (userUsageCount >= coupon.user_limit) {
            throw new common_1.HttpException('User coupon usage limit exceeded', common_1.HttpStatus.BAD_REQUEST);
        }
        if (discount_applied) {
            if (coupon.type === client_1.CouponType.PERCENTAGE) {
                if (discount_applied > coupon.value) {
                    throw new common_1.HttpException('Discount applied exceeds the allowed percentage', common_1.HttpStatus.BAD_REQUEST);
                }
            }
            else if (coupon.type === client_1.CouponType.FLAT) {
                if (discount_applied !== coupon.value) {
                    throw new common_1.HttpException('Discount applied does not match the flat coupon value', common_1.HttpStatus.BAD_REQUEST);
                }
            }
        }
        if (purchaseAmount < coupon.min_purchase) {
            throw new common_1.HttpException(`Minimum purchase amount of ${coupon.min_purchase} is required to use this coupon`, common_1.HttpStatus.BAD_REQUEST);
        }
        return coupon;
    }
    getDiscountedAmount(amount, discountValue, couponType) {
        if (couponType === 'FLAT') {
            return Math.max(amount - discountValue, 0);
        }
        else if (couponType === 'PERCENTAGE') {
            const discountAmount = (amount * discountValue) / 100;
            return Math.max(amount - discountAmount, 0);
        }
        else {
            throw new Error('Invalid coupon type. Must be "FLAT" or "PERCENTAGE".');
        }
    }
    getDiscountValue(amount, discountValue, couponType) {
        return couponType === client_1.CouponType.FLAT
            ? discountValue
            : (amount * discountValue) / 100;
    }
    async rollbackCouponUsage(coupon_id, user_id, prisma) {
        const usage = await prisma.couponUsage.findFirst({
            where: {
                coupon_id,
                user_id,
                deleted_at: null,
            },
            orderBy: { created_at: 'desc' },
        });
        if (!usage) {
            return null;
        }
        const rolledBack = await prisma.couponUsage.delete({
            where: { id: usage.id },
        });
        return rolledBack;
    }
};
exports.CouponUsageService = CouponUsageService;
exports.CouponUsageService = CouponUsageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        log_service_1.LogService,
        generic_service_1.GenericService,
        management_service_1.CouponManagementService])
], CouponUsageService);
//# sourceMappingURL=usage.service.js.map