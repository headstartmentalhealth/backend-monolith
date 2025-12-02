import { Module } from '@nestjs/common';
import { OwnerModule } from './owner/owner.module';
import { BusinessModule } from './business/business.module';

@Module({
  imports: [OwnerModule, BusinessModule],
})
export class AnalyticsModule {}
