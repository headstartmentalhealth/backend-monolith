"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogPostService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const prisma_base_repository_1 = require("../prisma/prisma.base.repository");
const client_1 = require("@prisma/client");
const log_service_1 = require("../log/log.service");
const generic_service_1 = require("../generic/generic.service");
const generic_utils_1 = require("../generic/generic.utils");
let BlogPostService = class BlogPostService {
    constructor(prisma, logService, genericService) {
        this.prisma = prisma;
        this.logService = logService;
        this.genericService = genericService;
        this.model = 'BlogPost';
        this.select = {
            id: true,
            title: true,
            slug: true,
            content: true,
            excerpt: true,
            cover_image: true,
            category: true,
            is_published: true,
            published_at: true,
            business_id: true,
            author_id: true,
            created_at: true,
            updated_at: true,
            author: {
                select: {
                    id: true,
                    name: true,
                },
            },
        };
        this.blogPostRepository = new prisma_base_repository_1.PrismaBaseRepository('blogPost', prisma);
    }
    async create(request, dto) {
        const { author_id, ...dataDto } = dto;
        const auth = request.user;
        return this.prisma.$transaction(async (prisma) => {
            const blogPost = await prisma.blogPost.create({
                data: {
                    ...dataDto,
                    ...(dto.is_published && { published_at: new Date() }),
                    author: { connect: { id: author_id || auth.sub } },
                    ...(request['Business-Id'] && {
                        business_info: { connect: { id: request['Business-Id'] } },
                    }),
                },
                select: this.select,
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_BLOG_POST,
                entity: 'BlogPost',
                entity_id: blogPost.id,
                metadata: `User ${auth.sub} created a blog post: ${blogPost.id}`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.CREATED,
                message: 'Blog post created successfully.',
                data: blogPost,
            };
        });
    }
    async fetch(payload, filterDto) {
        const auth = payload.user;
        if (payload['Business-Id']) {
            await this.genericService.isUserLinkedToBusiness(this.prisma, {
                user_id: auth.sub,
                business_id: payload['Business-Id'],
            });
        }
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterDto);
        const filters = {
            ...(payload['Business-Id'] && { business_id: payload['Business-Id'] }),
            ...(filterDto.category && { category: filterDto.category }),
            ...(filterDto.is_published !== undefined && { is_published: filterDto.is_published }),
            ...(filterDto.q && {
                OR: [
                    {
                        title: { contains: filterDto.q, mode: 'insensitive' },
                    },
                    {
                        content: { contains: filterDto.q, mode: 'insensitive' },
                    },
                ],
            }),
            ...pagination_filters.filters,
            tz: payload.timezone,
            deleted_at: null,
        };
        const [blogPosts, total] = await Promise.all([
            this.blogPostRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, this.select),
            this.blogPostRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: blogPosts,
            count: total,
        };
    }
    async fetchSingle(payload, param) {
        const auth = payload.user;
        if (payload['Business-Id']) {
            await this.genericService.isUserLinkedToBusiness(this.prisma, {
                user_id: auth.sub,
                business_id: payload['Business-Id'],
            });
        }
        const blogPost = await this.blogPostRepository.findOne({ id: param.id, ...(payload['Business-Id'] && { business_id: payload['Business-Id'] }), deleted_at: null }, undefined, this.select);
        if (!blogPost) {
            throw new common_1.NotFoundException('Blog post not found.');
        }
        return {
            statusCode: common_1.HttpStatus.OK,
            data: blogPost,
        };
    }
    async fetchPublic(filterDto) {
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterDto);
        const filters = {
            ...(filterDto.category && { category: filterDto.category }),
            is_published: true,
            ...(filterDto.q && {
                OR: [
                    {
                        title: { contains: filterDto.q, mode: 'insensitive' },
                    },
                    {
                        content: { contains: filterDto.q, mode: 'insensitive' },
                    },
                ],
            }),
            deleted_at: null,
        };
        const [blogPosts, total] = await Promise.all([
            this.blogPostRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, this.select),
            this.blogPostRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: blogPosts,
            count: total,
        };
    }
    async fetchSinglePublic(param) {
        const blogPost = await this.blogPostRepository.findOne({ id: param.id, is_published: true, deleted_at: null }, undefined, this.select);
        if (!blogPost) {
            throw new common_1.NotFoundException('Blog post not found.');
        }
        return {
            statusCode: common_1.HttpStatus.OK,
            data: blogPost,
        };
    }
    async update(request, param, dto) {
        const { author_id, ...dataDto } = dto;
        const auth = request.user;
        const { id } = param;
        return this.prisma.$transaction(async (prisma) => {
            const existing = await prisma.blogPost.findFirst({
                where: { id, ...(request['Business-Id'] && { business_id: request['Business-Id'] }), deleted_at: null },
            });
            if (!existing) {
                throw new common_1.NotFoundException('Blog post not found.');
            }
            const blogPost = await prisma.blogPost.update({
                where: { id },
                data: {
                    ...dataDto,
                    ...(dto.is_published && !existing.is_published && { published_at: new Date() }),
                    ...(author_id && { author: { connect: { id: author_id } } }),
                },
                select: this.select,
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_BLOG_POST,
                entity: 'BlogPost',
                entity_id: blogPost.id,
                metadata: `User ${auth.sub} updated blog post: ${blogPost.id}`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Blog post updated successfully.',
                data: blogPost,
            };
        });
    }
    async delete(request, param) {
        const auth = request.user;
        const { id } = param;
        return this.prisma.$transaction(async (prisma) => {
            const existing = await prisma.blogPost.findFirst({
                where: { id, ...(request['Business-Id'] && { business_id: request['Business-Id'] }), deleted_at: null },
            });
            if (!existing) {
                throw new common_1.NotFoundException('Blog post not found.');
            }
            await prisma.blogPost.update({
                where: { id },
                data: { deleted_at: new Date() },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_BLOG_POST,
                entity: 'BlogPost',
                entity_id: id,
                metadata: `User ${auth.sub} deleted blog post: ${id}`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Blog post deleted successfully.',
            };
        });
    }
};
exports.BlogPostService = BlogPostService;
exports.BlogPostService = BlogPostService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        log_service_1.LogService,
        generic_service_1.GenericService])
], BlogPostService);
//# sourceMappingURL=blog-post.service.js.map