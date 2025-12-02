import {
  Body,
  Get,
  Controller,
  Post,
  Req,
  Query,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CouponManagementService } from './management.service';
import { Role } from '@/generic/generic.data';
import { Roles } from '@/account/auth/decorators/role.decorator';
import {
  AuthPayload,
  GenericPayload,
  GenericPayloadAlias,
  PagePayload,
} from '@/generic/generic.payload';
import {
  ApplyCouponDto,
  CreateCouponDto,
  FilterCouponsDto,
  UpdateCouponDto,
} from './management.dto';
import { IdDto, QueryDto } from '@/generic/generic.dto';
import { Coupon } from '@prisma/client';
import { CouponSelection, RelatedModels } from './management.utils';
import { BusinessGuard } from '@/generic/guards/business.guard';
import { Public } from '@/account/auth/decorators/auth.decorator';

@Controller('v1/coupon-management')
export class CouponManagementController {
  constructor(
    private readonly couponManagementService: CouponManagementService,
  ) {}

  /**
   * Create coupon
   * @param request
   * @param createCouponDto
   * @returns
   */
  @Post('create')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  create(
    @Req() request: AuthPayload & Request,
    @Body() createCouponDto: CreateCouponDto,
  ): Promise<GenericPayload> {
    return this.couponManagementService.create(request, createCouponDto);
  }

  /**
   * Fetch coupons (with pagination filters)
   * @param request
   * @param param
   * @param filterDto
   * @returns
   */
  @Get('fetch/:business_id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  fetch(
    @Req() request: AuthPayload & Request,
    @Param() param: { business_id: string },
    @Query() filterDto: FilterCouponsDto & QueryDto,
  ): Promise<PagePayload<Coupon>> {
    return this.couponManagementService.fetch(request, param, filterDto);
  }

  /**
   * Fetch coupon details
   * @param request
   * @param param
   * @returns
   */
  @Get('details/:id')
  @UseGuards(BusinessGuard)
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  fetchDetails(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
  ): Promise<GenericPayloadAlias<CouponSelection & RelatedModels>> {
    return this.couponManagementService.fetchSingle(request, param);
  }

  /**
   * Update coupon
   * @param request
   * @param param
   * @param updateCouponDto
   * @returns
   */
  @Patch(':id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  update(
    @Req() request: AuthPayload & Request,
    @Param() param: { id: string },
    @Body() updateCouponDto: UpdateCouponDto,
  ): Promise<GenericPayload> {
    return this.couponManagementService.update(request, param, updateCouponDto);
  }

  /**
   * Delete coupon
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
    return this.couponManagementService.delete(request, param);
  }

  /**
   * Fetch all coupons (with pagination filters)
   * @param request
   * @param param
   * @param filterDto
   * @returns
   */
  @Get('fetch-all')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  fetchAll(
    @Req() request: AuthPayload & Request,
    @Query() filterDto: FilterCouponsDto & QueryDto,
  ): Promise<PagePayload<Coupon>> {
    return this.couponManagementService.fetchAll(request, filterDto);
  }

  @Post('apply-coupon')
  @Public()
  applyCoupon(@Body() body: ApplyCouponDto) {
    return this.couponManagementService.validateAndApplyCoupon(
      body.email,
      body.code,
      +body.amount,
    );
  }
}
