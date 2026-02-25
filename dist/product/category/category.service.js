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
exports.ProductCategoryService = void 0;
const generic_service_1 = require("../../generic/generic.service");
const log_service_1 = require("../../log/log.service");
const prisma_base_repository_1 = require("../../prisma/prisma.base.repository");
const prisma_service_1 = require("../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const generic_utils_1 = require("../../generic/generic.utils");
let ProductCategoryService = class ProductCategoryService {
    constructor(prisma, logService, genericService) {
        this.prisma = prisma;
        this.logService = logService;
        this.genericService = genericService;
        this.model = 'ProductCategory';
        this.select = {
            id: true,
            name: true,
            creator_id: true,
            created_at: true,
            updated_at: true,
            creator: {
                select: {
                    id: true,
                    name: true,
                    role: { select: { name: true, role_id: true } },
                },
            },
        };
        this.productCategoryRepository = new prisma_base_repository_1.PrismaBaseRepository('productCategory', prisma);
    }
    async nameExists(name, business_id, prisma) {
        const product_category = await prisma.productCategory.findUnique({
            where: { name },
        });
        if (product_category) {
            throw new common_1.ConflictException('Product category name exists.');
        }
    }
    async create(request, createCategoryDto) {
        const auth = request.user;
        const { name } = createCategoryDto;
        return this.prisma.$transaction(async (prisma) => {
            await this.nameExists(name, request['Business-Id'], prisma);
            const product_category = await prisma.productCategory.create({
                data: {
                    name,
                    creator: { connect: { id: auth.sub } },
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_PRODUCT_CATEGORY,
                entity: this.model,
                entity_id: product_category.id,
                metadata: `User with ID ${auth.sub} just created a ticket category ID ${product_category.id}`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.CREATED,
                message: 'Product category created successfully.',
            };
        });
    }
    async fetch(payload, filterProductCategoryDto) {
        const auth = payload.user;
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterProductCategoryDto);
        const filters = {
            ...(filterProductCategoryDto.q && {
                name: { contains: filterProductCategoryDto.q, mode: 'insensitive' },
            }),
            ...pagination_filters.filters,
            tz: payload.timezone,
        };
        const select = this.select;
        const [productCategories, total] = await Promise.all([
            this.productCategoryRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, select),
            this.productCategoryRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: productCategories,
            count: total,
        };
    }
    async fetchSingle(payload, param) {
        const auth = payload.user;
        const select = {
            ...this.select,
        };
        const filters = {
            id: param.id,
        };
        const productCategory = await this.productCategoryRepository.findOne(filters, undefined, select);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: productCategory,
        };
    }
    async findOne(id) {
        const select = this.select;
        const filters = {
            id,
        };
        const product_category = await this.productCategoryRepository.findOne(filters, undefined, select);
        if (!product_category) {
            throw new common_1.NotFoundException(`Product category not found.`);
        }
        return product_category;
    }
    async update(request, param, updateProductCategoryDto) {
        const auth = request.user;
        const { id } = param;
        const { name } = updateProductCategoryDto;
        return this.prisma.$transaction(async (prisma) => {
            const existing_product_category = await this.findOne(id);
            await prisma.productCategory.update({
                where: { id },
                data: {
                    ...updateProductCategoryDto,
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_PRODUCT_CATEGORY,
                entity: this.model,
                entity_id: existing_product_category.id,
                metadata: `User with ID ${auth.sub} just updated a product category ID ${existing_product_category.id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Product category updated successfully.',
            };
        });
    }
    async delete(request, param) {
        const auth = request.user;
        const { id } = param;
        return this.prisma.$transaction(async (prisma) => {
            const existing_product_category = await this.findOne(id);
            await prisma.productCategory.update({
                where: { id: existing_product_category.id },
                data: {
                    name: (0, generic_utils_1.deletionRename)(existing_product_category.name),
                    deleted_at: new Date(),
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_PRODUCT_CATEGORY,
                entity: this.model,
                entity_id: existing_product_category.id,
                metadata: `User with ID ${auth.sub} just deleted a product category ID ${existing_product_category.id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Product category deleted successfully.',
            };
        });
    }
    async hasRelatedRecords(product_category_id) {
        const relatedTables = [{ model: null, field: 'product_category_id' }];
        for (const { model, field } of relatedTables) {
            const count = await model.count({
                where: { [field]: product_category_id },
            });
            if (count > 0) {
                throw new common_1.ForbiddenException('Related records for this model exists.');
            }
        }
    }
};
exports.ProductCategoryService = ProductCategoryService;
exports.ProductCategoryService = ProductCategoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        log_service_1.LogService,
        generic_service_1.GenericService])
], ProductCategoryService);
//# sourceMappingURL=category.service.js.map