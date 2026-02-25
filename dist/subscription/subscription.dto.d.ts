import { PaymentMethod } from '@prisma/client';
export declare class CreateSubscriptionDto {
    email: string;
    plan_price_id: string;
    payment_method: PaymentMethod;
    billing_id?: string;
    auto_renew: boolean;
    currency: string;
}
export declare class VerifySubscriptionDto {
    payment_id: string;
}
export declare class RenewSubscriptionDto {
    subscription_id: string;
}
export declare class UpgradeSubscriptionDto {
    new_plan_price_id: string;
    payment_method: PaymentMethod;
}
