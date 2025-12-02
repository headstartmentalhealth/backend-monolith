import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Req,
  Query,
} from '@nestjs/common';
import { SubscriptionPlanPriceService } from './price.service';
import { Roles } from '@/account/auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';
import {
  AuthPayload,
  GenericPayload,
  PagePayload,
} from '@/generic/generic.payload';
import {
  CreateSubscriptionPlanPriceDto,
  UpdateSubscriptionPlanPriceDto,
} from './price.dto';
import { QueryDto } from '@/generic/generic.dto';
import { SubscriptionPlanPrice } from '@prisma/client';

@Controller('v1/subscription-plan-price')
export class SubscriptionPlanPriceController {
  constructor(
    private readonly subscriptionPlanPriceService: SubscriptionPlanPriceService,
  ) {}

  /**
   * Create subscription plan's price
   * @param request
   * @param createSubcriptionPlanPriceDto
   * @returns
   */
  @Post('create')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  create(
    @Req() request: AuthPayload & Request,
    @Body() createSubcriptionPlanPriceDto: CreateSubscriptionPlanPriceDto,
  ): Promise<GenericPayload> {
    return this.subscriptionPlanPriceService.create(
      request,
      createSubcriptionPlanPriceDto,
    );
  }

  /**
   * Fetch subscription plan prices (with pagination filters)
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
  ): Promise<PagePayload<SubscriptionPlanPrice>> {
    return this.subscriptionPlanPriceService.fetch(request, param, queryDto);
  }

  /**
   * Update subscription plan's price
   * @param request
   * @param param
   * @param updateSubscriptionPlanPriceDto
   * @returns
   */
  @Patch(':id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  update(
    @Req() request: AuthPayload & Request,
    @Param() param: { id: string },
    @Body() updateSubscriptionPlanPriceDto: UpdateSubscriptionPlanPriceDto,
  ): Promise<GenericPayload> {
    return this.subscriptionPlanPriceService.update(
      request,
      param,
      updateSubscriptionPlanPriceDto,
    );
  }

  /**
   * Delete subscription plan's price
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
    return this.subscriptionPlanPriceService.delete(request, param);
  }
}
