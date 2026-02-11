import {
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBlogPostDto,
  FilterBlogPostDto,
  UpdateBlogPostDto,
} from './blog-post.dto';
import { PrismaBaseRepository } from '@/prisma/prisma.base.repository';
import {
  Action,
  BlogPost,
  Prisma,
} from '@prisma/client';
import { LogService } from '@/log/log.service';
import { GenericService } from '@/generic/generic.service';
import {
  AuthPayload,
  GenericDataPayload,
  GenericPayload,
  GenericPayloadAlias,
  PagePayload,
} from '@/generic/generic.payload';
import {
  getIpAddress,
  getUserAgent,
  pageFilter,
} from '@/generic/generic.utils';
import { IdDto, TZ } from '@/generic/generic.dto';

@Injectable()
export class BlogPostService {
  private readonly model = 'BlogPost';

  private readonly blogPostRepository: PrismaBaseRepository<
    BlogPost,
    Prisma.BlogPostCreateInput,
    Prisma.BlogPostUpdateInput,
    Prisma.BlogPostWhereUniqueInput,
    Prisma.BlogPostWhereInput | Prisma.BlogPostFindFirstArgs,
    Prisma.BlogPostUpsertArgs
  >;

  private readonly select: Prisma.BlogPostSelect = {
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly logService: LogService,
    private readonly genericService: GenericService,
  ) {
    this.blogPostRepository = new PrismaBaseRepository<
      BlogPost,
      Prisma.BlogPostCreateInput,
      Prisma.BlogPostUpdateInput,
      Prisma.BlogPostWhereUniqueInput,
      Prisma.BlogPostWhereInput | Prisma.BlogPostFindFirstArgs,
      Prisma.BlogPostUpsertArgs
    >('blogPost', prisma);
  }

  async create(
    request: AuthPayload & Request,
    dto: CreateBlogPostDto,
  ): Promise<GenericPayloadAlias<BlogPost>> {
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

      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_BLOG_POST,
          entity: 'BlogPost',
          entity_id: blogPost.id,
          metadata: `User ${auth.sub} created a blog post: ${blogPost.id}`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Blog post created successfully.',
        data: blogPost,
      };
    });
  }

  async fetch(
    payload: AuthPayload,
    filterDto: FilterBlogPostDto,
  ): Promise<PagePayload<BlogPost>> {
    const auth = payload.user;

    if (payload['Business-Id']) {
      await this.genericService.isUserLinkedToBusiness(this.prisma, {
        user_id: auth.sub,
        business_id: payload['Business-Id'],
      });
    }

    const pagination_filters = pageFilter(filterDto);

    const filters: Prisma.BlogPostWhereInput & TZ = {
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
      this.blogPostRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        undefined,
        this.select,
      ),
      this.blogPostRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: blogPosts,
      count: total,
    };
  }

  async fetchSingle(
    payload: AuthPayload,
    param: IdDto,
  ): Promise<GenericDataPayload<BlogPost>> {
    const auth = payload.user;

    if (payload['Business-Id']) {
      await this.genericService.isUserLinkedToBusiness(this.prisma, {
        user_id: auth.sub,
        business_id: payload['Business-Id'],
      });
    }

    const blogPost = await this.blogPostRepository.findOne(
      { id: param.id, ...(payload['Business-Id'] && { business_id: payload['Business-Id'] }), deleted_at: null },
      undefined,
      this.select,
    );

    if (!blogPost) {
      throw new NotFoundException('Blog post not found.');
    }

    return {
      statusCode: HttpStatus.OK,
      data: blogPost,
    };
  }

  async update(
    request: AuthPayload & Request,
    param: IdDto,
    dto: UpdateBlogPostDto,
  ): Promise<GenericPayloadAlias<BlogPost>> {
    const { author_id, ...dataDto } = dto;
    const auth = request.user;
    const { id } = param;

    return this.prisma.$transaction(async (prisma) => {
      const existing = await prisma.blogPost.findFirst({
        where: { id, ...(request['Business-Id'] && { business_id: request['Business-Id'] }), deleted_at: null },
      });

      if (!existing) {
        throw new NotFoundException('Blog post not found.');
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

      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_BLOG_POST,
          entity: 'BlogPost',
          entity_id: blogPost.id,
          metadata: `User ${auth.sub} updated blog post: ${blogPost.id}`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Blog post updated successfully.',
        data: blogPost,
      };
    });
  }

  async delete(
    request: AuthPayload & Request,
    param: IdDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { id } = param;

    return this.prisma.$transaction(async (prisma) => {
      const existing = await prisma.blogPost.findFirst({
        where: { id, ...(request['Business-Id'] && { business_id: request['Business-Id'] }), deleted_at: null },
      });

      if (!existing) {
        throw new NotFoundException('Blog post not found.');
      }

      await prisma.blogPost.update({
        where: { id },
        data: { deleted_at: new Date() },
      });

      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_BLOG_POST,
          entity: 'BlogPost',
          entity_id: id,
          metadata: `User ${auth.sub} deleted blog post: ${id}`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Blog post deleted successfully.',
      };
    });
  }
}
