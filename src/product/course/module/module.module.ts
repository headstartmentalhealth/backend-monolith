import { Module } from '@nestjs/common';
import { CourseModuleController } from './module.controller';
import { CourseModuleService } from './module.service';
import { CourseCrudService } from '../crud/crud.service';

@Module({
  controllers: [CourseModuleController],
  providers: [CourseModuleService, CourseCrudService],
  exports: [CourseModuleService],
})
export class CMModule {}
