import {
  AuthPayload,
  GenericDataPayload,
  GenericPayload,
  GenericPayloadAlias,
  PagePayload,
} from '@/generic/generic.payload';
import { GenericService } from '@/generic/generic.service';
import {
  getIpAddress,
  getUserAgent,
  pageFilter,
} from '@/generic/generic.utils';
import { LogService } from '@/log/log.service';
import { PrismaBaseRepository } from '@/prisma/prisma.base.repository';
import { PrismaService } from '@/prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Action,
  Prisma,
  Product,
  ProductStatus,
  ProductType,
  Ticket,
  TicketTier,
} from '@prisma/client';
import {
  CreateTicketDto,
  CreateTicketTierDto,
  FilterProductDto,
  TicketTierIdDto,
  UpdateTicketDto,
} from './crud.dto';
import { IdDto, TZ } from '@/generic/generic.dto';
import { DeleteTicket, DeleteTicketTier } from './crud.payload';

@Injectable()
export class TicketCrudService {
  private readonly model = 'Product';
  private readonly productRepository: PrismaBaseRepository<
    Product,
    Prisma.ProductCreateInput,
    Prisma.ProductUpdateInput,
    Prisma.ProductWhereUniqueInput,
    Prisma.ProductWhereInput | Prisma.ProductFindFirstArgs,
    Prisma.ProductUpsertArgs
  >;
  private readonly select: Prisma.ProductSelect = {
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
      }, // Fetch only required user details
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

  constructor(
    private prisma: PrismaService,
    private readonly logService: LogService,
    private readonly genericService: GenericService,
  ) {
    this.productRepository = new PrismaBaseRepository<
      Product,
      Prisma.ProductCreateInput,
      Prisma.ProductUpdateInput,
      Prisma.ProductWhereUniqueInput,
      Prisma.ProductWhereInput | Prisma.ProductFindFirstArgs,
      Prisma.ProductUpsertArgs
    >('product', prisma);
  }

