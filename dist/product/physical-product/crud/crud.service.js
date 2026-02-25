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
exports.PhysicalProductCrudService = void 0;
const generic_service_1 = require("../../../generic/generic.service");
const log_service_1 = require("../../../log/log.service");
const prisma_base_repository_1 = require("../../../prisma/prisma.base.repository");
const prisma_service_1 = require("../../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const generic_utils_1 = require("../../../generic/generic.utils");
let PhysicalProductCrudService = class PhysicalProductCrudService {
    constructor(prisma, logService, genericService) {
        this.prisma = prisma;
        this.logService = logService;
        this.genericService = genericService;
        this.model = 'Product';
        this.select = {
            id: true,
            title: true,
            slug: true,
            description: true,
            keywords: true,
            metadata: true,
            status: true,
            published_at: true,
            archived_at: true,
            price: true,
            original_price: true,
            currency: true,
            multimedia_id: true,
            creator_id: true,
            category_id: true,
            created_at: true,
            updated_at: true,
            creator: {
                select: {
                    id: true,
                    name: true,
                    role: { select: { name: true, role_id: true } },
                },
            },
            purchased_digital_products: { take: 1 },
            category: true,
            multimedia: true,
            zip_file: true,
            physical_product: { include: { media: { include: { multimedia: true } } } },
            other_currencies: true,
        };
        this.productRepository = new prisma_base_repository_1.PrismaBaseRepository('product', prisma);
    }
    async create(request, createPhysicalProductDto) {
        const auth = request.user;
        const { title, slug, description, price, original_price, multimedia_id, category_id, keywords, other_currencies, status, details, } = createPhysicalProductDto;
        return this.prisma.$transaction(async (prisma) => {
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id: request['Business-Id'],
            });
            const business_details = await prisma.businessInformation.findUnique({
                where: { id: request['Business-Id'] },
            });
            const product_slug = await prisma.product.findFirst({ where: { slug } });
            if (product_slug) {
                throw new common_1.ConflictException('Shortlink already exists.');
            }
            const multimedia = await prisma.multimedia.findUnique({
                where: { id: multimedia_id },
            });
            if (!multimedia) {
                throw new common_1.NotFoundException('Multimedia not found.');
            }
            const product_category = await prisma.productCategory.findUnique({
                where: { id: category_id },
            });
            if (!product_category) {
                throw new common_1.NotFoundException('Category not found.');
            }
            const sku_details = (0, generic_utils_1.createProductIdentifiers)(business_details.business_name, title);
            const product = await prisma.product.create({
                data: {
                    title,
                    sku: sku_details.sku,
                    slug,
                    description,
                    price,
                    original_price,
                    creator: { connect: { id: auth.sub } },
                    business_info: { connect: { id: request['Business-Id'] } },
                    multimedia: { connect: { id: multimedia_id } },
                    type: client_1.ProductType.PHYSICAL_PRODUCT,
                    category: { connect: { id: category_id } },
                    keywords,
                    status,
                    published_at: new Date(),
                    other_currencies: other_currencies
                        ? JSON.parse(JSON.stringify(other_currencies))
                        : undefined,
                },
                include: { business_info: { include: { onboarding_status: true } } },
            });
            const physical_product = await prisma.physicalProduct.create({
                data: {
                    product_id: product.id,
                    sizes: details.sizes,
                    colors: details.colors,
                    location: details.location,
                    stock: details.stock,
                    type: details.type,
                    gender: details.gender,
                    estimated_production_time: details.estimated_production_time,
                    min_required: details.min_required,
                },
            });
            if (Boolean(details?.multimedia_ids?.length)) {
                await prisma.physicalProductMedia.createMany({
                    data: details.multimedia_ids.map((multimedia_id) => ({
                        multimedia_id,
                        physical_product_id: physical_product.id,
                    })),
                });
            }
            const physical_product_media = await prisma.physicalProductMedia.findMany({
                where: { physical_product_id: physical_product.id },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_PHYSICAL_PRODUCT,
                entity: this.model,
                entity_id: product.id,
                metadata: `User with ID ${auth.sub} just created a physical product ID ${product.id} for Business ID ${product.business_id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.CREATED,
                message: 'Physical product created successfully.',
                data: Object.assign({}, product, {
                    physical_product,
                    media: physical_product_media,
                }),
            };
        });
    }
    async fetch(payload, filterProductDto) {
        const auth = payload.user;
        await this.genericService.isUserLinkedToBusiness(this.prisma, {
            user_id: auth.sub,
            business_id: payload['Business-Id'],
        });
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterProductDto);
        const filters = {
            business_id: payload['Business-Id'],
            type: client_1.ProductType.PHYSICAL_PRODUCT,
            ...(filterProductDto.status && { status: filterProductDto.status }),
            ...(filterProductDto.q && {
                OR: [
                    {
                        title: { contains: filterProductDto.q, mode: 'insensitive' },
                    },
                    {
                        keywords: { contains: filterProductDto.q, mode: 'insensitive' },
                    },
                ],
            }),
            ...pagination_filters.filters,
            tz: payload.timezone,
        };
        const select = {
            ...this.select,
            business_info: true,
        };
        const [digital_assets, total] = await Promise.all([
            this.productRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, select),
            this.productRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: digital_assets,
            count: total,
        };
    }
    async fetchSingle(payload, param) {
        const auth = payload.user;
        await this.genericService.isUserLinkedToBusiness(this.prisma, {
            user_id: auth.sub,
            business_id: payload['Business-Id'],
        });
        const select = {
            ...this.select,
            business_info: true,
            creator: { select: { id: true, name: true } },
        };
        const filters = {
            id: param.id,
            type: client_1.ProductType.PHYSICAL_PRODUCT,
        };
        const product = await this.productRepository.findOne(filters, undefined, select);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: product,
        };
    }
    async findOne(id) {
        const select = this.select;
        const filters = {
            id,
            type: client_1.ProductType.PHYSICAL_PRODUCT,
        };
        const product = await this.prisma.product.findFirst({ where: filters, select });
        if (!product) {
            throw new common_1.NotFoundException(`Product not found.`);
        }
        return product;
    }
    async update(request, param, dto) {
        const auth = request.user;
        const { id } = param;
        const businessId = request['Business-Id'];
        return this.prisma.$transaction(async (prisma) => {
            const existing_physical_product = await this.findOne(id);
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id: businessId,
            });
            const productUpdateData = {};
            const physicalProductUpdateData = {};
            if (dto) {
                if (dto.title)
                    productUpdateData.title = dto.title;
                if (dto.slug)
                    productUpdateData.slug = dto.slug;
                if (dto.price)
                    productUpdateData.price = dto.price;
                if (dto.original_price)
                    productUpdateData.original_price = dto.original_price;
                if (dto.description !== undefined)
                    productUpdateData.description = dto.description;
                if (dto.keywords !== undefined)
                    productUpdateData.keywords = dto.keywords;
                if (dto.metadata !== undefined)
                    productUpdateData.metadata = dto.metadata;
                if (dto.status)
                    productUpdateData.status = dto.status;
                if (dto.category_id)
                    productUpdateData.category = { connect: { id: dto.category_id } };
                if (dto.multimedia_id)
                    productUpdateData.multimedia = { connect: { id: dto.multimedia_id } };
                if (dto.status === client_1.ProductStatus.PUBLISHED)
                    productUpdateData.published_at = new Date();
                if (dto.other_currencies) {
                    productUpdateData.other_currencies = JSON.parse(JSON.stringify(dto.other_currencies));
                }
            }
            if (dto?.details) {
                const details = dto.details;
                if (details.colors)
                    physicalProductUpdateData.colors = details.colors;
                if (details.sizes)
                    physicalProductUpdateData.sizes = details.sizes;
                if (details.location)
                    physicalProductUpdateData.location = details.location;
                if (details.stock)
                    physicalProductUpdateData.stock = details.stock;
                if (details.type)
                    physicalProductUpdateData.type = details.type;
                if (details.gender)
                    physicalProductUpdateData.gender = details.gender;
                if (details.estimated_production_time)
                    physicalProductUpdateData.estimated_production_time =
                        details.estimated_production_time;
                if (details.min_required)
                    physicalProductUpdateData.min_required = details.min_required;
            }
            const [updatedProduct, updatedPhysicalProduct] = await Promise.all([
                Object.keys(productUpdateData).length > 0
                    ? prisma.product.update({
                        where: { id },
                        data: productUpdateData,
                        include: {
                            business_info: { include: { onboarding_status: true } },
                        },
                    })
                    : this.findOne(id),
                Object.keys(physicalProductUpdateData).length > 0
                    ? prisma.physicalProduct.update({
                        where: { id: existing_physical_product.physical_product.id },
                        data: physicalProductUpdateData,
                    })
                    : existing_physical_product.physical_product,
            ]);
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_PHYSICAL_PRODUCT,
                entity: 'PhysicalProduct',
                entity_id: updatedProduct.id,
                metadata: `User with ID ${auth.sub} bulk updated physical product ID ${updatedProduct.id} for business ID ${businessId}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Physical product updated successfully.',
                data: Object.assign({}, updatedProduct, {
                    physical_product: updatedPhysicalProduct,
                }),
            };
        });
    }
    async delete(request, param) {
        const auth = request.user;
        const { id } = param;
        return this.prisma.$transaction(async (prisma) => {
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id: request['Business-Id'],
            });
            const existing_physical_product = await this.findOne(id);
            if (existing_physical_product.status === client_1.ProductStatus.PUBLISHED) {
                throw new common_1.ForbiddenException('You cannot delete a published physical product.');
            }
            await this.hasRelatedRecords(existing_physical_product.id);
            const product = await prisma.product.update({
                where: { id: existing_physical_product.id },
                data: {
                    deleted_at: new Date(),
                    title: (0, generic_utils_1.deletionRename)(existing_physical_product.title),
                    slug: (0, generic_utils_1.deletionRename)(existing_physical_product.slug),
                },
            });
            await prisma.physicalProduct.update({
                where: { id: existing_physical_product.id },
                data: {
                    deleted_at: new Date(),
                },
            });
            await prisma.physicalProductMedia.deleteMany({
                where: { physical_product: { product_id: product.id } },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_PHYSICAL_PRODUCT,
                entity: 'PhysicalProduct',
                entity_id: existing_physical_product.id,
                metadata: `User with ID ${auth.sub} just deleted a physical product ID ${existing_physical_product.id} from business ID ${request['Business-Id']}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Physical product deleted successfully.',
                data: {
                    id: product.id,
                    deleted: true,
                },
            };
        });
    }
    async hasRelatedRecords(product_id) {
        const relatedTables = [{ model: this.prisma.payment, field: 'product_id' }];
        for (const { model, field } of relatedTables) {
            const count = await model.count({
                where: {
                    purchase: {
                        path: ['items'],
                        array_contains: [{ product_id: product_id }],
                    },
                },
            });
            if (count > 0) {
                throw new common_1.ForbiddenException('Related records for this model exists.');
            }
        }
    }
    async removeSinglePhysicalProductMedia(request, paramDto) {
        const physicalProductMedia = await this.prisma.physicalProductMedia.findUnique({
            where: { id: paramDto.id },
        });
        if (!physicalProductMedia) {
            throw new common_1.NotFoundException('Physical product media not found.');
        }
        await this.prisma.physicalProductMedia.delete({
            where: { id: paramDto.id },
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Physical product media content removed successfully.',
        };
    }
    async addPhysicalProductMedia(request, productDto, addPhysicalProductMedia) {
        const { multimedia_ids } = addPhysicalProductMedia;
        const { product_id } = productDto;
        if (!Array.isArray(multimedia_ids) || multimedia_ids.length === 0) {
            throw new common_1.BadRequestException('At least one multimedia ID is required.');
        }
        const physicalProduct = await this.prisma.physicalProduct.findUnique({
            where: { product_id },
        });
        if (!physicalProduct) {
            throw new common_1.NotFoundException('Physical product not found.');
        }
        const existingMedia = await this.prisma.multimedia.findMany({
            where: { id: { in: multimedia_ids } },
            select: { id: true },
        });
        const existingIds = existingMedia.map((m) => m.id);
        const missing = multimedia_ids.filter((id) => !existingIds.includes(id));
        if (missing.length > 0) {
            throw new common_1.NotFoundException(`Some multimedia not found: ${missing.join(', ')}`);
        }
        const alreadyLinked = await this.prisma.physicalProductMedia.findMany({
            where: {
                physical_product_id: physicalProduct.id,
                multimedia_id: { in: multimedia_ids },
            },
            select: { multimedia_id: true },
        });
        const alreadyLinkedIds = alreadyLinked.map((m) => m.multimedia_id);
        const newIdsToAdd = multimedia_ids.filter((id) => !alreadyLinkedIds.includes(id));
        if (newIdsToAdd.length === 0) {
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'All provided images are already linked to this product.',
                data: alreadyLinked,
            };
        }
        await this.prisma.physicalProductMedia.createMany({
            data: newIdsToAdd.map((multimedia_id) => ({
                multimedia_id,
                physical_product_id: physicalProduct.id,
            })),
        });
        const allMedia = await this.prisma.physicalProductMedia.findMany({
            where: { physical_product_id: physicalProduct.id },
            include: { multimedia: true },
        });
        await this.logService.createWithTrx({
            user_id: request.user.sub,
            action: client_1.Action.MANAGE_PHYSICAL_PRODUCT,
            entity: 'PhysicalProductMedia',
            entity_id: physicalProduct.id,
            metadata: `Added ${newIdsToAdd.length} new image(s) to physical product ${physicalProduct.id}`,
            ip_address: (0, generic_utils_1.getIpAddress)(request),
            user_agent: (0, generic_utils_1.getUserAgent)(request),
        }, this.prisma.log);
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: `Added ${newIdsToAdd.length} new image(s) successfully.`,
            data: allMedia,
        };
    }
};
exports.PhysicalProductCrudService = PhysicalProductCrudService;
exports.PhysicalProductCrudService = PhysicalProductCrudService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        log_service_1.LogService,
        generic_service_1.GenericService])
], PhysicalProductCrudService);
//# sourceMappingURL=crud.service.js.map