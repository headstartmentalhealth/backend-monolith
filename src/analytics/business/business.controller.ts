import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { BusinessAnalyticsService } from './business.service';
import { BusinessAnalyticsDto, ProductRevenueMonthlyDto } from './business.dto';
import { AuthPayload, GenericDataPayload } from '@/generic/generic.payload';
import { Roles } from '@/account/auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';
import { BusinessGuard } from '@/generic/guards/business.guard';
import { CurrencyDto } from '@/generic/generic.dto';

@Controller('v1/business-analytics')
export class BusinessAnalyticsController {
  constructor(
    private readonly businessAnalyticsService: BusinessAnalyticsService,
  ) {}

  /**
   * Get comprehensive business analytics
   * @param auth
   * @param query
   * @returns
   */
  @Get('stats')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  @UseGuards(BusinessGuard)
  async getBusinessAnalytics(
    @Req() auth: AuthPayload & Request,
    @Query() query: CurrencyDto,
  ): Promise<GenericDataPayload<any>> {
    return this.businessAnalyticsService.getBusinessAnalytics(auth, query);
  }

  /**
   * Get revenue breakdown for all products (Course, Ticket, Subscription)
   */
  @Get('product-revenue')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  @UseGuards(BusinessGuard)
  async getProductRevenueBreakdown(
    @Req() auth: AuthPayload & Request,
  ): Promise<any> {
    return this.businessAnalyticsService.getProductRevenueBreakdown(auth);
  }

  /**
   * Get monthly revenue breakdown for all products (Course, Ticket, Subscription)
   */
  @Get('product-revenue-monthly')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  @UseGuards(BusinessGuard)
  async getMonthlyProductRevenueBreakdown(
    @Req() auth: AuthPayload & Request,
    @Query() query: ProductRevenueMonthlyDto,
  ): Promise<any> {
    return this.businessAnalyticsService.getMonthlyProductRevenueBreakdown(
      auth,
      query.year,
    );
  }
}
