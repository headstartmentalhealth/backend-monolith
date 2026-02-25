import { MeasurementMetadataDto } from '@/generic/generic.dto';
import { CouponType, ProductType, SubscriptionPeriod } from '@prisma/client';
export declare class TransactionSchema {
    user_id: string;
    purchases: any[];
    coupon_id: string;
    coupon_code: string;
    coupon_value: number;
}
export declare class PurchaseSchema {
    name: string;
    tier_name?: string;
    price: number;
    id: string;
    product_id: string;
    quantity: number;
    created_at: Date;
    purchase_type: ProductType;
    interval?: SubscriptionPeriod;
    auto_renew?: boolean;
    metadata?: MeasurementMetadataDto[];
}
export declare class CompletePurchaseDetailSchema {
    items: PurchaseSchema[];
    coupon_id: string;
    coupon_code: string;
    coupon_value: number;
    coupon_type: CouponType;
    business_id: string;
    currency?: string;
    payment_id: string;
}