  /**
   * Create a ticket product
   * @param request
   * @param createTicketDto
   * @returns
   */
  async create(
    request: AuthPayload & Request,
    createTicketDto: CreateTicketDto,
  ): Promise<GenericPayloadAlias<Product>> {
    const auth = request.user;
    const {
      title,
      slug,
      description,
      multimedia_id,
      category_id,
      keywords,
      event_time,
      event_start_date,
      event_end_date,
      event_location,
      event_type,
      auth_details,
      ticket_tiers,
    } = createTicketDto;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: request['Business-Id'],
      });

      const product_slug = await prisma.product.findFirst({ where: { slug } });
      if (product_slug) {
        throw new ConflictException('Shortlink already exists.');
      }

      // Check if multimedia exists
      const multimedia = await prisma.multimedia.findUnique({
        where: { id: multimedia_id },
      });

      if (!multimedia) {
        throw new NotFoundException('Multimedia not found.');
      }

      // Check if product category exists
      const product_category = await prisma.productCategory.findUnique({
        where: { id: category_id },
      });

      if (!product_category) {
        throw new NotFoundException('Category not found.');
      }

      // Find product by slug
      await this.genericService.productBySlug(prisma, slug);

      // 2. Create ticket product
      const product = await prisma.product.create({
        data: {
          title,
          slug,
          description,
          creator: { connect: { id: auth.sub } },
          business_info: { connect: { id: request['Business-Id'] } },
          multimedia: { connect: { id: multimedia_id } },
          type: ProductType.TICKET,
          category: { connect: { id: category_id } },
          keywords,
          status: ProductStatus.PUBLISHED, // Set as published by default
          published_at: new Date(), // Set published_at
        },
        include: { business_info: { include: { onboarding_status: true } } },
      });

      // Create ticket details
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

      // Create ticket tier details
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
              ? (JSON.parse(
                  JSON.stringify(ticket_tier.other_currencies),
                ) as Prisma.InputJsonValue)
              : undefined,
          }),
        })),
      });

      if (product.business_info.onboarding_status.current_step < 5) {
        // Update onboarding status if not updated to 5
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

      // 3. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_TICKET,
          entity: 'Ticket',
          entity_id: ticket.id,
          metadata: `User with ID ${auth.sub} just created a ticket product ID ${ticket.id} for Business ID ${product.business_id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Ticket created successfully.',
        data: product,
      };
    });
  }

  /**
   * Fetch tickets (products of type TICKET)
   * @param payload
   * @param filterTicketDto
   * @returns
   */
  async fetch(
    payload: AuthPayload,
    filterTicketDto: FilterProductDto, // reuse or create FilterTicketDto if needed
  ): Promise<PagePayload<Product>> {
    const auth = payload.user;

    // Ensure user is part of the business
    await this.genericService.isUserLinkedToBusiness(this.prisma, {
      user_id: auth.sub,
      business_id: payload['Business-Id'],
    });

    // Apply pagination filter logic
    const pagination_filters = pageFilter(filterTicketDto);

    // Construct filters
    const filters: Prisma.ProductWhereInput & TZ = {
      business_id: payload['Business-Id'],
      type: ProductType.TICKET,
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

    const select: Prisma.ProductSelect = {
      ...this.select,
      business_info: true,
      ticket: {
        include: {
          ticket_tiers: {
            where: { deleted_at: null }, // ✅ Only include non-deleted tiers
          },
        },
      },
    };

    const [tickets, total] = await Promise.all([
      this.productRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        undefined,
        select,
      ),
      this.productRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: tickets,
      count: total,
    };
  }

  /**
   * Fetch single ticket
   * @param payload
   * @param param
   * @returns
   */
  async fetchSingle(
    payload: AuthPayload,
    param: IdDto,
  ): Promise<GenericDataPayload<Product>> {
    const auth = payload.user;

    // Check if user is part of the company's administrators
    await this.genericService.isUserLinkedToBusiness(this.prisma, {
      user_id: auth.sub,
      business_id: payload['Business-Id'],
    });

    const select: Prisma.ProductSelect = {
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

    const filters: Prisma.ProductWhereUniqueInput = {
      id: param.id,
    };

    const ticket: Product = await this.productRepository.findOne(
      filters,
      undefined,
      select,
    );

    return {
      statusCode: HttpStatus.OK,
      data: ticket,
    };
  }

  /**
   * Get a single ticket (return error if not found)
   * @param id
   * @returns
   */
  async findOne(id: string): Promise<Product> {
    const select = this.select;

    const filters: Prisma.ProductWhereUniqueInput = {
      id,
    };

    const ticket = await this.productRepository.findOne(
      filters,
      undefined,
      select,
    );

    if (!ticket) {
      throw new NotFoundException(`Ticket not found.`);
    }

    return ticket;
  }

  /**
   * Update a ticket
   * @param request
   * @param param
   * @param updateTicketDto
   * @returns
   */
  async update(
    request: AuthPayload & Request,
    param: IdDto,
    dto: UpdateTicketDto,
  ): Promise<GenericPayloadAlias<Product>> {
    const auth = request.user;
    const { id } = param;
    const businessId = request['Business-Id'];

    return this.prisma.$transaction(async (prisma) => {
      const existingTicket = await this.findOne(id);

      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: businessId,
      });

      const productUpdateData: Prisma.ProductUpdateInput = {
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
        ...(dto.status === ProductStatus.PUBLISHED && {
          published_at: new Date(),
        }),
      };

      const ticketUpdateData: Prisma.TicketUpdateInput = {
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

      // If this is the first time publishing this ticket, check if it's the first published ticket
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
        // Handle updates
        const updates = dto.ticket_tiers
          .filter((tier) => tier.id)
          .map((tier) =>
            prisma.ticketTier.update({
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
                    ? (JSON.parse(
                        JSON.stringify(tier.other_currencies),
                      ) as Prisma.InputJsonValue)
                    : undefined,
                }),
              },
            }),
          );

        // Handle creates with duplicate name check
        const creates = [];
        for (const tier of dto.ticket_tiers.filter((t) => !t?.id)) {
          const existingTier = await prisma.ticketTier.findFirst({
            where: {
              ticket_id: updatedTicket.id,
              name: tier.name,
            },
          });

          if (existingTier) {
            throw new BadRequestException(
              `A ticket tier with the name "${tier.name}" already exists for this ticket.`,
            );
          }

          creates.push(
            prisma.ticketTier.create({
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
                    ? (JSON.parse(
                        JSON.stringify(tier.other_currencies),
                      ) as Prisma.InputJsonValue)
                    : undefined,
                }),
              },
            }),
          );
        }

        updatedTiers = await Promise.all([...updates, ...creates]);
      }

      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_TICKET,
          entity: 'Ticket',
          entity_id: updatedTicket.id,
          metadata: `User with ID ${auth.sub} bulk updated ticket ID ${updatedTicket.id} for business ID ${businessId}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      const finalTicketProduct = Object.assign({}, updatedProduct, {
        ticket: updatedTicket,
        ticket_tiers: updatedTiers,
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Ticket updated successfully with bulk tier operations.',
        data: finalTicketProduct,
      };
    });
  }

  /**
   * Delete a ticket
   * @param request
   * @param param
   * @returns
   */
  async delete(
    request: AuthPayload & Request,
    param: IdDto,
  ): Promise<GenericPayloadAlias<DeleteTicket>> {
    const auth = request.user;
    const { id } = param;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: request['Business-Id'],
      });

      // 2. Get a single ticket
      const existing_ticket_product = await this.findOne(id);

      // 3. Check if ticket is published
      if (existing_ticket_product.status === ProductStatus.PUBLISHED) {
        throw new ForbiddenException('You cannot delete a published ticket.');
      }

      // 4. Validate that there are no related models
      await this.hasRelatedRecords(existing_ticket_product.id);

      // 5. Update product
      const product = await prisma.product.update({
        where: { id: existing_ticket_product.id },
        data: {
          deleted_at: new Date(),
        },
      });

      // 6. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_TICKET,
          entity: 'Ticket',
          entity_id: existing_ticket_product.id,
          metadata: `User with ID ${auth.sub} just deleted a ticket ID ${existing_ticket_product.id} from business ID ${request['Business-Id']}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Ticket deleted successfully.',
        data: {
          id: product.id,
          deleted: true,
        },
      };
    });
  }

  /**
   * Validate that model has related records
   * @param product_id
   */
  private async hasRelatedRecords(product_id: string): Promise<void> {
    const relatedTables = [{ model: this.prisma.payment, field: 'product_id' }];

    for (const { model, field } of relatedTables) {
      const count = await (model.count as any)({
        where: {
          purchase: {
            path: ['items'],
            array_contains: [{ product_id: product_id }],
          },
        },
      });

      if (count > 0) {
        throw new ForbiddenException('Related records for this model exists.'); // Related records exist
      }
    }

    // No related records. Move on
  }

  /**
   * Remove ticket tier
   * @param request
   * @param param
   * @returns
   */
  async removeTicketTier(
    request: AuthPayload & Request,
    param: TicketTierIdDto, // { id: string } where id is the ticket tier ID
  ): Promise<GenericPayloadAlias<DeleteTicketTier>> {
    const auth = request.user;
    const { ticket_tier_id } = param;
    const businessId = request['Business-Id'];

    return this.prisma.$transaction(async (prisma) => {
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: businessId,
      });

      // Fetch the tier and its relations to ensure access
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
        throw new NotFoundException('Ticket tier not found.');
      }

      const product = ticketTier.ticket.product;

      if (product.business_id !== businessId) {
        throw new ForbiddenException(
          'You do not have access to this ticket tier.',
        );
      }

      // Disallow purchased ticket tier from being deleted
      if (ticketTier.purchased_tickets.length) {
        throw new ForbiddenException(
          'You cannot delete a ticket tier that has once been purchased.',
        );
      }

      // Soft delete the ticket tier
      await prisma.ticketTier.update({
        where: { id: ticket_tier_id },
        data: {
          name: `${ticketTier.name} [deleted - ${new Date().getTime()}]`,
          deleted_at: new Date(),
        },
      });

      // Optionally log the deletion
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_TICKET,
          entity: 'TicketTier',
          entity_id: ticket_tier_id,
          metadata: `User with ID ${auth.sub} deleted ticket tier ID ${ticket_tier_id} from ticket ID ${ticketTier.ticket_id}`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Ticket tier deleted successfully.',
        data: { ticket_tier_id, deleted: true },
      };
    });
  }
}
