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
exports.DigitalProductCrudService = void 0;
const generic_service_1 = require("../../../generic/generic.service");
const generic_utils_1 = require("../../../generic/generic.utils");
const log_service_1 = require("../../../log/log.service");
const prisma_base_repository_1 = require("../../../prisma/prisma.base.repository");
const prisma_service_1 = require("../../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let DigitalProductCrudService = class DigitalProductCrudService {
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
            other_currencies: true,
        };
        this.productRepository = new prisma_base_repository_1.PrismaBaseRepository('product', prisma);
    }
    async create(request, createDigitalProductDto) {
        const auth = request.user;
        const { title, slug, description, price, original_price, multimedia_id, multimedia_zip_id, category_id, keywords, other_currencies, } = createDigitalProductDto;
        return this.prisma.$transaction(async (prisma) => {
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id: request['Business-Id'],
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
            const multimedia_zip = await prisma.multimedia.findUnique({
                where: { id: multimedia_zip_id },
            });
            if (!multimedia) {
                throw new common_1.NotFoundException('Multimedia zip not found.');
            }
            const product_category = await prisma.productCategory.findUnique({
                where: { id: category_id },
            });
            if (!product_category) {
                throw new common_1.NotFoundException('Category not found.');
            }
            const product = await prisma.product.create({
                data: {
                    title,
                    slug,
                    description,
                    price,
                    original_price,
                    creator: { connect: { id: auth.sub } },
                    business_info: { connect: { id: request['Business-Id'] } },
                    multimedia: { connect: { id: multimedia_id } },
                    zip_file: { connect: { id: multimedia_zip_id } },
                    type: client_1.ProductType.DIGITAL_PRODUCT,
                    category: { connect: { id: category_id } },
                    keywords,
                    status: client_1.ProductStatus.PUBLISHED,
                    published_at: new Date(),
                    other_currencies: other_currencies
                        ? JSON.parse(JSON.stringify(other_currencies))
                        : undefined,
                },
                include: { business_info: { include: { onboarding_status: true } } },
            });
            if (product.business_info.onboarding_status.current_step < 5) {
                await prisma.onboardingStatus.upsert({
                    where: {
                        user_id_business_id: {
                            user_id: auth.sub,
                            business_id: request['Business-Id'],
                        },
                    },
                    create: {
                        user_id: auth.sub,
                        business_id: request['Business-Id'],
                        current_step: 5,
                    },
                    update: {
                        current_step: 5,
                    },
                });
            }
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_DIGITAL_PRODUCT,
                entity: this.model,
                entity_id: product.id,
                metadata: `User with ID ${auth.sub} just created a digital product ID ${product.id} for Business ID ${product.business_id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.CREATED,
                message: 'Digital product created successfully.',
                data: product,
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
            type: client_1.ProductType.DIGITAL_PRODUCT,
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
            creator: true,
        };
        const filters = {
            id: param.id,
            type: client_1.ProductType.DIGITAL_PRODUCT,
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
            type: client_1.ProductType.DIGITAL_PRODUCT,
        };
        const product = await this.productRepository.findOne(filters, undefined, select);
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
            const existing_digital_product = await this.findOne(id);
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id: businessId,
            });
            const productUpdateData = {
                ...(dto.title && { title: dto.title }),
                ...(dto.slug && { slug: dto.slug }),
                ...(dto.price && { price: dto.price }),
                ...(dto.original_price && { original_price: dto.original_price }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.keywords !== undefined && { keywords: dto.keywords }),
                ...(dto.metadata !== undefined && { metadata: dto.metadata }),
                ...(dto.status && { status: dto.status }),
                ...(dto.category_id && {
                    category: { connect: { id: dto.category_id } },
                }),
                ...(dto.multimedia_id && {
                    multimedia: { connect: { id: dto.multimedia_id } },
                }),
                ...(dto.multimedia_zip_id && {
                    zip_file: { connect: { id: dto.multimedia_zip_id } },
                }),
                ...(dto.status === client_1.ProductStatus.PUBLISHED && {
                    published_at: new Date(),
                }),
                ...(dto.other_currencies && {
                    other_currencies: dto.other_currencies
                        ? JSON.parse(JSON.stringify(dto.other_currencies))
                        : undefined,
                }),
            };
            const [updatedProduct] = await Promise.all([
                prisma.product.update({
                    where: { id },
                    data: productUpdateData,
                    include: { business_info: { include: { onboarding_status: true } } },
                }),
            ]);
            if (updatedProduct.business_info.onboarding_status.current_step < 5) {
                await prisma.onboardingStatus.upsert({
                    where: {
                        user_id_business_id: {
                            user_id: auth.sub,
                            business_id: businessId,
                        },
                    },
                    create: {
                        user_id: auth.sub,
                        business_id: businessId,
                        current_step: 5,
                    },
                    update: {
                        current_step: 5,
                    },
                });
            }
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_DIGITAL_PRODUCT,
                entity: 'Product',
                entity_id: updatedProduct.id,
                metadata: `User with ID ${auth.sub} bulk updated digital product ID ${updatedProduct.id} for business ID ${businessId}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            const finalDigitalProduct = Object.assign({}, updatedProduct);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Digital product updated successfully.',
                data: finalDigitalProduct,
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
            const existing_digital_product = await this.findOne(id);
            if (existing_digital_product.status === client_1.ProductStatus.PUBLISHED) {
                throw new common_1.ForbiddenException('You cannot delete a published digital product.');
            }
            await this.hasRelatedRecords(existing_digital_product.id);
            const product = await prisma.product.update({
                where: { id: existing_digital_product.id },
                data: {
                    deleted_at: new Date(),
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_DIGITAL_PRODUCT,
                entity: 'DigitalProduct',
                entity_id: existing_digital_product.id,
                metadata: `User with ID ${auth.sub} just deleted a digital product ID ${existing_digital_product.id} from business ID ${request['Business-Id']}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Digital product deleted successfully.',
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
};
exports.DigitalProductCrudService = DigitalProductCrudService;
exports.DigitalProductCrudService = DigitalProductCrudService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        log_service_1.LogService,
        generic_service_1.GenericService])
], DigitalProductCrudService);
//# sourceMappingURL=crud.service.js.map