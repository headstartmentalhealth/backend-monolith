import { BusinessGuard } from '@/generic/guards/business.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CourseModuleService } from './module.service';
import { Roles } from '@/account/auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';
import {
  AuthPayload,
  GenericDataPayload,
  GenericPayload,
  PagePayload,
} from '@/generic/generic.payload';
import {
  BulkUpdateModulesDto,
  CourseIdDto,
  CreateModuleDto,
  CreateMultipleModulesDto,
  RearrangeModulesDto,
  UpdateModuleDto,
} from './module.dto';
import { IdDto, QueryDto } from '@/generic/generic.dto';
import { Module } from '@prisma/client';

@Controller('v1/course-module')
@UseGuards(BusinessGuard)
export class CourseModuleController {
  constructor(private readonly moduleService: CourseModuleService) {}

  /**
   * Create course module
   * @param request
   * @param createCourseDto
   * @returns
   */
  @Post('create')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  create(
    @Req() request: AuthPayload & Request,
    @Body() createModuleDto: CreateModuleDto,
  ): Promise<GenericPayload> {
    return this.moduleService.create(request, createModuleDto);
  }

  /**
   * Fetch modules
   * @param request
   * @param queryDto
   * @returns
   */
  @Get(':course_id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  fetch(
    @Req() request: AuthPayload & Request,
    @Query() queryDto: QueryDto,
    @Param() courseIdDto: CourseIdDto,
  ): Promise<PagePayload<Module>> {
    return this.moduleService.fetch(request, queryDto, courseIdDto);
  }

  /**
   * Fetch single module
   * @param request
   * @param param
   * @returns
   */
  @Get(':id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  async fetchSingle(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
  ): Promise<GenericDataPayload<Module>> {
    return this.moduleService.fetchSingle(request, param);
  }

  /**
   * Update a module
   * @param request
   * @param param
   * @param updateModuleDto
   * @returns
   */
  @Patch(':id/update')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  update(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
    @Body() updateModuleDto: UpdateModuleDto,
  ): Promise<GenericPayload> {
    return this.moduleService.update(request, param, updateModuleDto);
  }

  /**
   * Delete a module
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
    return this.moduleService.delete(request, param);
  }

  /**
   * Rearrange course modules
   * @param request
   * @param param
   * @param dto
   * @returns
   */
  @Patch(':course_id/rearrange')
  async rearrange(
    @Req() request: AuthPayload & Request,
    @Param() param: { course_id: string },
    @Body() dto: RearrangeModulesDto,
  ) {
    return this.moduleService.rearrange(request, param, dto);
  }

  /**
   * Create bulk modules and their contents
   * @param request
   * @param dto
   * @returns
   */
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  createMultiple(
    @Req() request: AuthPayload & Request,
    @Body() dto: CreateMultipleModulesDto,
  ) {
    return this.moduleService.createMultipleModulesWithContents(request, dto);
  }

  /**
   * Update bulk modules and their contents
   * @param request
   * @param dto
   * @returns
   */
  @Patch('bulk-update')
  @HttpCode(HttpStatus.OK)
  async bulkUpdateModules(
    @Req() request: AuthPayload & Request,
    @Body() dto: BulkUpdateModulesDto,
  ) {
    return this.moduleService.bulkUpdateModules(request, dto);
  }
}
