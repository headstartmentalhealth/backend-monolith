import { OtherCurrencyDto } from '@/product/course/crud/crud.dto';
import { ProductStatus } from '@prisma/client';
export declare class CreateDigitalProductDto {
    title: string;
    slug: string;
    description?: string;
    keywords?: string;
    metadata?: any;
    category_id: string;
    status?: ProductStatus;
    multimedia_id: string;
    multimedia_zip_id: string;
    price: number;
    original_price?: number;
    other_currencies?: OtherCurrencyDto[];
}
declare const UpdateDigitalProductDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateDigitalProductDto>>;
export declare class UpdateDigitalProductDto extends UpdateDigitalProductDto_base {
}
export {};
