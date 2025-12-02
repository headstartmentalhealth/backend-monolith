import {
  Controller,
  Post,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionPlanService } from './plan.service';
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
} from '@/generic/generic.payload';
import { Roles } from '@/account/auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';
import { IdDto, QueryDto } from '@/generic/generic.dto';
import { Subscription, SubscriptionPlan } from '@prisma/client';
import { Public } from '@/account/auth/decorators/auth.decorator';
import { PlanSelection, RelatedModels } from './plan.utils';
import { BusinessGuard } from '@/generic/guards/business.guard';

@Controller('v1/subscription-plan')
export class SubscriptionPlanController {
  constructor(
    private readonly subscriptionPlanService: SubscriptionPlanService,
  ) {}

  /**
   * Create subscription plan
   * @param request
   * @param createSubPlanDto
   * @returns
   */
  @Post('create')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  create(
    @Req() request: AuthPayload & Request,
    @Body() createSubPlanDto: CreateSubscriptionPlanDto,
  ): Promise<GenericPayload> {
    return this.subscriptionPlanService.create(request, createSubPlanDto);
  }

  /**
   * Fetch subscription plans (with pagination filters)
   * @param request
   * @param param
   * @param queryDto
   * @returns
   */
  @Get('fetch/:business_id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN, Role.USER)
  fetch(
    @Req() request: AuthPayload & Request,
    @Param() param: { business_id: string },
    @Query() queryDto: FilterPlanDto,
  ): Promise<PagePayload<SubscriptionPlan>> {
    return this.subscriptionPlanService.fetch(request, param, queryDto);
  }

  /**
   * Fetch subscription plans (with pagination filters)
   * @param request
   * @param param
   * @param queryDto
   * @returns
   */
  @UseGuards(BusinessGuard)
  @Get('fetch-single/:id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN, Role.USER)
  findSingle(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
  ): Promise<GenericDataPayload<PlanSelection & RelatedModels>> {
    return this.subscriptionPlanService.findSingle(param);
  }

  /**
   * Update subscription plan
   * @param request
   * @param param
   * @param updateSubPlanDto
   * @returns
   */
  @Patch(':id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  update(
    @Req() request: AuthPayload & Request,
    @Param() param: { id: string },
    @Body() updateSubPlanDto: UpdateSubscriptionPlanDto,
  ): Promise<GenericPayload> {
    return this.subscriptionPlanService.update(
      request,
      param,
      updateSubPlanDto,
    );
  }

  /**
   * Delete subscription plan
   * @param request
   * @param param
   * @returns
   */
  @Delete(':id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  delete(
    @Req() request: AuthPayload & Request,
    @Param() param: { id: string },
  ): Promise<GenericPayload> {
    return this.subscriptionPlanService.delete(request, param);
  }

  /**
   * Fetch subscription plans for public (with pagination filters)
   * @param request
   * @param param
   * @param queryDto
   * @returns
   */
  @Get('view/:business_id')
  @Public()
  publicFetch(
    @Req() request: Timezone & Request,
    @Param() param: { business_id: string },
    @Query() queryDto: QueryDto,
  ): Promise<PagePayload<SubscriptionPlan>> {
    return this.subscriptionPlanService.publicFetch(request, param, queryDto);
  }

  /**
   * Fetch subscription plans for public (with pagination filters)
   * @param request
   * @param param
   * @param queryDto
   * @returns
   */
  @Get('fetch-all')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  fetchBusinessPlans(
    @Req() request: AuthPayload & Request,
    @Query() filterBusinessPlanDto: FilterBusinessPlansDto,
  ): Promise<PagePayload<SubscriptionPlan>> {
    return this.subscriptionPlanService.fetchBusinessPlans(
      request,
      filterBusinessPlanDto,
    );
  }

  @Post('bulk-create')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  bulkCreate(
    @Req() request: AuthPayload & Request,
    @Body() dto: CreateSubscriptionPlanDto2,
  ) {
    return this.subscriptionPlanService.createSubscriptionPlan(request, dto);
  }

  @Patch(':id/bulk-update')
  async bulkUpdate(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionPlanDto2,
    @Req() request: AuthPayload & Request,
  ) {
    return this.subscriptionPlanService.updateSubscriptionPlan(
      id,
      dto,
      request,
    );
  }

  /**
   * Fetch all subscriptions for public users with filters and pagination
   */
  @Get('public/:business_id')
  @Public()
  async fetchPublicSubscriptionPlans(
    @Req() request: Timezone & Request,
    @Param('business_id') businessId: string,
    @Query() filterDto: FilterSubscriptionPlanDto,
  ): Promise<PagePayload<SubscriptionPlan>> {
    return this.subscriptionPlanService.fetchPublicSubscriptionPlans(
      businessId,
      filterDto,
    );
  }
}
