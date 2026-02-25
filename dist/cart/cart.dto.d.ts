import { MeasurementMetadataDto, QueryDto } from '@/generic/generic.dto';
import { ProductType } from '@prisma/client';
export declare class AddToCartDto {
    product_id: string;
    product_type: ProductType;
    quantity: number;
    currency?: string;
    metadata?: any;
}
export declare class UpdateCartItemDto {
    quantity: number;
}
export declare class RemoveCartItemsDto {
    user_id: string;
    product_ids: string[];
}
export declare class FilterCartDto extends QueryDto {
    q?: string;
    business_id: string;
}
export declare class AddMultipleToCartItemDto {
    product_id: string;
    product_type: ProductType;
    quantity: number;
    metadata?: MeasurementMetadataDto[];
}
export declare class AddMultipleToCartDto {
    items: AddMultipleToCartItemDto[];
}
