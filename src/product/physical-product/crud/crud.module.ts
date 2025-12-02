import { Module } from '@nestjs/common';
import { PhysicalProductCrudController } from './crud.controller';
import { PhysicalProductCrudService } from './crud.service';

@Module({
  controllers: [PhysicalProductCrudController],
  providers: [PhysicalProductCrudService],
})
export class CrudModule {}
