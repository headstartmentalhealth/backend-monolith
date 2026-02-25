import { PrismaService } from '../prisma/prisma.service';
import { AverageRatingDto, CreateReviewDto, QueryReviewsDto } from './review.dto';
import { AuthPayload, GenericDataPayload, GenericPayload, PagePayload } from '@/generic/generic.payload';
import { Review } from '@prisma/client';
export declare class ReviewService {
    private readonly prisma;
    private readonly model;
    private readonly reviewRepository;
    constructor(prisma: PrismaService);
    create(userId: string, createReviewDto: CreateReviewDto): Promise<GenericPayload>;
    findReviews(request: AuthPayload & Request, filterReviewDto: QueryReviewsDto): Promise<PagePayload<Review>>;
    getAverageRating(productId: string): Promise<GenericDataPayload<AverageRatingDto>>;
}
