import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrencyPayload } from './currency.payload';
import { AuthPayload } from '@/generic/generic.payload';
import { ToggleCurrencyDto } from './currency.dto';
import { BusinessDto } from '@/generic/generic.dto';
import { prioritizeNGN, prioritizeShorthandNGN } from '@/generic/generic.utils';

@Injectable()
export class CurrencyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get available currencies
   * @param req
   * @returns
   */
  async getAvailableCurrencies(req: AuthPayload): Promise<CurrencyPayload> {
    const [system, account, product] = await Promise.all([
      this.prisma.allowedCurrency.findMany({
        where: { enabled: true, deleted_at: null },
        orderBy: { currency: 'asc' },
      }),
      this.prisma.businessAccountCurrency.findMany({
        where: { business_id: req['Business-Id'], deleted_at: null },
        orderBy: { currency: 'asc' },
      }),
      this.prisma.businessProductEnabledCurrency.findMany({
        where: { business_id: req['Business-Id'], deleted_at: null },
        orderBy: { currency: 'asc' },
      }),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: {
        system: prioritizeNGN(system),
        account: prioritizeNGN(account),
        product: prioritizeNGN(product),
      },
    };
  }

  /**
   * Toggle business account currencies
   * @param req
   * @param toggleCurrencyDto
   * @returns
   */
  async toggleBusinessAccountCurrency(
    req: AuthPayload,
    toggleCurrencyDto: ToggleCurrencyDto,
  ) {
    const businessId = req['Business-Id'];
    const { currency } = toggleCurrencyDto;

    // ✅ Ensure currency is allowed
    const allowed = await this.prisma.allowedCurrency.findFirst({
      where: { currency, enabled: true, deleted_at: null },
    });

    if (!allowed) {
      throw new BadRequestException(`Currency ${currency} is not allowed.`);
    }

    // ✅ Check if currency already exists for this business
    const existing = await this.prisma.businessAccountCurrency.findFirst({
      where: { business_id: businessId, currency, deleted_at: null },
    });

    if (existing) {
      // ❌ Remove it
      await this.prisma.businessAccountCurrency.delete({
        where: { id: existing.id },
      });

      return {
        statusCode: HttpStatus.OK,
        message: `Currency ${currency} removed successfully.`,
        data: { action: 'removed', currency, data: {} },
      };
    } else {
      // ✅ Add it
      const response = await this.prisma.businessAccountCurrency.create({
        data: { business_id: businessId, currency },
      });

      return {
        statusCode: HttpStatus.OK,
        message: `Currency ${currency} added successfully.`,
        data: {
          action: 'added',
          currency,
          data: response,
        },
      };
    }
  }

  /**
   * Toggle business product enabled currency
   * @param businessId
   * @param toggleCurrencyDto
   * @returns
   */
  async toggleBusinessProductEnabledCurrency(
    req: AuthPayload,
    toggleCurrencyDto: ToggleCurrencyDto,
  ) {
    const businessId = req['Business-Id'];
    const { currency } = toggleCurrencyDto;

    // ✅ Check if currency already exists for this business
    const existing = await this.prisma.businessProductEnabledCurrency.findFirst(
      {
        where: { business_id: businessId, currency, deleted_at: null },
      },
    );

    if (existing) {
      // ❌ Remove it
      await this.prisma.businessProductEnabledCurrency.delete({
        where: { id: existing.id },
      });

      return {
        statusCode: HttpStatus.OK,
        message: `Currency ${currency} removed from product-enabled currencies.`,
        data: { action: 'removed', currency, data: {} },
      };
    } else {
      // ✅ Add it
      const response = await this.prisma.businessProductEnabledCurrency.create({
        data: { business_id: businessId, currency },
      });

      return {
        statusCode: HttpStatus.OK,
        message: `Currency ${currency} added to product-enabled currencies.`,
        data: { action: 'added', currency, data: response },
      };
    }
  }

  /**
   * Fetch all currencies enabled to the public
   */
  async getBusinessAccountCurrencies(businessDto: BusinessDto) {
    const { business_id } = businessDto;

    const currencies = await this.prisma.businessAccountCurrency.findMany({
      where: {
        OR: [
          { business: { id: business_id } },
          { business: { business_slug: business_id } },
        ],
        deleted_at: null,
      },
      select: {
        id: true,
        currency: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: 'asc' },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Business account currencies fetched successfully',
      data: {
        details: prioritizeNGN(currencies),
        currencies: prioritizeShorthandNGN(currencies.map((c) => c.currency)), // ✅ shorthand list
      },
    };
  }

  /**
   * Fetch currency rates and allowed currencies
   * @returns
   */
  async fetchCurrencyRatesAndAllowedCurrencies() {
    const [rates, allowed] = await Promise.all([
      this.prisma.currencyRate.findMany({
        where: { deleted_at: null },
        include: { creator: true },
        orderBy: { created_at: 'asc' },
      }),
      this.prisma.allowedCurrency.findMany({
        where: { enabled: true, deleted_at: null },
        include: { creator: true },
        orderBy: { created_at: 'asc' },
      }),
    ]);

    return {
      statusCode: HttpStatus.OK,
      message: 'Currency rates and allowed currencies fetched successfully',
      data: {
        rates,
        allowed,
        allowed_currencies: allowed.map((c) => c.currency), // shortcut array of codes
      },
    };
  }
}
