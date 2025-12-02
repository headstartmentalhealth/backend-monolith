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
import { PhysicalProductCrudService } from './crud.service';
import { Roles } from '@/account/auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';
import {
  AuthPayload,
  GenericDataPayload,
  GenericPayload,
  GenericPayloadAlias,
  PagePayload,
} from '@/generic/generic.payload';
import { Multimedia, PhysicalProductMedia, Product } from '@prisma/client';
import {
  AddPhysicalProductMedia,
  CreatePhysicalProductDto,
  ProductDto,
  UpdatePhysicalProductDto,
} from './crud.dto';
import { FilterProductDto } from '@/product/general/general.dto';
import { IdDto } from '@/generic/generic.dto';
import { DeletePhysicalProduct } from './crud.payload';

@Controller('v1/product-physical-crud')
@UseGuards(BusinessGuard)
export class PhysicalProductCrudController {
  constructor(
    private readonly physicalProductCrudService: PhysicalProductCrudService,
  ) {}

  /**
   * Create physical product
   * @param request
   * @param createPhysicalProductDto
   * @returns
   */
  @Post('create')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  create(
    @Req() request: AuthPayload & Request,
    @Body() createPhysicalProductDto: CreatePhysicalProductDto,
  ): Promise<GenericPayloadAlias<Product>> {
    return this.physicalProductCrudService.create(
      request,
      createPhysicalProductDto,
    );
  }

  /**
   * Fetch physical products
   * @param request
   * @param queryDto
   * @returns
   */
  @Get()
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  fetch(
    @Req() request: AuthPayload & Request,
    @Query() filterPhysicalProductDto: FilterProductDto,
  ): Promise<PagePayload<Product>> {
    return this.physicalProductCrudService.fetch(
      request,
      filterPhysicalProductDto,
    );
  }

  /**
   * Fetch single physical product
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
    return this.physicalProductCrudService.fetchSingle(request, param);
  }

  /**
   * Update a physical product
   * @param request
   * @param param
   * @param updatePhysicalProductDto
   * @returns
   */
  @Patch(':id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  update(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
    @Body() updatePhysicalProductDto: UpdatePhysicalProductDto,
  ): Promise<GenericPayloadAlias<Product>> {
    return this.physicalProductCrudService.update(
      request,
      param,
      updatePhysicalProductDto,
    );
  }

  /**
   * Delete a physical product
   * @param request
   * @param param
   * @returns
   */
  @Delete(':id')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  delete(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
  ): Promise<GenericPayloadAlias<DeletePhysicalProduct>> {
    return this.physicalProductCrudService.delete(request, param);
  }

  /**
   * Delete media
   * @param request
   * @param paramDto
   * @returns
   */
  @Delete(':id/media')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  removeSinglePhysicalProductMedia(
    @Req() request: AuthPayload & Request,
    @Param() paramDto: IdDto,
  ): Promise<GenericPayload> {
    return this.physicalProductCrudService.removeSinglePhysicalProductMedia(
      request,
      paramDto,
    );
  }

  @Post(':product_id/media')
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  addPhysicalProductMedia(
    @Req() request: AuthPayload & Request,
    @Param() productDto: ProductDto,
    @Body() addPhysicalProductMedia: AddPhysicalProductMedia,
  ) {
    return this.physicalProductCrudService.addPhysicalProductMedia(
      request,
      productDto,
      addPhysicalProductMedia,
    );
  }
}
