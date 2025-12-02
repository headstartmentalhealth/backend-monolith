import { PrismaService } from '../../prisma/prisma.service';
import { Module } from '@nestjs/common';
import { LogService } from '@/log/log.service';
import { SubscriptionPlanPriceController } from './price.controller';
import { SubscriptionPlanPriceService } from './price.service';

@Module({
  controllers: [SubscriptionPlanPriceController],
  providers: [PrismaService, LogService, SubscriptionPlanPriceService],
  exports: [SubscriptionPlanPriceService],
})
export class PriceModule {}
