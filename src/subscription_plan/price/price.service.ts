import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateSubscriptionPlanPriceDto,
  UpdateSubscriptionPlanPriceDto,
} from './price.dto';
import {
  AuthPayload,
  GenericPayload,
  PagePayload,
} from '../../generic/generic.payload';
import { PrismaBaseRepository } from '../../prisma/prisma.base.repository';
import {
  Action,
  Prisma,
  PrismaClient,
  SubscriptionPeriod,
  SubscriptionPlan,
  SubscriptionPlanPrice,
} from '@prisma/client';
import { LogService } from '../../log/log.service';
import {
  getIpAddress,
  getUserAgent,
  pageFilter,
  verifySubscriptionPlan,
} from '../../generic/generic.utils';
import { QueryDto, TZ } from '../../generic/generic.dto';
import { PriceSelection, RelatedModels } from './price.utils';
import { GenericService } from '../../generic/generic.service';

@Injectable()
export class SubscriptionPlanPriceService {
  private readonly subscriptionPlanPriceRepository: PrismaBaseRepository<
    SubscriptionPlanPrice,
    Prisma.SubscriptionPlanPriceCreateInput,
    Prisma.SubscriptionPlanPriceUpdateInput,
    Prisma.SubscriptionPlanPriceWhereUniqueInput,
    | Prisma.SubscriptionPlanPriceWhereInput
    | Prisma.SubscriptionPlanPriceFindFirstArgs,
    Prisma.SubscriptionPlanPriceUpsertArgs
  >;
  private readonly subscriptionPlanRepository: PrismaBaseRepository<
    SubscriptionPlan,
    Prisma.SubscriptionPlanCreateInput,
    Prisma.SubscriptionPlanUpdateInput,
    Prisma.SubscriptionPlanWhereUniqueInput,
    Prisma.SubscriptionPlanWhereInput | Prisma.SubscriptionPlanFindFirstArgs,
    Prisma.SubscriptionPlanUpsertArgs
  >;

  private readonly select: Prisma.SubscriptionPlanPriceSelect = {
    id: true,
    price: true,
    period: true,
    created_at: true,
    creator: {
      select: {
        id: true,
        name: true,
        role: { select: { name: true, role_id: true } },
      }, // Fetch only required user details
    },
    subscription_plan: {
      select: {
        id: true,
        name: true,
        business_id: true,
      },
    },
  };

  constructor(
    private prisma: PrismaService,
    private readonly logService: LogService,
    private readonly genericService: GenericService,
  ) {
    this.subscriptionPlanPriceRepository = new PrismaBaseRepository<
      SubscriptionPlanPrice,
      Prisma.SubscriptionPlanPriceCreateInput,
      Prisma.SubscriptionPlanPriceUpdateInput,
      Prisma.SubscriptionPlanPriceWhereUniqueInput,
      | Prisma.SubscriptionPlanPriceWhereInput
      | Prisma.SubscriptionPlanPriceFindFirstArgs,
      Prisma.SubscriptionPlanPriceUpsertArgs
    >('subscriptionPlanPrice', prisma);
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
   * Create a new subscription plan's price
   * @param request
   * @param dto
   * @returns
   */
  async create(
    request: AuthPayload & Request,
    dto: CreateSubscriptionPlanPriceDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    let { period, subscription_plan_id } = dto;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Get subscription plan
      const subscription_plan = await prisma.subscriptionPlan.findUnique({
        where: { id: subscription_plan_id },
      });

      // Verify subscription plan
      verifySubscriptionPlan(subscription_plan);

      // Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: subscription_plan.business_id,
      });

      // 2. Check if subscription plan price exists
      const sub_plan_price = await prisma.subscriptionPlanPrice.findFirst({
        where: {
          period,
          subscription_plan_id,
        },
      });

      // Check if subscription price has already been created
      if (sub_plan_price) {
        throw new BadRequestException("Subscription plan's price exists.");
      }

      // 3. Create subscription plan price
      const price = await prisma.subscriptionPlanPrice.create({
        data: { ...dto, creator_id: auth.sub },
        select: {
          id: true,
          subscription_plan: { select: { business_id: true } },
        },
      });

