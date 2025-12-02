import { Module } from '@nestjs/common';
import { CourseCrudModule } from './crud/crud.module';
import { CMModule } from './module/module.module';
import { CMCModule } from './module-content/module-content.module';
import { EnrolledCourseModule } from './enrolled/enrolled.module';

@Module({
  imports: [
    CourseCrudModule,
    CMModule, // For Modules in a course
    CMCModule, // For Contents in a module
    EnrolledCourseModule,
  ],
})
export class CourseModule {}
