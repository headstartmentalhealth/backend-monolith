import { PrismaService } from '../prisma/prisma.service';
import { CreateBlogPostDto, FilterBlogPostDto, UpdateBlogPostDto } from './blog-post.dto';
import { BlogPost } from '@prisma/client';
import { LogService } from '@/log/log.service';
import { GenericService } from '@/generic/generic.service';
import { AuthPayload, GenericDataPayload, GenericPayload, GenericPayloadAlias, PagePayload } from '@/generic/generic.payload';
import { IdDto } from '@/generic/generic.dto';
export declare class BlogPostService {
    private readonly prisma;
    private readonly logService;
    private readonly genericService;
    private readonly model;
    private readonly blogPostRepository;
    private readonly select;
    constructor(prisma: PrismaService, logService: LogService, genericService: GenericService);
    create(request: AuthPayload & Request, dto: CreateBlogPostDto): Promise<GenericPayloadAlias<BlogPost>>;
    fetch(payload: AuthPayload, filterDto: FilterBlogPostDto): Promise<PagePayload<BlogPost>>;
    fetchSingle(payload: AuthPayload, param: IdDto): Promise<GenericDataPayload<BlogPost>>;
    fetchPublic(filterDto: FilterBlogPostDto): Promise<PagePayload<BlogPost>>;
    fetchSinglePublic(param: IdDto): Promise<GenericDataPayload<BlogPost>>;
    update(request: AuthPayload & Request, param: IdDto, dto: UpdateBlogPostDto): Promise<GenericPayloadAlias<BlogPost>>;
    delete(request: AuthPayload & Request, param: IdDto): Promise<GenericPayload>;
}
