import { IdDto, QueryDto, TZ } from '@/generic/generic.dto';
import {
  AuthPayload,
  GenericDataPayload,
  PagePayload,
} from '@/generic/generic.payload';
import { GenericService } from '@/generic/generic.service';
import {
  getIpAddress,
  getUserAgent,
  pageFilter,
} from '@/generic/generic.utils';
import { LogService } from '@/log/log.service';
import { PrismaBaseRepository } from '@/prisma/prisma.base.repository';
import { PrismaService } from '@/prisma/prisma.service';
import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Action, EnrolledCourse, Prisma, PrismaClient } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { ContentIdDto, ProgressDto } from './enrolled.payload';

@Injectable()
export class EnrolledCourseService {
  private readonly model = 'EnrolledCourse';

  private readonly enrolledCourseRepository: PrismaBaseRepository<
    EnrolledCourse,
    Prisma.EnrolledCourseCreateInput,
    Prisma.EnrolledCourseUpdateInput,
    Prisma.EnrolledCourseWhereUniqueInput,
    Prisma.EnrolledCourseWhereInput | Prisma.EnrolledCourseFindFirstArgs,
    Prisma.EnrolledCourseUpsertArgs
  >;

  private readonly select: Prisma.EnrolledCourseSelect = {
    id: true,
    enrolled_at: true,
    completed_lessons: true,
    total_lessons: true,
    progress: true,
    status: true,
    course_id: true,
    created_at: true,
    updated_at: true,
    course: true, // Associate Course model
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly logService: LogService,
    private readonly genericService: GenericService,
  ) {
    this.enrolledCourseRepository = new PrismaBaseRepository<
      EnrolledCourse,
      Prisma.EnrolledCourseCreateInput,
      Prisma.EnrolledCourseUpdateInput,
      Prisma.EnrolledCourseWhereUniqueInput,
      Prisma.EnrolledCourseWhereInput | Prisma.EnrolledCourseFindFirstArgs,
      Prisma.EnrolledCourseUpsertArgs
    >('enrolledCourse', prisma);
  }

  /**
   * Retrieve enrolled courses
   * @param payload
   * @param queryDto
   * @returns
   */
  async fetch(
    payload: AuthPayload,
    queryDto: QueryDto,
  ): Promise<PagePayload<EnrolledCourse>> {
    const auth = payload.user;

    // Invoke pagination filters
    const pagination_filters = pageFilter(queryDto);

    // Filters
    const filters: Prisma.EnrolledCourseWhereInput & TZ = {
      user_id: auth.sub,
      tz: payload.timezone,
      ...pagination_filters.filters,
    };

    // Assign something else to same variable
    const select = this.select;

    const [enrolled_courses, total] = await Promise.all([
      this.enrolledCourseRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        undefined,
        select,
      ),
      this.enrolledCourseRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: enrolled_courses,
      count: total,
    };
  }

  /**
   * Fetch single enrolled course
   * @param payload
   * @param param
   * @returns
   */
  async fetchSingle(
    payload: AuthPayload,
    param: IdDto,
  ): Promise<GenericDataPayload<EnrolledCourse>> {
    const auth = payload.user;

    const select: Prisma.EnrolledCourseSelect = {
      ...this.select,
      course: {
        include: {
          modules: {
            include: {
              contents: {
                include: { progress: { where: { user_id: auth.sub } } },
              },
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              business_info: { select: { id: true, business_name: true } },
            },
          },
        },
      },
    };

    const filters: Prisma.EnrolledCourseWhereUniqueInput = {
      id: param.id,
      user_id: auth.sub,
    };

    const enrolled_course: EnrolledCourse =
      await this.enrolledCourseRepository.findOne(filters, undefined, select);

    return {
      statusCode: HttpStatus.OK,
      data: enrolled_course,
    };
  }

