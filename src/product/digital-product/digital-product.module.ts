import { Module } from '@nestjs/common';
import { CrudModule } from './crud/crud.module';

@Module({
  imports: [CrudModule],
})
export class DigitalProductModule {}
