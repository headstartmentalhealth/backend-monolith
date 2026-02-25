import { AuthPayload, GenericDataPayload, GenericPayload, PagePayload } from '@/generic/generic.payload';
import { AverageRatingDto, CreateReviewDto, FetchReviewAvgDto, QueryReviewsDto } from './review.dto';
import { Review } from '@prisma/client';
import { ReviewService } from './review.service';
export declare class ReviewController {
    private readonly reviewService;
    constructor(reviewService: ReviewService);
    create(request: AuthPayload & Request, createReviewDto: CreateReviewDto): Promise<GenericPayload>;
    findReviews(request: AuthPayload & Request, filterReviewDto: QueryReviewsDto): Promise<PagePayload<Review>>;
    fetchAverageRating(filterReviewAvgDto: FetchReviewAvgDto): Promise<GenericDataPayload<AverageRatingDto>>;
}