      // 4. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.SUBSCRIPTION_PLAN_PRICE,
          entity: 'SubscriptionPlanPrice',
          entity_id: price.id,
          metadata: `User with ID ${auth.sub} just created a price for subscription plan ID ${subscription_plan_id} of Business ID ${price.subscription_plan.business_id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: "Subscription plan's price created successfully.",
      };
    });
  }

  /**
   * Fetch paginated subscription plan prices.
   * @param payload - Authenticated user payload.
   * @param param - Request parameters containing subscription_plan_id.
   * @param queryDto - Pagination and query filters.
   * @returns Paginated subscription plan prices.
   */
  async fetch(
    payload: AuthPayload,
    param: { subscription_plan_id: string },
    queryDto: QueryDto,
  ): Promise<PagePayload<SubscriptionPlanPrice>> {
    const user = payload.user;
    const { subscription_plan_id } = param;

    // Step 1: Retrieve the subscription plan with minimal required fields
    const subscriptionPlan = await this.subscriptionPlanRepository.findOne(
      { id: subscription_plan_id },
      undefined,
      { business_id: true },
    );

    // Step 2: Validate the subscription plan and user permissions
    verifySubscriptionPlan(subscriptionPlan);
    await this.genericService.isUserLinkedToBusiness(this.prisma, {
      user_id: user.sub,
      business_id: subscriptionPlan.business_id,
    });

    // Step 3: Prepare filters for pagination and timezone
    const paginationFilters = pageFilter(queryDto);
    const filters: Prisma.SubscriptionPlanPriceWhereInput & TZ = {
      subscription_plan_id,
      ...paginationFilters.filters,
      tz: payload.timezone,
    };

    // Step 4: Execute paginated query and count in parallel
    const [planPrices, total] = await Promise.all([
      this.subscriptionPlanPriceRepository.findManyWithPagination(
        filters,
        paginationFilters.pagination_options,
        Prisma.SortOrder.desc,
        undefined,
        this.select, // Use defined `select` from class
      ),
      this.subscriptionPlanPriceRepository.count(filters),
    ]);

    // Step 5: Return formatted response
    return {
      statusCode: HttpStatus.OK,
      data: planPrices,
      count: total,
    };
  }

  /**
   * Get a single subscription plan's price by ID - (Invoked in the subscription module)
   * @param id
   * @returns
   */
  async findOne(id: string) {
    const select = this.select;

    const filters: Prisma.SubscriptionPlanPriceWhereUniqueInput = {
      id,
    };

    const price = await this.prisma.subscriptionPlanPrice.findFirst({
      where: filters,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            role: { select: { name: true, role_id: true } },
          },
        },
        subscription_plan: {
          select: {
            id: true,
            name: true,
            business_id: true,
          },
        },
      },
    });

    if (!price) {
      throw new NotFoundException(
        `Subscription plan's price not found for your subscription plan`,
      );
    }

    return price;
  }

  /**
   * Update subscription plan's price
   * @param request
   * @param param
   * @param dto
   * @returns
   */
  async update(
    request: AuthPayload & Request,
    param: { id: string },
    dto: UpdateSubscriptionPlanPriceDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { id } = param;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Check for the existing of the subscription plan's price
      const existing_plan_price = await this.findOne(id);

      // Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: existing_plan_price.subscription_plan.business_id,
      });

      // 2. Update subscription plan price
      await prisma.subscriptionPlanPrice.update({
        where: { id: existing_plan_price.id },
        data: {
          ...dto,
        },
      });

      // 3. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.SUBSCRIPTION_PLAN_PRICE,
          entity: 'SubscriptionPlanPrice',
          entity_id: existing_plan_price.id,
          metadata: `User with ID ${auth.sub} just created a subscription plan price for subscription plan ID ${existing_plan_price.subscription_plan.id} of business ID ${existing_plan_price.subscription_plan.business_id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: "Subscription plan's price updated successfully.",
      };
    });
  }

  /**
   * Validate that model has related records
   * @param prisma
   * @param period
   */
  private async hasRelatedRecords(
    prisma: PrismaClient,
    plan_id: string,
    period: SubscriptionPeriod,
  ): Promise<void> {
    const relatedTables = [
      {
        model: prisma.subscription,
        field1: 'plan_id',
        field2: 'billing_interval',
      },
    ];

    for (const { model, field1, field2 } of relatedTables) {
      const count = await (model.count as any)({
        where: { [field1]: plan_id, [field2]: period },
      });
      if (count > 0) {
        throw new ForbiddenException('Related records for this model exists.'); // Related records exist
      }
    }

    // No related records. Move on
  }

  /**
   * Delete plan's price (Soft delete)
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
      // 1. Check for the existing of the subscription plan price
      const existing_plan_price = await this.findOne(id);

      // Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: existing_plan_price.subscription_plan.business_id,
      });

      // Validate that there are no related models (Presently, nothing depends on this model)
      await this.hasRelatedRecords(
        prisma as PrismaClient,
        existing_plan_price.subscription_plan.id,
        existing_plan_price.period,
      );

      // 2. Update subscription plan
      await prisma.subscriptionPlanPrice.update({
        where: { id: existing_plan_price.id },
        data: {
          deleted_at: new Date(),
        },
      });

      // 3. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.SUBSCRIPTION_PLAN_PRICE,
          entity: 'SubscriptionPlanPrice',
          entity_id: existing_plan_price.id,
          metadata: `User with ID ${auth.sub} just deleted a subscription plan price ID ${existing_plan_price.id} from subscription plan ${existing_plan_price.subscription_plan.id} of business ID ${existing_plan_price.subscription_plan.business_id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: "Subscription plan's price deleted successfully.",
      };
    });
  }
}
