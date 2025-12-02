import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateSubscriptionPlanDto,
  CreateSubscriptionPlanDto2,
  FilterBusinessPlansDto,
  FilterPlanDto,
  FilterSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto2,
} from './plan.dto';
import {
  AuthPayload,
  GenericDataPayload,
  GenericPayload,
  PagePayload,
  Timezone,
} from '../../generic/generic.payload';
import { LogService } from '../../log/log.service';
import {
  Action,
  Prisma,
  PrismaClient,
  ProductType,
  Subscription,
  SubscriptionPlan,
} from '@prisma/client';
import {
  getIpAddress,
  getUserAgent,
  pageFilter,
  verifyBusiness,
} from '../../generic/generic.utils';
import { PrismaBaseRepository } from '../../prisma/prisma.base.repository';
import { IdDto, QueryDto, TZ } from '../../generic/generic.dto';
import { GenericService } from '../../generic/generic.service';
import { PlanSelection, RelatedModels } from './plan.utils';

@Injectable()
export class SubscriptionPlanService {
  private readonly subscriptionPlanRepository: PrismaBaseRepository<
    SubscriptionPlan,
    Prisma.SubscriptionPlanCreateInput,
    Prisma.SubscriptionPlanUpdateInput,
    Prisma.SubscriptionPlanWhereUniqueInput,
    Prisma.SubscriptionPlanWhereInput | Prisma.SubscriptionPlanFindFirstArgs,
    Prisma.SubscriptionPlanUpsertArgs
  >;

  private readonly select: Prisma.SubscriptionPlanSelect = {
    id: true,
    name: true,
    description: true,
    cover_image: true,
    created_at: true,
    business_id: true,
    subscriptions: { take: 1, select: { id: true, plan_id: true } },
    creator: {
      select: {
        id: true,
        name: true,
        role: { select: { name: true, role_id: true } },
      }, // Fetch only required user details
    },
    subscription_plan_prices: {
      where: { deleted_at: null },
      select: {
        id: true,
        price: true,
        period: true,
        currency: true,
        subscription_plan: {
          select: { subscriptions: { take: 1, select: { id: true } } },
        },
        other_currencies: true,
      },
    },
    subscription_plan_roles: {
      select: {
        title: true,
        role_id: true,
        selected: true,
      },
    },
    product: { include: { multimedia: true, category: true } },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly logService: LogService,
    private readonly genericService: GenericService,
  ) {
    this.subscriptionPlanRepository = new PrismaBaseRepository<
      SubscriptionPlan,
      Prisma.SubscriptionPlanCreateInput,
      Prisma.SubscriptionPlanUpdateInput,
      Prisma.SubscriptionPlanWhereUniqueInput,
      Prisma.SubscriptionPlanWhereInput | Prisma.SubscriptionPlanFindFirstArgs,
      Prisma.SubscriptionPlanUpsertArgs
    >('subscriptionPlan', prisma);
  }

