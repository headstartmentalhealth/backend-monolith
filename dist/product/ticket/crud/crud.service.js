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
exports.TicketCrudService = void 0;
const generic_service_1 = require("../../../generic/generic.service");
const generic_utils_1 = require("../../../generic/generic.utils");
const log_service_1 = require("../../../log/log.service");
const prisma_base_repository_1 = require("../../../prisma/prisma.base.repository");
const prisma_service_1 = require("../../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let TicketCrudService = class TicketCrudService {
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
                    ticket_tiers: true,
                },
            },
        };
        this.productRepository = new prisma_base_repository_1.PrismaBaseRepository('product', prisma);
    }
    async create(request, createTicketDto) {
        const auth = request.user;
        const { title, slug, description, multimedia_id, category_id, keywords, event_time, event_start_date, event_end_date, event_location, event_type, auth_details, ticket_tiers, } = createTicketDto;
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
            const product_category = await prisma.productCategory.findUnique({
                where: { id: category_id },
            });
            if (!product_category) {
                throw new common_1.NotFoundException('Category not found.');
            }
            await this.genericService.productBySlug(prisma, slug);
            const product = await prisma.product.create({
                data: {
                    title,
                    slug,
                    description,
                    creator: { connect: { id: auth.sub } },
                    business_info: { connect: { id: request['Business-Id'] } },
                    multimedia: { connect: { id: multimedia_id } },
                    type: client_1.ProductType.TICKET,
                    category: { connect: { id: category_id } },
                    keywords,
                    status: client_1.ProductStatus.PUBLISHED,
                    published_at: new Date(),
                },
                include: { business_info: { include: { onboarding_status: true } } },
            });
            const ticket = await prisma.ticket.create({
                data: {
                    product: { connect: { id: product.id } },
                    event_time,
                    event_start_date,
                    event_end_date,
                    event_type,
                    event_location,
                    auth_details,
                },
            });
            await prisma.ticketTier.createMany({
                data: ticket_tiers.map((ticket_tier) => ({
                    ticket_id: ticket.id,
                    name: ticket_tier.name,
                    amount: ticket_tier.amount,
                    original_amount: ticket_tier.original_amount,
                    description: ticket_tier.description,
                    quantity: ticket_tier.quantity,
                    remaining_quantity: ticket_tier.remaining_quantity,
                    max_per_purchase: ticket_tier.max_per_purchase,
                    default_view: ticket_tier.default_view,
                    status: ticket_tier.status,
                    ...(ticket_tier.other_currencies && {
                        other_currencies: ticket_tier.other_currencies
                            ? JSON.parse(JSON.stringify(ticket_tier.other_currencies))
                            : undefined,
                    }),
                })),
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
                action: client_1.Action.MANAGE_TICKET,
                entity: 'Ticket',
                entity_id: ticket.id,
                metadata: `User with ID ${auth.sub} just created a ticket product ID ${ticket.id} for Business ID ${product.business_id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.CREATED,
                message: 'Ticket created successfully.',
                data: product,
            };
        });
    }
    async fetch(payload, filterTicketDto) {
        const auth = payload.user;
        await this.genericService.isUserLinkedToBusiness(this.prisma, {
            user_id: auth.sub,
            business_id: payload['Business-Id'],
        });
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterTicketDto);
        const filters = {
            business_id: payload['Business-Id'],
            type: client_1.ProductType.TICKET,
            ...(filterTicketDto.status && { status: filterTicketDto.status }),
            ...(filterTicketDto.q && {
                OR: [
                    {
                        title: { contains: filterTicketDto.q, mode: 'insensitive' },
                    },
                    {
                        keywords: { contains: filterTicketDto.q, mode: 'insensitive' },
                    },
                ],
            }),
            ...pagination_filters.filters,
            tz: payload.timezone,
        };
        const select = {
            ...this.select,
            business_info: true,
            ticket: {
                include: {
                    ticket_tiers: {
                        where: { deleted_at: null },
                    },
                },
            },
        };
        const [tickets, total] = await Promise.all([
            this.productRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, select),
            this.productRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: tickets,
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
            ticket: {
                include: {
                    ticket_tiers: {
                        where: { deleted_at: null },
                        include: {
                            purchased_tickets: {
                                where: { deleted_at: null },
                                take: 1,
                            },
                        },
                    },
                    purchased_tickets: {
                        where: { deleted_at: null },
                        take: 1,
                    },
                },
            },
        };
        const filters = {
            id: param.id,
        };
        const ticket = await this.productRepository.findOne(filters, undefined, select);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: ticket,
        };
    }
    async findOne(id) {
        const select = this.select;
        const filters = {
            id,
        };
        const ticket = await this.productRepository.findOne(filters, undefined, select);
        if (!ticket) {
            throw new common_1.NotFoundException(`Ticket not found.`);
        }
        return ticket;
    }
    async update(request, param, dto) {
        const auth = request.user;
        const { id } = param;
        const businessId = request['Business-Id'];
        return this.prisma.$transaction(async (prisma) => {
            const existingTicket = await this.findOne(id);
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id: businessId,
            });
            const productUpdateData = {
                ...(dto.title && { title: dto.title }),
                ...(dto.slug && { slug: dto.slug }),
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
                ...(dto.status === client_1.ProductStatus.PUBLISHED && {
                    published_at: new Date(),
                }),
            };
            const ticketUpdateData = {
                ...(dto.event_start_date && { event_start_date: dto.event_start_date }),
                ...(dto.event_end_date && { event_end_date: dto.event_end_date }),
                ...(dto.event_type && { event_type: dto.event_type }),
                ...(dto.event_time && { event_time: dto.event_time }),
                ...(dto.event_location !== undefined && {
                    event_location: dto.event_location,
                }),
                ...(dto.auth_details !== undefined && {
                    auth_details: dto.auth_details,
                }),
            };
            const [updatedProduct, updatedTicket] = await Promise.all([
                prisma.product.update({
                    where: { id },
                    data: productUpdateData,
                    include: { business_info: { include: { onboarding_status: true } } },
                }),
                prisma.ticket.update({
                    where: { product_id: id },
                    data: ticketUpdateData,
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
            let updatedTiers = [];
            if (dto.ticket_tiers?.length) {
                const updates = dto.ticket_tiers
                    .filter((tier) => tier.id)
                    .map((tier) => prisma.ticketTier.update({
                    where: { id: tier.id },
                    data: {
                        ...(tier.name && { name: tier.name }),
                        ...(tier.amount !== undefined && { amount: tier.amount }),
                        ...(tier.original_amount !== undefined && {
                            original_amount: tier.original_amount,
                        }),
                        ...(tier.description !== undefined && {
                            description: tier.description,
                        }),
                        ...(tier.quantity !== undefined && { quantity: tier.quantity }),
                        ...(tier.remaining_quantity !== undefined && {
                            remaining_quantity: tier.remaining_quantity,
                        }),
                        ...(tier.max_per_purchase !== undefined && {
                            max_per_purchase: tier.max_per_purchase,
                        }),
                        ...(tier.default_view !== undefined && {
                            default_view: tier.default_view,
                        }),
                        ...(tier.status && { status: tier.status }),
                        ...(tier.other_currencies && {
                            other_currencies: tier.other_currencies
                                ? JSON.parse(JSON.stringify(tier.other_currencies))
                                : undefined,
                        }),
                    },
                }));
                const creates = [];
                for (const tier of dto.ticket_tiers.filter((t) => !t?.id)) {
                    const existingTier = await prisma.ticketTier.findFirst({
                        where: {
                            ticket_id: updatedTicket.id,
                            name: tier.name,
                        },
                    });
                    if (existingTier) {
                        throw new common_1.BadRequestException(`A ticket tier with the name "${tier.name}" already exists for this ticket.`);
                    }
                    creates.push(prisma.ticketTier.create({
                        data: {
                            ticket_id: updatedTicket.id,
                            name: tier.name,
                            amount: tier.amount,
                            original_amount: tier.original_amount,
                            description: tier.description,
                            quantity: tier.quantity,
                            remaining_quantity: tier.remaining_quantity,
                            max_per_purchase: tier.max_per_purchase,
                            default_view: tier.default_view,
                            status: tier.status,
                            ...(tier.other_currencies && {
                                other_currencies: tier.other_currencies
                                    ? JSON.parse(JSON.stringify(tier.other_currencies))
                                    : undefined,
                            }),
                        },
                    }));
                }
                updatedTiers = await Promise.all([...updates, ...creates]);
            }
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_TICKET,
                entity: 'Ticket',
                entity_id: updatedTicket.id,
                metadata: `User with ID ${auth.sub} bulk updated ticket ID ${updatedTicket.id} for business ID ${businessId}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            const finalTicketProduct = Object.assign({}, updatedProduct, {
                ticket: updatedTicket,
                ticket_tiers: updatedTiers,
            });
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Ticket updated successfully with bulk tier operations.',
                data: finalTicketProduct,
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
            const existing_ticket_product = await this.findOne(id);
            if (existing_ticket_product.status === client_1.ProductStatus.PUBLISHED) {
                throw new common_1.ForbiddenException('You cannot delete a published ticket.');
            }
            await this.hasRelatedRecords(existing_ticket_product.id);
            const product = await prisma.product.update({
                where: { id: existing_ticket_product.id },
                data: {
                    deleted_at: new Date(),
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_TICKET,
                entity: 'Ticket',
                entity_id: existing_ticket_product.id,
                metadata: `User with ID ${auth.sub} just deleted a ticket ID ${existing_ticket_product.id} from business ID ${request['Business-Id']}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Ticket deleted successfully.',
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
    async removeTicketTier(request, param) {
        const auth = request.user;
        const { ticket_tier_id } = param;
        const businessId = request['Business-Id'];
        return this.prisma.$transaction(async (prisma) => {
            await this.genericService.isUserLinkedToBusiness(prisma, {
                user_id: auth.sub,
                business_id: businessId,
            });
            const ticketTier = await prisma.ticketTier.findUnique({
                where: { id: ticket_tier_id },
                include: {
                    ticket: {
                        include: {
                            product: true,
                        },
                    },
                    purchased_tickets: true,
                },
            });
            if (!ticketTier || !ticketTier.ticket?.product) {
                throw new common_1.NotFoundException('Ticket tier not found.');
            }
            const product = ticketTier.ticket.product;
            if (product.business_id !== businessId) {
                throw new common_1.ForbiddenException('You do not have access to this ticket tier.');
            }
            if (ticketTier.purchased_tickets.length) {
                throw new common_1.ForbiddenException('You cannot delete a ticket tier that has once been purchased.');
            }
            await prisma.ticketTier.update({
                where: { id: ticket_tier_id },
                data: {
                    name: `${ticketTier.name} [deleted - ${new Date().getTime()}]`,
                    deleted_at: new Date(),
                },
            });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.MANAGE_TICKET,
                entity: 'TicketTier',
                entity_id: ticket_tier_id,
                metadata: `User with ID ${auth.sub} deleted ticket tier ID ${ticket_tier_id} from ticket ID ${ticketTier.ticket_id}`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Ticket tier deleted successfully.',
                data: { ticket_tier_id, deleted: true },
            };
        });
    }
};
exports.TicketCrudService = TicketCrudService;
exports.TicketCrudService = TicketCrudService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        log_service_1.LogService,
        generic_service_1.GenericService])
], TicketCrudService);
//# sourceMappingURL=crud.service.js.map