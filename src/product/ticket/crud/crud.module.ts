import { Module } from '@nestjs/common';
import { TicketCrudService } from './crud.service';
import { TicketCrudController } from './crud.controller';

@Module({
  controllers: [TicketCrudController],
  providers: [TicketCrudService],
})
export class CrudModule {}
