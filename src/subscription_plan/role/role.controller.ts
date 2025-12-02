import {
  Delete,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { SubscriptionPlanRoleService } from './role.service';
import { Roles } from '@/account/auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';
import {
  AuthPayload,
  GenericPayload,
  PagePayload,
} from '@/generic/generic.payload';
import {
  CreateSubscriptionPlanRoleDto,
  UpdateSubscriptionPlanRoleDto,
} from './role.dto';
import { SubscriptionPlanRole } from '@prisma/client';
import { QueryDto } from '@/generic/generic.dto';

@Controller('v1/subscription-plan-role')
export class SubscriptionPlanRoleController {
  constructor(
    private readonly subscriptionPlanRoleService: SubscriptionPlanRoleService,
  ) {}

  /**
   * Create subscription plan's role
   * @param request
   * @param createSubcriptionPlanRoleDto
   * @returns
   */
  @Post('create')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  create(
    @Req() request: AuthPayload & Request,
    @Body() createSubcriptionPlanRoleDto: CreateSubscriptionPlanRoleDto,
  ): Promise<GenericPayload> {
    return this.subscriptionPlanRoleService.create(
      request,
      createSubcriptionPlanRoleDto,
    );
  }

  /**
   * Fetch subscription plan roles (with pagination filters)
   * @param request
   * @param param
   * @param queryDto
   * @returns
   */
  @Get(':subscription_plan_id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  fetch(
    @Req() request: AuthPayload & Request,
    @Param() param: { subscription_plan_id: string },
    @Query() queryDto: QueryDto,
  ): Promise<PagePayload<SubscriptionPlanRole>> {
    return this.subscriptionPlanRoleService.fetch(request, param, queryDto);
  }

  /**
   * Update subscription plan's role
   * @param request
   * @param param
   * @param updateSubscriptionPlanRoleDto
   * @returns
   */
  @Patch(':id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  update(
    @Req() request: AuthPayload & Request,
    @Param() param: { id: string },
    @Body() updateSubscriptionPlanRoleDto: UpdateSubscriptionPlanRoleDto,
  ): Promise<GenericPayload> {
    return this.subscriptionPlanRoleService.update(
      request,
      param,
      updateSubscriptionPlanRoleDto,
    );
  }

  /**
   * Delete subscription plan's role
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
    return this.subscriptionPlanRoleService.delete(request, param);
  }
}
