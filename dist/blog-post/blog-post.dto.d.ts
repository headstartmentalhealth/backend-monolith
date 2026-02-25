import { QueryDto } from '@/generic/generic.dto';
export declare class CreateBlogPostDto {
    author_id?: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    cover_image?: string;
    category?: string;
    is_published?: boolean;
    published_at?: Date;
}
export declare class UpdateBlogPostDto {
    author_id?: string;
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    cover_image?: string;
    category?: string;
    is_published?: boolean;
    published_at?: Date;
}
export declare class FilterBlogPostDto extends QueryDto {
    q?: string;
    is_published?: boolean;
    category?: string;
}
