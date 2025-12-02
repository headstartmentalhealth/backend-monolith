import { Module } from '@nestjs/common';
import { DigitalProductCrudController } from './crud.controller';
import { DigitalProductCrudService } from './crud.service';

@Module({
  controllers: [DigitalProductCrudController],
  providers: [DigitalProductCrudService],
})
export class CrudModule {}
