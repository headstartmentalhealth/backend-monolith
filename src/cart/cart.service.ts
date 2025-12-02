import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddMultipleToCartDto,
  AddToCartDto,
  FilterCartDto,
  RemoveCartItemsDto,
  UpdateCartItemDto,
} from './cart.dto';
import { PrismaBaseRepository } from '@/prisma/prisma.base.repository';
import {
  Action,
  Cart,
  CartItem,
  Course,
  Prisma,
  PrismaClient,
  Product,
  ProductType,
  SubscriptionPlanPrice,
  TicketTier,
  User,
} from '@prisma/client';
import { LogService } from '@/log/log.service';
import { GenericService } from '@/generic/generic.service';
import {
  AltPagePayload,
  AuthPayload,
  GenericPayload,
  PagePayload,
} from '@/generic/generic.payload';
import { camelCase, capitalize, includes } from 'lodash';
import { CurrencyDto, IdDto, TZ } from '@/generic/generic.dto';
import {
  formatMoney,
  getIpAddress,
  getUserAgent,
  pageFilter,
} from '@/generic/generic.utils';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailService } from '@/notification/mail/mail.service';
import { DEFAULT_CURRENCY } from '@/generic/generic.data';
import { OtherCurrencyDto } from '@/product/course/crud/crud.dto';
import { iif } from 'rxjs';

@Injectable()
export class CartService {
  private readonly model = 'cart';
  private readonly logger = new Logger(CartService.name);
  private readonly cartInactivityThreshold: number;

  private readonly cartRepository: PrismaBaseRepository<
    Cart,
    Prisma.CartCreateInput,
    Prisma.CartUpdateInput,
    Prisma.CartWhereUniqueInput,
    Prisma.CartWhereInput | Prisma.CartFindFirstArgs,
    Prisma.CartUpsertArgs
  >;

  private readonly cartItemRepository: PrismaBaseRepository<
    CartItem,
    Prisma.CartItemCreateInput,
    Prisma.CartItemUpdateInput,
    Prisma.CartItemWhereUniqueInput,
    Prisma.CartItemWhereInput | Prisma.CartItemFindFirstArgs,
    Prisma.CartItemUpsertArgs
  >;

  private readonly select: Prisma.CartSelect = {
    id: true,
    user: true,
    created_at: true,
    updated_at: true,
    items: {
      include: {
        product: { include: { business_info: true, multimedia: true } },
        course: { include: { business_info: true, multimedia: true } },
        ticket_tier: {
          include: {
            ticket: {
              include: {
                product: { include: { business_info: true, multimedia: true } },
              },
            },
          },
        },
        subscription_plan_price: {
          include: {
            subscription_plan: {
              include: {
                product: { include: { business_info: true, multimedia: true } },
              },
            },
          },
        },
        digital_product: { include: { business_info: true, multimedia: true } },
        physical_product: {
          include: { business_info: true, multimedia: true },
        },
      },
    },
  };

  private readonly cartItemInclude: Prisma.CartItemInclude = {
    product: { include: { business_info: true, multimedia: true } },
    course: { include: { business_info: true, multimedia: true } },
    ticket_tier: {
      include: {
        ticket: {
          include: {
            product: { include: { business_info: true, multimedia: true } },
          },
        },
      },
    },
    subscription_plan_price: {
      include: {
        subscription_plan: {
          include: {
            product: { include: { business_info: true, multimedia: true } },
          },
        },
      },
    },
    digital_product: { include: { business_info: true, multimedia: true } },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly logService: LogService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly genericService: GenericService,
  ) {
    this.cartRepository = new PrismaBaseRepository<
      Cart,
      Prisma.CartCreateInput,
      Prisma.CartUpdateInput,
      Prisma.CartWhereUniqueInput,
      Prisma.CartWhereInput | Prisma.CartFindFirstArgs,
      Prisma.CartUpsertArgs
    >('cart', prisma);
    this.cartItemRepository = new PrismaBaseRepository<
      CartItem,
      Prisma.CartItemCreateInput,
      Prisma.CartItemUpdateInput,
      Prisma.CartItemWhereUniqueInput,
      Prisma.CartItemWhereInput | Prisma.CartItemFindFirstArgs,
      Prisma.CartItemUpsertArgs
    >('cartItem', prisma);
    this.cartInactivityThreshold =
      this.configService.get<number>('CART_ABANDONMENT_THRESHOLD_HOURS') || 24;
  }

