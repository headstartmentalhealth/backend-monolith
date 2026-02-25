import { BooleanOptions } from '@/generic/generic.utils';
import { CouponType } from '@prisma/client';
export declare class CreateCouponDto {
    code: string;
    type: CouponType;
    value: number;
    start_date: string;
    end_date: string;
    usage_limit: number;
    user_limit: number;
    min_purchase: number;
    business_id: string;
}
declare const UpdateCouponDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateCouponDto>>;
export declare class UpdateCouponDto extends UpdateCouponDto_base {
    is_active?: boolean;
}
export declare class FilterCouponsDto {
    is_active?: BooleanOptions;
    q?: string;
    business_id: string;
}
export declare class ApplyCouponDto {
    email: string;
    code: string;
    amount: string;
}
export {};
