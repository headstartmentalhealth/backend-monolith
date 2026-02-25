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
exports.ProductGeneralService = void 0;
const generic_service_1 = require("../../generic/generic.service");
const generic_utils_1 = require("../../generic/generic.utils");
const prisma_service_1 = require("../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_base_repository_1 = require("../../prisma/prisma.base.repository");
const generic_data_1 = require("../../generic/generic.data");
let ProductGeneralService = class ProductGeneralService {
    constructor(prisma, genericService) {
        this.prisma = prisma;
        this.genericService = genericService;
        this.select = {
            id: true,
            title: true,
            slug: true,
            description: true,
            price: true,
            original_price: true,
            currency: true,
            keywords: true,
            metadata: true,
            status: true,
            type: true,
            published_at: true,
            archived_at: true,
            creator_id: true,
            created_at: true,
            business_info: true,
            creator: {
                select: {
                    id: true,
                    name: true,
                    role: { select: { name: true, role_id: true } },
                },
            },
            category: true,
            multimedia: true,
            ticket: {
                select: {
                    id: true,
                    event_time: true,
                    event_start_date: true,
                    event_end_date: true,
                    event_location: true,
                    event_type: true,
                    ticket_tiers: { where: { deleted_at: null } },
                },
            },
            subscription_plan: { include: { subscription_plan_prices: true } },
            physical_product: { include: { media: { include: { multimedia: true } } } },
            other_currencies: true,
        };
        this.productRepository = new prisma_base_repository_1.PrismaBaseRepository('product', prisma);
    }
    async fetch(payload, filterProductDto) {
        const auth = payload.user;
        await this.genericService.isUserLinkedToBusiness(this.prisma, {
            user_id: auth.sub,
            business_id: payload['Business-Id'],
        });
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterProductDto);
        const priceFilter = {};
        if (filterProductDto.min_price !== undefined ||
            filterProductDto.max_price !== undefined) {
            priceFilter.price = {};
            if (filterProductDto.min_price !== undefined) {
                priceFilter.price.gte = filterProductDto.min_price;
            }
            if (filterProductDto.max_price !== undefined) {
                priceFilter.price.lte = filterProductDto.max_price;
            }
        }
        const filters = {
            business_id: payload['Business-Id'],
            ...(filterProductDto.status && { status: filterProductDto.status }),
            ...(filterProductDto.type && { type: filterProductDto.type }),
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
            ...(Object.keys(priceFilter).length > 0 && priceFilter),
            ...pagination_filters.filters,
            tz: payload.timezone,
        };
        const select = this.select;
        const [products, total] = await Promise.all([
            this.productRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, select),
            this.productRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: products,
            count: total,
        };
    }
    async fetchAll(payload, filterProductDto) {
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterProductDto);
        const priceFilter = {};
        if (filterProductDto.min_price !== undefined ||
            filterProductDto.max_price !== undefined) {
            priceFilter.price = {};
            if (filterProductDto.min_price !== undefined) {
                priceFilter.price.gte = filterProductDto.min_price;
            }
            if (filterProductDto.max_price !== undefined) {
                priceFilter.price.lte = filterProductDto.max_price;
            }
        }
        const filters = {
            ...(filterProductDto.status && { status: filterProductDto.status }),
            ...(filterProductDto.business_id && {
                business_id: filterProductDto.business_id,
            }),
            ...(filterProductDto.type && { type: filterProductDto.type }),
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
            ...(Object.keys(priceFilter).length > 0 && priceFilter),
            ...pagination_filters.filters,
            tz: payload.timezone,
        };
        const select = {
            ...this.select,
            business_info: true,
            creator: { include: { role: true, profile: true } },
        };
        const [products, total] = await Promise.all([
            this.productRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, select),
            this.productRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: products,
            count: total,
        };
    }
    async fetchOrganizationProducts(businessId, filterDto) {
        const { min_price, max_price, type, q, currency } = filterDto;
        const { filters: paginationFilters, pagination_options } = (0, generic_utils_1.pageFilter)(filterDto);
        const baseBusinessFilter = {
            OR: [
                { business_id: businessId },
                { business_info: { business_slug: businessId } },
            ],
        };
        const priceFilter = min_price !== undefined || max_price !== undefined
            ? {
                price: {
                    ...(min_price !== undefined && { gte: min_price }),
                    ...(max_price !== undefined && { lte: max_price }),
                },
            }
            : {};
        const searchFilter = q
            ? {
                OR: [
                    { title: { contains: q, mode: 'insensitive' } },
                    { keywords: { contains: q, mode: 'insensitive' } },
                ],
            }
            : undefined;
        const filters = {
            ...baseBusinessFilter,
            status: client_1.ProductStatus.PUBLISHED,
            ...(type && { type }),
            ...(searchFilter ?? {}),
            ...(Object.keys(priceFilter).length && priceFilter),
            ...paginationFilters,
            deleted_at: null,
        };
        let [products, total] = await Promise.all([
            this.productRepository.findManyWithPagination(filters, pagination_options, client_1.Prisma.SortOrder.desc, undefined, this.select),
            this.productRepository.count({ ...filters }),
        ]);
        if (currency && currency !== generic_data_1.DEFAULT_CURRENCY) {
            products = await Promise.all(products.map((product) => this.genericService.assignSelectedCurrencyPrices(product, currency)));
        }
        return {
            statusCode: common_1.HttpStatus.OK,
            data: products,
            count: total,
        };
    }
    async fetchProductByIdPublic(productId, currency) {
        const product = await this.prisma.product.findFirst({
            where: {
                AND: {
                    OR: [{ id: productId }, { slug: productId }],
                    status: client_1.ProductStatus.PUBLISHED,
                    deleted_at: null,
                },
            },
            select: {
                ...this.select,
                modules: {
                    include: {
                        contents: {
                            select: {
                                id: true,
                                title: true,
                                multimedia: { select: { type: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found.');
        }
        const formatted_product = await this.genericService.assignSelectedCurrencyPrices(product, currency);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Product details fetched',
            data: formatted_product,
        };
    }
};
exports.ProductGeneralService = ProductGeneralService;
exports.ProductGeneralService = ProductGeneralService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        generic_service_1.GenericService])
], ProductGeneralService);
//# sourceMappingURL=general.service.js.map