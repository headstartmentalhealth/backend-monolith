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
exports.ReviewService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const prisma_base_repository_1 = require("../prisma/prisma.base.repository");
const generic_utils_1 = require("../generic/generic.utils");
let ReviewService = class ReviewService {
    constructor(prisma) {
        this.prisma = prisma;
        this.model = 'Payment';
        this.reviewRepository = new prisma_base_repository_1.PrismaBaseRepository('review', prisma);
    }
    async create(userId, createReviewDto) {
        const product = await this.prisma.product.findUnique({
            where: { id: createReviewDto.product_id },
        });
        if (!product) {
            throw new common_1.BadRequestException(`Product not found.`);
        }
        const review = await this.prisma.review.create({
            data: {
                ...createReviewDto,
                user_id: userId,
            },
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Review created successfully.',
        };
    }
    async findReviews(request, filterReviewDto) {
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterReviewDto);
        const filters = {
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
        const include = {
            user: {
                select: {
                    id: true,
                    name: true,
                    role: { select: { id: true, role_id: true } },
                },
            },
        };
        const [reviews, total] = await Promise.all([
            this.reviewRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, include, undefined),
            this.reviewRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: reviews,
            count: total,
        };
    }
    async getAverageRating(productId) {
        const result = await this.prisma.review.aggregate({
            where: { product_id: productId },
            _avg: { rating: true },
            _count: { _all: true },
        });
        if (result._count._all === 0) {
            return {
                statusCode: common_1.HttpStatus.OK,
                data: {
                    product_id: productId,
                    averageRating: 0,
                    totalReviews: 0,
                },
            };
        }
        return {
            statusCode: common_1.HttpStatus.OK,
            data: {
                product_id: productId,
                averageRating: result._avg.rating || 0,
                totalReviews: result._count._all,
            },
        };
    }
};
exports.ReviewService = ReviewService;
exports.ReviewService = ReviewService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewService);
//# sourceMappingURL=review.service.js.map