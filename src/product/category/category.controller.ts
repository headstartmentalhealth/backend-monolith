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
import { ProductCategoryService } from './category.service';
import { Roles } from '@/account/auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';
import {
  AuthPayload,
  GenericDataPayload,
  GenericPayload,
  PagePayload,
} from '@/generic/generic.payload';
import {
  CreateProductCategoryDto,
  FilterProductCategoryDto,
} from './category.dto';
import { ProductCategory } from '@prisma/client';
import { IdDto } from '@/generic/generic.dto';

@Controller('v1/product-category')
export class ProductCategoryController {
  constructor(
    private readonly productCategoryService: ProductCategoryService,
  ) {}

  /**
   * Create product category
   * @param request
   * @param createProductCategoryDto
   * @returns
   */
  @Post('create')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  create(
    @Req() request: AuthPayload & Request,
    @Body() createProductCategoryDto: CreateProductCategoryDto,
  ): Promise<GenericPayload> {
    return this.productCategoryService.create(
      request,
      createProductCategoryDto,
    );
  }

  /**
   * Fetch product categories
   * @param request
   * @param queryDto
   * @returns
   */
  @Get()
  fetch(
    @Req() request: AuthPayload & Request,
    @Query() filterProductCategoryDto: FilterProductCategoryDto,
  ): Promise<PagePayload<ProductCategory>> {
    return this.productCategoryService.fetch(request, filterProductCategoryDto);
  }

  /**
   * Fetch single product category
   * @param request
   * @param param
   * @returns
   */
  @Get(':id')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  fetchSingle(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
  ): Promise<GenericDataPayload<ProductCategory>> {
    return this.productCategoryService.fetchSingle(request, param);
  }

  /**
   * Update a product category
   * @param request
   * @param param
   * @param updateProductCategoryDto
   * @returns
   */
  @Patch(':id')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  update(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
    @Body() updateProductCategoryDto: Partial<CreateProductCategoryDto>,
  ): Promise<GenericPayload> {
    return this.productCategoryService.update(
      request,
      param,
      updateProductCategoryDto,
    );
  }

  /**
   * Delete a product category
   * @param request
   * @param param
   * @returns
   */
  @Delete(':id')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  delete(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
  ): Promise<GenericPayload> {
    return this.productCategoryService.delete(request, param);
  }
}
