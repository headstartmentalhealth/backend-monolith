import { Module } from '@nestjs/common';
import { SubscriptionPlanRoleController } from './role.controller';
import { SubscriptionPlanRoleService } from './role.service';

@Module({
  controllers: [SubscriptionPlanRoleController],
  providers: [SubscriptionPlanRoleService],
})
export class RoleModule {}
