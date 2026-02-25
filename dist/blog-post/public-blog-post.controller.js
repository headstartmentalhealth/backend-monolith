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
exports.PublicBlogPostController = void 0;
const common_1 = require("@nestjs/common");
const blog_post_service_1 = require("./blog-post.service");
const blog_post_dto_1 = require("./blog-post.dto");
const generic_dto_1 = require("../generic/generic.dto");
const auth_decorator_1 = require("../account/auth/decorators/auth.decorator");
let PublicBlogPostController = class PublicBlogPostController {
    constructor(blogPostService) {
        this.blogPostService = blogPostService;
    }
    async fetch(filterDto) {
        return this.blogPostService.fetchPublic(filterDto);
    }
    async fetchSingle(param) {
        return this.blogPostService.fetchSinglePublic(param);
    }
};
exports.PublicBlogPostController = PublicBlogPostController;
__decorate([
    (0, common_1.Get)(),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [blog_post_dto_1.FilterBlogPostDto]),
    __metadata("design:returntype", Promise)
], PublicBlogPostController.prototype, "fetch", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_dto_1.IdDto]),
    __metadata("design:returntype", Promise)
], PublicBlogPostController.prototype, "fetchSingle", null);
exports.PublicBlogPostController = PublicBlogPostController = __decorate([
    (0, common_1.Controller)('v1/public/blog-posts'),
    __metadata("design:paramtypes", [blog_post_service_1.BlogPostService])
], PublicBlogPostController);
//# sourceMappingURL=public-blog-post.controller.js.map