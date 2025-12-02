import { Module } from '@nestjs/common';
import { BusinessAnalyticsService } from './business.service';
import { BusinessAnalyticsController } from './business.controller';

@Module({
  controllers: [BusinessAnalyticsController],
  providers: [BusinessAnalyticsService],
})
export class BusinessModule {}