  /**
   * Fetch enrolled course by course ID and user ID
   * @param payload
   * @param courseId
   * @returns
   */
  async fetchByCourseId(
    payload: AuthPayload,
    courseId: string,
  ): Promise<GenericDataPayload<EnrolledCourse>> {
    const auth = payload.user;

    const select: Prisma.EnrolledCourseSelect = {
      ...this.select,
      course: {
        include: {
          modules: {
            include: {
              contents: {
                include: {
                  progress: {
                    where: { user_id: auth.sub },
                  },
                  multimedia: true,
                },
              },
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              business_info: {
                select: {
                  id: true,
                  business_name: true,
                  logo_url: true,
                },
              },
            },
          },
        },
      },
    };

    const filters: Prisma.EnrolledCourseWhereInput = {
      course_id: courseId,
      user_id: auth.sub,
    };

    const enrolled_course: EnrolledCourse =
      await this.enrolledCourseRepository.findOne(filters, undefined, select);

    if (!enrolled_course) {
      throw new NotFoundException('You are not enrolled in this course.');
    }

    return {
      statusCode: HttpStatus.OK,
      data: enrolled_course,
    };
  }

  /**
   * Get a single enrolled course (return error if not found)
   * @param id
   * @returns
   */
  async findOne(id: string): Promise<EnrolledCourse> {
    const select = this.select;

    const filters: Prisma.EnrolledCourseWhereUniqueInput = {
      id,
    };

    const enrolled_course = await this.enrolledCourseRepository.findOne(
      filters,
      undefined,
      select,
    );

    if (!enrolled_course) {
      throw new NotFoundException(`Enrolled course not found.`);
    }

    return enrolled_course;
  }

  /**
   * Get lesson progress
   * @param course_id
   * @param user_id
   * @param prisma
   * @returns
   */
  private async getLessonProgress(
    course_id: string,
    user_id: string,
    prisma: Omit<
      PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
  ): Promise<ProgressDto> {
    // 1. Count total lessons (ModuleContent) in the course
    const total_lessons = await prisma.moduleContent.count({
      where: { module: { course_id } },
    });

    // 2. Count completed lessons by the user
    const completed_lessons = await prisma.userCourseProgress.count({
      where: { user_id, course_id },
    });

    // 3. Calculate progress percentage
    const progress =
      total_lessons > 0
        ? Math.floor((completed_lessons / total_lessons) * 100)
        : 0;

    return {
      total_lessons,
      completed_lessons,
      progress, // e.g., 50% if 5/10 lessons are completed
    };
  }

  /**
   * Update lesson progress
   * @param request
   * @param param
   * @returns
   */
  async updateLessonProgress(
    request: AuthPayload & Request,
    param: ContentIdDto,
  ) {
    const auth = request.user;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Get module content
      const module_content = await prisma.moduleContent.findUnique({
        where: { id: param.content_id },
        include: { module: true },
      });

      if (!module_content) {
        throw new NotFoundException('Module content not found.');
      }

      // 2. Check if the user already completed the lesson
      const existing_progress = await prisma.userCourseProgress.findUnique({
        where: {
          user_id_module_content_id: {
            user_id: auth.sub,
            module_content_id: module_content.id,
          },
        },
      });

      // Update course progress (Remove or add)
      if (existing_progress) {
        // Remove lesson from the record of completion
        await prisma.userCourseProgress.delete({
          where: { id: existing_progress.id },
        });
      } else {
        // Mark the lesson as completed
        await prisma.userCourseProgress.create({
          data: {
            user_id: auth.sub,
            course_id: module_content.module.course_id,
            module_content_id: module_content.id,
            completed_at: new Date(),
          },
        });
      }

      // Get lesson progress
      const { total_lessons, completed_lessons, progress } =
        await this.getLessonProgress(
          module_content.module.course_id,
          auth.sub,
          prisma,
        );

      // Update enrolled course record
      const updated_enrolled = await prisma.enrolledCourse.update({
        where: {
          user_id_course_id: {
            user_id: auth.sub,
            course_id: module_content.module.course_id,
          },
        },
        data: { completed_lessons, total_lessons, progress },
      });

      // Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.UPDATE_COURSE_PROGRESS,
          entity: this.model,
          entity_id: updated_enrolled.id,
          metadata: `User with ID ${auth.sub} just updated their lesson progress of enrolled course ID ${updated_enrolled.id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Lesson progress updated successfully.',
      };
    });
  }
}
