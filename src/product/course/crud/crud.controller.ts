import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CourseCrudService } from './crud.service';
import {
  CreateCourseDto,
  FilterCourseDto,
  UpdateCourseDto,
  BulkCreateCourseDto,
} from './crud.dto';
import {
  AuthPayload,
  GenericDataPayload,
  GenericPayload,
  GenericPayloadAlias,
  PagePayload,
} from '@/generic/generic.payload';
import { Roles } from '@/account/auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';
import { IdDto, QueryDto } from '@/generic/generic.dto';
import { Course, Product } from '@prisma/client';
import { BusinessGuard } from '@/generic/guards/business.guard';

@Controller('v1/product-course-crud')
@UseGuards(BusinessGuard)
export class CourseCrudController {
  constructor(private readonly courseService: CourseCrudService) {}

  /**
   * Create course
   * @param request
   * @param createCourseDto
   * @returns
   */
  @Post('create')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  create(
    @Req() request: AuthPayload & Request,
    @Body() createCourseDto: CreateCourseDto,
  ): Promise<GenericPayloadAlias<Product>> {
    return this.courseService.create(request, createCourseDto);
  }

  /**
   * Fetch courses
   * @param request
   * @param queryDto
   * @returns
   */
  @Get()
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  fetch(
    @Req() request: AuthPayload & Request,
    @Query() filterCourseDto: FilterCourseDto,
  ): Promise<PagePayload<Product>> {
    return this.courseService.fetch(request, filterCourseDto);
  }

  /**
   * Fetch single course
   * @param request
   * @param param
   * @returns
   */
  @Get(':id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  fetchSingle(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
  ): Promise<GenericDataPayload<Product>> {
    return this.courseService.fetchSingle(request, param);
  }

  /**
   * Update a course
   * @param request
   * @param param
   * @param updateCourseDto
   * @returns
   */
  @Patch(':id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  update(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
    @Body() updateCourseDto: UpdateCourseDto,
  ): Promise<GenericPayloadAlias<Product>> {
    return this.courseService.update(request, param, updateCourseDto);
  }

  /**
   * Delete a course
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
    return this.courseService.delete(request, param);
  }

  /**
   * Bulk create courses
   * @param request
   * @param dto
   * @returns
   */
  @Post('bulk-create')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  bulkCreate(
    @Req() request: AuthPayload & Request,
    @Body() dto: BulkCreateCourseDto,
  ): Promise<GenericPayloadAlias<Product[]>> {
    return this.courseService.bulkCreate(request, dto);
  }
}
