import { ProductStatus } from '@prisma/client';
import { QueryDto } from '@/generic/generic.dto';
export declare class CreateCourseDto {
    title: string;
    slug: string;
    description?: string;
    keywords?: string;
    metadata?: any;
    status?: ProductStatus;
    multimedia_id: string;
    price: number;
    original_price: number;
    category_id: string;
    other_currencies?: OtherCurrencyDto[];
}
export declare class UpdateCourseDto {
    title?: string;
    price?: number;
    original_price: number;
    slug: string;
    description?: string;
    keywords?: string;
    metadata?: any;
    category_id?: string;
    multimedia_id?: string;
    status?: ProductStatus;
    other_currencies?: OtherCurrencyDto[];
}
export declare class FilterCourseDto extends QueryDto {
    q?: string;
    status?: ProductStatus;
}
export declare class BulkCreateCourseDto {
    courses: ImportCourseDto[];
}
export declare class ImportCourseDto {
    title: string;
    slug: string;
    description?: string;
    price: number;
    original_price: number;
    keywords?: string;
    metadata?: any;
    multimedia_url: string;
    category_name: string;
    status?: ProductStatus;
    other_currencies?: OtherCurrencyDto[];
}
export declare class OtherCurrencyDto {
    currency: string;
    price: number;
    original_price?: number;
}
