import { CouponManagementService } from './management.service';
import { AuthPayload, GenericPayload, GenericPayloadAlias, PagePayload } from '@/generic/generic.payload';
import { ApplyCouponDto, CreateCouponDto, FilterCouponsDto, UpdateCouponDto } from './management.dto';
import { IdDto, QueryDto } from '@/generic/generic.dto';
import { Coupon } from '@prisma/client';
import { CouponSelection, RelatedModels } from './management.utils';
export declare class CouponManagementController {
    private readonly couponManagementService;
    constructor(couponManagementService: CouponManagementService);
    create(request: AuthPayload & Request, createCouponDto: CreateCouponDto): Promise<GenericPayload>;
    fetch(request: AuthPayload & Request, param: {
        business_id: string;
    }, filterDto: FilterCouponsDto & QueryDto): Promise<PagePayload<Coupon>>;
    fetchDetails(request: AuthPayload & Request, param: IdDto): Promise<GenericPayloadAlias<CouponSelection & RelatedModels>>;
    update(request: AuthPayload & Request, param: {
        id: string;
    }, updateCouponDto: UpdateCouponDto): Promise<GenericPayload>;
    delete(request: AuthPayload & Request, param: {
        id: string;
    }): Promise<GenericPayload>;
    fetchAll(request: AuthPayload & Request, filterDto: FilterCouponsDto & QueryDto): Promise<PagePayload<Coupon>>;
    applyCoupon(body: ApplyCouponDto): Promise<GenericPayloadAlias<{
        discountedAmount: number;
        discount: number;
    }>>;
}
