import { BusinessGuard } from '@/generic/guards/business.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ModuleContentService } from './module-content.service';
import { Roles } from '@/account/auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';
import {
  AuthPayload,
  GenericDataPayload,
  GenericPayload,
  PagePayload,
} from '@/generic/generic.payload';
import {
  CreateModuleContentDto,
  RearrangeModuleContentsDto,
  UpdateModuleContentDto,
} from './module-content.dto';
import { IdDto, QueryDto } from '@/generic/generic.dto';
import { ModuleContent } from '@prisma/client';

@Controller('v1/course-module-content')
@UseGuards(BusinessGuard)
export class ModuleContentController {
  constructor(private readonly moduleContentService: ModuleContentService) {}

  /**
   * Create course module content
   * @param request
   * @param createModuleContentDto
   * @returns
   */
  @Post('create')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  create(
    @Req() request: AuthPayload & Request,
    @Body() createModuleContentDto: CreateModuleContentDto,
  ): Promise<GenericPayload> {
    return this.moduleContentService.create(request, createModuleContentDto);
  }

  /**
   * Fetch module contents
   * @param request
   * @param queryDto
   * @returns
   */
  @Get()
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  fetch(
    @Req() request: AuthPayload & Request,
    @Query() queryDto: QueryDto,
  ): Promise<PagePayload<ModuleContent>> {
    return this.moduleContentService.fetch(request, queryDto);
  }

  /**
   * Fetch single module content
   * @param request
   * @param param
   * @returns
   */
  @Get(':id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  async fetchSingle(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
  ): Promise<GenericDataPayload<ModuleContent>> {
    return this.moduleContentService.fetchSingle(request, param);
  }

  /**
   * Update a module content
   * @param request
   * @param param
   * @param updateModuleContentDto
   * @returns
   */
  @Patch(':id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  update(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
    @Body() updateModuleContentDto: UpdateModuleContentDto,
  ): Promise<GenericPayload> {
    return this.moduleContentService.update(
      request,
      param,
      updateModuleContentDto,
    );
  }

  /**
   * Delete a module content
   * @param request
   * @param param
   * @returns
   */
  @Delete(':id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  delete(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
  ): Promise<GenericPayload> {
    return this.moduleContentService.delete(request, param);
  }

  /**
   * Rearrange module contents
   * @param request
   * @param param
   * @param dto
   * @returns
   */
  @Patch(':module_id/rearrange')
  async rearrange(
    @Req() request: AuthPayload & Request,
    @Param() param: { module_id: string },
    @Body() dto: RearrangeModuleContentsDto,
  ) {
    return this.moduleContentService.rearrange(request, param, dto);
  }
}
