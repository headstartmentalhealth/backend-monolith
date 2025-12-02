import { Module } from '@nestjs/common';
import { CategoryModule } from '../category/category.module';
import { CrudModule } from './crud/crud.module';

@Module({
  imports: [CrudModule],
})
export class TicketModule {}
