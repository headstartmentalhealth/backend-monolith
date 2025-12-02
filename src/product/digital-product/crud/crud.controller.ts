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
import { Roles } from '@/account/auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';
import {
  AuthPayload,
  GenericDataPayload,
  GenericPayload,
  GenericPayloadAlias,
  PagePayload,
} from '@/generic/generic.payload';
import { CreateDigitalProductDto, UpdateDigitalProductDto } from './crud.dto';
import { IdDto } from '@/generic/generic.dto';
import { Product } from '@prisma/client';
import { BusinessGuard } from '@/generic/guards/business.guard';
import { DigitalProductCrudService } from './crud.service';
import { DeleteDigitalProduct } from './crud.payload';
import { FilterProductDto } from '@/product/general/general.dto';

@Controller('v1/product-digital-crud')
@UseGuards(BusinessGuard)
export class DigitalProductCrudController {
  constructor(
    private readonly digitalProductCrudService: DigitalProductCrudService,
  ) {}

  /**
   * Create digital product
   * @param request
   * @param createDigitalProductDto
   * @returns
   */
  @Post('create')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  create(
    @Req() request: AuthPayload & Request,
    @Body() createDigitalProductDto: CreateDigitalProductDto,
  ): Promise<GenericPayloadAlias<Product>> {
    return this.digitalProductCrudService.create(
      request,
      createDigitalProductDto,
    );
  }

  /**
   * Fetch digital products
   * @param request
   * @param queryDto
   * @returns
   */
  @Get()
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  fetch(
    @Req() request: AuthPayload & Request,
    @Query() filterDigitalProductDto: FilterProductDto,
  ): Promise<PagePayload<Product>> {
    return this.digitalProductCrudService.fetch(
      request,
      filterDigitalProductDto,
    );
  }

  /**
   * Fetch single digital product
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
    return this.digitalProductCrudService.fetchSingle(request, param);
  }

  /**
   * Update a digital product
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
    @Body() updateDigitalProductDto: UpdateDigitalProductDto,
  ): Promise<GenericPayloadAlias<Product>> {
    return this.digitalProductCrudService.update(
      request,
      param,
      updateDigitalProductDto,
    );
  }

  /**
   * Delete a digital product
   * @param request
   * @param param
   * @returns
   */
  @Delete(':id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  delete(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
  ): Promise<GenericPayloadAlias<DeleteDigitalProduct>> {
    return this.digitalProductCrudService.delete(request, param);
  }
}
