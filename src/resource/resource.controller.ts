import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ResourceService } from './resource.service';
import {
  CreateResourceDto,
  FilterResourceDto,
  UpdateResourceDto,
} from './resource.dto';
import { AuthPayload } from '@/generic/generic.payload';
import { IdDto } from '@/generic/generic.dto';
import { AuthGuard } from '@/account/auth/guards/auth.guard';
import { BusinessGuard } from '@/generic/guards/business.guard';
import { Roles } from '@/account/auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';

@Controller('v1/resources')
@UseGuards(AuthGuard)
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  create(@Req() request: AuthPayload & Request, @Body() dto: CreateResourceDto) {
    return this.resourceService.create(request, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  findAll(@Req() request: AuthPayload, @Query() filterDto: FilterResourceDto) {
    return this.resourceService.fetch(request, filterDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  findOne(@Req() request: AuthPayload, @Param() param: IdDto) {
    return this.resourceService.fetchSingle(request, param);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  update(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
    @Body() dto: UpdateResourceDto,
  ) {
    return this.resourceService.update(request, param, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  remove(@Req() request: AuthPayload & Request, @Param() param: IdDto) {
    return this.resourceService.delete(request, param);
  }
}