  /**
   * Create subscription plan
   */
  async create(
    request: AuthPayload & Request,
    dto: CreateSubscriptionPlanDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { name, slug, business_id, category_id, status, multimedia_id } = dto;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Verify user is linked to business
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id,
      });

      const product_slug = await prisma.product.findFirst({ where: { slug } });
      if (product_slug) {
        throw new ConflictException('Shortlink already exists.');
      }

      // 2. Ensure category exists
      const category = await prisma.productCategory.findUnique({
        where: { id: category_id },
      });
      if (!category) {
        throw new NotFoundException('Category not found.');
      }

      // 3. Ensure subscription plan does not already exist
      const existingPlan = await prisma.subscriptionPlan.findUnique({
        where: { name_business_id: { name, business_id } },
      });

      if (existingPlan) {
        throw new BadRequestException(
          'A subscription plan with this name already exists.',
        );
      }

      // 4. Ensure product with same title does not exist
      const existingProduct = await prisma.product.findFirst({
        where: { title: name, business_id },
      });

      if (existingProduct) {
        throw new BadRequestException(
          'A product with this title already exists.',
        );
      }

      // 5. Create product
      const product = await prisma.product.create({
        data: {
          business_info: { connect: { id: business_id } },
          title: name,
          slug,
          type: ProductType.SUBSCRIPTION,
          status,
          creator: { connect: { id: auth.sub } },
          category: { connect: { id: category_id } },
          multimedia: { connect: { id: multimedia_id } },
        },
        include: { business_info: { include: { onboarding_status: true } } },
      });

      // Remove slug
      delete dto.slug;

      // 6. Create subscription plan linked to product
      const plan = await prisma.subscriptionPlan.create({
        data: {
          ...dto,
          creator_id: auth.sub,
          product_id: product.id,
        },
      });

      if (product.business_info.onboarding_status.current_step < 5) {
        await prisma.onboardingStatus.upsert({
          where: {
            user_id_business_id: {
              user_id: auth.sub,
              business_id,
            },
          },
          create: {
            user_id: auth.sub,
            business_id,
            current_step: 5,
          },
          update: {
            current_step: 5,
          },
        });
      }

      // 8. Log activity
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.SUBSCRIPTION_PLAN,
          entity: 'SubscriptionPlan',
          entity_id: plan.id,
          metadata: `User with ID ${auth.sub} created a subscription plan "${plan.name}".`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Subscription plan created successfully.',
      };
    });
  }

  /**
   * Fetch plans (with pagination filters)
   * @param payload
   * @param param
   * @param queryDto
   * @returns
   */
  async fetch(
    payload: AuthPayload,
    param: { business_id: string },
    queryDto: FilterPlanDto,
  ): Promise<PagePayload<SubscriptionPlan>> {
    const auth = payload.user;
    const { business_id } = param;

    // Check if user is part of the company's administrators
    await this.genericService.isUserLinkedToBusiness(
      this.prisma,
      {
        user_id: auth.sub,
        business_id,
      },
      true,
    );

    // Invoke pagination filters
    const pagination_filters = pageFilter(queryDto);

    const filters: Prisma.SubscriptionPlanWhereInput & TZ = {
      ...(business_id && { business_id }),
      ...(queryDto.q && {
        OR: [
          { id: { contains: queryDto.q, mode: 'insensitive' } },
          {
            name: { contains: queryDto.q, mode: 'insensitive' },
          },
        ],
      }),
      ...pagination_filters.filters,
      tz: payload.timezone,
    };

    const select: Prisma.SubscriptionPlanSelect = {
      ...this.select,
      subscription_plan_roles: true,
      business: true,
    };

    const plans = await this.subscriptionPlanRepository.findManyWithPagination(
      filters,
      { ...pagination_filters.pagination_options },
      Prisma.SortOrder.desc,
      undefined,
      select,
    );

    const total = await this.subscriptionPlanRepository.count(filters);

    return {
      statusCode: HttpStatus.OK,
      data: plans,
      count: total,
    };
  }

  /**
   * Find single plan
   * @param user_id
   * @param id
   * @returns
   */
  private async findOne(id: string): Promise<PlanSelection & RelatedModels> {
    const select = this.select;

    const filters: Prisma.SubscriptionPlanWhereUniqueInput = {
      id,
    };

    const plan: PlanSelection & RelatedModels =
      await this.subscriptionPlanRepository.findOne(filters, undefined, select);

    if (!plan) {
      throw new NotFoundException(
        'Subscription plan not found for your business.',
      );
    }

    return plan;
  }

  /**
   * Fetch single plan
   * @param param
   * @returns
   */
  async findSingle(
    param: IdDto,
  ): Promise<GenericDataPayload<PlanSelection & RelatedModels>> {
    const plan = await this.findOne(param.id);

    return {
      statusCode: HttpStatus.OK,
      data: plan,
    };
  }

  /**
   * Update plan
   * @param request
   * @param param
   * @param dto
   * @returns
   */
  async update(
    request: AuthPayload & Request,
    param: { id: string },
    dto: UpdateSubscriptionPlanDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { id } = param;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Check for the existing of the subscription plan
      const existing_plan = await this.findOne(id);

      // Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(this.prisma, {
        user_id: auth.sub,
        business_id: existing_plan.business_id,
      });

      // 2. Update subscription plan
      await prisma.subscriptionPlan.update({
        where: { id: existing_plan.id },
        data: {
          ...dto,
        },
      });

      // 2b. Update product
      await prisma.product.update({
        where: { id: existing_plan.product.id },
        data: {
          ...(dto.status && { status: dto.status }),
          ...(dto.slug && { slug: dto.slug }),
          ...(dto.category_id && { category_id: dto.category_id }),
          ...(dto.multimedia_id && { multimedia_id: dto.multimedia_id }),
        },
      });

      // 3. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.SUBSCRIPTION_PLAN,
          entity: 'SubscriptionPlan',
          entity_id: existing_plan.id,
          metadata: `User with ID ${auth.sub} just created a subscription plan.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Subscription plan updated successfully.',
      };
    });
  }

  /**
   * Validate that model has related records
   * @param prisma
   * @param subscription_plan_id
   */
  private async hasRelatedRecords(
    prisma: PrismaClient,
    subscription_plan_id: string,
  ): Promise<void> {
    const relatedTables = [
      // { model: prisma.subscriptionPlanRole, field: 'subscription_plan_id' },
      // { model: prisma.subscriptionPlanPrice, field: 'subscription_plan_id' },
      { model: prisma.subscription, field: 'plan_id' },
    ];

    for (const { model, field } of relatedTables) {
      const count = await (model.count as any)({
        where: { [field]: subscription_plan_id },
      });
      if (count > 0) {
        throw new ForbiddenException('Related records for this model exists.'); // Related records exist
      }
    }

    // No related records. Move on
  }

  /**
   * Delete plan (Soft delete)
   * @param request
   * @param param
   * @returns
   */
  async delete(
    request: AuthPayload & Request,
    param: { id: string },
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { id } = param;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Check for the existing of the subscription plan
      const existing_plan = await this.findOne(id);

      // Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(this.prisma, {
        user_id: auth.sub,
        business_id: existing_plan.business_id,
      });

      // Validate that there are no related models
      await this.hasRelatedRecords(prisma as PrismaClient, existing_plan.id);

      // 2. Update subscription plan
      await prisma.subscriptionPlan.update({
        where: { id: existing_plan.id },
        data: {
          name: `${existing_plan.name} [Deleted - ${new Date().getTime()}]`,
          deleted_at: new Date(),
        },
      });

      // 3. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.SUBSCRIPTION_PLAN,
          entity: 'SubscriptionPlan',
          entity_id: existing_plan.id,
          metadata: `User with ID ${auth.sub} just deleted a subscription plan ID ${existing_plan.id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Subscription plan deleted successfully.',
      };
    });
  }

  /**
   * Fetch plans along with their prices (with pagination filters)
   * @param payload
   * @param param
   * @param queryDto
   * @returns
   */
  async publicFetch(
    payload: Timezone & Request,
    param: { business_id: string },
    queryDto: QueryDto,
  ): Promise<PagePayload<SubscriptionPlan>> {
    const { business_id } = param;

    // Invoke pagination filters
    const pagination_filters = pageFilter(queryDto);

    const filters: Prisma.SubscriptionPlanWhereInput & TZ = {
      ...(business_id && { business_id }),
      ...pagination_filters.filters,
      tz: payload.timezone,
    };

    // Remove unwanted
    delete this.select.creator;

    const select = this.select;

    const [plans, total] = await Promise.all([
      this.subscriptionPlanRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        undefined,
        select,
      ),
      this.subscriptionPlanRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: plans,
      count: total,
    };
  }

  /**
   * Fetch business' subscription plans - for admin
   * @param payload
   * @param filterDto
   * @returns
   */
  async fetchBusinessPlans(
    payload: AuthPayload & Request,
    filterDto: FilterBusinessPlansDto,
  ): Promise<PagePayload<SubscriptionPlan>> {
    const { business_id } = filterDto;

    // Check if user is part of the owner's administrators - TODO

    // Invoke pagination filters
    const pagination_filters = pageFilter(filterDto);

    const filters: Prisma.SubscriptionPlanWhereInput & TZ = {
      ...(filterDto.q && {
        OR: [
          {
            id: { contains: filterDto.q, mode: 'insensitive' },
          },
          {
            name: { contains: filterDto.q, mode: 'insensitive' },
          },
        ],
      }),
      ...(business_id && { business_id }),
      ...pagination_filters.filters,
      tz: payload.timezone,
    };

    const include: Prisma.SubscriptionPlanInclude = {
      business: true,
      subscription_plan_prices: true,
      subscription_plan_roles: true,
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          is_email_verified: true,
          is_phone_verified: true,
          created_at: true,
          role: true,
        },
      },
    };

    const [plans, total] = await Promise.all([
      this.subscriptionPlanRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        include,
        undefined,
      ),
      this.subscriptionPlanRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: plans,
      count: total,
    };
  }

  /**
   * Create a bulk subscription plan
   * @param request
   * @param data
   * @returns
   */
  async createSubscriptionPlan(
    request: AuthPayload & Request,
    data: CreateSubscriptionPlanDto2,
  ): Promise<GenericDataPayload<SubscriptionPlan>> {
    const auth = request.user;
    const {
      name,
      slug,
      description,
      cover_image,
      business_id,
      creator_id,
      category_id,
      status,
      multimedia_id,
      subscription_plan_prices,
      subscription_plan_roles,
    } = data;

    return await this.prisma.$transaction(async (tx) => {
      // Check if name and business_id exists
      const found_plan = await tx.subscriptionPlan.findFirst({
        where: {
          name,
          business_id,
        },
      });

      if (found_plan) {
        throw new BadRequestException('Plan name already exists.');
      }

      const product_slug = await tx.product.findFirst({ where: { slug } });
      if (product_slug) {
        throw new BadRequestException('Shortlink already exists.');
      }

      // Check category id
      const product_category = await tx.productCategory.findUnique({
        where: { id: category_id },
      });

      if (!product_category) {
        throw new NotFoundException('Product category not found.');
      }

      // Check multimedia id
      const multimedia = await tx.multimedia.findUnique({
        where: { id: multimedia_id },
      });

      if (!multimedia) {
        throw new NotFoundException('Multimedia not found.');
      }

      // Create product entry
      const product = await tx.product.create({
        data: {
          business_info: { connect: { id: business_id } },
          title: name,
          slug,
          type: ProductType.SUBSCRIPTION,
          status,
          creator: { connect: { id: auth.sub } },
          category: { connect: { id: category_id } },
          multimedia: { connect: { id: multimedia_id } },
        },
        include: { business_info: { include: { onboarding_status: true } } },
      });

      // Create subscription plan entry
      const subscriptionPlan = await tx.subscriptionPlan.create({
        data: {
          name,
          description,
          business_id,
          creator_id,
          product_id: product.id,
          cover_image,
        },
      });

      // Prepare prices
      const prices = subscription_plan_prices.map((price) => ({
        ...price,
        creator_id,
        subscription_plan_id: subscriptionPlan.id,
        ...(price.other_currencies && {
          other_currencies: price.other_currencies
            ? (JSON.parse(
                JSON.stringify(price.other_currencies),
              ) as Prisma.InputJsonValue)
            : undefined,
        }),
      }));

      // Prepare roles
      const roles = subscription_plan_roles.map((role) => ({
        ...role,
        creator_id,
        subscription_plan_id: subscriptionPlan.id,
        selected: role.selected ?? false,
      }));

      // Deduplicate roles by (title, role_id)
      const uniqueRoles = [
        ...new Map(roles.map((r) => [`${r.title}-${r.role_id}`, r])).values(),
      ];

      // Save prices
      await tx.subscriptionPlanPrice.createMany({
        data: prices,
        skipDuplicates: true,
      });

      // Save roles safely
      await tx.subscriptionPlanRole.createMany({
        data: uniqueRoles,
        skipDuplicates: true,
      });

      // Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.SUBSCRIPTION_PLAN,
          entity: 'SubscriptionPlan',
          entity_id: subscriptionPlan.id,
          metadata: `User with ID ${auth.sub} just created a subscription plan.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        tx.log, // transactional Prisma model
      );

      // Fetch saved plan
      const saved = await tx.subscriptionPlan.findFirst({
        where: { id: subscriptionPlan.id },
        select: { ...this.select },
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Subscription plan created successfully.',
        data: saved,
      };
    });
  }

  /**
   * Update a bulk subscription plan
   * @param id
   * @param dto
   * @param request
   * @returns
   */
  async updateSubscriptionPlan(
    id: string,
    dto: UpdateSubscriptionPlanDto2,
    request: AuthPayload & Request,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const {
      name,
      slug,
      description,
      cover_image,
      subscription_plan_prices,
      subscription_plan_roles,
      status,
      multimedia_id,
      category_id,
    } = dto;

    await this.prisma.$transaction(async (tx) => {
      // === Update SubscriptionPlan ===
      const updatedPlan = await tx.subscriptionPlan.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description && { description }),
          ...(cover_image && { cover_image }),
        },
      });

      // === Ensure product_id exists before updating product ===
      if (!updatedPlan.product_id) {
        throw new BadRequestException(
          `Subscription plan '${id}' is not linked to any product.`,
        );
      }

      // === Update Product ===
      const updatedProduct = await tx.product.update({
        where: { id: updatedPlan.product_id },
        data: {
          type: ProductType.SUBSCRIPTION,
          ...(name && { title: name }),
          ...(slug && { slug }),
          ...(description && { description }),
          ...(multimedia_id && { multimedia_id }),
          ...(category_id && { category_id }),
          ...(status && { status }),
        },
      });

      // === Handle Prices ===
      if (subscription_plan_prices) {
        const existingPriceIds = subscription_plan_prices
          .filter((p) => p.id)
          .map((p) => p.id);

        await tx.subscriptionPlanPrice.deleteMany({
          where: {
            subscription_plan_id: id,
            ...(existingPriceIds.length && {
              NOT: { id: { in: existingPriceIds } },
            }),
          },
        });

        for (const price of subscription_plan_prices) {
          if (price.id) {
            await tx.subscriptionPlanPrice.update({
              where: { id: price.id },
              data: {
                price: price.price,
                currency: price.currency,
                period: price.period,
                updated_at: new Date(),
                ...(price.other_currencies && {
                  other_currencies: price.other_currencies
                    ? (JSON.parse(
                        JSON.stringify(price.other_currencies),
                      ) as Prisma.InputJsonValue)
                    : undefined,
                }),
              },
            });
          } else {
            const plan_details = await tx.subscriptionPlanPrice.findFirst({
              where: { period: price.period, subscription_plan_id: id },
            });

            if (plan_details) {
              throw new BadRequestException(
                `The period '${price.period}' already exists.`,
              );
            }

            await tx.subscriptionPlanPrice.create({
              data: {
                ...price,
                creator_id: auth.sub,
                subscription_plan_id: id,
                ...(price.other_currencies && {
                  other_currencies: price.other_currencies
                    ? (JSON.parse(
                        JSON.stringify(price.other_currencies),
                      ) as Prisma.InputJsonValue)
                    : undefined,
                }),
              },
            });
          }
        }
      }

      // === Handle Roles ===
      if (subscription_plan_roles) {
        const existingRoleIds = subscription_plan_roles
          .filter((r) => r.id)
          .map((r) => r.id);

        await tx.subscriptionPlanRole.deleteMany({
          where: {
            subscription_plan_id: id,
            ...(existingRoleIds.length && {
              NOT: { id: { in: existingRoleIds } },
            }),
          },
        });

        for (const role of subscription_plan_roles) {
          if (role.id) {
            await tx.subscriptionPlanRole.update({
              where: { id: role.id },
              data: {
                title: role.title,
                role_id: role.role_id,
                selected: role.selected,
                updated_at: new Date(),
              },
            });
          } else {
            await tx.subscriptionPlanRole.create({
              data: {
                ...role,
                selected: role.selected ?? false,
                creator_id: auth.sub,
                subscription_plan_id: id,
              },
            });
          }
        }
      }

      // === Log Entry ===
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.SUBSCRIPTION_PLAN,
          entity: 'SubscriptionPlan',
          entity_id: id,
          metadata: `User with ID ${auth.sub} updated a subscription plan.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        tx.log,
      );

      return updatedPlan;
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Subscription plan updated successfully.',
    };
  }

  /**
   * Fetch all subscription plans for public users with filters and pagination
   */
  async fetchPublicSubscriptionPlans(
    businessId: string,
    filterDto: FilterSubscriptionPlanDto,
  ): Promise<PagePayload<SubscriptionPlan>> {
    const pagination_filters = pageFilter(filterDto);

    const filters: Prisma.SubscriptionPlanWhereInput = {
      ...(filterDto.id && { id: filterDto.id }),
      ...(businessId && {
        business_id: businessId,
      }),
      ...(filterDto.q && {
        OR: [
          {
            name: {
              contains: filterDto.q,
              mode: 'insensitive',
            },
          },
        ],
      }),
      ...pagination_filters.filters,
      deleted_at: null,
    };

    const [subscription_plans, total] = await Promise.all([
      this.prisma.subscriptionPlan.findMany({
        where: filters,
        include: { subscription_plan_prices: true },
        skip:
          (pagination_filters.pagination_options.page - 1) *
          pagination_filters.pagination_options.limit,
        take: pagination_filters.pagination_options.limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.subscriptionPlan.count({ where: filters }),
    ]);

    return {
      statusCode: 200,
      data: subscription_plans,
      count: total,
    };
  }
}
