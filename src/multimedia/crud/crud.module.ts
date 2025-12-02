import { Module } from '@nestjs/common';
import { MultimediaCrudService } from './crud.service';
import { MultimediaCrudController } from './crud.controller';

@Module({
  controllers: [MultimediaCrudController],
  providers: [MultimediaCrudService],
})
export class CrudModule {}
