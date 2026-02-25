import { QueryDto } from '@/generic/generic.dto';
export declare class CreateReviewDto {
    rating: number;
    title?: string;
    content?: string;
    product_id: string;
}
declare const UpdateReviewDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateReviewDto>>;
export declare class UpdateReviewDto extends UpdateReviewDto_base {
}
export declare class QueryReviewsDto extends QueryDto {
    product_id?: string;
    q?: string;
}
export declare class AverageRatingDto {
    product_id: string;
    averageRating: number;
    totalReviews: number;
}
export declare class FetchReviewAvgDto {
    product_id: string;
}
export {};
