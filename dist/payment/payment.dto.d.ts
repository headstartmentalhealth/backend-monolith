import { PaymentStatus, PurchaseType, PaymentMethod, ProductType } from '@prisma/client';
import { MeasurementMetadataDto, QueryDto } from '@/generic/generic.dto';
export declare class CreatePaymentDto {
    email: string;
    purchases: PurchaseItemDto[];
    amount: number;
    currency: string;
    business_id: string;
    coupon_code?: string;
    payment_method: PaymentMethod;
    billing_id?: string;
    metadata?: any;
}
declare class PurchaseItemDto {
    purchase_id: string;
    purchase_type: ProductType;
    quantity: number;
    metadata?: MeasurementMetadataDto[];
}
export declare class VerifyPaymentDto {
    payment_id?: string;
}
export declare class PaymentIdDto {
    payment_id?: string;
}
export declare class QueryPaymentsDto extends QueryDto {
    purchase_type?: PurchaseType;
    payment_status?: PaymentStatus;
    business_id?: string;
    q?: string;
}
export declare class PaymentMetaDataDto {
    reason: string;
    business_id: string;
}
export declare class InitiateWithdrawalDto {
    amount: number;
    currency: string;
}
export {};
