import {
  AuthPayload,
  GenericDataPayload,
  GenericPayload,
  PagePayload,
} from '@/generic/generic.payload';
import { GenericService } from '@/generic/generic.service';
import { LogService } from '@/log/log.service';
import { PrismaBaseRepository } from '@/prisma/prisma.base.repository';
import { PrismaService } from '@/prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Action, Module, Prisma } from '@prisma/client';
import {
  BulkUpdateModulesDto,
  CourseIdDto,
  CreateModuleDto,
  CreateMultipleModulesDto,
  RearrangeModulesDto,
  UpdateModuleDto,
} from './module.dto';
import {
  getIpAddress,
  getUserAgent,
  pageFilter,
} from '@/generic/generic.utils';
import { IdDto, QueryDto, TZ } from '@/generic/generic.dto';
import { CourseCrudService } from '../crud/crud.service';
import { getReadinessPercent } from './module.utils';

@Injectable()
export class CourseModuleService {
  private readonly moduleRepository: PrismaBaseRepository<
    Module,
    Prisma.ModuleCreateInput,
    Prisma.ModuleUpdateInput,
    Prisma.ModuleWhereUniqueInput,
    Prisma.ModuleWhereInput | Prisma.ModuleFindFirstArgs,
    Prisma.ModuleUpsertArgs
  >;

  private readonly select: Prisma.ModuleSelect = {
    id: true,
    title: true,
    position: true,
    course_id: true,
    creator_id: true,
    created_at: true,
    updated_at: true,
    creator: {
      select: {
        id: true,
        name: true,
        role: { select: { name: true, role_id: true } },
      }, // Fetch only required user details
    },
    course: true,
  };

  constructor(
    private prisma: PrismaService,
    private readonly logService: LogService,
    private readonly genericService: GenericService,
    private readonly courseCrudService: CourseCrudService,
  ) {
    this.moduleRepository = new PrismaBaseRepository<
      Module,
      Prisma.ModuleCreateInput,
      Prisma.ModuleUpdateInput,
      Prisma.ModuleWhereUniqueInput,
      Prisma.ModuleWhereInput | Prisma.ModuleFindFirstArgs,
      Prisma.ModuleUpsertArgs
    >('module', prisma);
  }

