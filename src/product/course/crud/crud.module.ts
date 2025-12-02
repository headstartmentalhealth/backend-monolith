import { Module } from '@nestjs/common';
import { CourseCrudService } from './crud.service';
import { CourseCrudController } from './crud.controller';

@Module({
  controllers: [CourseCrudController],
  providers: [CourseCrudService],
  exports: [CourseCrudService],
})
export class CourseCrudModule {}
