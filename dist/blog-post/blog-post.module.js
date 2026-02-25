"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogPostModule = void 0;
const common_1 = require("@nestjs/common");
const blog_post_service_1 = require("./blog-post.service");
const blog_post_controller_1 = require("./blog-post.controller");
const public_blog_post_controller_1 = require("./public-blog-post.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const log_module_1 = require("../log/log.module");
const generic_module_1 = require("../generic/generic.module");
let BlogPostModule = class BlogPostModule {
};
exports.BlogPostModule = BlogPostModule;
exports.BlogPostModule = BlogPostModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, log_module_1.LogModule, generic_module_1.GenericModule],
        controllers: [blog_post_controller_1.BlogPostController, public_blog_post_controller_1.PublicBlogPostController],
        providers: [blog_post_service_1.BlogPostService],
        exports: [blog_post_service_1.BlogPostService],
    })
], BlogPostModule);
//# sourceMappingURL=blog-post.module.js.map