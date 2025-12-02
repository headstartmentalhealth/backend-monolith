import { Module } from '@nestjs/common';
import { ManagementModule } from './management/management.module';
import { UsageModule } from './usage/usage.module';

@Module({
  imports: [ManagementModule, UsageModule],
})
export class CouponModule {}
