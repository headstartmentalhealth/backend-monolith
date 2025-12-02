import { Module } from '@nestjs/common';
import { ProductGeneralService } from './general.service';
import { ProductGeneralController } from './general.controller';

@Module({
  controllers: [ProductGeneralController],
  providers: [ProductGeneralService],
})
export class GeneralModule {}
