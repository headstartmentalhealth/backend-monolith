import {
  AuthPayload,
  GenericPayload,
  PagePayload,
  Timezone,
} from '@/generic/generic.payload';
import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
  Logger,
  UnprocessableEntityException,
  ForbiddenException,
} from '@nestjs/common';
import {
  CreatePaymentDto,
  InitiateWithdrawalDto,
  QueryPaymentsDto,
  VerifyPaymentDto,
} from './payment.dto';
import { PrismaService } from '@/prisma/prisma.service';
import {
  IVerify,
  ITrx,
  PaystackService,
} from '@/generic/providers/paystack/paystack.provider';
import { AuthService } from '@/account/auth/auth.service';
import { LogService } from '@/log/log.service';
import { MailService } from '@/notification/mail/mail.service';
import { GenericService } from '@/generic/generic.service';
import { PaymentType } from '@paypal/checkout-server-sdk/lib/orders/lib';
import {
  Action,
  BusinessInformation,
  Coupon,
  Course,
  CourseStatus,
  EnrollmentStatus,
  NotificationType,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  PrismaClient,
  Product,
  ProductStatus,
  ProductType,
  PurchaseType,
  SubscriptionPlan,
  SubscriptionPlanPrice,
  Ticket,
  TicketTier,
  TicketTierStatus,
  TransactionType,
  User,
} from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { camelCase, capitalize } from 'lodash';
import { BillingService } from '@/account/billing/billing.service';
import { CouponUsageService } from '@/coupon/usage/usage.service';
import {
  addGracePeriod,
  businessIdFilter,
  calculateEndDate,
  doexcessCharge,
  feeAmount,
  formatMoney,
  getDaysUntilNextPayment,
  getEndDateFromDays,
  getIpAddress,
  getUserAgent,
  pageFilter,
  reformatText,
  toTimezone,
  TransactionError,
} from '@/generic/generic.utils';
import {
  CompletePurchaseDetailSchema,
  PurchaseSchema,
  TransactionSchema,
} from './payment.payload';
import { CartService } from '@/cart/cart.service';
import { IdDto, MeasurementMetadataDto, TZ } from '@/generic/generic.dto';
import { PrismaBaseRepository } from '@/prisma/prisma.base.repository';
import { GenericDataPayload } from '@/generic/generic.payload';
import { FlutterwaveService } from '@/generic/providers/flutterwave/flutterwave.provider';
import {
  FlutterwaveStatus,
  FlutterwaveTransactionResponse,
} from '@/generic/providers/flutterwave/flutterwave.utils';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { OtherCurrencyDto } from '@/product/course/crud/crud.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentService {
  private readonly model = 'Payment';
  private readonly paymentRepository: PrismaBaseRepository<
    Payment,
    Prisma.PaymentCreateInput,
    Prisma.PaymentUpdateInput,
    Prisma.PaymentWhereUniqueInput,
    Prisma.PaymentWhereInput | Prisma.PaymentFindFirstArgs,
    Prisma.PaymentUpsertArgs
  >;
  private readonly businessInformationRepository: PrismaBaseRepository<
    BusinessInformation,
    Prisma.BusinessInformationCreateInput,
    Prisma.BusinessInformationUpdateInput,
    Prisma.BusinessInformationWhereUniqueInput,
    | Prisma.BusinessInformationWhereInput
    | Prisma.BusinessInformationFindFirstArgs,
    Prisma.BusinessInformationUpsertArgs
  >;

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystackService: PaystackService,
    private readonly flutterwaveService: FlutterwaveService,
    private readonly authService: AuthService,
    private readonly logService: LogService,
    private readonly mailService: MailService,
    private readonly logger: Logger, // Inject the Logger
    private readonly billingService: BillingService,
    private readonly couponUsageService: CouponUsageService,
    private readonly cartService: CartService,
    private readonly genericService: GenericService,
    private readonly configService: ConfigService,
  ) {
    this.paymentRepository = new PrismaBaseRepository<
      Payment,
      Prisma.PaymentCreateInput,
      Prisma.PaymentUpdateInput,
      Prisma.PaymentWhereUniqueInput,
      Prisma.PaymentWhereInput | Prisma.PaymentFindFirstArgs,
      Prisma.PaymentUpsertArgs
    >('payment', prisma);
    this.businessInformationRepository = new PrismaBaseRepository<
      BusinessInformation,
      Prisma.BusinessInformationCreateInput,
      Prisma.BusinessInformationUpdateInput,
      Prisma.BusinessInformationWhereUniqueInput,
      | Prisma.BusinessInformationWhereInput
      | Prisma.BusinessInformationFindFirstArgs,
      Prisma.BusinessInformationUpsertArgs
    >('payment', prisma);
  }

  /**
   * Get purchase details by purchase type
   * @param purchase_id
   * @param purchase_type
   * @param prisma
   * @returns
   */
  private async purchaseByType(
    user_id: string,
    purchase_id: string,
    purchase_type: ProductType,
    quantity: number,
    business_id: string,
    currency: string,
    prisma: Omit<
      PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
    metadata?: MeasurementMetadataDto[],
  ): Promise<PurchaseSchema> {
    let details: any = {};
    if (
      purchase_type === ProductType.COURSE ||
      purchase_type === ProductType.DIGITAL_PRODUCT ||
      purchase_type === ProductType.PHYSICAL_PRODUCT
    ) {
      let purchase_details = (await prisma.product.findUnique({
        where: {
          id: purchase_id,
          type: purchase_type,
          status: ProductStatus.PUBLISHED,
          business_id,
        },
      })) as Product & { other_currencies: OtherCurrencyDto[] };

      if (!purchase_details) {
        throw new NotFoundException(
          `${capitalize(purchase_type)} with ID ${purchase_id} not found.`,
        );
      }

      purchase_details = await this.genericService.find_product(
        purchase_details,
        currency,
      );

      details = {
        name: purchase_details.title,
        price: purchase_details.price,
        quantity,
        id: purchase_details.id,
        product_id: purchase_details.id,
        created_at: purchase_details.created_at,
        ...(purchase_type === ProductType.PHYSICAL_PRODUCT && { metadata }),
      };
    } else if (purchase_type === ProductType.TICKET) {
      // The purchase id is for the TicketTier model
      let purchase_details = (await prisma.ticketTier.findUnique({
        where: {
          id: purchase_id,
          status: TicketTierStatus.OPEN,
          ticket: { product: { business_id } },
        },
        include: { ticket: { include: { product: true } } },
      })) as unknown as TicketTier & {
        ticket?: Ticket & { product?: Product };
        other_currencies: OtherCurrencyDto[];
      };

      // Check if ticket tier exists
      if (!purchase_details) {
        throw new NotFoundException(
          `${capitalize(purchase_type)} with ID ${purchase_id} not found.`,
        );
      }

      // Verify that quantity requested does not exceed the TicketTier's max_per_purchase
      if (
        purchase_details.max_per_purchase &&
        quantity > purchase_details.max_per_purchase
      ) {
        throw new UnprocessableEntityException(
          `Ticket tier quantity provided exceeds the maximum quantity per purchase of ${purchase_details.max_per_purchase}. Try to reduce a little.`,
        );
      }

      purchase_details = await this.genericService.find_ticket_tier_price(
        purchase_details,
        currency,
      );

      details = {
        name: purchase_details.ticket.product.title,
        tier_name: capitalize(reformatText(purchase_details.name, '_')),
        price: purchase_details.amount,
        quantity,
        id: purchase_details.id,
        product_id: purchase_details.ticket.product_id,
        created_at: purchase_details.created_at,
      };
    } else if (purchase_type === ProductType.SUBSCRIPTION) {
      // The purchase id is for the SubscriptionPlanPrice model
      let purchase_details = (await prisma.subscriptionPlanPrice.findUnique({
        where: {
          id: purchase_id,
          subscription_plan: { business: { id: business_id } },
        },
        include: { subscription_plan: true },
      })) as SubscriptionPlanPrice & {
        subscription_plan?: SubscriptionPlan;
        other_currencies: OtherCurrencyDto[];
      };

      // Check if subscription plan price exists
      if (!purchase_details) {
        throw new NotFoundException(
          `${capitalize(purchase_type)} with ID ${purchase_id} not found.`,
        );
      }

      purchase_details = await this.genericService.find_subscription_plan_price(
        purchase_details,
        currency,
      );

      // Check  if user has  subscribed  to this subscription plan
      const has_subscribed = await prisma.subscription.findFirst({
        where: {
          user_id,
          plan_id: purchase_details.id,
        },
      });

      if (has_subscribed) {
        throw new ConflictException(
          `This subscription plan ${purchase_details.subscription_plan.name} has already been subscribed to.`,
        );
      }

      details = {
        name: purchase_details.subscription_plan.name,
        tier_name: capitalize(reformatText(purchase_details.period, '_')),
        price: purchase_details.price,
        quantity,
        id: purchase_details.id,
        product_id: purchase_details.subscription_plan.id,
        created_at: purchase_details.created_at,
        interval: purchase_details.period,
      };
    } else {
      throw new UnprocessableEntityException(
        `Purchase type ${purchase_type} not recognized.`,
      );
    }

    return { ...details, purchase_type };
  }

  private async getTodayEarningsAndPayments(businessId: string) {
    const now = new Date();

    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const yesterdayStart = startOfDay(subDays(now, 1));
    const yesterdayEnd = endOfDay(subDays(now, 1));

    // ✅ Helper: Fetch grouped payment data for a date range
    const getGroupedPayments = async (start: Date, end: Date) => {
      return this.prisma.payment.groupBy({
        by: ['currency'],
        where: {
          created_at: { gte: start, lte: end },
          payment_status: PaymentStatus.SUCCESS,
          deleted_at: null,
          OR: [
            { purchase_type: PurchaseType.PRODUCT },
            { transaction_type: TransactionType.CREDIT },
          ],
          AND: [
            {
              OR: [
                { business_id: businessId },
                {
                  purchase: {
                    path: ['business_id'],
                    string_contains: businessId,
                  },
                },
                {
                  subscription_plan: {
                    business_id: { equals: businessId },
                  },
                },
              ],
            },
          ],
        },
        _sum: {
          final_amount: true,
          discount_applied: true,
        },
        _count: {
          id: true,
        },
      });
    };

    // 1️⃣ Fetch currencies and payment summaries
    const [currencies, todayGrouped, yesterdayGrouped] = await Promise.all([
      this.prisma.businessAccountCurrency.findMany({
        where: { business_id: businessId, deleted_at: null },
        select: { currency: true, currency_sign: true },
        distinct: ['currency'],
      }),
      getGroupedPayments(todayStart, todayEnd),
      getGroupedPayments(yesterdayStart, yesterdayEnd),
    ]);

    // 2️⃣ Helper: calculate percentage change safely
    const percentageChange = (today: number, yesterday: number) => {
      if (!yesterday || yesterday === 0) return today > 0 ? 100 : 0;
      return Math.round(((today - yesterday) / yesterday) * 100);
    };

    // 3️⃣ Map and format results by currency
    const byCurrency = currencies.map((c) => {
      const todayStats = todayGrouped.find((p) => p.currency === c.currency);
      const yesterdayStats = yesterdayGrouped.find(
        (p) => p.currency === c.currency,
      );

      const grossAmount = +todayStats?._sum.final_amount || 0;
      const totalDiscount = +todayStats?._sum.discount_applied || 0;
      const netEarnings = grossAmount - totalDiscount;

      const yesterdayGross = +yesterdayStats?._sum.final_amount || 0;
      const yesterdayDiscount = +yesterdayStats?._sum.discount_applied || 0;
      const yesterdayNet = yesterdayGross - yesterdayDiscount;

      return {
        currency: c.currency,
        currency_sign: c.currency_sign || '',
        total_payments: todayStats?._count.id ?? 0,
        gross_amount: formatMoney(grossAmount, c.currency),
        total_discount: formatMoney(totalDiscount, c.currency),
        net_earnings: formatMoney(netEarnings, c.currency),
        performance: {
          gross_change: percentageChange(grossAmount, yesterdayGross),
          net_change: percentageChange(netEarnings, yesterdayNet),
          payments_change: percentageChange(
            todayStats?._count.id ?? 0,
            yesterdayStats?._count.id ?? 0,
          ),
        },
      };
    });

    // 4️⃣ Aggregate overall totals (all currencies combined)
    const sumTotals = (payments: any[]) =>
      payments.reduce(
        (acc, curr) => {
          const gross = +curr._sum.amount || 0;
          const discount = +curr._sum.discount_applied || 0;
          const net = gross - discount;
          return {
            total_payments: acc.total_payments + curr._count.id,
            gross_amount: acc.gross_amount + gross,
            total_discount: acc.total_discount + discount,
            net_earnings: acc.net_earnings + net,
          };
        },
        {
          total_payments: 0,
          gross_amount: 0,
          total_discount: 0,
          net_earnings: 0,
        },
      );

    const todayTotals = sumTotals(todayGrouped);
    const yesterdayTotals = sumTotals(yesterdayGrouped);

    const overall = {
      total_payments: todayTotals.total_payments,
      gross_amount: formatMoney(todayTotals.gross_amount),
      total_discount: formatMoney(todayTotals.total_discount),
      net_earnings: formatMoney(todayTotals.net_earnings),
      performance: {
        gross_change: percentageChange(
          todayTotals.gross_amount,
          yesterdayTotals.gross_amount,
        ),
        net_change: percentageChange(
          todayTotals.net_earnings,
          yesterdayTotals.net_earnings,
        ),
        payments_change: percentageChange(
          todayTotals.total_payments,
          yesterdayTotals.total_payments,
        ),
      },
    };

    // 5️⃣ Final structured response
    return {
      date: todayStart.toISOString().split('T')[0],
      by_currency: byCurrency,
      overall,
    };
  }

  /**
   * Compute Total amount
   * @param purchase_details_list
   * @returns
   */
  private computeTotalAmount(purchase_details_list: PurchaseSchema[]): number {
    return purchase_details_list.reduce(
      (total, purchase) => total + purchase.price * purchase.quantity,
      0,
    );
  }

  /**
   * Compare passed amount with the computed amount
   * @param computed_amount
   * @param passed_amount
   */
  private compareAmounts(computed_amount: number, passed_amount: number): void {
    if (computed_amount !== passed_amount) {
      throw new UnprocessableEntityException(
        'Amount passed is not equal to the computed amount for the items about to be purchased.',
      );
    }
  }

  /**
   * Verify if each of the product has already been purchased
   * @param user_id
   * @param items
   * @param prisma
   */
  private async verifyProductAlreadyPurchased(
    user_id: string,
    items: PurchaseSchema[],
    prisma: Omit<
      PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
  ) {
    for (let index = 0; index < items.length; index++) {
      const item = items[index];

      // Check if item has been paid for
      if (item.purchase_type === ProductType.COURSE) {
        const found = await prisma.enrolledCourse.findUnique({
          where: { user_id_course_id: { user_id, course_id: item.id } },
        });

        if (found) {
          throw new ConflictException(
            `Product ID ${item.id} of type ${item.purchase_type} has been purchased.`,
          );
        }
      } else if (item.purchase_type === ProductType.TICKET) {
        // Factor the ticket check (TODO)
      }
    }
  }

  /**
   * Create paystack payment
   * @param request
   * @param createPaymentDto
   * @returns
   */
  async createPaystackPayment(
    request: Timezone & Request,
    createPaymentDto: CreatePaymentDto,
  ) {
    let {
      email,
      purchases,
      payment_method,
      coupon_code,
      amount,
      billing_id,
      metadata,
      business_id,
      currency,
    } = createPaymentDto;

    return this.prisma.$transaction(async (prisma) => {
      // 1. Get user details
      const user = await this.authService.getUserByEmail(prisma.user, email);

      // 2. Get billing details
      let billing_details = null;
      if (billing_id) {
        billing_details = await this.billingService.findOne(
          billing_id,
          user.id,
        );
      }

      // 3. Fetch the purchase details (if existent)
      const purchase_details_list: PurchaseSchema[] = await Promise.all(
        purchases.map(({ purchase_id, purchase_type, quantity, metadata }) =>
          this.purchaseByType(
            user.id,
            purchase_id,
            purchase_type,
            quantity,
            business_id,
            currency,
            prisma,
            metadata,
          ),
        ),
      );

      /**
       * 3b. Check if payment record exists based on cart
       * PURPOSE: To return an already existing payment record instead of creating another one again.
       */
      // await this.verifyProductAlreadyPurchased(
      //   user.id,
      //   purchase_details_list,
      //   prisma,
      // );

      // 3c. Compute purchase(s) total amount
      let computed_total_amount = this.computeTotalAmount(
        purchase_details_list,
      );

      // 4. Get coupon details based on amount
      let coupon_value = null;
      let coupon_type = null;
      let coupon_id = null;
      if (coupon_code) {
        const coupon_details =
          await this.couponUsageService.validateCouponUsage(
            { coupon_code, user_id: user.id },
            computed_total_amount,
          );

        // Apply coupon value and get discounted amount
        computed_total_amount = this.couponUsageService.getDiscountedAmount(
          computed_total_amount,
          coupon_details.value,
          coupon_details.type,
        );

        coupon_value = coupon_details.value;
        coupon_type = coupon_details.type;
        coupon_id = coupon_details.id;
      }

      // 4b. Compare computed amount with passed amount - Retun error if false
      this.compareAmounts(computed_total_amount, amount);

      // Save the payment record
      const paymentRecord = await prisma.payment.create({
        data: {
          user_id: user.id,
          business_id,
          purchase_type: PurchaseType.PRODUCT,
          purchase: {
            items: purchase_details_list, // Store all purchases inside metadata
            coupon_id,
            coupon_code,
            coupon_value,
            coupon_type,
            business_id,
          } as CompletePurchaseDetailSchema | any,
          amount: computed_total_amount,
          discount_applied: this.couponUsageService.getDiscountValue(
            computed_total_amount,
            coupon_value,
            coupon_type,
          ),
          payment_status: PaymentStatus.PENDING,
          ...(payment_method
            ? { payment_method }
            : { payment_method: PaymentMethod.PAYSTACK }),
          ...(billing_details && { billing_id: billing_details.id }),
          ...(billing_details && { billing_at_payment: billing_details }),
          metadata,
        },
      });

      // 5. Initialize Paystack transaction
      const payment = await this.paystackService.initializeTransaction({
        email: user.email,
        amount: computed_total_amount,
        metadata: {
          user_id: user.id,
          business_id,
          purchases,
          coupon_id,
          coupon_code,
          coupon_value,
          coupon_type,
        } as TransactionSchema,
      });

      // 3. Create log
      await this.logService.createWithTrx(
        {
          user_id: user.id,
          action: Action.PRODUCT_PAYMENT_INITIATION,
          entity: this.model,
          entity_id: paymentRecord.id,
          metadata: `User with ID ${user.id} just initated a product payment.`,
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
          payment_id: payment.data.reference,
          access: payment.data.access_code,
        },
      };
    });
  }

  /**
   * Create payment
   * @param request
   * @param createPaymentDto
   * @returns
   */
  async createPayment(
    request: Timezone & Request,
    createPaymentDto: CreatePaymentDto,
  ) {
    const {
      email,
      purchases,
      payment_method,
      coupon_code,
      amount,
      billing_id,
      metadata,
      business_id,
      currency,
    } = createPaymentDto;

    // 1️⃣ Fetch business info
    const business = await this.prisma.businessInformation.findFirst({
      where: { OR: [{ id: business_id }, { business_slug: business_id }] },
    });

    if (!business) throw new NotFoundException('Business info not found.');

    // 2️⃣ Fetch user details first (no need for transaction)
    const user = await this.authService.getUserByEmail(this.prisma.user, email);

    // 3️⃣ Fetch billing details outside transaction (safe)
    let billing_details = null;
    if (billing_id) {
      billing_details = await this.billingService.findOne(billing_id, user.id);
    }

    // 4️⃣ Build purchase details (still outside DB transaction)
    const purchase_details_list: PurchaseSchema[] = await Promise.all(
      purchases.map(({ purchase_id, purchase_type, quantity, metadata }) =>
        this.purchaseByType(
          user.id,
          purchase_id,
          purchase_type,
          quantity,
          business.id,
          currency,
          this.prisma, // safe to use base prisma here
          metadata,
        ),
      ),
    );

    // 5️⃣ Compute amount and coupon discount
    let computed_total_amount = this.computeTotalAmount(purchase_details_list);
    const gross_amount = computed_total_amount;

    let coupon_value = null;
    let coupon_type = null;
    let coupon_id = null;

    if (coupon_code) {
      const coupon_details = await this.couponUsageService.validateCouponUsage(
        { coupon_code, user_id: user.id },
        computed_total_amount,
      );

      computed_total_amount = this.couponUsageService.getDiscountedAmount(
        computed_total_amount,
        coupon_details.value,
        coupon_details.type,
      );

      coupon_value = coupon_details.value;
      coupon_type = coupon_details.type;
      coupon_id = coupon_details.id;
    }

    this.compareAmounts(computed_total_amount, amount);

    // 6️⃣ Compute final amount breakdown (Doexcess fee, etc.)
    const final_amount_breakdown =
      this.genericService.finalAmountToBusinessWallet(
        +computed_total_amount,
        currency,
        +coupon_value,
        business.enable_special_offer,
      );

    // 7️⃣ CREATE PAYMENT RECORD inside a short, clean transaction
    const paymentRecord = await this.prisma.$transaction(async (tx) => {
      return tx.payment.create({
        data: {
          user_id: user.id,
          business_id: business.id,
          purchase_type: PurchaseType.PRODUCT,
          purchase: {
            items: purchase_details_list,
            coupon_id,
            coupon_code,
            coupon_value,
            coupon_type,
            currency,
            business_id: business.id,
          } as any,
          gross_amount,
          amount: computed_total_amount,
          final_amount: final_amount_breakdown.final_amount,
          fee_amount: final_amount_breakdown.fee_amount,
          fee_percent: this.configService.get(`DOEXCESS_${currency}_CHARGE`),
          currency,
          discount_applied: this.couponUsageService.getDiscountValue(
            computed_total_amount,
            coupon_value,
            coupon_type,
          ),
          payment_status: PaymentStatus.PENDING,
          payment_method: payment_method || PaymentMethod.FLUTTERWAVE,
          ...(billing_details && { billing_id: billing_details.id }),
          ...(billing_details && { billing_at_payment: billing_details }),
          metadata,
        },
      });
    });

    // 8️⃣ Initialize external payment AFTER transaction commit
    const paymentInit = await this.flutterwaveService.initializePayment({
      email: user.email,
      amount: computed_total_amount,
      tx_ref: paymentRecord.id,
    });

    // 9️⃣ Create log OUTSIDE transaction (to prevent timeout)
    await this.logService.createLog({
      user_id: user.id,
      action: Action.PRODUCT_PAYMENT_INITIATION,
      entity: this.model,
      entity_id: paymentRecord.id,
      metadata: `User with ID ${user.id} just initiated a product payment.`,
      ip_address: getIpAddress(request),
      user_agent: getUserAgent(request),
    });

    // 🔟 Return the response
    return {
      statusCode: 200,
      message: 'Payment initialized successfully.',
      data: {
        payment_id: paymentRecord.id,
        authorization_url: paymentInit.data?.link ?? null,
      },
    };
  }

  /**
   * Cancel payment / order
   * @param request
   * @param payment_id
   * @returns
   */
  async cancelPayment(request: Timezone & Request, payment_id: string) {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Find the payment record
      const payment = await prisma.payment.findUnique({
        where: { id: payment_id },
      });

      if (!payment) {
        throw new NotFoundException('Payment record not found.');
      }

      // 3. Ensure payment is cancellable
      if (
        payment.payment_status !== PaymentStatus.PENDING &&
        payment.payment_status !== PaymentStatus.SUCCESS
      ) {
        throw new BadRequestException(
          `Cannot cancel an order with status: ${payment.payment_status}`,
        );
      }

      // 4. Update status
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          payment_status: PaymentStatus.CANCELLED,
        },
      });

      const purchase_details = (payment as any)
        .purchase as CompletePurchaseDetailSchema;

      // 5. Handle coupon rollback if coupon was applied
      if (purchase_details?.coupon_id) {
        await this.couponUsageService.rollbackCouponUsage(
          purchase_details.coupon_id,
          payment.user_id,
          prisma,
        );
      }

      // 6. Log cancellation
      await this.logService.createWithTrx(
        {
          user_id: payment.user_id,
          action: Action.PRODUCT_PAYMENT_CANCELLATION,
          entity: this.model,
          entity_id: payment.id,
          metadata: `User with ID ${payment.user_id} cancelled payment ${payment.id}.`,
          ip_address: getIpAddress(request),
          user_agent: getUserAgent(request),
        },
        prisma.log,
      );

      return {
        statusCode: 200,
        message: 'Payment cancelled successfully.',
        data: {
          payment_id: updatedPayment.id,
          status: updatedPayment.payment_status,
        },
      };
    });
  }

  /**
   * Format each item's price
   * @param items
   * @param currency
   * @returns
   */
  formatEachPrice(items: PurchaseSchema[], currency: string) {
    return items.map((item) => ({
      ...item,
      price: formatMoney(+item.price, currency),
    }));
  }

  /**
   * Create purchase record for the products
   * @param prisma
   * @param args
   * @returns
   */
  private async createPurchaseRecord(
    prisma: Omit<
      PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
    args: {
      purchase: any;
      payment: Payment & { user: User };
      verification: PaymentRecordResponse;
      payment_method: PaymentMethod;
    },
  ): Promise<{ actual_total: number }> {
    const { purchase, payment, verification, payment_method } = args;
    let actual_total = 0;

    for (const item of purchase['items'] as PurchaseSchema[]) {
      const {
        id,
        purchase_type,
        price,
        quantity,
        product_id,
        interval,
        auto_renew,
      } = item as PurchaseSchema;

      actual_total += price * quantity;
      if (purchase_type === ProductType.COURSE) {
        // Check if the user is already enrolled
        const existingEnrollment = await prisma.enrolledCourse.findUnique({
          where: {
            user_id_course_id: {
              user_id: payment.user_id,
              course_id: id,
            },
          },
        });

        if (existingEnrollment) continue;

        // Get total course module contents
        const total_module_contents = await prisma.moduleContent.count({
          where: { module: { course_id: id } },
        });

        // 4d. Create course enrollment record
        await prisma.enrolledCourse.create({
          data: {
            user_id: payment.user_id,
            course_id: item.id,
            status: EnrollmentStatus.ACTIVE, // User is now enrolled
            progress: 0, // Course starts at 0% progress
            completed_lessons: 0,
            total_lessons: total_module_contents,
            payment_id: payment.id,
            amount: price,
            currency: payment.currency,
            quantity,
          },
          include: {
            course: {
              include: {
                business_info: { include: { business_wallet: true } },
              },
            },
          },
        });
      } else if (purchase_type === ProductType.TICKET) {
        // Check if the user already purchased ticker
        const purchasedTicket = await prisma.purchasedTicket.findUnique({
          where: {
            user_id_ticket_tier_id: {
              user_id: payment.user_id,
              ticket_tier_id: item.id,
            },
          },
        });

        if (purchasedTicket) continue;

        // Update TicketTier
        const ticket_tier = await prisma.ticketTier.update({
          where: { id: item.id },
          data: { remaining_quantity: { decrement: item.quantity } },
        });

        // Create purchased ticket record
        await prisma.purchasedTicket.create({
          data: {
            user_id: payment.user_id,
            ticket_id: ticket_tier.ticket_id,
            ticket_tier_id: item.id,
            payment_id: payment.id,
            quantity,
            amount: price,
            currency: payment.currency,
          },
        });
      } else if (purchase_type === ProductType.SUBSCRIPTION) {
        // Get subscription plan price with plan details
        const subscription_plan_price =
          await prisma.subscriptionPlanPrice.findFirst({
            where: {
              id,
            },
            include: { subscription_plan: { include: { product: true } } },
          });

        // Field to get the next_payment days from now
        let next_payment_days_from_now = null;

        // Check if subscription already exist and is active
        const existing_active_subscription =
          await prisma.subscription.findFirst({
            where: {
              user_id: payment.user_id,
              plan_id: product_id,
              billing_interval: interval,
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
        let end_date = calculateEndDate(interval);

        // Check if next_payment_days_from_now is not null
        if (next_payment_days_from_now) {
          // Add the next_payment_days gotten from the previous to the the new end date
          end_date = getEndDateFromDays(end_date, next_payment_days_from_now);
        }

        // 4b. Create the subscription
        const subscription = await prisma.subscription.create({
          data: {
            user: { connect: { id: payment.user_id } },
            subscription_plan: {
              connect: {
                id: subscription_plan_price.subscription_plan_id,
              },
            },
            plan_name_at_subscription:
              subscription_plan_price.subscription_plan.name,
            plan_price_at_subscription: subscription_plan_price.price,
            start_date: new Date(),
            end_date: end_date, // Adjust based on billing interval
            grace_end_date: addGracePeriod(end_date),
            is_active: true,
            payment_method: payment_method,
            billing_interval: interval,
            next_payment_date: end_date,
            next_payment_amount: price,
            auto_renew: auto_renew,
            // @ts-ignore
            ...(verification?.data?.authorization?.authorization_code && {
              charge_auth_code: this.genericService.encrypt(
                // @ts-ignore
                verification?.data?.authorization?.authorization_code,
              ),
            }),
            business_info: {
              connect: {
                id: subscription_plan_price.subscription_plan.business_id,
              },
            },
          },
        });

        // 4c. Create subscription payment
        await prisma.subscriptionPayment.create({
          data: {
            subscription_id: subscription.id,
            amount: price,
            currency: subscription.currency,
            payment_id: payment.id,
          },
        });

        // 5. Check if group chat exist
        let group_chat = await prisma.chatGroup.findFirst({
          where: { subscription_plan_id: subscription.plan_id },
        });
        // 5b. Auto-create chat group if non-existent
        if (!group_chat) {
          group_chat = await prisma.chatGroup.create({
            data: {
              name: `${subscription.plan_name_at_subscription} Group`,
              description:
                subscription_plan_price.subscription_plan.description,
              multimedia_id:
                subscription_plan_price.subscription_plan.product.multimedia_id,
              auto_created: true,
              subscription_plan_id: subscription.plan_id,
            },
          });
        }

        // 5c. Check if group member is in chat group
        const group_member = await prisma.chatGroupMember.findFirst({
          where: {
            group_id: group_chat.id,
            member_id: payment.user_id,
          },
        });
        if (!group_member) {
          // 5d. Add subscriber to group chat
          await prisma.chatGroupMember.create({
            data: {
              member_id: payment.user_id,
              group_id: group_chat.id,
            },
          });
        }
      } else if (purchase_type === ProductType.DIGITAL_PRODUCT) {
        // Check if the user has already purchased digital product
        const existingDigitalProduct =
          await prisma.purchasedDigitalProduct.findUnique({
            where: {
              user_id_product_id: {
                user_id: payment.user_id,
                product_id: id,
              },
            },
          });

        if (existingDigitalProduct) continue;

        // 4d. Create purchased digital product record
        await prisma.purchasedDigitalProduct.create({
          data: {
            user_id: payment.user_id,
            product_id: item.id,
            quantity: item.quantity,
            payment_id: payment.id,
            amount: price,
            currency: payment.currency,
          },
          include: {
            product: {
              include: {
                business_info: { include: { business_wallet: true } },
              },
            },
          },
        });
      }
    }

    return { actual_total };
  }

  /**
   * Verify payment
   * @param request
   * @param verifyPaymentDto
   * @returns
   */
  async verifyPaystackPayment(
    request: Timezone & Request,
    verifyPaymentDto: VerifyPaymentDto,
  ): Promise<GenericPayload> {
    const { payment_id } = verifyPaymentDto;

    try {
      const { payment, business_name, business_owner, actual_total } =
        await this.prisma.$transaction(async (prisma) => {
          // 1. Fetch the payment record
          const payment = await prisma.payment.findUnique({
            where: { id: payment_id },
            include: {
              user: true,
              // subscription_plan: {
              //   select: {
              //     name: true,
              //     business_id: true,
              //     business: {
              //       include: {
              //         business_contacts: {
              //           where: { is_owner: true },
              //           include: { user: true },
              //         },
              //         business_wallet: true,
              //       },
              //     },
              //   },
              // },
            },
          });

          // 2. Check if the payment record exists
          if (!payment) {
            throw new NotFoundException('Payment record not found.');
          }

          // Check if payment has already been verified
          if (payment.payment_status === PaymentStatus.SUCCESS) {
            throw new ConflictException(`Payment has already been verified.`);
          }

          // 1. Verify the transaction with paystack
          const verification =
            await this.paystackService.verifyTransaction(payment_id);

          if (verification.data.status !== 'success') {
            await prisma.payment.update({
              where: { id: payment_id },
              data: { payment_status: PaymentStatus.FAILED },
            });

            throw new BadGatewayException('Payment verification failed.');
          }

          // 4. Mark payment as successful
          await prisma.payment.update({
            where: { id: payment_id },
            data: { payment_status: PaymentStatus.SUCCESS },
          });

          // 5. Retrieve purchases from metadata and process each one
          const purchase: any = payment.purchase || [];
          if (!Object.values(purchase).length) {
            throw new BadRequestException('No purchases found.');
          }

          const products = [];
          const { actual_total } = await this.createPurchaseRecord(prisma, {
            purchase,
            payment,
            // @ts-ignore
            verification,
            payment_method: PaymentMethod.PAYSTACK,
          });

          if ((purchase as CompletePurchaseDetailSchema)['coupon_value']) {
            // Save the coupon usage
            await this.couponUsageService.createWithTrx(
              {
                coupon_id: (purchase as CompletePurchaseDetailSchema).coupon_id,
                user_id: payment.user_id,
                discount_applied: payment.discount_applied,
              },
              prisma.couponUsage,
            );
          }

          // Get seller's previous balance
          const business_wallet = await prisma.businessWallet.findUnique({
            where: {
              business_id_currency: {
                business_id: purchase['business_id'],
                currency: payment.currency,
              },
            },
            include: { business: { include: { user: true } } },
          });

          // Credit seller's business account
          await prisma.businessWallet.update({
            where: {
              business_id_currency: {
                business_id: purchase['business_id'],
                currency: payment.currency,
              },
            },
            data: {
              balance: {
                increment: +payment.amount,
              },
              previous_balance: business_wallet.balance,
            },
          });

          // Remove items from cart
          await this.cartService.removeItemsFromCart(
            {
              user_id: payment.user_id,
              product_ids: (purchase['items'] as PurchaseSchema[]).map(
                (item) => item.id,
              ),
            },
            prisma,
          );

          // Log enrollment
          await this.logService.createWithTrx(
            {
              user_id: payment.user_id,
              action: Action.PRODUCT_PAYMENT_CONFIRMATION,
              entity: this.model,
              entity_id: payment.id,
              metadata: `User with ID ${payment.user_id} completed payment for product(s) under business ID ${purchase['business_id']}.`,
              ip_address: getIpAddress(request),
              user_agent: getUserAgent(request),
            },
            prisma.log,
          );

          return {
            payment,
            business_name: business_wallet.business.business_name,
            business_owner: business_wallet.business.user,
            actual_total,
          };
        });

      // Format each price
      const formatted_items = this.formatEachPrice(
        // @ts-ignore
        (payment.purchase as CompletePurchaseDetailSchema).items,
        payment.currency,
      );

      // Send payment email (product)
      await this.mailService.purchaseConfirmation(payment.user, {
        business_name,
        gateway: capitalize(payment.payment_method),
        payment_status: capitalize(PaymentStatus.SUCCESS),
        currency: payment.currency,
        total: formatMoney(+payment.amount, payment.currency),
        // @ts-ignore
        discount_applied: (payment.purchase as CompletePurchaseDetailSchema)
          .coupon_value
          ? formatMoney(+payment.discount_applied, payment.currency)
          : '',
        sub_total: formatMoney(+actual_total, payment.currency),
        // @ts-ignore
        items: formatted_items,
        payment_date: toTimezone(payment.created_at, '', 'MMM Do, YYYY'),
        payment_id: payment.id,
      });

      // Send payment notification email to business super admin
      await this.mailService.purchaseConfirmationNotificationEmail(
        business_owner,
        {
          buyer_name: payment.user.name,
          gateway: capitalize(payment.payment_method),
          payment_status: capitalize(PaymentStatus.SUCCESS),
          currency: payment.currency,
          total: formatMoney(+payment.amount, payment.currency),
          // @ts-ignore
          discount_applied: (payment.purchase as CompletePurchaseDetailSchema)
            .coupon_value
            ? formatMoney(+payment.discount_applied, payment.currency)
            : '',
          sub_total: formatMoney(+actual_total, payment.currency),
          // @ts-ignore
          items: formatted_items,
          payment_date: toTimezone(payment.created_at, '', 'MMM Do, YYYY'),
          payment_id: payment.id,
        },
      );

      return {
        statusCode: HttpStatus.OK,
        message: `Payment verified successfully.`,
      };
    } catch (error) {
      TransactionError(error, this.logger);
    }
  }

  /**
   * Verify payment
   * @param request
   * @param verifyPaymentDto
   * @returns
   */
  async verifyFlwPayment(
    request: Timezone & Request,
    verifyPaymentDto: VerifyPaymentDto,
  ): Promise<GenericPayload> {
    const { payment_id } = verifyPaymentDto;

    try {
      // 1. Verify the transaction with Flutterwave
      const verification =
        await this.flutterwaveService.verifyPayment(payment_id);

      const { payment, business_name, business_owner, actual_total } =
        await this.prisma.$transaction(async (prisma) => {
          if (verification.status !== FlutterwaveStatus.SUCCESS) {
            await prisma.payment.update({
              where: { id: payment_id },
              data: { payment_status: PaymentStatus.FAILED },
            });

            throw new BadGatewayException('Payment verification failed.');
          }

          // 1. Fetch the payment record
          const payment = await prisma.payment.findUnique({
            where: { id: verification.data.tx_ref },
            include: {
              user: {
                include: { profile: { select: { profile_picture: true } } },
              },
              // subscription_plan: {
              //   select: {
              //     name: true,
              //     business_id: true,
              //     business: {
              //       include: {
              //         business_contacts: {
              //           where: { is_owner: true },
              //           include: { user: true },
              //         },
              //         business_wallet: true,
              //       },
              //     },
              //   },
              // },
            },
          });

          // 2. Check if the payment record exists
          if (!payment) {
            throw new NotFoundException('Payment record not found.');
          }

          // Check if payment has already been verified
          if (payment.payment_status === PaymentStatus.SUCCESS) {
            throw new ConflictException(`Payment has already been verified.`);
          }

          // 4. Mark payment as successful
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              payment_status: PaymentStatus.SUCCESS,
            },
          });

          // 5. Retrieve purchases from metadata and process each one
          const purchase: any = payment.purchase || [];
          if (!Object.values(purchase).length) {
            throw new BadRequestException('No purchases found.');
          }

          const products = [];
          const { actual_total } = await this.createPurchaseRecord(prisma, {
            purchase,
            payment,
            // @ts-ignore
            verification: verification.data,
          });

          if ((purchase as CompletePurchaseDetailSchema)['coupon_value']) {
            // Save the coupon usage
            await this.couponUsageService.createWithTrx(
              {
                coupon_id: (purchase as CompletePurchaseDetailSchema).coupon_id,
                user_id: payment.user_id,
                discount_applied: payment.discount_applied,
              },
              prisma.couponUsage,
            );
          }

          // Get seller's previous balance
          const business_wallet = await prisma.businessWallet.findUnique({
            where: {
              business_id_currency: {
                business_id: purchase['business_id'],
                currency: payment.currency,
              },
            },
            include: { business: { include: { user: true } } },
          });

          // Credit seller's business account
          await prisma.businessWallet.update({
            where: {
              business_id_currency: {
                business_id: purchase['business_id'],
                currency: payment.currency,
              },
            },
            data: {
              balance: {
                increment: +payment.final_amount,
              },
              previous_balance: business_wallet.balance,
            },
          });

          // Create in-app notification
          await prisma.notification.create({
            data: {
              title: 'New Payment Received',
              message: `You’ve received a new payment of ${formatMoney(
                +payment.final_amount,
                payment.currency,
              )} from ${payment.user.name} for recent purchase(s).`,
              icon_url: payment.user?.profile?.profile_picture,
              business_id: purchase['business_id'],
              type: NotificationType.PUSH,
            },
          });

          // Remove items from cart
          await this.cartService.removeItemsFromCart(
            {
              user_id: payment.user_id,
              product_ids: (purchase['items'] as PurchaseSchema[]).map(
                (item) => item.id,
              ),
            },
            prisma,
          );

          // Log enrollment
          await this.logService.createWithTrx(
            {
              user_id: payment.user_id,
              action: Action.PRODUCT_PAYMENT_CONFIRMATION,
              entity: this.model,
              entity_id: payment.id,
              metadata: `User ${payment.user_id} completed payment for product(s) under business ${purchase['business_id']}. Gross: ${payment.gross_amount}, Discount: ${payment.discount_applied}, Net: ${payment.amount}`,
              ip_address: getIpAddress(request),
              user_agent: getUserAgent(request),
            },
            prisma.log,
          );

          return {
            payment,
            business_name: business_wallet.business.business_name,
            business_owner: business_wallet.business.user,
            actual_total,
          };
        });

      // Format each price
      const formatted_items = this.formatEachPrice(
        // @ts-ignore
        (payment.purchase as CompletePurchaseDetailSchema).items,
        payment.currency,
      );

      // Send payment email (product)
      await this.mailService.purchaseConfirmation(payment.user, {
        business_name,
        gateway: capitalize(payment.payment_method),
        payment_status: capitalize(PaymentStatus.SUCCESS),
        currency: payment.currency,
        total: formatMoney(+payment.amount, payment.currency),
        // @ts-ignore
        discount_applied: (payment.purchase as CompletePurchaseDetailSchema)
          .coupon_value
          ? formatMoney(+payment.discount_applied, payment.currency)
          : '',
        sub_total: formatMoney(+actual_total, payment.currency),
        // @ts-ignore
        items: formatted_items,
        payment_date: toTimezone(payment.created_at, '', 'MMM Do, YYYY'),
        payment_id: payment.id,
      });

      // Send payment notification email to business super admin
      await this.mailService.purchaseConfirmationNotificationEmail(
        business_owner,
        {
          buyer_name: payment.user.name,
          gateway: capitalize(payment.payment_method),
          payment_status: capitalize(PaymentStatus.SUCCESS),
          currency: payment.currency,
          total: formatMoney(+payment.amount, payment.currency),
          // @ts-ignore
          discount_applied: (payment.purchase as CompletePurchaseDetailSchema)
            .coupon_value
            ? formatMoney(+payment.discount_applied, payment.currency)
            : '',
          sub_total: formatMoney(+actual_total, payment.currency),
          // @ts-ignore
          items: formatted_items,
          payment_date: toTimezone(payment.created_at, '', 'MMM Do, YYYY'),
          payment_id: payment.id,
        },
      );

      return {
        statusCode: HttpStatus.OK,
        message: `Payment verified successfully.`,
      };
    } catch (error) {
      TransactionError(error, this.logger);
    }
  }

  /**
   * Verify payment
   * @param request
   * @param verifyPaymentDto
   * @returns
   */
  async verifyPayment(
    request: Timezone & Request,
    verifyPaymentDto: VerifyPaymentDto,
  ): Promise<GenericPayload> {
    const { payment_id } = verifyPaymentDto;

    try {
      // 1. Verify the transaction with Flutterwave
      const verification =
        await this.paystackService.verifyTransaction(payment_id);

      const { payment, business_name, business_owner, actual_total } =
        await this.prisma.$transaction(async (prisma) => {
          if (verification.data.status !== 'success') {
            await prisma.payment.update({
              where: { id: payment_id },
              data: { payment_status: PaymentStatus.FAILED },
            });

            throw new BadGatewayException('Payment verification failed.');
          }

          // 1. Fetch the payment record
          const payment = await prisma.payment.findUnique({
            where: { id: verification.data.reference },
            include: {
              user: {
                include: { profile: { select: { profile_picture: true } } },
              },
              // subscription_plan: {
              //   select: {
              //     name: true,
              //     business_id: true,
              //     business: {
              //       include: {
              //         business_contacts: {
              //           where: { is_owner: true },
              //           include: { user: true },
              //         },
              //         business_wallet: true,
              //       },
              //     },
              //   },
              // },
            },
          });

          // 2. Check if the payment record exists
          if (!payment) {
            throw new NotFoundException('Payment record not found.');
          }

          // Check if payment has already been verified
          if (payment.payment_status === PaymentStatus.SUCCESS) {
            throw new ConflictException(`Payment has already been verified.`);
          }

          // 4. Mark payment as successful
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              payment_status: PaymentStatus.SUCCESS,
            },
          });

          // 5. Retrieve purchases from metadata and process each one
          const purchase: any = payment.purchase || [];
          if (!Object.values(purchase).length) {
            throw new BadRequestException('No purchases found.');
          }

          const products = [];
          const { actual_total } = await this.createPurchaseRecord(prisma, {
            purchase,
            payment,
            // @ts-ignore
            verification: verification.data,
            payment_method: PaymentMethod.PAYSTACK,
          });

          if ((purchase as CompletePurchaseDetailSchema)['coupon_value']) {
            // Save the coupon usage
            await this.couponUsageService.createWithTrx(
              {
                coupon_id: (purchase as CompletePurchaseDetailSchema).coupon_id,
                user_id: payment.user_id,
                discount_applied: payment.discount_applied,
              },
              prisma.couponUsage,
            );
          }

          // Get seller's previous balance
          const business_wallet = await prisma.businessWallet.findUnique({
            where: {
              business_id_currency: {
                business_id: purchase['business_id'],
                currency: payment.currency,
              },
            },
            include: { business: { include: { user: true } } },
          });

          // Credit seller's business account
          await prisma.businessWallet.update({
            where: {
              business_id_currency: {
                business_id: purchase['business_id'],
                currency: payment.currency,
              },
            },
            data: {
              balance: {
                increment: +payment.final_amount,
              },
              previous_balance: business_wallet.balance,
            },
          });

          // Create in-app notification
          await prisma.notification.create({
            data: {
              title: 'New Payment Received',
              message: `You’ve received a new payment of ${formatMoney(
                +payment.final_amount,
                payment.currency,
              )} from ${payment.user.name} for recent purchase(s).`,
              icon_url: payment.user?.profile?.profile_picture,
              business_id: purchase['business_id'],
              type: NotificationType.PUSH,
            },
          });

          // Remove items from cart
          await this.cartService.removeItemsFromCart(
            {
              user_id: payment.user_id,
              product_ids: (purchase['items'] as PurchaseSchema[]).map(
                (item) => item.id,
              ),
            },
            prisma,
          );

          // Log enrollment
          await this.logService.createWithTrx(
            {
              user_id: payment.user_id,
              action: Action.PRODUCT_PAYMENT_CONFIRMATION,
              entity: this.model,
              entity_id: payment.id,
              metadata: `User ${payment.user_id} completed payment for product(s) under business ${purchase['business_id']}. Gross: ${payment.gross_amount}, Discount: ${payment.discount_applied}, Net: ${payment.amount}`,
              ip_address: getIpAddress(request),
              user_agent: getUserAgent(request),
            },
            prisma.log,
          );

          return {
            payment,
            business_name: business_wallet.business.business_name,
            business_owner: business_wallet.business.user,
            actual_total,
          };
        });

      // Format each price
      const formatted_items = this.formatEachPrice(
        // @ts-ignore
        (payment.purchase as CompletePurchaseDetailSchema).items,
        payment.currency,
      );

      // Send payment email (product)
      await this.mailService.purchaseConfirmation(payment.user, {
        business_name,
        gateway: capitalize(payment.payment_method),
        payment_status: capitalize(PaymentStatus.SUCCESS),
        currency: payment.currency,
        total: formatMoney(+payment.amount, payment.currency),
        // @ts-ignore
        discount_applied: (payment.purchase as CompletePurchaseDetailSchema)
          .coupon_value
          ? formatMoney(+payment.discount_applied, payment.currency)
          : '',
        sub_total: formatMoney(+actual_total, payment.currency),
        // @ts-ignore
        items: formatted_items,
        payment_date: toTimezone(payment.created_at, '', 'MMM Do, YYYY'),
        payment_id: payment.id,
      });

      // Send payment notification email to business super admin
      await this.mailService.purchaseConfirmationNotificationEmail(
        business_owner,
        {
          buyer_name: payment.user.name,
          gateway: capitalize(payment.payment_method),
          payment_status: capitalize(PaymentStatus.SUCCESS),
          currency: payment.currency,
          total: formatMoney(+payment.amount, payment.currency),
          // @ts-ignore
          discount_applied: (payment.purchase as CompletePurchaseDetailSchema)
            .coupon_value
            ? formatMoney(+payment.discount_applied, payment.currency)
            : '',
          sub_total: formatMoney(+actual_total, payment.currency),
          // @ts-ignore
          items: formatted_items,
          payment_date: toTimezone(payment.created_at, '', 'MMM Do, YYYY'),
          payment_id: payment.id,
        },
      );

      return {
        statusCode: HttpStatus.OK,
        message: `Payment verified successfully.`,
      };
    } catch (error) {
      TransactionError(error, this.logger);
    }
  }

  /**
   * Fetch payments - For admin
   * @param request
   * @param filterPaymentDto
   * @returns
   */
  async fetchPayments(
    request: AuthPayload,
    filterPaymentDto: QueryPaymentsDto,
  ): Promise<PagePayload<Payment>> {
    // Check if user is part of the owner's administrators  (TODO)

    // Invoke pagination filters
    const pagination_filters = pageFilter(filterPaymentDto);

    // Filters
    const filters: Prisma.PaymentWhereInput & TZ = {
      ...(filterPaymentDto.payment_status && {
        payment_status: filterPaymentDto.payment_status,
      }),
      ...(filterPaymentDto.business_id && {
        // @ts-ignore
        OR: businessIdFilter(filterPaymentDto.business_id),
      }),
      ...(filterPaymentDto.q && {
        OR: [
          {
            id: { contains: filterPaymentDto.q, mode: 'insensitive' },
          },
        ],
      }),
      ...pagination_filters.filters,
      tz: request.timezone,
    };

    // Assign something else to same variable
    const include: Prisma.PaymentInclude = {
      user: true,
      subscription_plan: true,
      billing_info: true,
      refunds: true,
      payment_gateway_logs: true,
    };

    const [payments, total] = await Promise.all([
      this.paymentRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        include,
        undefined,
      ),
      this.paymentRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: payments,
      count: total,
    };
  }

  /**
   * Fetch payments - For business
   * @param request
   * @param filterPaymentDto
   * @returns
   */
  async fetchPaymentsForBusiness(
    request: AuthPayload,
    filterPaymentDto: QueryPaymentsDto,
  ): Promise<PagePayload<Payment> | any> {
    // Check if user is part of the owner's administrators  (TODO)

    // Invoke pagination filters
    const pagination_filters = pageFilter(filterPaymentDto);

    // Filters
    const filters: Prisma.PaymentWhereInput & TZ = {
      ...(filterPaymentDto.payment_status && {
        payment_status: filterPaymentDto.payment_status,
      }),
      ...(request['Business-Id'] && {
        // @ts-ignore
        OR: [
          {
            business_id: request['Business-Id'],
          },
          {
            purchase: {
              path: ['business_id'],
              equals: request['Business-Id'],
            },
          },
          {
            subscription_plan: {
              business_id: { equals: request['Business-Id'] },
            },
          },
        ],
      }),
      ...(filterPaymentDto.q && {
        OR: [
          {
            id: { contains: filterPaymentDto.q, mode: 'insensitive' },
          },
        ],
      }),
      ...pagination_filters.filters,
      tz: request.timezone,
    };

    // Credit Filters
    const credit_filters: Prisma.PaymentWhereInput = {
      payment_status: PaymentStatus.SUCCESS,
      // @ts-ignore
      OR: [
        {
          purchase: {
            path: ['business_id'],
            equals: request['Business-Id'],
          },
        },
        {
          subscription_plan: {
            business_id: { equals: request['Business-Id'] },
          },
        },
      ],
    };

    // Debit Filters
    const debit_filters: Prisma.PaymentWhereInput = {
      payment_status: PaymentStatus.SUCCESS,
      transaction_type: TransactionType.WITHDRAWAL,
    };

    // total transactions Filters
    const total_filters: Prisma.PaymentWhereInput = {
      payment_status: PaymentStatus.SUCCESS,
      // @ts-ignore
      OR: [
        {
          purchase: {
            path: ['business_id'],
            equals: request['Business-Id'],
          },
        },
        {
          subscription_plan: {
            business_id: { equals: request['Business-Id'] },
          },
        },
        // Add withdrawal filter and others later
      ],
    };

    // Assign something else to same variable
    const include: Prisma.PaymentInclude = {
      user: { include: { profile: true } },
      subscription_plan: true,
      billing_info: true,
      refunds: true,
      payment_gateway_logs: true,
      business_info: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profile: { select: { profile_picture: true } },
            },
          },
        },
      },
    };

    const [payments, total, details, total_credit, total_debit, total_trx] =
      await Promise.all([
        this.paymentRepository.findManyWithPagination(
          filters,
          { ...pagination_filters.pagination_options },
          Prisma.SortOrder.desc,
          include,
          undefined,
        ),
        this.paymentRepository.count(filters),
        this.getTodayEarningsAndPayments(request['Business-Id']),
        // ✅ Total amount (credit + debit filtered with same filters)
        this.paymentRepository.sum('amount', credit_filters),
        this.paymentRepository.sum('amount', debit_filters),
        this.paymentRepository.sum('amount', total_filters),
      ]);

    return {
      statusCode: HttpStatus.OK,
      data: payments,
      count: total,
      total_credit,
      total_debit,
      total_trx,
      details,
    };
  }

  /**
   * Fetch payment by ID - For business
   * @param request
   * @param idDto
   * @returns
   */
  async fetchPaymentByIDForBusiness(
    request: AuthPayload,
    idDto: IdDto,
  ): Promise<PagePayload<Payment> | any> {
    const { id } = idDto;
    // Check if user is part of the business's administrators  (TODO)

    // Filters
    const filters: Prisma.PaymentWhereInput & TZ = {
      id,
      // @ts-ignore
      OR: [
        {
          purchase: {
            path: ['business_id'],
            equals: request['Business-Id'],
          },
        },
        {
          subscription_plan: {
            business_id: { equals: request['Business-Id'] },
          },
        },
      ],
      tz: request.timezone,
    };

    // Assign something else to same variable
    const include: Prisma.PaymentInclude = {
      user: { include: { profile: true } },
      subscription_plan: true,
      billing_info: true,
      refunds: true,
      payment_gateway_logs: true,
    };

    const payment = await this.paymentRepository.findOne(
      filters,
      include,
      undefined,
    );

    return {
      statusCode: HttpStatus.OK,
      data: payment,
    };
  }

  /**
   * Fetch distinct customer payments - For admin
   * @param request
   * @param filterPaymentDto
   * @returns
   */
  async fetchDistinctCustomerPayments(
    request: AuthPayload,
    filterPaymentDto: QueryPaymentsDto,
  ) {
    // Check if user is part of the owner's administrators (TODO)

    // Invoke pagination filters
    const pagination_filters = pageFilter(filterPaymentDto);

    // Filters

    const filters: Prisma.PaymentWhereInput & TZ = {
      AND: [
        // Payment status filter (exact match)
        ...(filterPaymentDto.payment_status
          ? [{ payment_status: filterPaymentDto.payment_status }]
          : []),

        // Business ID filter (OR across two possible locations)
        ...(filterPaymentDto.business_id
          ? [
              {
                OR: [
                  {
                    subscription_plan: {
                      business_id: filterPaymentDto.business_id,
                    },
                  },
                  {
                    purchase: {
                      path: ['business_id'],
                      equals: filterPaymentDto.business_id,
                    },
                  },
                ],
              },
            ]
          : []),

        // Purchase type filter (OR across two possible locations)
        ...(filterPaymentDto.purchase_type
          ? [
              {
                OR: [
                  { purchase_type: filterPaymentDto.purchase_type },
                  {
                    purchase: {
                      path: ['purchase_type'],
                      equals: filterPaymentDto.purchase_type,
                    },
                  },
                ],
              },
            ]
          : []),

        // Search query (q)
        ...(filterPaymentDto.q
          ? [{ id: { contains: filterPaymentDto.q, mode: 'insensitive' } }]
          : []),

        // Pagination filters
        // // @ts-ignore
        // ...pagination_filters.filters,
        // Pagination filters (handle both object and array cases)
        ...(Array.isArray(pagination_filters.filters)
          ? pagination_filters.filters
          : [pagination_filters.filters].filter(Boolean)),
      ].filter(Boolean), // Remove any undefined/empty entries
      // Timezone
      tz: request.timezone,
    };

    // Assign something else to same variable
    const include: Prisma.PaymentInclude = {
      user: true,
      subscription_plan: true,
      billing_info: true,
      refunds: true,
      payment_gateway_logs: true,
    };

    const [customer_payments, total] = await Promise.all([
      this.paymentRepository.findManyDistinctWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        include,
        undefined,
        ['user_id'],
      ),
      this.paymentRepository.countDistinct(filters, ['user_id']),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: customer_payments,
      count: total,
    };
  }

  /**
   * Initiate withdrawal
   * @param request
   * @param initiateWithdrawalDto
   * @returns
   */
  async initiateWithdrawal(
    request: AuthPayload & Request,
    initiateWithdrawalDto: InitiateWithdrawalDto,
  ) {
    try {
      const { sub: user_id } = request.user;
      const { amount, currency } = initiateWithdrawalDto;

      await this.prisma.$transaction(async (prisma) => {
        // 1. Fetch business wallet
        const wallet = await prisma.businessWallet.findUnique({
          where: {
            business_id_currency: {
              business_id: request['business_id'],
              currency: 'NGN',
            },
          },
          include: {
            business: { include: { withdrawal_account: true } },
          },
        });

        if (!wallet) {
          throw new Error('Business wallet not found.');
        }

        // 2. Validate sufficient funds
        if (Number(wallet.balance) < Number(amount)) {
          throw new Error('Insufficient wallet balance.');
        }

        // 3. Calculate new balances
        const new_balance = Number(wallet.balance) - Number(amount);

        // 4. Initiate transfer to withdrawal account with paystack
        await this.paystackService.initiateTransfer({
          amount,
          recipient_code: this.genericService.decrypt(
            wallet.business.withdrawal_account.recipient_code,
          ),
          reason: 'Withdrawal',
        });

        // 4. Update wallet
        await prisma.businessWallet.update({
          where: {
            business_id_currency: {
              business_id: request['business_id'],
              currency,
            },
          },
          data: {
            previous_balance: wallet.balance,
            balance: new_balance,
          },
        });

        // 5. Record withdrawal (optional)
        const payment = await prisma.payment.create({
          data: {
            user_id, // Must come from business context
            business_id: request['business_id'] || request['Business-Id'],
            amount: amount,
            payment_status: PaymentStatus.PENDING,
            transaction_type: TransactionType.WITHDRAWAL,
            payment_method: PaymentMethod.PAYSTACK,
            currency: wallet.currency,
            metadata: {
              reason: 'Business initiated withdrawal',
              business_id: request['Business-Id'],
            },
          },
          select: {
            id: true,
            user_id: true,
            amount: true,
            currency: true,
            payment_status: true,
            transaction_type: true,
            payment_method: true,
            metadata: true,
            created_at: true,
          },
        });

        // 6. Log the withdrawal
        await this.logService.createWithTrx(
          {
            user_id: null, // Attach user if available
            action: Action.BUSINESS_WITHDRAWAL,
            entity: this.model,
            entity_id: payment.id,
            metadata: `User ID ${user_id} from Business with ID ${request['Business-Id']} withdrew ₦${amount}.`,
            ip_address: getIpAddress(request),
            user_agent: getUserAgent(request),
          },
          prisma.log,
        );

        return { payment };
      });

      return {
        statusCode: 200,
        message: 'Withdrawal initiated successfully.',
      };
    } catch (error) {
      TransactionError(error, this.logger);
    }
  }

  // Next - Verify withdrawal (Todo later)

  /**
   * Fetch payments for client (user)
   * @param request
   * @param filterPaymentDto
   * @returns
   */
  async fetchClientPayments(
    request: AuthPayload,
    filterPaymentDto: QueryPaymentsDto,
  ): Promise<PagePayload<any>> {
    const { sub: user_id } = request.user;

    const pagination_filters = pageFilter(filterPaymentDto);

    const filters: Prisma.PaymentWhereInput & TZ = {
      user_id,
      ...(filterPaymentDto.payment_status && {
        payment_status: filterPaymentDto.payment_status,
      }),
      ...(filterPaymentDto.purchase_type && {
        purchase_type: filterPaymentDto.purchase_type,
      }),
      ...(filterPaymentDto.q && {
        OR: [
          { id: { contains: filterPaymentDto.q, mode: 'insensitive' } },
          {
            transaction_id: {
              contains: filterPaymentDto.q,
              mode: 'insensitive',
            },
          },
        ],
      }),
      ...pagination_filters.filters,
      tz: request.timezone,
    };

    // basic relations
    const include: Prisma.PaymentInclude = {
      billing_info: true,
      refunds: true,
    };

    const [payments, total] = await Promise.all([
      this.paymentRepository.findManyWithPagination(
        filters,
        { ...pagination_filters.pagination_options },
        Prisma.SortOrder.desc,
        include,
      ),
      this.paymentRepository.count(filters),
    ]);

    // 🔹 Enhance payments with purchase details
    const enhancedPayments = await Promise.all(
      payments.map(async (payment) => {
        let purchases: CompletePurchaseDetailSchema | null = null;

        if (payment.purchase) {
          try {
            purchases =
              payment.purchase as unknown as CompletePurchaseDetailSchema;

            // Loop through items
            const enrichedItems = await Promise.all(
              purchases.items.map(async (item) => {
                if (item.purchase_type === ProductType.DIGITAL_PRODUCT) {
                  // fetch purchased digital product
                  const details =
                    await this.prisma.purchasedDigitalProduct.findFirst({
                      where: {
                        user_id,
                        product_id: item.product_id,
                        quantity: item.quantity,
                        payment_id: purchases.payment_id,
                      },
                      include: {
                        product: {
                          select: {
                            multimedia: true,
                            zip_file: true,
                            title: true,
                            description: true,
                          },
                        },
                      },
                    });

                  return {
                    ...item,
                    details,
                  };
                }

                if (item.purchase_type === ProductType.SUBSCRIPTION) {
                  const plan = await this.prisma.subscription.findFirst({
                    where: { user_id, plan_id: item.product_id },
                    include: {
                      subscription_plan: true,
                    },
                  });

                  return {
                    ...item,
                    details: plan,
                  };
                }

                if (item.purchase_type === ProductType.COURSE) {
                  const course = await this.prisma.enrolledCourse.findFirst({
                    where: {
                      user_id,
                      course_id: item.product_id,
                      quantity: item.quantity,
                    },
                  });

                  return {
                    ...item,
                    details: course,
                  };
                }

                if (item.purchase_type === ProductType.TICKET) {
                  const purchased_ticket =
                    await this.prisma.purchasedTicket.findFirst({
                      where: {
                        user_id,
                        ticket_tier_id: item.id,
                        quantity: item.quantity,
                      },
                    });

                  return {
                    ...item,
                    details: purchased_ticket,
                  };
                }

                // fallback
                return item;
              }),
            );

            // Get business info
            const business_info =
              await this.prisma.businessInformation.findFirst({
                where: { id: purchases.business_id },
                select: {
                  id: true,
                  business_name: true,
                  business_description: true,
                  business_size: true,
                  business_slug: true,
                },
              });

            return {
              ...payment,
              business_info,
              full_purchases_details: {
                ...purchases,
                items: enrichedItems,
              },
            };
          } catch (e) {
            console.error(
              'Error parsing purchases for payment:',
              payment.id,
              e,
            );
          }
        }

        return payment;
      }),
    );

    return {
      statusCode: HttpStatus.OK,
      data: enhancedPayments,
      count: total,
    };
  }

  /**
   * Fetch single payment details for client
   * @param request
   * @param idDto
   * @returns
   */
  async fetchClientPaymentByID(
    request: AuthPayload,
    idDto: IdDto,
  ): Promise<GenericDataPayload<Payment>> {
    const { sub: user_id } = request.user;
    const { id } = idDto;

    // Filters for client payment by ID
    const filters: Prisma.PaymentWhereInput & TZ = {
      id,
      user_id,
      tz: request.timezone,
    };

    // Include related data
    const include: Prisma.PaymentInclude = {
      subscription_plan: {
        include: {
          business: {
            select: {
              id: true,
              business_name: true,
              logo_url: true,
              industry: true,
            },
          },
        },
      },
      billing_info: true,
      refunds: {
        include: {
          payment: true,
        },
      },
      payment_gateway_logs: {
        orderBy: {
          created_at: Prisma.SortOrder.desc,
        },
        take: 10,
      },
    };

    const payment = await this.paymentRepository.findOne(
      filters,
      include,
      undefined,
    );

    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }

    return {
      statusCode: HttpStatus.OK,
      data: payment,
    };
  }

  /**
   * Fetch client payment orders summary
   * @param request
   * @returns
   */
  async fetchClientPaymentSummary(
    request: AuthPayload,
  ): Promise<GenericDataPayload<any>> {
    const { sub: user_id } = request.user;

    // Get summary statistics
    const [
      total_payments,
      successful_payments,
      pending_payments,
      failed_payments,
      total_amount,
      total_discount,
    ] = await Promise.all([
      // Total payments count
      this.paymentRepository.count({ user_id }),

      // Successful payments count
      this.paymentRepository.count({
        user_id,
        payment_status: PaymentStatus.SUCCESS,
      }),

      // Pending payments count
      this.paymentRepository.count({
        user_id,
        payment_status: PaymentStatus.PENDING,
      }),

      // Failed payments count
      this.paymentRepository.count({
        user_id,
        payment_status: PaymentStatus.FAILED,
      }),

      // Total amount spent
      this.paymentRepository.sum('amount', {
        user_id,
        payment_status: PaymentStatus.SUCCESS,
      }),

      // Total discount applied
      this.paymentRepository.sum('discount_applied', {
        user_id,
        payment_status: PaymentStatus.SUCCESS,
      }),
    ]);

    // Get recent payment types breakdown
    const payment_types = await this.prisma.payment.groupBy({
      by: ['purchase_type'],
      where: {
        user_id,
        payment_status: PaymentStatus.SUCCESS,
      },
      _count: {
        purchase_type: true,
      },
      _sum: {
        amount: true,
      },
    });

    // Get top businesses by spending
    const top_businesses = await this.prisma.payment.findMany({
      where: {
        user_id,
        payment_status: PaymentStatus.SUCCESS,
        subscription_plan: {
          isNot: null,
        },
      },
      select: {
        subscription_plan: {
          select: {
            id: true,
            business: {
              select: {
                id: true,
                business_name: true,
                logo_url: true,
              },
            },
          },
        },
        amount: true,
      },
      orderBy: {
        amount: 'desc',
      },
      take: 10,
    });

    // Group and aggregate the results manually
    const businessMap = new Map();
    top_businesses.forEach((payment) => {
      if (payment.subscription_plan) {
        const businessId = payment.subscription_plan.business.id;
        const existing = businessMap.get(businessId);

        if (existing) {
          existing.total_spent += Number(payment.amount || 0);
          existing.payment_count += 1;
        } else {
          businessMap.set(businessId, {
            business: payment.subscription_plan.business,
            total_spent: Number(payment.amount || 0),
            payment_count: 1,
          });
        }
      }
    });

    const formatted_top_businesses = Array.from(businessMap.values())
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 5);

    return {
      statusCode: HttpStatus.OK,
      data: {
        summary: {
          total_payments,
          successful_payments,
          pending_payments,
          failed_payments,
          total_amount: Number(total_amount || 0),
          total_discount: Number(total_discount || 0),
        },
        payment_types: payment_types.map((type) => ({
          type: type.purchase_type,
          count: type._count.purchase_type,
          total_amount: Number(type._sum.amount || 0),
        })),
        top_businesses: formatted_top_businesses.filter(Boolean),
      },
    };
  }
}
