import { Controller, Req, Get, Param, Query } from '@nestjs/common';
import { CouponUsageService } from './usage.service';
import { Role } from '@/generic/generic.data';
import { Roles } from '@/account/auth/decorators/role.decorator';
import { AuthPayload, PagePayload } from '@/generic/generic.payload';
import { QueryDto } from '@/generic/generic.dto';
import { CouponUsage } from '@prisma/client';

@Controller('v1/coupon-usage')
export class CouponUsageController {
  constructor(private readonly couponUsageService: CouponUsageService) {}

  /**
   * Fetch coupon usages (with pagination filters)
   * @param request
   * @param param
   * @param queryDto
   * @returns
   */
  @Get(':coupon_id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  fetch(
    @Req() request: AuthPayload & Request,
    @Param() param: { coupon_id: string },
    @Query() filterDto: QueryDto,
  ): Promise<PagePayload<CouponUsage>> {
    return this.couponUsageService.fetch(request, param, filterDto);
  }
}