  /**
   * Add item to cart
   * @param request
   * @param addToCartDto
   * @returns
   */
  async add(
    request: AuthPayload & Request,
    addToCartDto: AddToCartDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { product_id, quantity, product_type, currency, metadata } =
      addToCartDto;

    return this.prisma.$transaction(async (prisma) => {
      // Validate product existence based on type
      let product: Product;
      if (
        product_type === ProductType.COURSE ||
        product_type === ProductType.DIGITAL_PRODUCT ||
        product_type === ProductType.PHYSICAL_PRODUCT
      ) {
        product = await prisma.product.findUnique({
          where: { id: product_id },
        });
        if (!product)
          throw new NotFoundException(`${capitalize(product_type)} not found`);
      } else if (product_type === ProductType.SUBSCRIPTION) {
        const plan_price = await prisma.subscriptionPlanPrice.findUnique({
          where: { id: product_id },
          include: { subscription_plan: { include: { product: true } } },
        });
        if (!plan_price) throw new NotFoundException('Plan price not found');
        product = plan_price.subscription_plan.product;
      } else if (product_type === ProductType.TICKET) {
        const ticketTier = await prisma.ticketTier.findUnique({
          where: { id: product_id },
          include: { ticket: { include: { product: true } } },
        });
        if (!ticketTier) throw new NotFoundException('Ticket tier not found');
        product = ticketTier.ticket.product;
      } else {
        throw new NotFoundException('Product type not found.');
      }

      // Get or create cart
      let cart = await prisma.cart.findUnique({ where: { user_id: auth.sub } });
      if (!cart) {
        cart = await prisma.cart.create({
          data: { user_id: auth.sub },
        });
      }

      // Check for existing item
      const existingItem = await prisma.cartItem.findFirst({
        where: { cart_id: cart.id, product_id: product.id, currency },
      });

      if (existingItem) {
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
        });
      } else {
        // Get price based on product type
        let price: Prisma.Decimal;
        if (
          product_type === ProductType.COURSE ||
          product_type === ProductType.DIGITAL_PRODUCT ||
          product_type === ProductType.PHYSICAL_PRODUCT
        ) {
          const product =
            await this.genericService.assignSelectedCurrencyPrices(
              await prisma.product.findUnique({
                where: { id: product_id },
              }),
              currency,
            );
          price = product!.price;
        } else if (product_type === ProductType.SUBSCRIPTION) {
          const subscriptionPlanPrice =
            await this.genericService.find_subscription_plan_price(
              (await prisma.subscriptionPlanPrice.findUnique({
                where: { id: product_id },
              })) as SubscriptionPlanPrice & {
                other_currencies: OtherCurrencyDto[];
              },
              currency,
            );
          price = subscriptionPlanPrice!.price;
        } else if (product_type === ProductType.TICKET) {
          const ticketTier = await this.genericService.find_ticket_tier_price(
            (await prisma.ticketTier.findUnique({
              where: { id: product_id },
              select: { amount: true },
            })) as TicketTier & {
              other_currencies: OtherCurrencyDto[];
            },
            currency,
          );
          price = ticketTier!.amount ?? new Prisma.Decimal(0);
        } else {
          price = new Prisma.Decimal(0);
        }

        // Create cart item with explicit relation fields
        const createData: Prisma.CartItemCreateInput = {
          cart: { connect: { id: cart.id } },
          product: { connect: { id: product.id } },
          quantity,
          price_at_time: price,
          product_type,
          ...(currency && { currency }),
          ...(metadata !== undefined
            ? { metadata: JSON.parse(JSON.stringify(metadata)) }
            : {}),
        };

        // Set the appropriate relation based on type
        if (product_type === ProductType.COURSE) {
          createData.course = { connect: { id: product_id } };
        }
        // Set the appropriate relation based on type
        else if (product_type === ProductType.DIGITAL_PRODUCT) {
          createData.digital_product = { connect: { id: product_id } };
        } else if (product_type === ProductType.SUBSCRIPTION) {
          createData.subscription_plan_price = { connect: { id: product_id } };
        } else if (product_type === ProductType.TICKET) {
          createData.ticket_tier = { connect: { id: product_id } };
        } else if (product_type === ProductType.PHYSICAL_PRODUCT) {
          createData.physical_product = { connect: { id: product_id } };
        }

        await prisma.cartItem.create({
          data: createData,
        });
      }

      // Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.OPERATE_CART,
          entity: this.model,
          entity_id: cart.id,
          metadata: `User with ID ${auth.sub} saved an item in their cart ID ${cart.id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Item saved in the cart',
      };
    });
  }

  /**
   * Get user's cart
   * @param payload
   * @returns
   */
  async fetch(
    payload: AuthPayload,
    currencyDto: CurrencyDto,
  ): Promise<AltPagePayload<Cart & { items: CartItem[] }>> {
    const auth = payload.user;
    const { currency } = currencyDto;

    // Assign something else to same variable
    delete this.select.items;
    const select = this.select;

    const filters = {
      user_id: auth.sub,
      tz: payload.timezone,
      deleted_at: null,
    };

    const cart_item_filters: Prisma.CartItemWhereInput = {
      cart: { user_id: auth.sub },
      currency,
      deleted_at: null,
    };

    let [cart, items, total] = await Promise.all([
      await this.prisma.cart.findFirst({ where: filters, select }),
      await this.prisma.cartItem.findMany({
        where: cart_item_filters,
        include: { ...this.cartItemInclude },
      }),
      await this.prisma.cartItem.count({
        where: { cart: { user_id: auth.sub }, currency },
      }),
    ]);

    let modified_items = items;
    if (items && items.length) {
      for (let index = 0; index < items.length; index++) {
        const item = items[index];

        // console.log(item);

        switch (item.product_type) {
          case ProductType.DIGITAL_PRODUCT: {
            item.digital_product = await this.genericService.find_product(
              item.digital_product as Product & {
                other_currencies: OtherCurrencyDto[];
              },
              currency,
            );
            break;
          }
          case ProductType.PHYSICAL_PRODUCT: {
            item.physical_product = await this.genericService.find_product(
              item.physical_product as Product & {
                other_currencies: OtherCurrencyDto[];
              },
              currency,
            );
            break;
          }
          case ProductType.COURSE: {
            // console.log(ProductType.COURSE);
            // console.log(item.course);
            item.course = await this.genericService.find_product(
              item.course as Product & { other_currencies: OtherCurrencyDto[] },
              currency,
            );
            break;
          }
          case ProductType.TICKET: {
            // console.log(ProductType.TICKET);
            // console.log(item.ticket_tier);
            item.ticket_tier = await this.genericService.find_ticket_tier_price(
              item.ticket_tier as TicketTier & {
                other_currencies: OtherCurrencyDto[];
              },
              currency,
            );
            break;
          }
          case ProductType.SUBSCRIPTION: {
            // console.log(ProductType.SUBSCRIPTION);
            // console.log(item);
            item.subscription_plan_price =
              await this.genericService.find_subscription_plan_price(
                item.subscription_plan_price as SubscriptionPlanPrice & {
                  other_currencies: OtherCurrencyDto[];
                },
                currency,
              );
            break;
          }
        }

        modified_items[index] = item;
      }
    }

    return {
      statusCode: HttpStatus.OK,
      data: { ...cart, items: modified_items },
      count: total,
    };
  }

  /**
   * Update cart item quantity
   * @param request
   * @param param
   * @param updateCartItemDto
   * @returns
   */
  async update(
    request: AuthPayload & Request,
    param: IdDto,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { quantity } = updateCartItemDto;
    const { id } = param;

    return this.prisma.$transaction(async (prisma) => {
      const cart_item = await prisma.cartItem.findUnique({
        where: { id, cart: { user_id: auth.sub } },
      });

      if (!cart_item) throw new NotFoundException('Cart item not found');

      if (quantity === 0) {
        await prisma.cartItem.delete({ where: { id } });
      } else {
        await prisma.cartItem.update({
          where: { id },
          data: { quantity },
        });
      }

      // 6. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.OPERATE_CART,
          entity: this.model,
          entity_id: id,
          metadata: `User with ID ${auth.sub} just updated their cart ID ${id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Cart updated successfully.',
      };
    });
  }

  /**
   * Delete cart item
   * @param request
   * @param param
   * @returns
   */
  async delete(
    request: AuthPayload & Request,
    param: IdDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    const { id } = param;

    return this.prisma.$transaction(async (prisma) => {
      const cartItem = await prisma.cartItem.findUnique({
        where: { id, cart: { user_id: auth.sub } },
      });

      if (!cartItem) throw new NotFoundException('Cart item not found');

      await prisma.cartItem.delete({ where: { id } });

      // 6. Create log
      await this.logService.createWithTrx(
        {
          user_id: auth.sub,
          action: Action.OPERATE_CART,
          entity: this.model,
          entity_id: id,
          metadata: `User with ID ${auth.sub} just remove a cart item ID ${id} from their cart ID ${cartItem.cart_id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Item removed from cart successfully.',
      };
    });
  }

  /**
   * Remove items from cart
   * @param dto
   * @param prisma
   */
  async removeItemsFromCart(
    dto: RemoveCartItemsDto,
    prisma: Omit<
      PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
  ): Promise<void> {
    const { user_id, product_ids } = dto;

    // Remove multiple items using deleteMany
    await prisma.cartItem.deleteMany({
      where: {
        cart: { user_id },
        product_id: { in: product_ids },
      },
    });
  }

  /**
   * Process abandoned carts
   */
  @Cron(CronExpression.EVERY_DAY_AT_NOON) // Runs every hour
  async processAbandonedCarts() {
    this.logger.log('Checking for abandoned carts...');

    const thresholdDate = new Date();
    thresholdDate.setHours(
      thresholdDate.getHours() - this.cartInactivityThreshold,
    );

    try {
      const abandonedCarts = await this.getAbandonedCarts(thresholdDate);
      this.logger.log(`Found ${abandonedCarts.length} abandoned carts.`);

      for (const cart of abandonedCarts) {
        await this.notifyUser(cart);
      }
    } catch (error) {
      this.logger.error('Error processing abandoned carts:', error);
    }
  }

  /**
   * Get abandoned cart items
   * @param thresholdDate
   * @returns
   */
  private async getAbandonedCarts(thresholdDate: Date) {
    return this.prisma.cart.findMany({
      where: {
        updated_at: { lt: thresholdDate },
        deleted_at: null,
        items: { some: {} }, // Ensures cart has items
      },
      select: {
        id: true,
        user: {
          select: { id: true, email: true, name: true },
        },
        items: {
          select: {
            quantity: true,
            price_at_time: true,
            product_type: true,
            course: {
              include: {
                business_info: { include: { business_wallet: true } },
              },
            }, // Assuming only courses are mapped in CartItem
          },
        },
      },
    });
  }

  /**
   * Notify user about cart abandoned
   * @param cart
   * @returns
   */
  private async notifyUser(cart) {
    if (!cart.user?.email) {
      this.logger.warn(`Cart ${cart.id} has no associated email.`);
      return;
    }

    const cartItems = cart.items.map((item) => ({
      name: item.course?.title ?? 'Unknown Product',
      price: formatMoney(
        +item.course?.price,
        item.course?.business_info?.business_wallet?.currency,
      ),
      quantity: item.quantity,
    }));

    try {
      await this.mailService.cartReminderEmail(cart.user, {
        items: cartItems,
      });

      this.logger.log(`Email sent to ${cart.user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${cart.user.email}:`, error);
    }
  }

  /**
   * Get all cart - for admin
   * @param payload
   * @param queryDto
   */
  async fetchAll(
    payload: AuthPayload,
    filterDto: FilterCartDto,
  ): Promise<PagePayload<Cart>> {
    const auth = payload.user;
    const { business_id } = filterDto;

    // Check if user is part of the owner's administrators - TODO

    // Invoke pagination filters
    const pagination_filters = pageFilter(filterDto);

    // Filters
    const filters: Prisma.CartWhereInput = {
      items: {
        some: {},
      },
      ...(filterDto.q && {
        OR: [
          {
            items: {
              some: {
                ticket_tier: {
                  name: { contains: filterDto.q, mode: 'insensitive' },
                },
              },
            },
          },
          {
            items: {
              some: {
                course: {
                  title: { contains: filterDto.q, mode: 'insensitive' },
                  ...(business_id && { business_id }),
                },
              },
            },
          },
        ],
      }),
      ...(business_id && {
        items: {
          some: {
            OR: [
              {
                ticket_tier: {
                  ticket: { product: { business_id } },
                },
              },
              {
                course: { business_id },
              },
            ],
          },
        },
      }),
      ...pagination_filters.filters,
      ...(payload.timezone && { tz: payload.timezone }),
    };

    // Assign something else to same variable
    const select = this.select;

    const [cart, total] = await Promise.all([
      this.cartRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        undefined,
        select,
      ),
      this.cartRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: cart,
      count: total,
    };
  }

  /**
   * Add multiple items with measurements to cart
   * @param request
   * @param addMultipleToCartDto
   * @returns
   */
  async addMultiple(
    request: AuthPayload & Request,
    addMultipleToCartDto: AddMultipleToCartDto,
  ): Promise<GenericPayload> {
    const auth = request.user;
    return this.prisma.$transaction(async (prisma) => {
      // Get or create cart
      await this.addItems(request, auth, addMultipleToCartDto, prisma);

      return {
        statusCode: HttpStatus.OK,
        message: 'Items saved in the cart',
      };
    });
  }

  async addItems(
    request: Request,
    auth: AuthPayload['user'],
    addMultipleToCartDto: AddMultipleToCartDto,
    prisma: Omit<
      PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
  ) {
    let cart = await prisma.cart.findUnique({ where: { user_id: auth.sub } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { user_id: auth.sub } });
    }
    for (const item of addMultipleToCartDto.items) {
      const { product_id, quantity, product_type, metadata } = item;
      // Validate product existence based on type
      let product: Product;
      if (product_type === ProductType.TICKET) {
        const ticket_tier = await prisma.ticketTier.findUnique({
          where: {
            id: product_id,
          },
          include: { ticket: { include: { product: true } } },
        });

        if (!ticket_tier) {
          throw new NotFoundException(
            `Ticket tier price not found: ${product_id}`,
          );
        }

        product = ticket_tier.ticket.product;
      } else if (product_type === ProductType.SUBSCRIPTION) {
        const subPrice = await prisma.subscriptionPlanPrice.findUnique({
          where: { id: product_id },
          include: { subscription_plan: { include: { product: true } } },
        });

        if (!subPrice) {
          throw new NotFoundException(
            `Subscription plan price not found: ${product_id}`,
          );
        }

        product = subPrice.subscription_plan.product;
      } else {
        product = await prisma.product.findUnique({
          where: { id: product_id, type: product_type },
        });
      }

      if (!product)
        throw new NotFoundException(`Product not found: ${product_id}`);

      const price = product.price ?? new Prisma.Decimal(0);

      // Store
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cart_id: cart.id,
          product_id: product.id,
        },
      });
      if (existingItem) {
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
        });
      } else {
        const createData: Prisma.CartItemCreateInput = {
          product: { connect: { id: product.id } },
          cart: { connect: { id: cart.id } },
          ...(product_type === ProductType.COURSE
            ? { course: { connect: { id: product_id } } }
            : product_type === ProductType.DIGITAL_PRODUCT
              ? { digital_product: { connect: { id: product_id } } }
              : product_type === ProductType.PHYSICAL_PRODUCT
                ? { physical_product: { connect: { id: product_id } } }
                : product_type === ProductType.SUBSCRIPTION
                  ? { subscription_plan_price: { connect: { id: product_id } } }
                  : { ticket_tier: { connect: { id: product_id } } }),
          quantity,
          price_at_time: price,
          product_type,
          ...(metadata !== undefined
            ? { metadata: JSON.parse(JSON.stringify(metadata)) }
            : {}),
        };
        await prisma.cartItem.create({ data: createData });
      }
    }
    // Create log
    await this.logService.createWithTrx(
      {
        user_id: auth.sub,
        action: Action.OPERATE_CART,
        entity: this.model,
        entity_id: cart.id,
        metadata: `User with ID ${auth.sub} added multiple items to their cart ID ${cart.id}.`,
        ip_address: getIpAddress(request),
        user_agent: getUserAgent(request),
      },
      prisma.log,
    );

    return;
  }
}
