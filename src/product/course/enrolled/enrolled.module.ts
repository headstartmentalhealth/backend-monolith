import { Module } from '@nestjs/common';
import { EnrolledCourseService } from './enrolled.service';
import { EnrolledCourseController } from './enrolled.controller';

@Module({
  controllers: [EnrolledCourseController],
  providers: [EnrolledCourseService],
})
export class EnrolledCourseModule {}
