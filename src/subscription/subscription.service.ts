import {
  BadGatewayException,
  ConflictException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackService } from '../generic/providers/paystack/paystack.provider';
import {
  CreateSubscriptionDto,
  RenewSubscriptionDto,
  UpgradeSubscriptionDto,
  VerifySubscriptionDto,
} from './subscription.dto';
import { SubscriptionPlanPriceService } from '../subscription_plan/price/price.service';
import { AuthService } from '../account/auth/auth.service';
import {
  Action,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  PurchaseType,
  Subscription,
  SubscriptionPlan,
  SubscriptionPlanPrice,
} from '@prisma/client';
import { BillingService } from '../account/billing/billing.service';
import { LogService } from '../log/log.service';
import {
  addGracePeriod,
  calculateEndDate,
  formatMoney,
  getDaysUntilNextPayment,
  getEndDateFromDays,
  getIpAddress,
  getRemainingDays,
  getUserAgent,
  sleep,
  toTimezone,
  TransactionError,
  pageFilter,
} from '../generic/generic.utils';
import {
  GenericPayload,
  Timezone,
  PagePayload,
} from '../generic/generic.payload';
import { MailService } from '../notification/mail/mail.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { calculateProratedAmount } from './subscription.utils';
import { GenericService } from '../generic/generic.service';
import { OtherCurrencyDto } from '@/product/course/crud/crud.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SubscriptionService {
  private readonly model = 'Subscription';

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystackService: PaystackService,
    private readonly subscriptionPlanPriceService: SubscriptionPlanPriceService,
    private readonly authService: AuthService,
    private readonly billingService: BillingService,
    private readonly logService: LogService,
    private readonly mailService: MailService,
    private readonly logger: Logger, // Inject the Logger
    private readonly genericService: GenericService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create subscription
   * @param createSubscriptionDto
   * @returns
   */
  async createSubscription(
    request: Timezone & Request,
    createSubscriptionDto: CreateSubscriptionDto,
  ) {
    const {
      email,
      plan_price_id,
      payment_method,
      billing_id,
      auto_renew,
      currency,
    } = createSubscriptionDto;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Fetch the subscription plan by price (if it exists)
      const plan_price = await this.genericService.find_subscription_plan_price(
        (await this.subscriptionPlanPriceService.findOne(
          plan_price_id,
        )) as unknown as SubscriptionPlanPrice & {
          subscription_plan: SubscriptionPlan;
          other_currencies: OtherCurrencyDto[];
        },
        currency,
      );

      // 2. Get user details
      const user = await this.authService.getUserByEmail(prisma.user, email);

      // 3. Check if there is an already existing subscription
      if (user.subscriptions.length) {
        throw new ConflictException(
          'This account already has an active subscription.',
        );
      }

      // 3. Get billing details
      let billing_details = null;
      if (billing_id) {
        billing_details = await this.billingService.findOne(
          billing_id,
          user.id,
        );
      }

      // Initialize Paystack transaction
      const payment = await this.paystackService.initializeTransaction({
        email: user.email,
        amount: +plan_price.price,
        metadata: {
          user_id: user.id,
          plan_id: plan_price.subscription_plan.id,
          plan: plan_price.subscription_plan.name,
          interval: plan_price.period,
        },
      });

      // Doexcess transaction fee
      const final_amount_breakdown =
        this.genericService.finalAmountToBusinessWallet(
          +plan_price.price,
          currency,
          +0,
        );

      // Save the payment record
      const paymentRecord = await prisma.payment.create({
        data: {
          user_id: user.id,
          purchase_type: PurchaseType.SUBSCRIPTION,
          purchase_id: plan_price.subscription_plan.id,
          amount: final_amount_breakdown.net_amount,
          gross_amount: +plan_price.price,
          final_amount: final_amount_breakdown.fee_amount,
          fee_percent: this.configService.get(`DOEXCESS_${currency}_CHARGE`),
          currency: plan_price.currency,
          payment_status: PaymentStatus.PENDING,
          payment_method,
          transaction_id: payment.data.reference,
          ...(billing_details && { billing_id: billing_details.id }),
          ...(billing_details && { billing_at_payment: billing_details }),
          interval: plan_price.period,
          auto_renew,
        },
      });

      // 3. Create log
      await this.logService.createWithTrx(
        {
          user_id: user.id,
          action: Action.SUBSCRIPTION_INITIATION,
          entity: this.model,
          entity_id: paymentRecord.id,
          metadata: `User with ID ${user.id} just initated a subscription payment for subscription plan ID ${plan_price.subscription_plan.id} of business ID ${plan_price.subscription_plan.business_id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: 200,
        message: 'Payment initialized successfully.',
        data: {
          authorization_url: payment.data.authorization_url,
          payment_id: paymentRecord.id,
        },
      };
    });
  }

  /**
   * Verify subscription payment - For both new and renewed (Study carefully for proper understanding)
   * @param request
   * @param verifySubscriptionDto
   * @returns
   */
  async verifyPayment(
    request: Timezone & Request,
    verifySubscriptionDto: VerifySubscriptionDto,
  ): Promise<GenericPayload> {
    const { payment_id } = verifySubscriptionDto;

    try {
      const { payment, subscription } = await this.prisma.$transaction(
        async (prisma) => {
          // 1. Fetch an existing payment record
          const payment = await prisma.payment.findUnique({
            where: { id: payment_id },
            include: {
              user: true,
              subscription_plan: {
                select: {
                  name: true,
                  business_id: true,
                  business: {
                    include: {
                      business_contacts: {
                        where: { is_owner: true },
                        include: { user: true },
                      },
                      business_wallet: true,
                    },
                  },
                },
              },
            },
          });

          // 2. Check if the payment record exists
          if (!payment) {
            throw new NotFoundException('Payment record not found.');
          }

          const business_wallet = await prisma.businessWallet.findUnique({
            where: {
              business_id_currency: {
                business_id: payment.subscription_plan.business_id,
                currency: payment.currency,
              },
            },
          });

          if (!business_wallet) return;

          // Check if payment has already been verified
          if (payment.payment_status === PaymentStatus.SUCCESS) {
            throw new ConflictException(
              'Subscription payment has already been verified.',
            );
          }

          // I think this is not needed.
          // if (!payment.subscription_plan.business.business_contacts.length) {
          //   throw new NotFoundException('Business owner contact not found.');
          // }

          // 3. Verify the transaction with Paystack
          const verification = await this.paystackService.verifyTransaction(
            payment.id,
          );

          // 4. Check if verification was successful
          if (verification.data.status === 'success') {
            // 4a. Update payment status
            await prisma.payment.update({
              where: { id: payment_id },
              data: { payment_status: 'SUCCESS' },
            });

            // Field to get the next_payment days from now
            let next_payment_days_from_now = null;

            // Check if subscription already exist and is active
            const existing_active_subscription =
              await prisma.subscription.findFirst({
                where: {
                  user_id: payment.user_id,
                  plan_id: payment.purchase_id,
                  billing_interval: payment.interval,
                  is_active: true,
                  next_payment_date: { gt: new Date() }, // next_payment_date > now
                },
              });

            if (existing_active_subscription) {
              // Deactivate the previous subscription
              await prisma.subscription.update({
                where: { id: existing_active_subscription.id },
                data: { is_active: false, charge_auth_code: null },
              });

              // Assign next_payment_date of the previous active subscription
              const next_payment_date =
                existing_active_subscription.next_payment_date;

              // Determine the days to the previous active subscription's next payment date
              next_payment_days_from_now =
                getDaysUntilNextPayment(next_payment_date);
            }

            // end date variable (default)
            let end_date = calculateEndDate(payment.interval);

            // Check if next_payment_days_from_now is not null
            if (next_payment_days_from_now) {
              // Add the next_payment_days gotten from the previous to the the new end date
              end_date = getEndDateFromDays(
                end_date,
                next_payment_days_from_now,
              );
            }

            // 4b. Create the subscription
            const subscription = await prisma.subscription.create({
              data: {
                user: { connect: { id: payment.user_id } },
                subscription_plan: { connect: { id: payment.purchase_id } },
                plan_name_at_subscription: payment.subscription_plan.name,
                plan_price_at_subscription: payment.amount,
                next_payment_amount: payment.amount,
                start_date: new Date(),
                end_date: end_date, // Adjust based on billing interval
                grace_end_date: addGracePeriod(end_date),
                is_active: true,
                payment_method: PaymentMethod.PAYSTACK,
                billing_interval: payment.interval,
                next_payment_date: end_date,
                auto_renew: payment.auto_renew,
                charge_auth_code: this.genericService.encrypt(
                  verification.data.authorization.authorization_code,
                ),
                business_info: {
                  connect: { id: payment.subscription_plan.business_id },
                },
              },
            });

            // 4c. Create subscription payment
            await prisma.subscriptionPayment.create({
              data: {
                subscription_id: subscription.id,
                amount: payment.amount,
                currency: payment.currency,
                payment_id: payment.id,
              },
            });

            // 4c. Update business wallet balance
            await prisma.businessWallet.update({
              where: {
                business_id_currency: {
                  business_id: payment.subscription_plan.business_id,
                  currency: business_wallet.currency,
                },
              },
              data: {
                balance: {
                  increment: payment.final_amount,
                },
                previous_balance: business_wallet.balance,
              },
            });

            // Compose the metadata message - default
            let metadata = `User with ID ${payment.user_id} just made a subscription payment for subscription plan ID ${payment.purchase_id} of business ID ${payment.subscription_plan.business_id}.`;

            // Update the metadata message for subscription renewal
            if (payment.is_renewal) {
              metadata = `Subscription ID ${subscription.id} renewed successfully for user ${payment.user_id}.`;
            } else if (payment.is_upgrade) {
              metadata = `User with ID ${payment.user_id} upgraded their subscription from plan ID ${payment.metadata['old_subscription']['plan_id']} to plan ID ${subscription.id}.`;
            }

            // 4d. Create log
            await this.logService.createWithTrx(
              {
                user_id: payment.user_id,
                action: Action.SUBSCRIPTION_PAYMENT,
                entity: this.model,
                entity_id: payment.id,
                metadata: metadata,
                ip_address: getIpAddress(request),
                user_agent: getUserAgent(request),
              },
              prisma.log,
            );

            return { payment, subscription };
          } else {
            // Update payment status to failed
            await prisma.payment.update({
              where: { id: payment_id },
              data: { payment_status: PaymentStatus.FAILED },
            });

            throw new BadGatewayException('Payment verification failed.');
          }
        },
      );

      // For new subscription to a plan
      if (payment.is_renewal) {
        // 4d. Notify the subscriber about the renewal
        await this.mailService.subscriptionRenewalEmail(payment.user, {
          business_name: payment.subscription_plan.business.business_name,
          subscription: {
            id: subscription.id,
            created_at: toTimezone(subscription.created_at, '', 'MMM Do, YYYY'),
            plan_name: subscription.plan_name_at_subscription,
            amount: formatMoney(+payment.amount, payment.currency),
            interval: payment.interval,
            next_renewal_date: toTimezone(
              subscription.next_payment_date,
              '',
              'MMM Do, YYYY',
            ),
            payment_method: payment.payment_method,
            auto_renew: payment.auto_renew ? 'Enabled' : 'Disabled',
          },
        });

        // 8. Notify the business owner
        await this.mailService.subscriptionRenewalNotificationEmail(
          payment.subscription_plan.business.business_contacts[0].user,
          {
            subscriber_name: payment.user.name,
            subscription: {
              id: subscription.id,
              created_at: toTimezone(
                subscription.created_at,
                '',
                'MMM Do, YYYY',
              ),
              plan_name: subscription.plan_name_at_subscription,
              amount: formatMoney(+payment.amount, payment.currency),
              interval: payment.interval,
              end_date: toTimezone(
                subscription.next_payment_date,
                '',
                'MMM Do, YYYY',
              ),
              payment_method: payment.payment_method,
              auto_renew: payment.auto_renew ? 'Enabled' : 'Disabled',
              payment_status: payment.payment_status,
            },
          },
        );
      } else if (payment.is_upgrade) {
        // 4d. Notify the subscriber about the upgrade
        await this.mailService.subscriptionUpgradeEmail(payment.user, {
          business_name: payment.subscription_plan.business.business_name,
          subscription: {
            id: subscription.id,
            created_at: toTimezone(subscription.created_at, '', 'MMM Do, YYYY'),
            old_plan_name:
              payment.metadata['old_subscription']['plan_name_at_subscription'],
            old_plan_period:
              payment.metadata['old_subscription']['billing_interval'],
            new_plan_name: subscription.plan_name_at_subscription,
            amount: formatMoney(+payment.amount, payment.currency),
            interval: payment.interval,
            next_renewal_date: toTimezone(
              subscription.next_payment_date,
              '',
              'MMM Do, YYYY',
            ),
            payment_method: payment.payment_method,
            auto_renew: payment.auto_renew ? 'Enabled' : 'Disabled',
          },
        });

        // 8. Notify the business owner
        await this.mailService.subscriptionUpgradeNotificationEmail(
          payment.subscription_plan.business.business_contacts[0].user,
          {
            subscriber_name: payment.user.name,
            subscription: {
              id: subscription.id,
              created_at: toTimezone(
                subscription.created_at,
                '',
                'MMM Do, YYYY',
              ),
              old_plan_name:
                payment.metadata['old_subscription'][
                  'plan_name_at_subscription'
                ],
              old_plan_period:
                payment.metadata['old_subscription']['billing_interval'],
              new_plan_name: subscription.plan_name_at_subscription,
              amount: formatMoney(+payment.amount, payment.currency),
              interval: payment.interval,
              end_date: toTimezone(
                subscription.next_payment_date,
                '',
                'MMM Do, YYYY',
              ),
              payment_method: payment.payment_method,
              auto_renew: payment.auto_renew ? 'Enabled' : 'Disabled',
              payment_status: payment.payment_status,
            },
          },
        );
      } else {
        // 4d. Send subscription email
        await this.mailService.subscriptionEmail(payment.user, {
          business_name: payment.subscription_plan.business.business_name,
          subscription: {
            id: subscription.id,
            created_at: toTimezone(
              subscription.created_at,
              request?.timezone,
              'MMM Do, YYYY',
            ),
            plan_name: subscription.plan_name_at_subscription,
            amount: formatMoney(
              +subscription.plan_price_at_subscription,
              subscription.currency,
            ),
            interval: subscription.billing_interval,
            renewal_date: toTimezone(
              subscription.next_payment_date,
              request?.timezone,
              'MMM Do, YYYY',
            ),
            payment_method: subscription.payment_method,
            auto_renew: subscription.auto_renew ? 'Enabled' : 'Disabled',
          },
        });

        // 4e. Send subscription notification email to business super admin
        await this.mailService.subscriptionNotificationEmail(
          payment.subscription_plan.business.business_contacts[0].user,
          {
            subscriber_name: payment.user.name,
            subscription: {
              id: subscription.id,
              created_at: toTimezone(
                subscription.created_at,
                request?.timezone,
                'MMM Do, YYYY',
              ),
              plan_name: subscription.plan_name_at_subscription,
              amount: formatMoney(
                +subscription.plan_price_at_subscription,
                subscription.currency,
              ),
              interval: subscription.billing_interval,
              end_date: toTimezone(
                subscription.next_payment_date,
                request?.timezone,
                'MMM Do, YYYY',
              ),
              payment_method: subscription.payment_method,
              auto_renew: subscription.auto_renew ? 'Enabled' : 'Disabled',
              payment_status: PaymentStatus.SUCCESS,
            },
          },
        );
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Payment verified and subscription created successfully.',
      };
    } catch (error) {
      TransactionError(error, this.logger);
    }
  }

  /**
   * Process auto renewals
   */
  @Cron(CronExpression.EVERY_12_HOURS)
  async processAutoRenewals() {
    this.logger.log('[AUTO_RENEWAL]: Processing auto-renewals...');

    const batchSize = 10; // Define batch size
    const waitTime = 5000; // 5 seconds wait time between batches
    let offset = 0;
    let hasMoreSubscriptions = true;

    try {
      while (hasMoreSubscriptions) {
        const now = new Date();

        const subscriptions = await this.prisma.subscription.findMany({
          where: {
            is_active: true,
            auto_renew: true,
            AND: [
              { next_payment_date: { lte: now } }, // next_payment_date <= now
              { grace_end_date: { gte: now } }, // grace_end_date >= now
            ],
          },
          include: {
            user: true,
            subscription_plan: {
              include: {
                business: { include: { user: true, business_wallet: true } },
              },
            },
          },
          take: batchSize,
          skip: offset, // Offset ensures different records are fetched in each batch
        });

        if (subscriptions.length === 0) {
          this.logger.log('[AUTO_RENEWAL]: No subscriptions due for renewal.');
          hasMoreSubscriptions = false;
        }

        for (const subscription of subscriptions) {
          try {
            const subscription_plan_price =
              await this.genericService.find_subscription_plan_price(
                (await this.prisma.subscriptionPlanPrice.findFirst({
                  where: {
                    subscription_plan_id: subscription.plan_id,
                    period: subscription.billing_interval,
                  },
                })) as SubscriptionPlanPrice & {
                  other_currencies: OtherCurrencyDto[];
                },
                subscription.currency,
              );

            const previous_payment_record = await this.prisma.payment.findFirst(
              {
                where: {
                  user_id: subscription.user_id,
                  purchase_id: subscription.plan_id,
                  purchase_type: PurchaseType.SUBSCRIPTION,
                },
              },
            );

            if (!subscription_plan_price || !previous_payment_record) {
              this.logger.warn(
                `[AUTO_RENEWAL]: Skipping subscription ${subscription.id}: Missing plan price or payment record.`,
              );
              continue;
            }

            // Charge the customer
            const payment = await this.paystackService.chargeAuthorization(
              subscription.user.email,
              +subscription_plan_price.price,
              this.genericService.decrypt(subscription?.charge_auth_code),
            );

            if (payment.status !== true) {
              this.logger.error(
                `[AUTO_RENEWAL]: Failed to charge user ${subscription.user_id} for subscription ${subscription.id}.`,
              );
              continue;
            }

            const new_end_date = calculateEndDate(
              subscription.billing_interval,
            );

            // Transactional update
            await this.prisma.$transaction(async (prisma) => {
              await prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                  end_date: new_end_date,
                  next_payment_date: new_end_date,
                  next_payment_amount: subscription_plan_price.price,
                },
              });

              // Create Subscription Payment
              await prisma.subscriptionPayment.create({
                data: {
                  subscription_id: subscription.id,
                  amount: subscription.next_payment_amount,
                  currency: subscription.currency,
                },
              });

              // Business wallet
              const business_wallet = await prisma.businessWallet.findUnique({
                where: {
                  business_id_currency: {
                    business_id: subscription.subscription_plan.business_id,
                    currency: subscription.currency,
                  },
                },
              });

              const saved_payment = await prisma.payment.create({
                data: {
                  user_id: subscription.user_id,
                  purchase_type: PurchaseType.SUBSCRIPTION,
                  purchase_id: subscription.plan_id,
                  amount: subscription.next_payment_amount,
                  payment_status: PaymentStatus.SUCCESS,
                  payment_method: PaymentMethod.PAYSTACK,
                  currency: payment.data.currency,
                  transaction_id: payment.data.reference,
                  billing_id: previous_payment_record.billing_id,
                  billing_at_payment:
                    previous_payment_record.billing_at_payment,
                  auto_renew: subscription.auto_renew,
                  interval: subscription.billing_interval,
                },
              });

              await prisma.businessWallet.update({
                where: {
                  business_id_currency: {
                    business_id: subscription.subscription_plan.business_id,
                    currency: subscription.currency,
                  },
                },
                data: {
                  balance: {
                    increment: subscription_plan_price.price,
                  },
                  previous_balance: business_wallet.balance,
                },
              });

              await this.logService.createWithTrx(
                {
                  user_id: subscription.user_id,
                  action: Action.SUBSCRIPTION_PAYMENT,
                  entity: this.model,
                  entity_id: subscription.id,
                  metadata: `Automation: Subscription ${subscription.id} of business ID ${subscription.subscription_plan.business_id} renewed for user ${subscription.user_id}.`,
                },
                prisma.log,
              );

              // Send email to notify user of auto renewal
              await this.mailService.subscriptionRenewalEmail(
                subscription.user,
                {
                  business_name:
                    subscription.subscription_plan.business.business_name,
                  subscription: {
                    id: subscription.id,
                    created_at: toTimezone(
                      subscription.created_at,
                      '',
                      'MMM Do, YYYY',
                    ),
                    plan_name: subscription.plan_name_at_subscription,
                    amount: formatMoney(
                      +subscription_plan_price.price,
                      subscription.currency,
                    ),
                    interval: subscription.billing_interval,
                    next_renewal_date: toTimezone(
                      new_end_date,
                      '',
                      'MMM Do, YYYY',
                    ),
                    payment_method: saved_payment.payment_method,
                    auto_renew: saved_payment.auto_renew
                      ? 'Enabled'
                      : 'Disabled',
                  },
                },
              );

              // Send email to notify business owner of auto renewal
              await this.mailService.subscriptionRenewalNotificationEmail(
                subscription.subscription_plan.business.user,
                {
                  subscriber_name: subscription.user.name,
                  subscription: {
                    id: subscription.id,
                    created_at: toTimezone(
                      subscription.created_at,
                      '',
                      'MMM Do, YYYY',
                    ),
                    plan_name: subscription.plan_name_at_subscription,
                    amount: formatMoney(
                      +subscription_plan_price.price,
                      subscription.currency,
                    ),
                    interval: subscription.billing_interval,
                    end_date: toTimezone(new_end_date, '', 'MMM Do, YYYY'),
                    payment_method: saved_payment.payment_method,
                    auto_renew: saved_payment.auto_renew
                      ? 'Enabled'
                      : 'Disabled',
                    payment_status: saved_payment.payment_status,
                  },
                },
              );
            });

            this.logger.log(
              `[AUTO_RENEWAL]: Subscription ${subscription.id} renewed successfully for user ${subscription.user_id}.`,
            );
          } catch (error) {
            // Send email to payment failure
            await this.mailService.paymentFailure(subscription.user, {
              subscription: {
                id: subscription.id,
                grace_period_days: getRemainingDays(
                  new Date(toTimezone(subscription.grace_end_date)),
                ),
                plan_name: subscription.plan_name_at_subscription,
              },
            });

            this.logger.error(
              `[AUTO_RENEWAL]: Error processing subscription ${subscription.id}: ${error.message}`,
            );
          }
        }

        // Increase the offset for the next batch
        offset += batchSize;

        // **Wait before processing the next batch**
        this.logger.log(
          `[AUTO_RENEWAL]: Waiting ${waitTime / 1000} seconds before fetching the next batch...`,
        );
        await sleep(waitTime);
      }
    } catch (error) {
      this.logger.error(
        `[AUTO_RENEWAL]: Critical error in processAutoRenewals: ${error.message}`,
      );
    }
  }

  /**
   * Process elapsed grace period subscriptions
   * @returns
   */
  @Cron(CronExpression.EVERY_12_HOURS)
  async processElapsedGracePeriodSubscriptions() {
    this.logger.log(
      '[ELAPSED_GRACE_PERIOD_SUBSCRIPTIONS]: Processing elapsed grace period subscriptions...',
    );

    const batchSize = 10; // Define batch size
    const waitTime = 5000; // 5 seconds wait time between batches
    let offset = 0;
    let hasMoreSubscriptions = true;

    try {
      while (hasMoreSubscriptions) {
        const now = new Date();

        // Handle subscriptions where the grace period has ended
        const expired_subscriptions = await this.prisma.subscription.findMany({
          where: {
            is_active: true,
            grace_end_date: { lt: now }, // grace_end_date < now
          },
          include: {
            user: true,
          },
          take: batchSize,
          skip: offset, // Offset ensures different records are fetched in each batch
        });

        if (expired_subscriptions.length === 0) {
          this.logger.log(
            '[ELAPSED_GRACE_PERIOD_SUBSCRIPTIONS]: No subscriptions has elapsed the grace period yet.',
          );
          hasMoreSubscriptions = false;
        }

        for (const subscription of expired_subscriptions) {
          return this.prisma.$transaction(async (prisma) => {
            // 1. Update subscription plan
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: { is_active: false },
            });

            // 2. Deactivate subscription plan.
            await this.mailService.subscriptionDeactivated(subscription.user, {
              subscription: {
                id: subscription.id,
                plan_name: subscription.plan_name_at_subscription,
              },
            });

            this.logger.log(
              `[ELAPSED_GRACE_PERIOD_SUBSCRIPTIONS]: Subscription ${subscription.id} deactivated for user ${subscription.user_id}.`,
            );
          });
        }

        // Increase the offset for the next batch
        offset += batchSize;

        // **Wait before processing the next batch**
        this.logger.log(
          `[ELAPSED_GRACE_PERIOD_SUBSCRIPTIONS]: Waiting ${waitTime / 1000} seconds before fetching the next batch...`,
        );

        await sleep(waitTime);
      }
    } catch (error) {
      this.logger.error(
        `[ELAPSED_GRACE_PERIOD_SUBSCRIPTIONS]: Critical error in processElapsedGracePeriodSubscriptions: ${error.message}`,
      );
    }
  }

  /**
   * Initiate subscription renewal
   * @param request
   * @param subscriptionId
   * @returns
   */
  async initiateSubscriptionRenewal(
    request: Timezone & Request,
    renewSubscriptionDto: RenewSubscriptionDto,
  ) {
    const { subscription_id } = renewSubscriptionDto;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Fetch the subscription
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscription_id },
        include: {
          user: true,
          subscription_plan: {
            include: {
              subscription_plan_prices: true,
            },
          },
        },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found.');
      }

      // 3. Fetch the subscription plan price
      const plan_price =
        subscription.subscription_plan.subscription_plan_prices.find(
          (price) => price.period === subscription.billing_interval,
        );

      if (!plan_price) {
        throw new NotFoundException('Subscription plan price not found.');
      }

      // 4. Initialize Paystack transaction
      const payment = await this.paystackService.initializeTransaction({
        email: subscription.user.email,
        amount: +plan_price.price,
        metadata: {
          user_id: subscription.user_id,
          plan_id: subscription.plan_id,
          plan: subscription.subscription_plan.name,
          interval: subscription.billing_interval,
        },
      });

      // 5. Save the payment record
      const paymentRecord = await prisma.payment.create({
        data: {
          user_id: subscription.user_id,
          purchase_type: PurchaseType.SUBSCRIPTION,
          purchase_id: subscription.plan_id,
          amount: +plan_price.price,
          payment_status: PaymentStatus.PENDING,
          payment_method: PaymentMethod.PAYSTACK,
          transaction_id: payment.data.reference,
          interval: subscription.billing_interval,
          auto_renew: subscription.auto_renew,
          is_renewal: true,
        },
      });

      // 6. Log the renewal initiation
      await this.logService.createWithTrx(
        {
          user_id: subscription.user_id,
          action: Action.SUBSCRIPTION_RENEWAL_INITIATION,
          entity: this.model,
          entity_id: paymentRecord.id,
          metadata: `User with ID ${subscription.user_id} initiated a subscription renewal for subscription ID ${subscription.id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: 200,
        message: 'Subscription renewal initiated successfully.',
        data: {
          authorization_url: payment.data.authorization_url,
          payment_id: paymentRecord.id,
        },
      };
    });
  }

  /**
   * Upgrade subscription
   * @param request
   * @param subscriptionId
   * @param upgradeSubscriptionDto
   * @returns
   */
  async initiateSubscriptionUpgrade(
    request: Timezone & Request,
    subscriptionId: string,
    upgradeSubscriptionDto: UpgradeSubscriptionDto,
  ) {
    const { new_plan_price_id, payment_method } = upgradeSubscriptionDto;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Fetch the current subscription
      const current_subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId, is_active: true },
        include: {
          user: true,
          subscription_plan: {
            include: {
              subscription_plan_prices: true,
              business: { include: { user: true } },
            },
          },
        },
      });

      if (!current_subscription) {
        throw new NotFoundException('Subscription not found.');
      }

      // 2. Fetch the new subscription plan price
      const new_plan_price =
        await this.subscriptionPlanPriceService.findOne(new_plan_price_id);

      if (!new_plan_price) {
        throw new NotFoundException('New subscription plan price not found.');
      }

      // 3. Calculate prorated amount (if applicable)
      const prorated_amount = calculateProratedAmount(
        current_subscription,
        new_plan_price,
      );

      // 4. Initialize Paystack transaction for the upgrade
      const payment = await this.paystackService.initializeTransaction({
        email: current_subscription.user.email,
        amount: +prorated_amount,
        metadata: {
          user_id: current_subscription.user_id,
          plan_id: new_plan_price.subscription_plan.id,
          plan: new_plan_price.subscription_plan.name,
          interval: new_plan_price.period,
        },
      });

      // 5. Create a new payment record for the upgrade
      const payment_record = await prisma.payment.create({
        data: {
          user_id: current_subscription.user_id,
          purchase_type: PurchaseType.SUBSCRIPTION,
          purchase_id: new_plan_price.subscription_plan.id,
          amount: +prorated_amount,
          payment_status: PaymentStatus.PENDING,
          payment_method: payment_method || PaymentMethod.PAYSTACK,
          transaction_id: payment.data.reference,
          interval: new_plan_price.period,
          auto_renew: current_subscription.auto_renew,
          metadata: {
            old_subscription: {
              id: current_subscription.id,
              plan_name_at_subscription:
                current_subscription.plan_name_at_subscription,
              billing_interval: current_subscription.billing_interval,
              plan_price_at_subscription:
                current_subscription.plan_price_at_subscription,
            },
          },
          is_upgrade: true,
        },
      });

      // 6. Log the upgrade
      await this.logService.createWithTrx(
        {
          user_id: current_subscription.user_id,
          action: Action.SUBSCRIPTION_UPGRADE_INITIATION,
          entity: this.model,
          entity_id: payment_record.id,
          metadata: `User with ID ${current_subscription.user_id} upgraded their subscription from plan ID ${current_subscription.plan_id} to plan ID ${new_plan_price.subscription_plan.id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: 200,
        message: 'Subscription upgrade initiated successfully.',
        data: {
          authorization_url: payment.data.authorization_url,
          payment_id: payment_record.id,
        },
      };
    });
  }
}
