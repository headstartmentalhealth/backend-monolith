import { OtherCurrencyDto } from '@/product/course/crud/crud.dto';
import { PhysicalProductGender, PhysicalProductType, ProductStatus } from '@prisma/client';
export declare class PhysicalProductDto {
    sizes?: any[];
    colors?: any[];
    location: string;
    stock: number;
    type?: PhysicalProductType;
    measurements?: any[];
    gender: PhysicalProductGender;
    estimated_production_time?: number;
    min_required?: number;
    multimedia_ids?: string[];
}
export declare class CreatePhysicalProductDto {
    title: string;
    slug: string;
    description?: string;
    keywords?: string;
    metadata?: any;
    category_id: string;
    status?: ProductStatus;
    multimedia_id: string;
    price: number;
    original_price?: number;
    other_currencies?: OtherCurrencyDto[];
    details: PhysicalProductDto;
}
declare const UpdatePhysicalProductDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreatePhysicalProductDto>>;
export declare class UpdatePhysicalProductDto extends UpdatePhysicalProductDto_base {
}
export declare class AddPhysicalProductMedia {
    multimedia_ids: string[];
}
export declare class ProductDto {
    product_id: string;
}
export {};
