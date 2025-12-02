import { Controller, Get, Query } from '@nestjs/common';
import { OwnerService } from './owner.service';
import { Roles } from '@/account/auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';
import { FilterByYearDto } from './owner.dto';

@Controller('v1/owner-analytics')
export class OwnerController {
  constructor(private readonly ownerService: OwnerService) {}

  @Get('fetch-metrics')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  async fetchMetrics() {
    return this.ownerService.getMetrics();
  }

  @Get('fetch-revenue')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  async fetchYearlyRevenueBreakdown(@Query() filterByYearDto: FilterByYearDto) {
    return this.ownerService.getYearlyRevenueBreakdown(filterByYearDto);
  }

  @Get('fetch-product-count')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  async fetchProductCountByType() {
    return this.ownerService.getProductCountByType();
  }
}
