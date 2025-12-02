import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  BusinessInformation,
  MemberStatus,
  Prisma,
  PrismaClient,
  Product,
  ProductType,
  SubscriptionPlan,
  SubscriptionPlanPrice,
  TicketTier,
  User,
} from '@prisma/client';
import { DEFAULT_CURRENCY, Role } from './generic.data';
import { DefaultArgs } from '@prisma/client/runtime/library';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { OtherCurrencyDto } from '@/product/course/crud/crud.dto';
import { feeAmount } from './generic.utils';

@Injectable()
export class GenericService {
  private salt;
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.salt = crypto.randomBytes(32).toString('hex');
  }

  /**
   * Check if user is linked to business and the assigned role
   * @param prisma
   * @param args
   * @returns
   */
  async isUserLinkedToBusiness(
    prisma: Omit<
      PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
    args: { user_id: string; business_id: string },
    verifyBusiness?: boolean,
  ): Promise<void> {
    const { user_id, business_id } = args;

    // Verify business
    if (verifyBusiness) {
      await this.verifyBusiness(prisma, { user_id, id: business_id });
    }

    const existing_user_in_business = await prisma.businessContact.findFirst({
      where: {
        AND: [
          { user: { id: user_id } },
          { business_id },
          { status: MemberStatus.active },
          {
            user: {
              role: {
                OR: [
                  { role_id: Role.BUSINESS_ADMIN },
                  { role_id: Role.BUSINESS_SUPER_ADMIN },
                ],
              },
            },
          },
        ],
      },
    });

    if (!existing_user_in_business) {
      throw new ForbiddenException(
        'Access Denied. You are not privileged to performed this action.',
      );
    }
  }

  /**
   * Verify business information
   * @param req
   * @returns
   */
  private async verifyBusiness(
    prisma: Omit<
      PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
    args: { user_id: string; id: string },
  ): Promise<BusinessInformation> {
    const { user_id, id } = args;

    const business = await prisma.businessInformation.findUnique({
      where: {
        id,
        business_contacts: {
          some: {
            role: Role.BUSINESS_ADMIN,
            user_id,
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found.');
    }

    return business;
  }

  /**
   * Find user
   * @param user_id
   * @returns
   */
  async findUser(user_id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: user_id },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException('Account not found');
    }

    return user;
  }

  /**
   * Encrypt sensitive text
   * @param text
   * @returns
   */
  encrypt(text: string): string {
    const key = crypto.scryptSync(
      this.configService.get<string>('ENCRYPT_DECRYPT_PASSPHRASE'),
      this.salt,
      32,
    );
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');

    encrypted += cipher.final('hex');

    const part1 = encrypted.slice(0, 17);
    const part2 = encrypted.slice(17);

    return `${part1}${iv.toString('hex')}${part2}`;
  }

  /**
   * Encrypt sensitive text
   * @param text
   * @returns
   */
  decrypt(text: string): string {
    const key = crypto.scryptSync(
      this.configService.get<string>('ENCRYPT_DECRYPT_PASSPHRASE'),
      this.salt,
      32,
    );
    const ivPosition = {
      start: 17,
      end: 17 + 32,
    };

    const iv = Buffer.from(text.slice(ivPosition.start, ivPosition.end), 'hex');
    const part1: string = text.slice(0, ivPosition.start);
    const part2: string = text.slice(ivPosition.end);

    const encryptedText = `${part1}${part2}`;

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * System business details
   * @param prisma
   * @returns
   */
  async systemBusinessDetails(
    prisma: Omit<
      PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
  ) {
    const system_business = await prisma.businessInformation.findFirst({
      where: { scope: Role.OWNER_ADMIN },
    });

    return system_business;
  }

  /**
   * Find product by slug
   * @param prisma
   * @param slug
   */
  async productBySlug(
    prisma: Omit<
      PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
    slug: string,
  ) {
    // Check if slug is available
    const product_by_slug = await prisma.product.findFirst({
      where: { slug },
    });
    if (product_by_slug) {
      throw new ConflictException('Slug is not available.');
    }
  }

  async validateOtherCurrencies(
    other_currencies: OtherCurrencyDto[],
    prisma: Omit<
      PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
  ): Promise<void> {
    if (!other_currencies || other_currencies.length === 0) return;

    // 🔹 Prevent NGN from being included
    const forbiddenBase = 'NGN';
    const hasBaseCurrency = other_currencies.some(
      (o) => o.currency.toUpperCase() === forbiddenBase,
    );

    if (hasBaseCurrency) {
      throw new BadRequestException(
        `${forbiddenBase} cannot be included in other_currencies. It is the base currency.`,
      );
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
      throw new BadRequestException(
        `Invalid currencies: ${invalid.join(
          ', ',
        )}. Only allowed currencies can be used.`,
      );
    }
  }

  /**
   * Convert prices from NGN base currency to target currency using CurrencyRate
   */
  async convertPricesFromNGN(
    price: number,
    originalPrice: number | undefined,
    targetCurrency: string,
  ): Promise<{ price: number; original_price?: number } | null> {
    try {
      const currencyRate = await this.prisma.currencyRate.findFirst({
        where: {
          base_currency: DEFAULT_CURRENCY,
          foreign_currency: targetCurrency,
          deleted_at: null,
        },
      });

      if (!currencyRate?.base_to_foreign_rate) {
        return null;
      }

      const convertedPrice =
        Number(price) * Number(currencyRate.base_to_foreign_rate);

      const result: { price: number; original_price?: number } = {
        price: Math.round(convertedPrice * 100) / 100, // Round to 2 decimal places
      };

      if (originalPrice !== undefined) {
        const convertedOriginalPrice =
          Number(originalPrice) * Number(currencyRate.base_to_foreign_rate);
        result.original_price = Math.round(convertedOriginalPrice * 100) / 100;
      }

      return result;
    } catch (_e) {
      return null;
    }
  }

  /**
   * Assign selected-currency sale and original prices to product based on type
   * - COURSE/DIGITAL_PRODUCT: set `price`, `original_price`, `currency` from `other_currencies`
   * - TICKET: for each tier, set `amount`, `original_amount`, `currency` from tier `other_currencies`
   * - SUBSCRIPTION: for each plan price, set `price`, `currency` from `other_currencies`
   * - If other_currencies is null, use CurrencyRate to convert from NGN base currency
   */
  async assignSelectedCurrencyPrices(product: any, selectedCurrency: string) {
    try {
      switch (product.type) {
        case ProductType.COURSE:
        case ProductType.DIGITAL_PRODUCT:
        case ProductType.PHYSICAL_PRODUCT: {
          return this.find_product(product, selectedCurrency);
        }
        case ProductType.TICKET: {
          if (product.ticket?.ticket_tiers?.length) {
            product.ticket.ticket_tiers = await Promise.all(
              product.ticket.ticket_tiers.map((ticket_tier) =>
                this.find_ticket_tier_price(ticket_tier, selectedCurrency),
              ),
            );
          }
          return product;
        }
        case ProductType.SUBSCRIPTION: {
          if (product.subscription_plan?.subscription_plan_prices?.length) {
            product.subscription_plan.subscription_plan_prices =
              await Promise.all(
                product.subscription_plan.subscription_plan_prices.map(
                  (plan_price) =>
                    this.find_subscription_plan_price(
                      plan_price,
                      selectedCurrency,
                    ),
                ),
              );
          }
          return product;
        }
        default:
          return product;
      }
    } catch (_e) {
      return product;
    }
  }

  async find_subscription_plan_price(
    priceRow: SubscriptionPlanPrice & {
      subscription_plan?: SubscriptionPlan;
      other_currencies: OtherCurrencyDto[];
    },
    selectedCurrency: string,
  ) {
    const match = Array.isArray(priceRow?.other_currencies)
      ? priceRow?.other_currencies.find(
          (c: any) => c?.currency === selectedCurrency,
        )
      : undefined;

    if (match) {
      priceRow.price = (match.price ?? priceRow.price) as Prisma.Decimal;
      priceRow.currency = selectedCurrency;
    } else if (
      !priceRow?.other_currencies ||
      priceRow?.other_currencies.length === 0 ||
      (Boolean(priceRow?.other_currencies.length) && !match)
    ) {
      // Use CurrencyRate to convert from NGN base currency
      const convertedPrices = await this.convertPricesFromNGN(
        +priceRow.price,
        undefined,
        selectedCurrency,
      );
      if (convertedPrices) {
        priceRow.price = convertedPrices.price as unknown as Prisma.Decimal;
        priceRow.currency = selectedCurrency;
      }
    }
    return priceRow;
  }

  async find_ticket_tier_price(
    tier: TicketTier & { other_currencies: OtherCurrencyDto[] },
    selectedCurrency: string,
  ) {
    const match = Array.isArray(tier?.other_currencies)
      ? tier?.other_currencies.find(
          (c: any) => c?.currency === selectedCurrency,
        )
      : undefined;

    if (match) {
      tier.amount = (match.price ?? tier.amount) as Prisma.Decimal;
      if (match.original_price !== undefined) {
        tier.original_amount =
          match.original_price as unknown as Prisma.Decimal;
      }
      tier.currency = selectedCurrency;
    } else if (
      !tier?.other_currencies ||
      tier?.other_currencies.length === 0 ||
      (Boolean(tier?.other_currencies.length) && !match)
    ) {
      // Use CurrencyRate to convert from NGN base currency
      const convertedPrices = await this.convertPricesFromNGN(
        +tier?.amount,
        +tier?.original_amount,
        selectedCurrency,
      );

      if (convertedPrices) {
        tier.amount = convertedPrices.price as unknown as Prisma.Decimal;
        if (convertedPrices.original_price !== undefined) {
          tier.original_amount =
            convertedPrices.original_price as unknown as Prisma.Decimal;
        }
        tier.currency = selectedCurrency;
      }
    }
    return tier;
  }

  async find_product(
    product: Product & {
      other_currencies: OtherCurrencyDto[];
    },
    selectedCurrency: string,
  ) {
    const match = Array.isArray(product?.other_currencies)
      ? product?.other_currencies.find(
          (c: any) => c?.currency === selectedCurrency,
        )
      : undefined;

    if (match) {
      product.price = (match.price ?? product.price) as Prisma.Decimal;
      if (match.original_price !== undefined) {
        product.original_price =
          match.original_price as unknown as Prisma.Decimal;
      }
      product.currency = selectedCurrency;
    } else if (
      !product?.other_currencies ||
      product?.other_currencies.length === 0 ||
      (Boolean(product?.other_currencies.length) && !match)
    ) {
      // Use CurrencyRate to convert from NGN base currency
      const convertedPrices = await this.convertPricesFromNGN(
        +product?.price,
        +product?.original_price,
        selectedCurrency,
      );
      if (convertedPrices) {
        product.price = convertedPrices?.price as unknown as Prisma.Decimal;
        if (convertedPrices?.original_price !== undefined) {
          product.original_price =
            convertedPrices?.original_price as unknown as Prisma.Decimal;
        }
        product.currency = selectedCurrency;
      }
    }

    return product;
  }

  finalAmountToBusinessWallet(
    amount: number,
    currency: string,
    discount_applied: number,
    enable_special_offer: boolean = false,
  ) {
    const fee_amount = feeAmount(
      +amount,
      this.configService.get(
        `DOEXCESS_${currency}${enable_special_offer && currency === DEFAULT_CURRENCY ? '_SPECIAL_' : '_'}CHARGE`,
      ),
    );

    const net_amount = +amount - +discount_applied;
    const final_amount = net_amount - fee_amount;

    return { final_amount, fee_amount, net_amount };
  }
}

/**
 * Compare password
 * @param password
 * @param password_hash
 */
export const comparePassword = async (
  password: string,
  password_hash: string,
) => {
  const isPasswordValid = await bcrypt.compare(password, password_hash);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid password.');
  }
};
