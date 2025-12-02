import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AverageRatingDto,
  CreateReviewDto,
  QueryReviewsDto,
} from './review.dto';
import {
  AuthPayload,
  GenericDataPayload,
  GenericPayload,
  GenericPayloadAlias,
  PagePayload,
} from '@/generic/generic.payload';
import { Prisma, Review } from '@prisma/client';
import { PrismaBaseRepository } from '@/prisma/prisma.base.repository';
import { TZ } from '@/generic/generic.dto';
import { pageFilter } from '@/generic/generic.utils';
import { capitalize } from 'lodash';

@Injectable()
export class ReviewService {
  private readonly model = 'Payment';
  private readonly reviewRepository: PrismaBaseRepository<
    Review,
    Prisma.ReviewCreateInput,
    Prisma.ReviewUpdateInput,
    Prisma.ReviewWhereUniqueInput,
    Prisma.ReviewWhereInput | Prisma.ReviewFindFirstArgs,
    Prisma.ReviewUpsertArgs
  >;

  constructor(private readonly prisma: PrismaService) {
    this.reviewRepository = new PrismaBaseRepository<
      Review,
      Prisma.ReviewCreateInput,
      Prisma.ReviewUpdateInput,
      Prisma.ReviewWhereUniqueInput,
      Prisma.ReviewWhereInput | Prisma.ReviewFindFirstArgs,
      Prisma.ReviewUpsertArgs
    >('review', prisma);
  }

  async create(
    userId: string,
    createReviewDto: CreateReviewDto,
  ): Promise<GenericPayload> {
    // Check product_id
    const product = await this.prisma.product.findUnique({
      where: { id: createReviewDto.product_id },
    });

    if (!product) {
      throw new BadRequestException(`Product not found.`);
    }

    const review = await this.prisma.review.create({
      data: {
        ...createReviewDto,
        user_id: userId,
      },
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'Review created successfully.',
    };
  }

  async findReviews(
    request: AuthPayload & Request,
    filterReviewDto: QueryReviewsDto,
  ): Promise<PagePayload<Review>> {
    const pagination_filters = pageFilter(filterReviewDto);

    const filters: Prisma.ReviewWhereInput & TZ = {
      ...(filterReviewDto.product_id && {
        product_id: filterReviewDto.product_id,
      }),
      ...(filterReviewDto.q && {
        OR: [
          {
            id: { contains: filterReviewDto.q, mode: 'insensitive' },
          },
        ],
      }),
      ...pagination_filters.filters,
      tz: request?.timezone,
    };

    // Assign something else to same variable
    const include: Prisma.ReviewInclude = {
      user: {
        select: {
          id: true,
          name: true,
          role: { select: { id: true, role_id: true } },
        },
      },
    };

    const [reviews, total] = await Promise.all([
      this.reviewRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        include,
        undefined,
      ),
      this.reviewRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: reviews,
      count: total,
    };
  }

  async getAverageRating(
    productId: string,
  ): Promise<GenericDataPayload<AverageRatingDto>> {
    const result = await this.prisma.review.aggregate({
      where: { product_id: productId },
      _avg: { rating: true },
      _count: { _all: true },
    });

    if (result._count._all === 0) {
      return {
        statusCode: HttpStatus.OK,
        data: {
          product_id: productId,
          averageRating: 0,
          totalReviews: 0,
        },
      };
    }

    return {
      statusCode: HttpStatus.OK,
      data: {
        product_id: productId,
        averageRating: result._avg.rating || 0,
        totalReviews: result._count._all,
      },
    };
  }
}
