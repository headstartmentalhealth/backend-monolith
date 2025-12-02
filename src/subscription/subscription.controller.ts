import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import {
  CreateSubscriptionDto,
  RenewSubscriptionDto,
  UpgradeSubscriptionDto,
  VerifySubscriptionDto,
} from './subscription.dto';
import { Public } from '@/account/auth/decorators/auth.decorator';
import {
  GenericPayload,
  Timezone,
  PagePayload,
} from '@/generic/generic.payload';
import { Subscription } from '@prisma/client';

@Controller('v1/subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  /**
   * Create subscription payment
   * @param request
   * @param createSubscriptionDto
   * @returns
   */
  @Post('create')
  @Public()
  async createSubscription(
    @Req() request: Timezone & Request,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.subscriptionService.createSubscription(
      request,
      createSubscriptionDto,
    );
  }

  /**
   * Verify subscription payment
   * @param request
   * @param verifySubscriptionDto
   * @returns
   */
  @Post('verify/:payment_id')
  @Public()
  async verifyPayment(
    @Req() request: Timezone & Request,
    @Param() verifySubscriptionDto: VerifySubscriptionDto,
  ): Promise<GenericPayload> {
    return this.subscriptionService.verifyPayment(
      request,
      verifySubscriptionDto,
    );
  }

  /**
   * Renew subscription initiation
   * @param request
   * @param renewSubscriptionDto
   * @returns
   */
  @Post('renew')
  @Public()
  async renewSubscription(
    @Req() request: Timezone & Request,
    @Body() renewSubscriptionDto: RenewSubscriptionDto,
  ) {
    return this.subscriptionService.initiateSubscriptionRenewal(
      request,
      renewSubscriptionDto,
    );
  }

  /**
   * Upgrade subscription initiation
   * @param request
   * @param param
   * @param upgradeSubscriptionDto
   * @returns
   */
  @Post('upgrade/:subscription_id')
  @Public()
  async upgradeSubscription(
    @Req() request: Timezone & Request,
    @Param() param: { subscription_id: string },
    @Body() upgradeSubscriptionDto: UpgradeSubscriptionDto,
  ) {
    return this.subscriptionService.initiateSubscriptionUpgrade(
      request,
      param.subscription_id,
      upgradeSubscriptionDto,
    );
  }
}
