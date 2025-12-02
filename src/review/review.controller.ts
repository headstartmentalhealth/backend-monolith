// src/reviews/reviews.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Request,
  Query,
  Req,
} from '@nestjs/common';
import {
  AuthPayload,
  GenericDataPayload,
  GenericPayload,
  PagePayload,
} from '@/generic/generic.payload';
import {
  AverageRatingDto,
  CreateReviewDto,
  FetchReviewAvgDto,
  QueryReviewsDto,
} from './review.dto';
import { Review } from '@prisma/client';
import { ReviewService } from './review.service';
import { Public } from '@/account/auth/decorators/auth.decorator';

@Controller('v1/review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('create')
  async create(
    @Req() request: AuthPayload & Request,
    @Body() createReviewDto: CreateReviewDto,
  ): Promise<GenericPayload> {
    return this.reviewService.create(request.user.sub, createReviewDto);
  }

  @Get('fetch')
  async findReviews(
    request: AuthPayload & Request,
    @Query() filterReviewDto: QueryReviewsDto,
  ): Promise<PagePayload<Review>> {
    return this.reviewService.findReviews(request, filterReviewDto);
  }

  @Get('fetch-avg/:product_id')
  @Public()
  async fetchAverageRating(
    @Param() filterReviewAvgDto: FetchReviewAvgDto,
  ): Promise<GenericDataPayload<AverageRatingDto>> {
    return this.reviewService.getAverageRating(filterReviewAvgDto.product_id);
  }
}
