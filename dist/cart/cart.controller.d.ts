import { CartService } from './cart.service';
import { AddMultipleToCartDto, AddToCartDto, FilterCartDto, UpdateCartItemDto } from './cart.dto';
import { AltPagePayload, AuthPayload, GenericPayload, PagePayload } from '@/generic/generic.payload';
import { CurrencyDto, IdDto } from '@/generic/generic.dto';
import { Cart } from '@prisma/client';
export declare class CartController {
    private readonly cartService;
    constructor(cartService: CartService);
    addToCart(request: AuthPayload & Request, addToCartDto: AddToCartDto): Promise<GenericPayload>;
    fetch(request: AuthPayload & Request, currencyDto: CurrencyDto): Promise<AltPagePayload<Cart>>;
    update(request: AuthPayload & Request, param: IdDto, updateCartItemDto: UpdateCartItemDto): Promise<GenericPayload>;
    deleteCartItem(request: AuthPayload & Request, param: IdDto): Promise<GenericPayload>;
    fetchAll(request: AuthPayload & Request, filterDto: FilterCartDto): Promise<PagePayload<Cart>>;
    addMultipleToCart(request: AuthPayload & Request, addMultipleToCartDto: AddMultipleToCartDto): Promise<GenericPayload>;
}
