import { Module } from '@nestjs/common';
import { CouponManagementService } from './management.service';
import { CouponManagementController } from './management.controller';

@Module({
  controllers: [CouponManagementController],
  providers: [CouponManagementService],
})
export class ManagementModule {}
