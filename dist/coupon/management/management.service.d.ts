import { AuthPayload, GenericPayload, GenericPayloadAlias, PagePayload } from '../../generic/generic.payload';
import { GenericService } from '../../generic/generic.service';
import { LogService } from '../../log/log.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Coupon } from '@prisma/client';
import { CreateCouponDto, FilterCouponsDto, UpdateCouponDto } from './management.dto';
import { IdDto, QueryDto } from '../../generic/generic.dto';
import { CouponSelection, RelatedModels } from './management.utils';
export declare class CouponManagementService {
    private readonly prisma;
    private readonly logService;
    private readonly genericService;
    private readonly model;
    private readonly couponRepository;
    private readonly select;
    constructor(prisma: PrismaService, logService: LogService, genericService: GenericService);
    create(request: AuthPayload & Request, dto: CreateCouponDto): Promise<GenericPayload>;
    fetch(payload: AuthPayload, param: {
        business_id: string;
    }, filterDto: FilterCouponsDto & QueryDto): Promise<PagePayload<Coupon>>;
    findOne(id: string, business_id?: string): Promise<CouponSelection & RelatedModels>;
    fetchSingle(request: AuthPayload, param: IdDto): Promise<GenericPayloadAlias<CouponSelection & RelatedModels>>;
    update(request: AuthPayload & Request, param: {
        id: string;
    }, dto: UpdateCouponDto): Promise<GenericPayload>;
    delete(request: AuthPayload & Request, param: {
        id: string;
    }): Promise<GenericPayload>;
    fetchAll(payload: AuthPayload, filterDto: FilterCouponsDto & QueryDto): Promise<PagePayload<Coupon>>;
    validateAndApplyCoupon(email: string, code: string, amount: number): Promise<GenericPayloadAlias<{
        discountedAmount: number;
        discount: number;
    }>>;
}
