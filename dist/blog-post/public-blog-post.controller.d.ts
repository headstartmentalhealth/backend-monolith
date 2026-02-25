import { BlogPostService } from './blog-post.service';
import { FilterBlogPostDto } from './blog-post.dto';
import { IdDto } from '@/generic/generic.dto';
export declare class PublicBlogPostController {
    private readonly blogPostService;
    constructor(blogPostService: BlogPostService);
    fetch(filterDto: FilterBlogPostDto): Promise<import("../generic/generic.payload").PagePayload<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        business_id: string | null;
        cover_image: string | null;
        title: string;
        published_at: Date | null;
        slug: string;
        content: string;
        category: string | null;
        excerpt: string | null;
        is_published: boolean;
        author_id: string;
    }>>;
    fetchSingle(param: IdDto): Promise<import("../generic/generic.payload").GenericDataPayload<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        business_id: string | null;
        cover_image: string | null;
        title: string;
        published_at: Date | null;
        slug: string;
        content: string;
        category: string | null;
        excerpt: string | null;
        is_published: boolean;
        author_id: string;
    }>>;
}
