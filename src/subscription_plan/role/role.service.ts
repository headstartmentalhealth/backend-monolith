import {
  AuthPayload,
  GenericPayload,
  PagePayload,
} from '../../generic/generic.payload';
import { GenericService } from '../../generic/generic.service';
import { LogService } from '../../log/log.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateSubscriptionPlanRoleDto,
  UpdateSubscriptionPlanRoleDto,
} from './role.dto';
import {
  deletionRename,
  getIpAddress,
  getUserAgent,
  pageFilter,
  verifySubscriptionPlan,
} from '../../generic/generic.utils';
import { composeRoleID, RelatedModels, RoleSelection } from './role.utils';
import {
  Action,
  Prisma,
  SubscriptionPlan,
  SubscriptionPlanRole,
} from '@prisma/client';
import { QueryDto, TZ } from '../../generic/generic.dto';
import { PrismaBaseRepository } from '../../prisma/prisma.base.repository';

@Injectable()
export class SubscriptionPlanRoleService {
  private readonly subscriptionPlanRoleRepository: PrismaBaseRepository<
    SubscriptionPlanRole,
    Prisma.SubscriptionPlanRoleCreateInput,
    Prisma.SubscriptionPlanRoleUpdateInput,
    Prisma.SubscriptionPlanRoleWhereUniqueInput,
    | Prisma.SubscriptionPlanRoleWhereInput
    | Prisma.SubscriptionPlanRoleFindFirstArgs,
    Prisma.SubscriptionPlanRoleUpsertArgs
  >;
  private readonly subscriptionPlanRepository: PrismaBaseRepository<
    SubscriptionPlan,
    Prisma.SubscriptionPlanCreateInput,
    Prisma.SubscriptionPlanUpdateInput,
    Prisma.SubscriptionPlanWhereUniqueInput,
    Prisma.SubscriptionPlanWhereInput | Prisma.SubscriptionPlanFindFirstArgs,
    Prisma.SubscriptionPlanUpsertArgs
  >;
  private readonly select: Prisma.SubscriptionPlanRoleSelect = {
    id: true,
    title: true,
    role_id: true,
    selected: true,
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
    this.subscriptionPlanRoleRepository = new PrismaBaseRepository<
      SubscriptionPlanRole,
      Prisma.SubscriptionPlanRoleCreateInput,
      Prisma.SubscriptionPlanRoleUpdateInput,
      Prisma.SubscriptionPlanRoleWhereUniqueInput,
      | Prisma.SubscriptionPlanRoleWhereInput
      | Prisma.SubscriptionPlanRoleFindFirstArgs,
      Prisma.SubscriptionPlanRoleUpsertArgs
    >('subscriptionPlanRole', prisma);
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
   * Create a new subscription plan's role
   * @param request
   * @param dto
   * @returns
   */
  async create(
    request: AuthPayload & Request,
    dto: CreateSubscriptionPlanRoleDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    let { title, subscription_plan_id } = dto;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Get subscription plan
      const subscription_plan = await prisma.subscriptionPlan.findUnique({
        where: { id: subscription_plan_id },
        include: { subscription_plan_roles: { where: { deleted_at: null } } },
      });

      // Verify subscription plan
      verifySubscriptionPlan(subscription_plan);

      // 2. Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: subscription_plan.business_id,
      });

      // Compose role ID
      const role_id = composeRoleID(title);

      // 3. Retrieve existing subscription plan's price
      const sub_plan_role = await prisma.subscriptionPlanRole.findUnique({
        where: {
          title_role_id: {
            title,
            role_id,
          },
          subscription_plan_id,
        },
      });

      // Check if subscription plan's price has already been created
      if (sub_plan_role) {
        throw new ConflictException("Subscription plan's role exists.");
      }

      // 4. Create subscription plan price
      const role = await prisma.subscriptionPlanRole.create({
        data: {
          ...dto,
          creator_id: auth.sub,
          role_id,
          selected: !subscription_plan.subscription_plan_roles.length && true,
        },
        select: {
          id: true,
          subscription_plan: { select: { business_id: true } },
        },
      });

