import { Module } from '@nestjs/common';
import { CouponUsageService } from './usage.service';
import { CouponManagementService } from '../management/management.service';
import { CouponUsageController } from './usage.controller';

@Module({
  controllers: [CouponUsageController],
  providers: [CouponUsageService, CouponManagementService],
  exports: [CouponUsageService],
})
export class UsageModule {}
