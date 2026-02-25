import { Prisma } from '@prisma/client';
export declare class CreateCouponUsageDto {
    coupon_id: string;
    user_id: string;
    discount_applied: Prisma.Decimal;
}
export declare class ValidateCouponUsageDto {
    coupon_code: string;
    user_id: string;
    discount_applied?: number;
}
