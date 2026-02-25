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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewController = void 0;
const common_1 = require("@nestjs/common");
const review_dto_1 = require("./review.dto");
const review_service_1 = require("./review.service");
const auth_decorator_1 = require("../account/auth/decorators/auth.decorator");
let ReviewController = class ReviewController {
    constructor(reviewService) {
        this.reviewService = reviewService;
    }
    async create(request, createReviewDto) {
        return this.reviewService.create(request.user.sub, createReviewDto);
    }
    async findReviews(request, filterReviewDto) {
        return this.reviewService.findReviews(request, filterReviewDto);
    }
    async fetchAverageRating(filterReviewAvgDto) {
        return this.reviewService.getAverageRating(filterReviewAvgDto.product_id);
    }
};
exports.ReviewController = ReviewController;
__decorate([
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, review_dto_1.CreateReviewDto]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('fetch'),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, review_dto_1.QueryReviewsDto]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "findReviews", null);
__decorate([
    (0, common_1.Get)('fetch-avg/:product_id'),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [review_dto_1.FetchReviewAvgDto]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "fetchAverageRating", null);
exports.ReviewController = ReviewController = __decorate([
    (0, common_1.Controller)('v1/review'),
    __metadata("design:paramtypes", [review_service_1.ReviewService])
], ReviewController);
//# sourceMappingURL=review.controller.js.map