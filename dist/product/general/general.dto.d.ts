import { QueryDto } from '@/generic/generic.dto';
import { ProductStatus, ProductType } from '@prisma/client';
export declare class FilterProductDto extends QueryDto {
    q?: string;
    status?: ProductStatus;
    business_id: string;
    type?: ProductType;
    min_price?: number;
    max_price?: number;
}
