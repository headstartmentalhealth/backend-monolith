import { GenericService } from '../../generic/generic.service';
import { LogService } from '../../log/log.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Coupon, CouponType, CouponUsage, Prisma, PrismaClient } from '@prisma/client';
import { CreateCouponUsageDto, ValidateCouponUsageDto } from './usage.dto';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { AuthPayload, PagePayload } from '../../generic/generic.payload';
import { QueryDto } from '../../generic/generic.dto';
import { CouponManagementService } from '../management/management.service';
export declare class CouponUsageService {
    private readonly prisma;
    private readonly logService;
    private readonly genericService;
    private readonly couponManagementService;
    private readonly model;
    private readonly couponUsageRepository;
    private readonly select;
    constructor(prisma: PrismaService, logService: LogService, genericService: GenericService, couponManagementService: CouponManagementService);
    createWithTrx(createCouponUsageDto: CreateCouponUsageDto, couponUsageRepo: Prisma.CouponUsageDelegate<DefaultArgs, Prisma.PrismaClientOptions>): Promise<CouponUsage>;
    fetch(payload: AuthPayload, param: {
        coupon_id: string;
    }, queryDto: QueryDto): Promise<PagePayload<CouponUsage>>;
    validateCouponUsage(validateCouponUsageDto: ValidateCouponUsageDto, purchaseAmount: number): Promise<Coupon>;
    getDiscountedAmount(amount: number, discountValue: number, couponType: 'FLAT' | 'PERCENTAGE'): number;
    getDiscountValue(amount: number, discountValue: number, couponType: CouponType): number;
    rollbackCouponUsage(coupon_id: string, user_id: string, prisma: PrismaClient | Prisma.TransactionClient): Promise<{
        id: string;
        user_id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        coupon_id: string;
        discount_applied: Prisma.Decimal;
    }>;
}
