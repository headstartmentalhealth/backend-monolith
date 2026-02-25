import { SubscriptionPeriod } from '@prisma/client';
export declare class CreateSubscriptionPlanPriceDto {
    subscription_plan_id: string;
    price: number;
    period: SubscriptionPeriod;
}
declare const UpdateSubscriptionPlanPriceDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateSubscriptionPlanPriceDto>>;
export declare class UpdateSubscriptionPlanPriceDto extends UpdateSubscriptionPlanPriceDto_base {
}
export {};