  /**
   * Create module
   * @param request
   * @param createModuleDto
   * @returns
   */
  async create(
    request: AuthPayload & Request,
    createModuleDto: CreateModuleDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { course_id } = createModuleDto;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: request['Business-Id'],
      });

      // Check if course exists
      await this.courseCrudService.findOne(course_id);

      // 2. Create module
      const module = await prisma.module.create({
        data: {
          title: createModuleDto.title,
          position: createModuleDto.position,
          course: { connect: { id: createModuleDto.course_id } },
          creator: { connect: { id: auth.sub } },
          business_info: { connect: { id: request['Business-Id'] } },
        },
      });

      // 3. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_COURSE_MODULE,
          entity: 'Module',
          entity_id: module.id,
          metadata: `User with ID ${auth.sub} just created a course module ID ${module.id} for Business ID ${module.business_id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Course module created successfully.',
      };
    });
  }

  /**
   * Fetch modules
   * @param payload
   * @param queryDto
   * @returns
   */
  async fetch(
    payload: AuthPayload,
    queryDto: QueryDto,
    courseIdDto: CourseIdDto,
  ): Promise<PagePayload<Module>> {
    const auth = payload.user;

    // Check if user is part of the company's administrators
    await this.genericService.isUserLinkedToBusiness(this.prisma, {
      user_id: auth.sub,
      business_id: payload['Business-Id'],
    });

    // Invoke pagination filters
    const pagination_filters = pageFilter(queryDto);

    // Filters
    const filters: Prisma.ModuleWhereInput & TZ = {
      business_id: payload['Business-Id'],
      course_id: courseIdDto.course_id,
      ...pagination_filters.filters,
      tz: payload.timezone,
    };

    // Assign something else to same variable
    const select: Prisma.ModuleSelect = {
      ...this.select,
      contents: { include: { multimedia: true } },
    };

    const [modules, total] = await Promise.all([
      this.moduleRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.asc,
        undefined,
        select,
      ),
      this.moduleRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: modules,
      count: total,
    };
  }

  /**
   * Fetch single module
   * @param payload
   * @param param
   * @returns
   */
  async fetchSingle(
    payload: AuthPayload,
    param: IdDto,
  ): Promise<GenericDataPayload<Module>> {
    const auth = payload.user;

    // Check if user is part of the company's administrators
    await this.genericService.isUserLinkedToBusiness(this.prisma, {
      user_id: auth.sub,
      business_id: payload['Business-Id'],
    });

    const select: Prisma.ModuleSelect = {
      ...this.select,
      business_info: true,
      contents: true,
    };

    const filters: Prisma.ModuleWhereUniqueInput = {
      id: param.id,
    };

    const module: Module = await this.moduleRepository.findOne(
      filters,
      undefined,
      select,
    );

    return {
      statusCode: HttpStatus.OK,
      data: module,
    };
  }

  /**
   * Get a single module (return error if not found)
   * @param id
   * @returns
   */
  async findOne(id: string): Promise<Module> {
    const select = this.select;

    const filters: Prisma.ModuleWhereUniqueInput = {
      id,
    };

    const module = await this.moduleRepository.findOne(
      filters,
      undefined,
      select,
    );

    if (!module) {
      throw new NotFoundException(`Module not found.`);
    }

    return module;
  }

  /**
   * Update a module
   * @param request
   * @param param
   * @param updateModuleDto
   * @returns
   */
  async update(
    request: AuthPayload & Request,
    param: IdDto,
    updateModuleDto: UpdateModuleDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { id } = param;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Get a single module
      const existing_module = await this.findOne(id);

      // 1. Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: request['Business-Id'],
      });

      // 2. Update course module
      await prisma.module.update({
        where: { id },
        data: {
          ...updateModuleDto,
        },
      });

      // 3. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_COURSE_MODULE,
          entity: 'Module',
          entity_id: existing_module.id,
          metadata: `User with ID ${auth.sub} just updated a course module ID ${existing_module.id} for business ID ${request['Business-Id']}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Course module updated successfully.',
      };
    });
  }

  /**
   * Validate that model has related records
   * @param module_id
   */
  private async hasRelatedRecords(module_id: string): Promise<void> {
    const relatedTables = [
      { model: this.prisma.moduleContent, field: 'module_id' },
    ];

    for (const { model, field } of relatedTables) {
      const count = await (model.count as any)({
        where: { [field]: module_id },
      });
      if (count > 0) {
        throw new ForbiddenException('Related records for this model exists.'); // Related records exist
      }
    }

    // No related records. Move on
  }

  /**
   * Delete a module
   * @param request
   * @param param
   */
  async delete(
    request: AuthPayload & Request,
    param: IdDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { id } = param;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: request['Business-Id'],
      });

      // 2. Get a single module
      const existing_module = await this.findOne(id);

      // 4. Validate that there are no related models
      await this.hasRelatedRecords(existing_module.id);

      // 5. Soft delete module
      await prisma.module.update({
        where: { id: existing_module.id },
        data: {
          deleted_at: new Date(),
        },
      });

      // 6. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_COURSE_MODULE,
          entity: 'Module',
          entity_id: existing_module.id,
          metadata: `User with ID ${auth.sub} just deleted a course module ID ${existing_module.id} from business ID ${request['Business-Id']}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Course module deleted successfully.',
      };
    });
  }

  /**
   * Rearrange course modules
   * @param request
   * @param param
   * @param dto
   * @returns
   */
  async rearrange(
    request: AuthPayload & Request,
    param: { course_id: string },
    dto: RearrangeModulesDto,
  ) {
    const auth = request.user;
    const { course_id } = param;

    return this.prisma.$transaction(async (prisma) => {
      // Fetch the course to ensure it exists
      const course = await prisma.product.findUnique({
        where: { id: course_id },
        include: { modules: true },
      });

      if (!course) {
        throw new NotFoundException(`Course with ID ${course_id} not found`);
      }

      // Validate that all module IDs belong to the course
      const moduleIds = course.modules.map((content) => content.id);
      const invalidModuleIds = dto.modules
        .map((module: Module) => module.id)
        .filter((id) => !moduleIds.includes(id));

      if (invalidModuleIds.length > 0) {
        throw new NotFoundException(
          `Invalid module IDs: ${invalidModuleIds.join(', ')}`,
        );
      }

      // Update the positions of the modules
      const updatePromises = dto.modules.map((module) =>
        this.prisma.module.update({
          where: { id: module.id },
          data: { position: module.position },
        }),
      );

      await Promise.all(updatePromises);

      // 3. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_COURSE_MODULE,
          entity: 'Module',
          metadata: `User with ID ${auth.sub} just rearranged the modules of course ID ${course.id} for Business ID ${course.business_id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Course module rearranged successfully.',
      };
    });
  }

  /**
   * Create multiple modules with contents
   * @param request
   * @param dto
   * @returns
   */
  async createMultipleModulesWithContents(
    request: AuthPayload & Request,
    dto: CreateMultipleModulesDto,
  ): Promise<GenericPayload> {
    const { user } = request;
    const businessId = request['Business-Id'];

    return this.prisma.$transaction(async (prisma) => {
      // 1. Validate business linkage
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: user.sub,
        business_id: businessId,
      });

      // 2. Ensure all courses exist
      await Promise.all(
        dto.modules.map(({ course_id }) =>
          this.courseCrudService.findOne(course_id),
        ),
      );

      // 3. Create all modules with their contents
      const created_modules = await Promise.all(
        dto.modules.map(async (module) => {
          const newModule = await prisma.module.create({
            data: {
              title: module.title,
              position: module.position,
              course_id: module.course_id,
              creator_id: user.sub,
              business_id: businessId,
              contents: {
                create:
                  module.contents?.map((content) => ({
                    title: content.title,
                    position: content.position,
                    multimedia_id: content.multimedia_id,
                    creator_id: user.sub,
                    business_id: businessId,
                  })) || [],
              },
            },
          });

          return newModule;
        }),
      );

      // 3b. Get the number of contents
      const total_contents = await prisma.moduleContent.count({
        where: {
          // It's expected that the bulk modules data is for a single course
          module: { course_id: dto.modules[0].course_id },
        },
      });

      const readiness_percent = getReadinessPercent(total_contents);

      await prisma.product.update({
        where: { id: dto.modules[0].course_id },
        data: { readiness_percent },
      });

      // 4. Log all created modules
      await prisma.log.createMany({
        data: created_modules.map((mod) => ({
          user_id: user.sub,
          action: Action.MANAGE_COURSE_MODULE,
          entity: 'Module',
          entity_id: mod.id,
          metadata: `User with ID ${user.sub} created module ID ${mod.id} under business ID ${businessId}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        })),
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: `${created_modules.length} module(s) and their contents created successfully.`,
      };
    });
  }

  /**
   * Update multiple modules and contents in bulk
   * @param request - Authentication payload and request context
   * @param dto - Bulk update data transfer object
   * @returns Promise<GenericPayload>
   */
  async bulkUpdateModules(
    request: AuthPayload & Request,
    dto: BulkUpdateModulesDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const ipAddress = getIpAddress(request);
    const userAgent = getUserAgent(request);

    await this.prisma.$transaction(async (prisma) => {
      const moduleIds = dto.modules.map((m) => m.id).filter(Boolean);

      const existingModules = await prisma.module.findMany({
        where: { id: { in: moduleIds } },
        select: {
          id: true,
          business_id: true,
          course_id: true,
          contents: {
            select: { id: true },
          },
        },
      });

      const moduleMap = new Map(existingModules.map((m) => [m.id, m]));

      const uniqueBusinessIds = [
        ...new Set(existingModules.map((m) => m.business_id)),
      ];

      if (uniqueBusinessIds.length > 1) {
        throw new BadRequestException(
          'Modules must belong to the same business',
        );
      }

      const business_id = uniqueBusinessIds[0] || request['Business-Id'];
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id,
      });

      for (const moduleDto of dto.modules) {
        let moduleId = moduleDto.id;
        let createdModule;

        // Update existing module
        if (moduleId) {
          await prisma.module.update({
            where: { id: moduleId },
            data: {
              title: moduleDto.title,
              position: moduleDto.position,
              updated_at: new Date(),
            },
          });
        } else {
          // Create new module
          const newModule = await prisma.module.create({
            data: {
              title: moduleDto.title,
              position: moduleDto.position,
              course_id: moduleDto.course_id,
              creator_id: auth.sub,
              business_id,
            },
          });
          moduleId = newModule.id;
          createdModule = newModule;
        }

        const existingModule = moduleMap.get(moduleDto.id);
        const existingContentIds = existingModule
          ? existingModule.contents.map((c) => c.id)
          : [];

        const incomingContentIds = moduleDto.contents
          .map((c) => c.id)
          .filter(Boolean) as string[];

        // Delete removed contents
        if (existingContentIds.length > 0) {
          const contentsToDelete = existingContentIds.filter(
            (id) => !incomingContentIds.includes(id),
          );

          if (contentsToDelete.length > 0) {
            await prisma.moduleContent.deleteMany({
              where: {
                id: { in: contentsToDelete },
                module_id: moduleDto.id,
              },
            });
          }
        }

        // Handle contents
        for (const content of moduleDto.contents) {
          if (content.id) {
            await prisma.moduleContent.update({
              where: { id: content.id },
              data: {
                title: content.title,
                position: content.position,
                multimedia_id: content.multimedia_id,
                updated_at: new Date(),
              },
            });
          } else {
            await prisma.moduleContent.create({
              data: {
                title: content.title,
                position: content.position,
                multimedia_id: content.multimedia_id,
                module_id: moduleId,
                creator_id: auth.sub,
                business_id,
              },
            });
          }
        }

        const total_contents = await prisma.moduleContent.count({
          where: {
            module: { course_id: moduleDto.course_id },
          },
        });

        // Update readiness
        const readiness_percent = getReadinessPercent(total_contents);

        await prisma.product.update({
          where: { id: moduleDto.course_id },
          data: { readiness_percent },
        });

        await this.logService.createWithTrx(
          {
            user_id: auth.sub,
            action: Action.MANAGE_COURSE_MODULE,
            entity: 'Module',
            entity_id: moduleId,
            metadata: `User ${auth.sub} ${
              moduleDto.id ? 'updated' : 'created'
            } module ${moduleDto.title} with ${moduleDto.contents.length} contents`,
            ip_address: ipAddress,
            user_agent: userAgent,
          },
          prisma.log,
        );
      }
    });

    return {
      statusCode: HttpStatus.OK,
      message: `${dto.modules.length} modules and their contents processed successfully`,
    };
  }
}
