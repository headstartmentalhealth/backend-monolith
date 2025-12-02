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
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Action, ModuleContent, Prisma } from '@prisma/client';
import {
  CreateModuleContentDto,
  RearrangeModuleContentsDto,
  UpdateModuleContentDto,
} from './module-content.dto';
import {
  getIpAddress,
  getUserAgent,
  pageFilter,
} from '@/generic/generic.utils';
import { IdDto, QueryDto, TZ } from '@/generic/generic.dto';
import { CourseModuleService } from '../module/module.service';

@Injectable()
export class ModuleContentService {
  private readonly moduleContentRepository: PrismaBaseRepository<
    ModuleContent,
    Prisma.ModuleContentCreateInput,
    Prisma.ModuleContentUpdateInput,
    Prisma.ModuleContentWhereUniqueInput,
    Prisma.ModuleContentWhereInput | Prisma.ModuleContentFindFirstArgs,
    Prisma.ModuleContentUpsertArgs
  >;

  private readonly select: Prisma.ModuleContentSelect = {
    id: true,
    title: true,
    position: true,
    module_id: true,
    multimedia_id: true,
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
    module: true,
    multimedia: true,
  };

  constructor(
    private prisma: PrismaService,
    private readonly logService: LogService,
    private readonly genericService: GenericService,
    private readonly courseModuleService: CourseModuleService,
  ) {
    this.moduleContentRepository = new PrismaBaseRepository<
      ModuleContent,
      Prisma.ModuleContentCreateInput,
      Prisma.ModuleContentUpdateInput,
      Prisma.ModuleContentWhereUniqueInput,
      Prisma.ModuleContentWhereInput | Prisma.ModuleContentFindFirstArgs,
      Prisma.ModuleContentUpsertArgs
    >('moduleContent', prisma);
  }

