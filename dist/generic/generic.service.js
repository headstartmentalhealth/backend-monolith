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
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePassword = exports.GenericService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const generic_data_1 = require("./generic.data");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const generic_utils_1 = require("./generic.utils");
let GenericService = class GenericService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.salt = crypto.randomBytes(32).toString('hex');
    }
    async isUserLinkedToBusiness(prisma, args, verifyBusiness) {
        const { user_id, business_id } = args;
        if (verifyBusiness) {
            await this.verifyBusiness(prisma, { user_id, id: business_id });
        }
        const existing_user_in_business = await prisma.businessContact.findFirst({
            where: {
                AND: [
                    { user: { id: user_id } },
                    { business_id },
                    { status: client_1.MemberStatus.active },
                    {
                        user: {
                            role: {
                                OR: [
                                    { role_id: generic_data_1.Role.BUSINESS_ADMIN },
                                    { role_id: generic_data_1.Role.BUSINESS_SUPER_ADMIN },
                                ],
                            },
                        },
                    },
                ],
            },
        });
        if (!existing_user_in_business) {
            throw new common_1.ForbiddenException('Access Denied. You are not privileged to performed this action.');
        }
    }
    async verifyBusiness(prisma, args) {
        const { user_id, id } = args;
        const business = await prisma.businessInformation.findUnique({
            where: {
                id,
                business_contacts: {
                    some: {
                        role: generic_data_1.Role.BUSINESS_ADMIN,
                        user_id,
                    },
                },
            },
        });
        if (!business) {
            throw new common_1.NotFoundException('Business not found.');
        }
        return business;
    }
    async findUser(user_id) {
        const user = await this.prisma.user.findUnique({
            where: { id: user_id },
            include: { role: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('Account not found');
        }
        return user;
    }
    encrypt(text) {
        const key = crypto.scryptSync(this.configService.get('ENCRYPT_DECRYPT_PASSPHRASE'), this.salt, 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const part1 = encrypted.slice(0, 17);
        const part2 = encrypted.slice(17);
        return `${part1}${iv.toString('hex')}${part2}`;
    }
    decrypt(text) {
        const key = crypto.scryptSync(this.configService.get('ENCRYPT_DECRYPT_PASSPHRASE'), this.salt, 32);
        const ivPosition = {
            start: 17,
            end: 17 + 32,
        };
        const iv = Buffer.from(text.slice(ivPosition.start, ivPosition.end), 'hex');
        const part1 = text.slice(0, ivPosition.start);
        const part2 = text.slice(ivPosition.end);
        const encryptedText = `${part1}${part2}`;
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    async systemBusinessDetails(prisma) {
        const system_business = await prisma.businessInformation.findFirst({
            where: { scope: generic_data_1.Role.OWNER_ADMIN },
        });
        return system_business;
    }
    async productBySlug(prisma, slug) {
        const product_by_slug = await prisma.product.findFirst({
            where: { slug },
        });
        if (product_by_slug) {
            throw new common_1.ConflictException('Slug is not available.');
        }
    }
    async validateOtherCurrencies(other_currencies, prisma) {
        if (!other_currencies || other_currencies.length === 0)
            return;
        const forbiddenBase = 'NGN';
        const hasBaseCurrency = other_currencies.some((o) => o.currency.toUpperCase() === forbiddenBase);
        if (hasBaseCurrency) {
            throw new common_1.BadRequestException(`${forbiddenBase} cannot be included in other_currencies. It is the base currency.`);
        }
        const allowed = await prisma.allowedCurrency.findMany({
            where: { enabled: true, deleted_at: null },
            select: { currency: true },
        });
        const allowedSet = new Set(allowed.map((a) => a.currency));
        const invalid = other_currencies
            .map((o) => o.currency)
            .filter((c) => !allowedSet.has(c));
        if (invalid.length > 0) {
            throw new common_1.BadRequestException(`Invalid currencies: ${invalid.join(', ')}. Only allowed currencies can be used.`);
        }
    }
    async convertPricesFromNGN(price, originalPrice, targetCurrency) {
        try {
            const currencyRate = await this.prisma.currencyRate.findFirst({
                where: {
                    base_currency: generic_data_1.DEFAULT_CURRENCY,
                    foreign_currency: targetCurrency,
                    deleted_at: null,
                },
            });
            if (!currencyRate?.base_to_foreign_rate) {
                return null;
            }
            const convertedPrice = Number(price) * Number(currencyRate.base_to_foreign_rate);
            const result = {
                price: Math.round(convertedPrice * 100) / 100,
            };
            if (originalPrice !== undefined) {
                const convertedOriginalPrice = Number(originalPrice) * Number(currencyRate.base_to_foreign_rate);
                result.original_price = Math.round(convertedOriginalPrice * 100) / 100;
            }
            return result;
        }
        catch (_e) {
            return null;
        }
    }
    async assignSelectedCurrencyPrices(product, selectedCurrency) {
        try {
            switch (product.type) {
                case client_1.ProductType.COURSE:
                case client_1.ProductType.DIGITAL_PRODUCT:
                case client_1.ProductType.PHYSICAL_PRODUCT: {
                    return this.find_product(product, selectedCurrency);
                }
                case client_1.ProductType.TICKET: {
                    if (product.ticket?.ticket_tiers?.length) {
                        product.ticket.ticket_tiers = await Promise.all(product.ticket.ticket_tiers.map((ticket_tier) => this.find_ticket_tier_price(ticket_tier, selectedCurrency)));
                    }
                    return product;
                }
                case client_1.ProductType.SUBSCRIPTION: {
                    if (product.subscription_plan?.subscription_plan_prices?.length) {
                        product.subscription_plan.subscription_plan_prices =
                            await Promise.all(product.subscription_plan.subscription_plan_prices.map((plan_price) => this.find_subscription_plan_price(plan_price, selectedCurrency)));
                    }
                    return product;
                }
                default:
                    return product;
            }
        }
        catch (_e) {
            return product;
        }
    }
    async find_subscription_plan_price(priceRow, selectedCurrency) {
        const match = Array.isArray(priceRow?.other_currencies)
            ? priceRow?.other_currencies.find((c) => c?.currency === selectedCurrency)
            : undefined;
        if (match) {
            priceRow.price = (match.price ?? priceRow.price);
            priceRow.currency = selectedCurrency;
        }
        else if (!priceRow?.other_currencies ||
            priceRow?.other_currencies.length === 0 ||
            (Boolean(priceRow?.other_currencies.length) && !match)) {
            const convertedPrices = await this.convertPricesFromNGN(+priceRow.price, undefined, selectedCurrency);
            if (convertedPrices) {
                priceRow.price = convertedPrices.price;
                priceRow.currency = selectedCurrency;
            }
        }
        return priceRow;
    }
    async find_ticket_tier_price(tier, selectedCurrency) {
        const match = Array.isArray(tier?.other_currencies)
            ? tier?.other_currencies.find((c) => c?.currency === selectedCurrency)
            : undefined;
        if (match) {
            tier.amount = (match.price ?? tier.amount);
            if (match.original_price !== undefined) {
                tier.original_amount =
                    match.original_price;
            }
            tier.currency = selectedCurrency;
        }
        else if (!tier?.other_currencies ||
            tier?.other_currencies.length === 0 ||
            (Boolean(tier?.other_currencies.length) && !match)) {
            const convertedPrices = await this.convertPricesFromNGN(+tier?.amount, +tier?.original_amount, selectedCurrency);
            if (convertedPrices) {
                tier.amount = convertedPrices.price;
                if (convertedPrices.original_price !== undefined) {
                    tier.original_amount =
                        convertedPrices.original_price;
                }
                tier.currency = selectedCurrency;
            }
        }
        return tier;
    }
    async find_product(product, selectedCurrency) {
        const match = Array.isArray(product?.other_currencies)
            ? product?.other_currencies.find((c) => c?.currency === selectedCurrency)
            : undefined;
        if (match) {
            product.price = (match.price ?? product.price);
            if (match.original_price !== undefined) {
                product.original_price =
                    match.original_price;
            }
            product.currency = selectedCurrency;
        }
        else if (!product?.other_currencies ||
            product?.other_currencies.length === 0 ||
            (Boolean(product?.other_currencies.length) && !match)) {
            const convertedPrices = await this.convertPricesFromNGN(+product?.price, +product?.original_price, selectedCurrency);
            if (convertedPrices) {
                product.price = convertedPrices?.price;
                if (convertedPrices?.original_price !== undefined) {
                    product.original_price =
                        convertedPrices?.original_price;
                }
                product.currency = selectedCurrency;
            }
        }
        return product;
    }
    finalAmountToBusinessWallet(amount, currency, discount_applied, enable_special_offer = false) {
        const fee_amount = (0, generic_utils_1.feeAmount)(+amount, this.configService.get(`DOEXCESS_${currency}${enable_special_offer && currency === generic_data_1.DEFAULT_CURRENCY ? '_SPECIAL_' : '_'}CHARGE`));
        const net_amount = +amount - +discount_applied;
        const final_amount = net_amount - fee_amount;
        return { final_amount, fee_amount, net_amount };
    }
};
exports.GenericService = GenericService;
exports.GenericService = GenericService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], GenericService);
const comparePassword = async (password, password_hash) => {
    const isPasswordValid = await bcrypt.compare(password, password_hash);
    if (!isPasswordValid) {
        throw new common_1.UnauthorizedException('Invalid password.');
    }
};
exports.comparePassword = comparePassword;
//# sourceMappingURL=generic.service.js.map