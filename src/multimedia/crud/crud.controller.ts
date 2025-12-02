import { BusinessGuard } from '@/generic/guards/business.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MultimediaCrudService } from './crud.service';
import { Roles } from '@/account/auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';
import {
  AuthPayload,
  GenericPayload,
  PagePayload,
} from '@/generic/generic.payload';
import { CreateMultimediaDto } from './crud.dto';
import { IdDto, QueryDto } from '@/generic/generic.dto';
import { Multimedia } from '@prisma/client';

@Controller('v1/multimedia')
export class MultimediaCrudController {
  constructor(private readonly multimediaCrudService: MultimediaCrudService) {}

  /**
   * Create media content
   * @param request
   * @param createCourseDto
   * @returns
   */
  @Post('create')
  create(
    @Req() request: AuthPayload & Request,
    @Body() createMultimediaDto: CreateMultimediaDto,
  ): Promise<GenericPayload> {
    return this.multimediaCrudService.create(request, createMultimediaDto);
  }

  /**
   * Fetch media content
   * @param request
   * @param queryDto
   * @returns
   */
  @Get()
  fetch(
    @Req() request: AuthPayload & Request,
    @Query() queryDto: QueryDto,
  ): Promise<PagePayload<Multimedia>> {
    return this.multimediaCrudService.fetch(request, queryDto);
  }

  /**
   * Delete a media content
   * @param request
   * @param param
   * @returns
   */
  @Delete(':id')
  delete(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
  ): Promise<GenericPayload> {
    return this.multimediaCrudService.delete(request, param);
  }

  /**
   * Fetch all media contents - for admin
   * @param request
   * @param queryDto
   * @returns
   */
  @Get('fetch-all')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  fetchAll(
    @Req() request: AuthPayload & Request,
    @Query() queryDto: QueryDto,
  ): Promise<PagePayload<Multimedia>> {
    return this.multimediaCrudService.fetchAll(request, queryDto);
  }
}
