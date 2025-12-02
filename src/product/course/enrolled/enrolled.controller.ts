import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { EnrolledCourseService } from './enrolled.service';
import { Roles } from '@/account/auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';
import { IdDto, QueryDto } from '@/generic/generic.dto';
import {
  AuthPayload,
  GenericDataPayload,
  GenericPayload,
  PagePayload,
} from '@/generic/generic.payload';
import { EnrolledCourse } from '@prisma/client';
import { ContentIdDto } from './enrolled.payload';

@Controller('v1/enrolled-course')
export class EnrolledCourseController {
  constructor(private readonly enrolledCourseService: EnrolledCourseService) {}

  /**
   * Fetch enrolled courses
   * @param request
   * @param queryDto
   * @returns
   */
  @Get('fetch')
  @Roles(Role.USER)
  fetch(
    @Req() request: AuthPayload & Request,
    @Query() queryDto: QueryDto,
  ): Promise<PagePayload<EnrolledCourse>> {
    return this.enrolledCourseService.fetch(request, queryDto);
  }

  /**
   * Fetch single enrolled course details
   * @param request
   * @param param
   * @returns
   */
  @Get(':id')
  @Roles(Role.USER)
  fetchSingle(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
  ): Promise<GenericDataPayload<EnrolledCourse>> {
    return this.enrolledCourseService.fetchSingle(request, param);
  }

  /**
   * Fetch enrolled course by course ID
   * @param request
   * @param courseId
   * @returns
   */
  @Get('course/:courseId')
  @Roles(Role.USER)
  fetchByCourseId(
    @Req() request: AuthPayload & Request,
    @Param('courseId') courseId: string,
  ): Promise<GenericDataPayload<EnrolledCourse>> {
    return this.enrolledCourseService.fetchByCourseId(request, courseId);
  }

  /**
   * Update lesson progress
   * @param request
   * @param param
   * @returns
   */
  @Patch(':content_id')
  @Roles(Role.USER)
  update(
    @Req() request: AuthPayload & Request,
    @Param() param: ContentIdDto,
  ): Promise<GenericPayload> {
    return this.enrolledCourseService.updateLessonProgress(request, param);
  }
}
