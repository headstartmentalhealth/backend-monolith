"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CartService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const prisma_base_repository_1 = require("../prisma/prisma.base.repository");
const client_1 = require("@prisma/client");
const log_service_1 = require("../log/log.service");
const generic_service_1 = require("../generic/generic.service");
const lodash_1 = require("lodash");
const generic_utils_1 = require("../generic/generic.utils");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const mail_service_1 = require("../notification/mail/mail.service");
let CartService = CartService_1 = class CartService {
    constructor(prisma, logService, configService, mailService, genericService) {
        this.prisma = prisma;
        this.logService = logService;
        this.configService = configService;
        this.mailService = mailService;
        this.genericService = genericService;
        this.model = 'cart';
        this.logger = new common_1.Logger(CartService_1.name);
        this.select = {
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
        this.cartItemInclude = {
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
        this.cartRepository = new prisma_base_repository_1.PrismaBaseRepository('cart', prisma);
        this.cartItemRepository = new prisma_base_repository_1.PrismaBaseRepository('cartItem', prisma);
        this.cartInactivityThreshold =
            this.configService.get('CART_ABANDONMENT_THRESHOLD_HOURS') || 24;
    }
    async add(request, addToCartDto) {
        const auth = request.user;
        const { product_id, quantity, product_type, currency, metadata } = addToCartDto;
        return this.prisma.$transaction(async (prisma) => {
            let product;
            if (product_type === client_1.ProductType.COURSE ||
                product_type === client_1.ProductType.DIGITAL_PRODUCT ||
                product_type === client_1.ProductType.PHYSICAL_PRODUCT) {
                product = await prisma.product.findUnique({
                    where: { id: product_id },
                });
                if (!product)
                    throw new common_1.NotFoundException(`${(0, lodash_1.capitalize)(product_type)} not found`);
            }
            else if (product_type === client_1.ProductType.SUBSCRIPTION) {
                const plan_price = await prisma.subscriptionPlanPrice.findUnique({
                    where: { id: product_id },
                    include: { subscription_plan: { include: { product: true } } },
                });
                if (!plan_price)
                    throw new common_1.NotFoundException('Plan price not found');
                product = plan_price.subscription_plan.product;
            }
            else if (product_type === client_1.ProductType.TICKET) {
                const ticketTier = await prisma.ticketTier.findUnique({
                    where: { id: product_id },
                    include: { ticket: { include: { product: true } } },
                });
                if (!ticketTier)
                    throw new common_1.NotFoundException('Ticket tier not found');
                product = ticketTier.ticket.product;
            }
            else {
                throw new common_1.NotFoundException('Product type not found.');
            }
            let cart = await prisma.cart.findUnique({ where: { user_id: auth.sub } });
            if (!cart) {
                cart = await prisma.cart.create({
                    data: { user_id: auth.sub },
                });
            }
            const existingItem = await prisma.cartItem.findFirst({
                where: { cart_id: cart.id, product_id: product.id, currency },
            });
            if (existingItem) {
                await prisma.cartItem.update({
                    where: { id: existingItem.id },
                    data: { quantity: existingItem.quantity + quantity },
                });
            }
            else {
                let price;
                if (product_type === client_1.ProductType.COURSE ||
                    product_type === client_1.ProductType.DIGITAL_PRODUCT ||
                    product_type === client_1.ProductType.PHYSICAL_PRODUCT) {
                    const product = await this.genericService.assignSelectedCurrencyPrices(await prisma.product.findUnique({
                        where: { id: product_id },
                    }), currency);
                    price = product.price;
                }
                else if (product_type === client_1.ProductType.SUBSCRIPTION) {
                    const subscriptionPlanPrice = await this.genericService.find_subscription_plan_price((await prisma.subscriptionPlanPrice.findUnique({
                        where: { id: product_id },
                    })), currency);
                    price = subscriptionPlanPrice.price;
                }
                else if (product_type === client_1.ProductType.TICKET) {
                    const ticketTier = await this.genericService.find_ticket_tier_price((await prisma.ticketTier.findUnique({
                        where: { id: product_id },
                        select: { amount: true },
                    })), currency);
                    price = ticketTier.amount ?? new client_1.Prisma.Decimal(0);
                }
                else {
                    price = new client_1.Prisma.Decimal(0);
                }
                const createData = {
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
                if (product_type === client_1.ProductType.COURSE) {
                    createData.course = { connect: { id: product_id } };
                }
                else if (product_type === client_1.ProductType.DIGITAL_PRODUCT) {
                    createData.digital_product = { connect: { id: product_id } };
                }
                else if (product_type === client_1.ProductType.SUBSCRIPTION) {
                    createData.subscription_plan_price = { connect: { id: product_id } };
                }
                else if (product_type === client_1.ProductType.TICKET) {
                    createData.ticket_tier = { connect: { id: product_id } };
                }
                else if (product_type === client_1.ProductType.PHYSICAL_PRODUCT) {
                    createData.physical_product = { connect: { id: product_id } };
                }
                await prisma.cartItem.create({
                    data: createData,
                });
            }
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.OPERATE_CART,
                entity: this.model,
                entity_id: cart.id,
                metadata: `User with ID ${auth.sub} saved an item in their cart ID ${cart.id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Item saved in the cart',
            };
        });
    }
    async fetch(payload, currencyDto) {
        const auth = payload.user;
        const { currency } = currencyDto;
        delete this.select.items;
        const select = this.select;
        const filters = {
            user_id: auth.sub,
            tz: payload.timezone,
            deleted_at: null,
        };
        const cart_item_filters = {
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
                switch (item.product_type) {
                    case client_1.ProductType.DIGITAL_PRODUCT: {
                        item.digital_product = await this.genericService.find_product(item.digital_product, currency);
                        break;
                    }
                    case client_1.ProductType.PHYSICAL_PRODUCT: {
                        item.physical_product = await this.genericService.find_product(item.physical_product, currency);
                        break;
                    }
                    case client_1.ProductType.COURSE: {
                        item.course = await this.genericService.find_product(item.course, currency);
                        break;
                    }
                    case client_1.ProductType.TICKET: {
                        item.ticket_tier = await this.genericService.find_ticket_tier_price(item.ticket_tier, currency);
                        break;
                    }
                    case client_1.ProductType.SUBSCRIPTION: {
                        item.subscription_plan_price =
                            await this.genericService.find_subscription_plan_price(item.subscription_plan_price, currency);
                        break;
                    }
                }
                modified_items[index] = item;
            }
        }
        return {
            statusCode: common_1.HttpStatus.OK,
            data: { ...cart, items: modified_items },
            count: total,
        };
    }
    async update(request, param, updateCartItemDto) {
        const auth = request.user;
        const { quantity } = updateCartItemDto;
        const { id } = param;
        return this.prisma.$transaction(async (prisma) => {
            const cart_item = await prisma.cartItem.findUnique({
                where: { id, cart: { user_id: auth.sub } },
            });
            if (!cart_item)
                throw new common_1.NotFoundException('Cart item not found');
            if (quantity === 0) {
                await prisma.cartItem.delete({ where: { id } });
            }
            else {
                await prisma.cartItem.update({
                    where: { id },
                    data: { quantity },
                });
            }
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.OPERATE_CART,
                entity: this.model,
                entity_id: id,
                metadata: `User with ID ${auth.sub} just updated their cart ID ${id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Cart updated successfully.',
            };
        });
    }
    async delete(request, param) {
        const auth = request.user;
        const { id } = param;
        return this.prisma.$transaction(async (prisma) => {
            const cartItem = await prisma.cartItem.findUnique({
                where: { id, cart: { user_id: auth.sub } },
            });
            if (!cartItem)
                throw new common_1.NotFoundException('Cart item not found');
            await prisma.cartItem.delete({ where: { id } });
            await this.logService.createWithTrx({
                user_id: auth.sub,
                action: client_1.Action.OPERATE_CART,
                entity: this.model,
                entity_id: id,
                metadata: `User with ID ${auth.sub} just remove a cart item ID ${id} from their cart ID ${cartItem.cart_id}.`,
                ip_address: (0, generic_utils_1.getIpAddress)(request),
                user_agent: (0, generic_utils_1.getUserAgent)(request),
            }, prisma.log);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Item removed from cart successfully.',
            };
        });
    }
    async removeItemsFromCart(dto, prisma) {
        const { user_id, product_ids } = dto;
        await prisma.cartItem.deleteMany({
            where: {
                cart: { user_id },
                product_id: { in: product_ids },
            },
        });
    }
    async processAbandonedCarts() {
        this.logger.log('Checking for abandoned carts...');
        const thresholdDate = new Date();
        thresholdDate.setHours(thresholdDate.getHours() - this.cartInactivityThreshold);
        try {
            const abandonedCarts = await this.getAbandonedCarts(thresholdDate);
            this.logger.log(`Found ${abandonedCarts.length} abandoned carts.`);
            for (const cart of abandonedCarts) {
                await this.notifyUser(cart);
            }
        }
        catch (error) {
            this.logger.error('Error processing abandoned carts:', error);
        }
    }
    async getAbandonedCarts(thresholdDate) {
        return this.prisma.cart.findMany({
            where: {
                updated_at: { lt: thresholdDate },
                deleted_at: null,
                items: { some: {} },
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
                        },
                    },
                },
            },
        });
    }
    async notifyUser(cart) {
        if (!cart.user?.email) {
            this.logger.warn(`Cart ${cart.id} has no associated email.`);
            return;
        }
        const cartItems = cart.items.map((item) => ({
            name: item.course?.title ?? 'Unknown Product',
            price: (0, generic_utils_1.formatMoney)(+item.course?.price, item.course?.business_info?.business_wallet?.currency),
            quantity: item.quantity,
        }));
        try {
            await this.mailService.cartReminderEmail(cart.user, {
                items: cartItems,
            });
            this.logger.log(`Email sent to ${cart.user.email}`);
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${cart.user.email}:`, error);
        }
    }
    async fetchAll(payload, filterDto) {
        const auth = payload.user;
        const { business_id } = filterDto;
        const pagination_filters = (0, generic_utils_1.pageFilter)(filterDto);
        const filters = {
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
        const select = this.select;
        const [cart, total] = await Promise.all([
            this.cartRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, select),
            this.cartRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: cart,
            count: total,
        };
    }
    async addMultiple(request, addMultipleToCartDto) {
        const auth = request.user;
        return this.prisma.$transaction(async (prisma) => {
            await this.addItems(request, auth, addMultipleToCartDto, prisma);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Items saved in the cart',
            };
        });
    }
    async addItems(request, auth, addMultipleToCartDto, prisma) {
        let cart = await prisma.cart.findUnique({ where: { user_id: auth.sub } });
        if (!cart) {
            cart = await prisma.cart.create({ data: { user_id: auth.sub } });
        }
        for (const item of addMultipleToCartDto.items) {
            const { product_id, quantity, product_type, metadata } = item;
            let product;
            if (product_type === client_1.ProductType.TICKET) {
                const ticket_tier = await prisma.ticketTier.findUnique({
                    where: {
                        id: product_id,
                    },
                    include: { ticket: { include: { product: true } } },
                });
                if (!ticket_tier) {
                    throw new common_1.NotFoundException(`Ticket tier price not found: ${product_id}`);
                }
                product = ticket_tier.ticket.product;
            }
            else if (product_type === client_1.ProductType.SUBSCRIPTION) {
                const subPrice = await prisma.subscriptionPlanPrice.findUnique({
                    where: { id: product_id },
                    include: { subscription_plan: { include: { product: true } } },
                });
                if (!subPrice) {
                    throw new common_1.NotFoundException(`Subscription plan price not found: ${product_id}`);
                }
                product = subPrice.subscription_plan.product;
            }
            else {
                product = await prisma.product.findUnique({
                    where: { id: product_id, type: product_type },
                });
            }
            if (!product)
                throw new common_1.NotFoundException(`Product not found: ${product_id}`);
            const price = product.price ?? new client_1.Prisma.Decimal(0);
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
            }
            else {
                const createData = {
                    product: { connect: { id: product.id } },
                    cart: { connect: { id: cart.id } },
                    ...(product_type === client_1.ProductType.COURSE
                        ? { course: { connect: { id: product_id } } }
                        : product_type === client_1.ProductType.DIGITAL_PRODUCT
                            ? { digital_product: { connect: { id: product_id } } }
                            : product_type === client_1.ProductType.PHYSICAL_PRODUCT
                                ? { physical_product: { connect: { id: product_id } } }
                                : product_type === client_1.ProductType.SUBSCRIPTION
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
        await this.logService.createWithTrx({
            user_id: auth.sub,
            action: client_1.Action.OPERATE_CART,
            entity: this.model,
            entity_id: cart.id,
            metadata: `User with ID ${auth.sub} added multiple items to their cart ID ${cart.id}.`,
            ip_address: (0, generic_utils_1.getIpAddress)(request),
            user_agent: (0, generic_utils_1.getUserAgent)(request),
        }, prisma.log);
        return;
    }
};
exports.CartService = CartService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_NOON),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CartService.prototype, "processAbandonedCarts", null);
exports.CartService = CartService = CartService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        log_service_1.LogService,
        config_1.ConfigService,
        mail_service_1.MailService,
        generic_service_1.GenericService])
], CartService);
//# sourceMappingURL=cart.service.js.map