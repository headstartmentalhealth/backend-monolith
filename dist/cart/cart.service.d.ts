import { PrismaService } from '../prisma/prisma.service';
import { AddMultipleToCartDto, AddToCartDto, FilterCartDto, RemoveCartItemsDto, UpdateCartItemDto } from './cart.dto';
import { Cart, CartItem, Prisma, PrismaClient } from '@prisma/client';
import { LogService } from '@/log/log.service';
import { GenericService } from '@/generic/generic.service';
import { AltPagePayload, AuthPayload, GenericPayload, PagePayload } from '@/generic/generic.payload';
import { CurrencyDto, IdDto } from '@/generic/generic.dto';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { ConfigService } from '@nestjs/config';
import { MailService } from '@/notification/mail/mail.service';
export declare class CartService {
    private readonly prisma;
    private readonly logService;
    private readonly configService;
    private readonly mailService;
    private readonly genericService;
    private readonly model;
    private readonly logger;
    private readonly cartInactivityThreshold;
    private readonly cartRepository;
    private readonly cartItemRepository;
    private readonly select;
    private readonly cartItemInclude;
    constructor(prisma: PrismaService, logService: LogService, configService: ConfigService, mailService: MailService, genericService: GenericService);
    add(request: AuthPayload & Request, addToCartDto: AddToCartDto): Promise<GenericPayload>;
    fetch(payload: AuthPayload, currencyDto: CurrencyDto): Promise<AltPagePayload<Cart & {
        items: CartItem[];
    }>>;
    update(request: AuthPayload & Request, param: IdDto, updateCartItemDto: UpdateCartItemDto): Promise<GenericPayload>;
    delete(request: AuthPayload & Request, param: IdDto): Promise<GenericPayload>;
    removeItemsFromCart(dto: RemoveCartItemsDto, prisma: Omit<PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>): Promise<void>;
    processAbandonedCarts(): Promise<void>;
    private getAbandonedCarts;
    private notifyUser;
    fetchAll(payload: AuthPayload, filterDto: FilterCartDto): Promise<PagePayload<Cart>>;
    addMultiple(request: AuthPayload & Request, addMultipleToCartDto: AddMultipleToCartDto): Promise<GenericPayload>;
    addItems(request: Request, auth: AuthPayload['user'], addMultipleToCartDto: AddMultipleToCartDto, prisma: Omit<PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>): Promise<void>;
}
