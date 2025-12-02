import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CartService } from './cart.service';
import {
  AddMultipleToCartDto,
  AddToCartDto,
  FilterCartDto,
  UpdateCartItemDto,
} from './cart.dto';
import { Roles } from '@/account/auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';
import {
  AltPagePayload,
  AuthPayload,
  GenericPayload,
  PagePayload,
} from '@/generic/generic.payload';
import { CurrencyDto, IdDto, QueryDto } from '@/generic/generic.dto';
import { Cart } from '@prisma/client';

@Controller('v1/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * Add to cart
   * @param request
   * @param addToCartDto
   * @returns
   */
  @Post('add')
  @Roles(Role.USER)
  async addToCart(
    @Req() request: AuthPayload & Request,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<GenericPayload> {
    return this.cartService.add(request, addToCartDto);
  }

  /**
   * Fetch cart items
   * @param request
   * @returns
   */
  @Get()
  @Roles(Role.USER)
  async fetch(
    @Req() request: AuthPayload & Request,
    @Query() currencyDto: CurrencyDto,
  ): Promise<AltPagePayload<Cart>> {
    return this.cartService.fetch(request, currencyDto);
  }

  /**
   * Update cart item
   * @param request
   * @param param
   * @param updateCartItemDto
   * @returns
   */
  @Put('item/:id')
  @Roles(Role.USER)
  async update(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<GenericPayload> {
    return this.cartService.update(request, param, updateCartItemDto);
  }

  /**
   * Delete cart item
   * @param request
   * @param param
   * @returns
   */
  @Delete('item/:id')
  @Roles(Role.USER)
  async deleteCartItem(
    @Req() request: AuthPayload & Request,
    @Param() param: IdDto,
  ) {
    return this.cartService.delete(request, param);
  }

  /**
   * Get all cart - for admin
   * @param request
   * @param filterDto
   * @returns
   */
  @Get('fetch-all')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  async fetchAll(
    @Req() request: AuthPayload & Request,
    @Query() filterDto: FilterCartDto,
  ): Promise<PagePayload<Cart>> {
    return this.cartService.fetchAll(request, filterDto);
  }

  /**
   * Add multiple items to cart
   * @param request
   * @param addMultipleToCartDto
   * @returns
   */
  @Post('add-multiple')
  @Roles(Role.USER)
  async addMultipleToCart(
    @Req() request: AuthPayload & Request,
    @Body() addMultipleToCartDto: AddMultipleToCartDto,
  ): Promise<GenericPayload> {
    return this.cartService.addMultiple(request, addMultipleToCartDto);
  }
}
