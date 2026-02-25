import { QueryDto } from '@/generic/generic.dto';
import { OtherCurrencyDto } from '@/product/course/crud/crud.dto';
import { ProductStatus, SubscriptionPeriod } from '@prisma/client';
export declare class CreateSubscriptionPlanDto {
    name: string;
    slug: string;
    category_id?: string;
    description?: string;
    multimedia_id?: string;
    business_id: string;
    status?: ProductStatus;
}
export declare class UpdateSubscriptionPlanDto {
    name?: string;
    slug: string;
    description?: string;
    cover_image?: string;
    category_id?: string;
    multimedia_id?: string;
    status?: ProductStatus;
}
export declare class FilterPlansDto {
    period?: SubscriptionPeriod;
}
export declare class FilterBusinessPlansDto extends QueryDto {
    q?: string;
    business_id: string;
}
export declare class CreateSubscriptionPlanPriceDto {
    price: number;
    currency: string;
    period: SubscriptionPeriod;
    other_currencies?: OtherCurrencyDto[];
}
export declare class CreateSubscriptionPlanRoleDto {
    title: string;
    role_id: string;
    selected?: boolean;
}
export declare class CreateSubscriptionPlanDto2 {
    name: string;
    slug: string;
    business_id: string;
    category_id?: string;
    creator_id: string;
    description?: string;
    multimedia_id?: string;
    cover_image?: string;
    status?: ProductStatus;
    subscription_plan_prices: CreateSubscriptionPlanPriceDto[];
    subscription_plan_roles: CreateSubscriptionPlanRoleDto[];
}
export declare class UpdateSubscriptionPlanPriceDto {
    id?: string;
    price: number;
    currency: string;
    period: SubscriptionPeriod;
    other_currencies?: OtherCurrencyDto[];
}
export declare class UpdateSubscriptionPlanRoleDto {
    id?: string;
    title: string;
    role_id: string;
    selected?: boolean;
}
export declare class UpdateSubscriptionPlanDto2 {
    name?: string;
    slug: string;
    description?: string;
    cover_image?: string;
    multimedia_id?: string;
    category_id?: string;
    product_id?: string;
    status: ProductStatus;
    subscription_plan_prices: UpdateSubscriptionPlanPriceDto[];
    subscription_plan_roles?: UpdateSubscriptionPlanRoleDto[];
}
export declare class FilterPlanDto extends QueryDto {
    q?: string;
}
export declare class FilterSubscriptionPlanDto extends QueryDto {
    q?: string;
    id?: string;
}