      // 4. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.SUBSCRIPTION_PLAN_ROLE,
          entity: 'SubscriptionPlanRole',
          entity_id: role.id,
          metadata: `User with ID ${auth.sub} just created a role for subscription plan ID ${subscription_plan_id} of Business ID ${role.subscription_plan.business_id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: "Subscription plan's role created successfully.",
      };
    });
  }

  /**
   * Get all subscription plan's roles
   * @param payload
   * @param param
   * @param queryDto
   * @returns
   */
  async fetch(
    payload: AuthPayload,
    param: { subscription_plan_id: string },
    queryDto: QueryDto,
  ): Promise<PagePayload<SubscriptionPlanRole>> {
    const auth = payload.user;
    const { subscription_plan_id } = param;

    let select: Prisma.SubscriptionPlanSelect = {
      business_id: true,
    };

    // 1. Get subscription plan
    const subscription_plan = await this.subscriptionPlanRepository.findOne(
      { id: subscription_plan_id },
      undefined,
      select,
    );

    // Verify subscription plan
    verifySubscriptionPlan(subscription_plan);

    // Check if user is part of the company's administrators
    await this.genericService.isUserLinkedToBusiness(this.prisma, {
      user_id: auth.sub,
      business_id: subscription_plan.business_id,
    });

    // Invoke pagination filters
    const pagination_filters = pageFilter(queryDto);

    // Filters
    let filters: Prisma.SubscriptionPlanRoleWhereInput & TZ = {
      ...(subscription_plan_id && { subscription_plan_id }),
      ...pagination_filters.filters,
      tz: payload.timezone,
    };

    // Assign something else to same variable
    select = this.select;

    const [plan_roles, total] = await Promise.all([
      this.subscriptionPlanRoleRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        undefined,
        select,
      ),
      this.subscriptionPlanRoleRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: plan_roles,
      count: total,
    };
  }

  /**
   * Get a single subscription plan's role by ID
   * @param id
   * @returns
   */
  private async findOne(id: string): Promise<RoleSelection & RelatedModels> {
    const select = this.select;

    const filters: Prisma.SubscriptionPlanRoleWhereUniqueInput = {
      id,
    };

    const role: RoleSelection & RelatedModels =
      await this.subscriptionPlanRoleRepository.findOne(
        filters,
        undefined,
        select,
      );

    if (!role) {
      throw new NotFoundException(
        `Subscription plan's role not found for this subscription plan`,
      );
    }

    return role;
  }

  /**
   * Update subscription plan's role
   * @param request
   * @param param
   * @param dto
   * @returns
   */
  async update(
    request: AuthPayload & Request,
    param: { id: string },
    dto: UpdateSubscriptionPlanRoleDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { id } = param;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Check for the existence of the subscription plan's role
      const existing_plan_role = await this.findOne(id);

      // Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: existing_plan_role.subscription_plan.business_id,
      });

      // 2. Update subscription plan role
      await prisma.subscriptionPlanRole.update({
        where: { id: existing_plan_role.id },
        data: {
          ...dto,
        },
      });

      // 3. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.SUBSCRIPTION_PLAN_ROLE,
          entity: 'SubscriptionPlanRole',
          entity_id: existing_plan_role.id,
          metadata: `User with ID ${auth.sub} just updated a subscription plan role for subscription plan ID ${existing_plan_role.subscription_plan.id} of business ID ${existing_plan_role.subscription_plan.business_id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: "Subscription plan's role updated successfully.",
      };
    });
  }

  /**
   * Delete a subscription plan role
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
      // 1. Check for the existence of the subscription plan role
      const existing_plan_role = await this.findOne(id);

      // Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: existing_plan_role.subscription_plan.business_id,
      });

      // Validate that there are no related models (Presently, nothing depends on this model)

      // 2. Update subscription plan
      await prisma.subscriptionPlanRole.update({
        where: { id: existing_plan_role.id },
        data: {
          title: deletionRename(existing_plan_role.title),
          role_id: deletionRename(existing_plan_role.role_id),
          deleted_at: new Date(),
        },
      });

      // 3. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.SUBSCRIPTION_PLAN_ROLE,
          entity: 'SubscriptionPlanRole',
          entity_id: existing_plan_role.id,
          metadata: `User with ID ${auth.sub} just deleted a subscription plan role ID ${existing_plan_role.id} from subscription plan ${existing_plan_role.subscription_plan.id} of business ID ${existing_plan_role.subscription_plan.business_id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: "Subscription plan's role deleted successfully.",
      };
    });
  }
}
