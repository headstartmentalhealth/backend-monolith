import { PrismaService } from '../../prisma/prisma.service';
import { Module } from '@nestjs/common';
import { SubscriptionPlanController } from './plan.controller';
import { SubscriptionPlanService } from './plan.service';
import { LogService } from '@/log/log.service';

@Module({
  controllers: [SubscriptionPlanController],
  providers: [PrismaService, LogService, SubscriptionPlanService],
})
export class PlanModule {}