  /**
   * Create module content
   * @param request
   * @param createModuleContentDto
   * @returns
   */
  async create(
    request: AuthPayload & Request,
    createModuleContentDto: CreateModuleContentDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { module_id } = createModuleContentDto;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: request['Business-Id'],
      });

      // Check if module exists
      await this.courseModuleService.findOne(module_id);

      // 2. Create module content
      const module_content = await prisma.moduleContent.create({
        data: {
          title: createModuleContentDto.title,
          position: createModuleContentDto.position,
          module: { connect: { id: createModuleContentDto.module_id } },
          multimedia: { connect: { id: createModuleContentDto.multimedia_id } },
          creator: { connect: { id: auth.sub } },
          business_info: { connect: { id: request['Business-Id'] } },
        },
      });

      // 3. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_MODULE_CONTENT,
          entity: 'ModuleContent',
          entity_id: module_content.id,
          metadata: `User with ID ${auth.sub} just created a module content ID ${module.id} for Business ID ${module_content.business_id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Module content created successfully.',
      };
    });
  }

  /**
   * Fetch module contents
   * @param payload
   * @param queryDto
   * @returns
   */
  async fetch(
    payload: AuthPayload,
    queryDto: QueryDto,
  ): Promise<PagePayload<ModuleContent>> {
    const auth = payload.user;

    // Check if user is part of the company's administrators
    await this.genericService.isUserLinkedToBusiness(this.prisma, {
      user_id: auth.sub,
      business_id: payload['Business-Id'],
    });

    // Invoke pagination filters
    const pagination_filters = pageFilter(queryDto);

    // Filters
    const filters: Prisma.ModuleContentWhereInput & TZ = {
      business_id: payload['Business-Id'],
      ...pagination_filters.filters,
      tz: payload.timezone,
    };

    // Assign something else to same variable
    const select = this.select;

    const [module_contents, total] = await Promise.all([
      this.moduleContentRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        undefined,
        select,
      ),
      this.moduleContentRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: module_contents,
      count: total,
    };
  }

  /**
   * Fetch single module content
   * @param payload
   * @param param
   * @returns
   */
  async fetchSingle(
    payload: AuthPayload,
    param: IdDto,
  ): Promise<GenericDataPayload<ModuleContent>> {
    const auth = payload.user;

    // Check if user is part of the company's administrators
    await this.genericService.isUserLinkedToBusiness(this.prisma, {
      user_id: auth.sub,
      business_id: payload['Business-Id'],
    });

    const select: Prisma.ModuleContentSelect = {
      ...this.select,
      business_info: true,
    };

    const filters: Prisma.ModuleContentWhereUniqueInput = {
      id: param.id,
    };

    const module_content: ModuleContent =
      await this.moduleContentRepository.findOne(filters, undefined, select);

    return {
      statusCode: HttpStatus.OK,
      data: module_content,
    };
  }

  /**
   * Get a single module content (return error if not found)
   * @param id
   * @returns
   */
  private async findOne(id: string): Promise<ModuleContent> {
    const select = this.select;

    const filters: Prisma.ModuleContentWhereUniqueInput = {
      id,
    };

    const module_content = await this.moduleContentRepository.findOne(
      filters,
      undefined,
      select,
    );

    if (!module_content) {
      throw new NotFoundException(`Module content not found.`);
    }

    return module_content;
  }

  /**
   * Update a module content
   * @param request
   * @param param
   * @param updateModuleContentDto
   * @returns
   */
  async update(
    request: AuthPayload & Request,
    param: IdDto,
    updateModuleContentDto: UpdateModuleContentDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { id } = param;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Get a single module content
      const existing_module_content = await this.findOne(id);

      // 1. Check if user is part of the company's administrators
      await this.genericService.isUserLinkedToBusiness(prisma, {
        user_id: auth.sub,
        business_id: request['Business-Id'],
      });

      // 2. Update course module content
      await prisma.moduleContent.update({
        where: { id },
        data: {
          ...updateModuleContentDto,
        },
      });

      // 3. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_MODULE_CONTENT,
          entity: 'ModuleContent',
          entity_id: existing_module_content.id,
          metadata: `User with ID ${auth.sub} just updated a module content ID ${existing_module_content.id} for business ID ${request['Business-Id']}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Module content updated successfully.',
      };
    });
  }

  /**
   * Delete a module content
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

      // 2. Get a single module content
      const existing_module_content = await this.findOne(id);

      // 4. Validate that there are no related models (Presently, nothing depends on this model)

      // 5. Soft delete module content
      await prisma.moduleContent.update({
        where: { id: existing_module_content.id },
        data: {
          deleted_at: new Date(),
        },
      });

      // 6. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_MODULE_CONTENT,
          entity: 'Module',
          entity_id: existing_module_content.id,
          metadata: `User with ID ${auth.sub} just deleted a module content ID ${existing_module_content.id} from business ID ${request['Business-Id']}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Module content deleted successfully.',
      };
    });
  }

  /**
   * Rearrange module contents
   * @param request
   * @param param
   * @param dto
   * @returns
   */
  async rearrange(
    request: AuthPayload & Request,
    param: { module_id: string },
    dto: RearrangeModuleContentsDto,
  ) {
    const auth = request.user;
    const { module_id } = param;

    return this.prisma.$transaction(async (prisma) => {
      // Fetch the module to ensure it exists
      const module = await prisma.module.findUnique({
        where: { id: module_id },
        include: { contents: true },
      });

      if (!module) {
        throw new NotFoundException(`Module with ID ${module_id} not found`);
      }

      // Validate that all content IDs belong to the module
      const moduleContentIds = module.contents.map((content) => content.id);
      const invalidContentIds = dto.contents
        .map((content: ModuleContent) => content.id)
        .filter((id: string) => !moduleContentIds.includes(id));

      if (invalidContentIds.length > 0) {
        throw new NotFoundException(
          `Invalid content IDs: ${invalidContentIds.join(', ')}`,
        );
      }

      // Update the positions of the module contents
      const updatePromises = dto.contents.map((content: ModuleContent) =>
        this.prisma.moduleContent.update({
          where: { id: content.id },
          data: { position: content.position },
        }),
      );

      await Promise.all(updatePromises);

      // 3. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.MANAGE_MODULE_CONTENT,
          entity: 'ModuleContent',
          metadata: `User with ID ${auth.sub} just rearranged the contents of module ID ${module.id} for Business ID ${module.business_id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Module contents rearranged successfully.',
      };
    });
  }
}
