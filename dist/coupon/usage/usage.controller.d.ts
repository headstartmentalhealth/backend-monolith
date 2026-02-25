import { CouponUsageService } from './usage.service';
import { AuthPayload, PagePayload } from '@/generic/generic.payload';
import { QueryDto } from '@/generic/generic.dto';
import { CouponUsage } from '@prisma/client';
export declare class CouponUsageController {
    private readonly couponUsageService;
    constructor(couponUsageService: CouponUsageService);
    fetch(request: AuthPayload & Request, param: {
        coupon_id: string;
    }, filterDto: QueryDto): Promise<PagePayload<CouponUsage>>;
}
