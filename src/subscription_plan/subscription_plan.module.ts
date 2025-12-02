import { Module } from '@nestjs/common';
import { PlanModule } from './crud/plan.module';
import { PriceModule } from './price/price.module';
import { RoleModule } from './role/role.module';

@Module({
  imports: [PlanModule, PriceModule, RoleModule],
})
export class SubscriptionPlanModule {}
