import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ProductGeneralService } from './general.service';
import { Roles } from '@/account/auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';
import { BusinessGuard } from '@/generic/guards/business.guard';
import {
  AuthPayload,
  GenericPayloadAlias,
  PagePayload,
} from '@/generic/generic.payload';
import { FilterProductDto } from '../ticket/crud/crud.dto';
import { Product } from '@prisma/client';
import { Public } from '@/account/auth/decorators/auth.decorator';

@Controller('v1/product-general')
export class ProductGeneralController {
  constructor(private readonly productGeneralService: ProductGeneralService) {}

  /**
   * Fetch products
   * @param request
   * @param queryDto
   * @returns
   */
  @Get()
  @Roles(Role.BUSINESS_SUPER_ADMIN, Role.BUSINESS_ADMIN)
  @UseGuards(BusinessGuard)
  fetch(
    @Req() request: AuthPayload & Request,
    @Query() filterProductDto: FilterProductDto,
  ): Promise<PagePayload<Product>> {
    return this.productGeneralService.fetch(request, filterProductDto);
  }

  /**
   * Fetch all products
   * @param request
   * @param queryDto
   * @returns
   */
  @Get('fetch')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  fetchAll(
    @Req() request: AuthPayload & Request,
    @Query() filterProductDto: FilterProductDto,
  ): Promise<PagePayload<Product>> {
    return this.productGeneralService.fetchAll(request, filterProductDto);
  }

  /**
   * Fetch products for an organization with filter DTO
   * @param business_id
   * @param filterProductDto
   * @returns
   */
  @Get('organization/:business_id')
  @Public()
  fetchOrganizationProducts(
    @Param('business_id') businessId: string,
    @Query() filterProductDto: FilterProductDto,
  ): Promise<PagePayload<Product>> {
    return this.productGeneralService.fetchOrganizationProducts(
      businessId,
      filterProductDto,
    );
  }

  /**
   * Fetch a product by id for public users
   * @param product_id
   * @returns
   */
  @Get('public/:product_id')
  @Public()
  fetchProductByIdPublic(
    @Param('product_id') productId: string,
    @Query() query: { currency?: string },
  ): Promise<GenericPayloadAlias<Product | any>> {
    return this.productGeneralService.fetchProductByIdPublic(
      productId,
      query.currency,
    );
  }
}
