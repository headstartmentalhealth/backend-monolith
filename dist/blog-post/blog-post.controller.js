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
exports.BlogPostController = void 0;
const common_1 = require("@nestjs/common");
const blog_post_service_1 = require("./blog-post.service");
const blog_post_dto_1 = require("./blog-post.dto");
const generic_payload_1 = require("../generic/generic.payload");
const generic_dto_1 = require("../generic/generic.dto");
const auth_guard_1 = require("../account/auth/guards/auth.guard");
const role_decorator_1 = require("../account/auth/decorators/role.decorator");
const generic_data_1 = require("../generic/generic.data");
let BlogPostController = class BlogPostController {
    constructor(blogPostService) {
        this.blogPostService = blogPostService;
    }
    async create(request, dto) {
        return this.blogPostService.create(request, dto);
    }
    async fetch(request, filterDto) {
        return this.blogPostService.fetch(request, filterDto);
    }
    async fetchSingle(request, param) {
        return this.blogPostService.fetchSingle(request, param);
    }
    async update(request, param, dto) {
        return this.blogPostService.update(request, param, dto);
    }
    async delete(request, param) {
        return this.blogPostService.delete(request, param);
    }
};
exports.BlogPostController = BlogPostController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, blog_post_dto_1.CreateBlogPostDto]),
    __metadata("design:returntype", Promise)
], BlogPostController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_payload_1.AuthPayload,
        blog_post_dto_1.FilterBlogPostDto]),
    __metadata("design:returntype", Promise)
], BlogPostController.prototype, "fetch", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_payload_1.AuthPayload,
        generic_dto_1.IdDto]),
    __metadata("design:returntype", Promise)
], BlogPostController.prototype, "fetchSingle", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.IdDto,
        blog_post_dto_1.UpdateBlogPostDto]),
    __metadata("design:returntype", Promise)
], BlogPostController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, role_decorator_1.Roles)(generic_data_1.Role.OWNER_SUPER_ADMIN, generic_data_1.Role.OWNER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generic_dto_1.IdDto]),
    __metadata("design:returntype", Promise)
], BlogPostController.prototype, "delete", null);
exports.BlogPostController = BlogPostController = __decorate([
    (0, common_1.Controller)('v1/blog-posts'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [blog_post_service_1.BlogPostService])
], BlogPostController);
//# sourceMappingURL=blog-post.controller.js.map