import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RoleGroupService, RoleService } from './rbac.service';
import { CreateRoleDto, CreateRoleGroupDto, RoleQueryDto } from './rbac.dto';
import {
  GenericPayload,
  GenericPayloadAlias,
  PagePayload,
} from '../generic/generic.payload';
import { QueryDto } from '../generic/generic.dto';
import { Role, RoleGroup } from '@prisma/client';

@Controller('v1/role-group')
export class RoleGroupController {
  constructor(private readonly roleGroupService: RoleGroupService) {}

  @Post()
  async create(
    @Body() createRoleGroupDto: CreateRoleGroupDto,
  ): Promise<GenericPayload> {
    return this.roleGroupService.create(createRoleGroupDto);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async fetch(@Query() query: QueryDto): Promise<PagePayload<RoleGroup>> {
    return this.roleGroupService.fetch(query);
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<GenericPayloadAlias<RoleGroup>> {
    return this.roleGroupService.fetchSingle(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRoleGroupDto: Partial<CreateRoleGroupDto>,
  ): Promise<GenericPayload> {
    return this.roleGroupService.update(id, updateRoleGroupDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<GenericPayload> {
    return await this.roleGroupService.delete(id);
  }
}

@Controller('v1/role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  async create(@Body() createRoleDto: CreateRoleDto): Promise<GenericPayload> {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true }))
  async fetch(@Query() query: RoleQueryDto): Promise<PagePayload<Role>> {
    return this.roleService.fetch(query);
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<GenericPayloadAlias<Role>> {
    return this.roleService.fetchSingle(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: Partial<CreateRoleDto>,
  ): Promise<GenericPayload> {
    return this.roleService.update(id, updateRoleDto);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Req() request: Request,
  ): Promise<GenericPayload> {
    return await this.roleService.delete(id, request);
  }
}
