import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { Public } from '@/account/auth/decorators/auth.decorator';
import { Roles } from '@/account/auth/decorators/role.decorator';
import { Role } from '@/generic/generic.data';
import { BusinessGuard } from '@/generic/guards/business.guard';
import { AuthPayload } from '@/generic/generic.payload';
import { ToggleCurrencyDto } from './currency.dto';
import { BusinessDto, IdDto } from '@/generic/generic.dto';

@Controller('v1/currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  /**
   * Fetch available currencies
   * @returns
   */
  @UseGuards(BusinessGuard)
  @Get('business-currencies')
  @Roles(Role.BUSINESS_SUPER_ADMIN)
  async getAvailableCurrencies(@Req() req: AuthPayload) {
    return this.currencyService.getAvailableCurrencies(req);
  }

  /**
   * Toggle business currency
   * @returns
   */
  @UseGuards(BusinessGuard)
  @Patch('toggle-business-currency')
  @Roles(Role.BUSINESS_SUPER_ADMIN)
  async toggleBusinessAccountCurrency(
    @Req() req: AuthPayload,
    @Body() toggleCurrencyDto: ToggleCurrencyDto,
  ) {
    return this.currencyService.toggleBusinessAccountCurrency(
      req,
      toggleCurrencyDto,
    );
  }

  /**
   * Toggle product currency
   * @returns
   */
  @UseGuards(BusinessGuard)
  @Patch('toggle-product-currency')
  @Roles(Role.BUSINESS_SUPER_ADMIN)
  async toggleBusinessProductEnabledCurrency(
    @Req() req: AuthPayload,
    @Body() toggleCurrencyDto: ToggleCurrencyDto,
  ) {
    return this.currencyService.toggleBusinessProductEnabledCurrency(
      req,
      toggleCurrencyDto,
    );
  }

  /**
   * Fetch business currencies to the public (business_id could be business_id or slug)
   * @returns
   */
  @Get('fetch-business-currencies/:business_id')
  @Public()
  async getBusinessAccountCurrencies(@Param() businessDto: BusinessDto) {
    return this.currencyService.getBusinessAccountCurrencies(businessDto);
  }

  /**
   * Fetch system currencies
   * @returns
   */
  @Get('fetch-system-currencies')
  @Roles(Role.OWNER_SUPER_ADMIN, Role.OWNER_ADMIN)
  async fetchCurrencyRatesAndAllowedCurrencies() {
    return this.currencyService.fetchCurrencyRatesAndAllowedCurrencies();
  }
}
