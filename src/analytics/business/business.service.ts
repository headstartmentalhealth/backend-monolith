import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import {
  Payment,
  PaymentStatus,
  PurchaseType,
  Subscription,
  EnrolledCourse,
  EnrollmentStatus,
  UserCourseProgress,
  BusinessContact,
  MemberStatus,
  Prisma,
  TransactionType,
} from '@prisma/client';
import { formatMoney, withDeleted } from '@/generic/generic.utils';
import { PrismaBaseRepository } from '@/prisma/prisma.base.repository';
import { AuthPayload, GenericDataPayload } from '@/generic/generic.payload';
import { Role } from '@/generic/generic.data';
import { CurrencyDto } from '@/generic/generic.dto';

@Injectable()
export class BusinessAnalyticsService {
  private readonly paymentRepository: PrismaBaseRepository<
    Payment,
    Prisma.PaymentCreateInput,
    Prisma.PaymentUpdateInput,
    Prisma.PaymentWhereUniqueInput,
    Prisma.PaymentWhereInput | Prisma.PaymentFindFirstArgs,
    Prisma.PaymentUpsertArgs
  >;
  private readonly subscriptionRepository: PrismaBaseRepository<
    Subscription,
    Prisma.SubscriptionCreateInput,
    Prisma.SubscriptionUpdateInput,
    Prisma.SubscriptionWhereUniqueInput,
    Prisma.SubscriptionWhereInput | Prisma.SubscriptionFindFirstArgs,
    Prisma.SubscriptionUpsertArgs
  >;
  private readonly enrolledCourseRepository: PrismaBaseRepository<
    EnrolledCourse,
    Prisma.EnrolledCourseCreateInput,
    Prisma.EnrolledCourseUpdateInput,
    Prisma.EnrolledCourseWhereUniqueInput,
    Prisma.EnrolledCourseWhereInput | Prisma.EnrolledCourseFindFirstArgs,
    Prisma.EnrolledCourseUpsertArgs
  >;
  private readonly businessContactRepository: PrismaBaseRepository<
    BusinessContact,
    Prisma.BusinessContactCreateInput,
    Prisma.BusinessContactUpdateInput,
    Prisma.BusinessContactWhereUniqueInput,
    Prisma.BusinessContactWhereInput | Prisma.BusinessContactFindFirstArgs,
    Prisma.BusinessContactUpsertArgs
  >;

  constructor(
    private readonly prisma: PrismaService,
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
    this.subscriptionRepository = new PrismaBaseRepository<
      Subscription,
      Prisma.SubscriptionCreateInput,
      Prisma.SubscriptionUpdateInput,
      Prisma.SubscriptionWhereUniqueInput,
      Prisma.SubscriptionWhereInput | Prisma.SubscriptionFindFirstArgs,
      Prisma.SubscriptionUpsertArgs
    >('subscription', prisma);
    this.enrolledCourseRepository = new PrismaBaseRepository<
      EnrolledCourse,
      Prisma.EnrolledCourseCreateInput,
      Prisma.EnrolledCourseUpdateInput,
      Prisma.EnrolledCourseWhereUniqueInput,
      Prisma.EnrolledCourseWhereInput | Prisma.EnrolledCourseFindFirstArgs,
      Prisma.EnrolledCourseUpsertArgs
    >('enrolledCourse', prisma);
    this.businessContactRepository = new PrismaBaseRepository<
      BusinessContact,
      Prisma.BusinessContactCreateInput,
      Prisma.BusinessContactUpdateInput,
      Prisma.BusinessContactWhereUniqueInput,
      Prisma.BusinessContactWhereInput | Prisma.BusinessContactFindFirstArgs,
      Prisma.BusinessContactUpsertArgs
    >('businessContact', prisma);
  }

  /**
   * Get comprehensive analytics for a business
   * @param auth
   * @param businessId
   * @returns
   */
  async getBusinessAnalytics(
    payload: AuthPayload & Request,
    query: CurrencyDto,
  ): Promise<GenericDataPayload<any>> {
    const businessId = payload['Business-Id'];

    // 1. Total Revenue
    const totalRevenue = await this.getTotalRevenue(this.prisma, businessId);

    // 2. Active Subscriptions
    const activeSubscriptions = await this.getActiveSubscriptions(
      this.prisma,
      businessId,
    );

    // 3. All Clients
    const allClients = await this.getAllClients(this.prisma, businessId);

    // 4. Course Completions
    const courseCompletions = await this.getCourseCompletions(
      this.prisma,
      businessId,
    );

    return {
      statusCode: HttpStatus.OK,
      data: {
        total_revenue: totalRevenue,
        active_subscriptions: activeSubscriptions,
        all_clients: allClients,
        course_completions: courseCompletions,
      },
    };
  }

  private async fetchTotalRevenue(prisma: PrismaService, businessId: string) {
    // 1️⃣ Get all distinct currencies for this business
    const currencies = await prisma.businessAccountCurrency.findMany({
      where: {
        business_id: businessId,
        deleted_at: null,
      },
      select: {
        currency: true,
        currency_sign: true,
      },
    });

    // 2️⃣ Fetch all successful payments per currency
    const groupedPayments = await prisma.payment.groupBy({
      by: ['currency'],
      where: {
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
        amount: true,
        discount_applied: true,
      },
      _count: {
        id: true,
      },
    });

    // 3️⃣ Map and compute revenue details for each currency
    const byCurrency = currencies.map((currencyRecord) => {
      const stats = groupedPayments.find(
        (p) => p.currency === currencyRecord.currency,
      );

      const gross_amount = stats?._sum.amount ?? 0;
      const discount = stats?._sum.discount_applied ?? 0;
      const net_earnings = +gross_amount - +discount;

      return {
        currency: currencyRecord.currency,
        currency_sign: currencyRecord.currency_sign || '',
        total_payments: stats?._count.id ?? 0,
        gross_amount: formatMoney(+gross_amount, currencyRecord.currency),
        total_discount: formatMoney(+discount, currencyRecord.currency),
        net_earnings: formatMoney(net_earnings, currencyRecord.currency),
        raw: {
          gross_amount: +gross_amount,
          total_discount: +discount,
          net_earnings,
        },
      };
    });

    // 4️⃣ Compute overall totals (summed across currencies)
    const overallTotals = byCurrency.reduce(
      (acc, curr) => ({
        total_payments: acc.total_payments + curr.total_payments,
        gross_amount: acc.gross_amount + curr.raw.gross_amount,
        total_discount: acc.total_discount + curr.raw.total_discount,
        net_earnings: acc.net_earnings + curr.raw.net_earnings,
      }),
      {
        total_payments: 0,
        gross_amount: 0,
        total_discount: 0,
        net_earnings: 0,
      },
    );

    // 5️⃣ Return structured result
    return {
      business_id: businessId,
      by_currency: byCurrency,
      overall: {
        total_payments: overallTotals.total_payments,
        gross_amount: formatMoney(overallTotals.gross_amount, 'NGN'),
        total_discount: formatMoney(overallTotals.total_discount, 'NGN'),
        net_earnings: formatMoney(overallTotals.net_earnings, 'NGN'),
      },
    };
  }

  /**
   * Get total revenue for a business
   * @param prisma
   * @param businessId
   * @returns
   */
  private async getTotalRevenue(
    prisma: PrismaService,
    businessId: string,
    currency: string = 'NGN',
  ): Promise<any> {
    // const currency =
    //   this.configService.get<string>('DEFAULT_CURRENCY') || 'NGN';

    const [
      enrolledCourses,
      subscriptions,
      purchasedTickets,
      purchasedDigitalProducts,
      totalRevenue,
    ] = await Promise.all([
      // --- Courses
      prisma.enrolledCourse.findMany({
        where: { course: { business_id: businessId }, ...withDeleted() },
        select: { course: { select: { price: true } }, quantity: true },
      }),

      // --- Subscriptions
      prisma.subscription.findMany({
        where: {
          subscription_plan: { business_id: businessId },
          is_active: true,
          ...withDeleted(),
        },
        select: { plan_price_at_subscription: true },
      }),

      // --- Tickets
      prisma.purchasedTicket.findMany({
        where: {
          ticket: { product: { business_id: businessId } },
          ...withDeleted(),
        },
        include: { ticket_tier: true },
      }),

      // --- Digital Products
      prisma.purchasedDigitalProduct.findMany({
        where: { product: { business_id: businessId }, ...withDeleted() },
        select: { product: { select: { price: true } }, quantity: true },
      }),

      this.fetchTotalRevenue(prisma, businessId),
    ]);

    // --- Compute revenue
    const courseRevenue = enrolledCourses.reduce(
      (sum, { course, quantity }) =>
        sum + (course.price?.toNumber() || 0) * (quantity || 1),
      0,
    );

    const subscriptionRevenue = subscriptions.reduce(
      (sum, sub) => sum + Number(sub.plan_price_at_subscription || 0),
      0,
    );

    const ticketRevenue = purchasedTickets.reduce(
      (sum, purchased) =>
        sum +
        (purchased.ticket_tier.amount?.toNumber() || 0) *
          (purchased.quantity || 1),
      0,
    );

    const digitalRevenue = purchasedDigitalProducts.reduce(
      (sum, { product, quantity }) =>
        sum + (product?.price?.toNumber() || 0) * (quantity || 1),
      0,
    );

    const totalAmount =
      courseRevenue + subscriptionRevenue + ticketRevenue + digitalRevenue;

    return {
      total: formatMoney(totalAmount, currency),
      raw_total: totalAmount,
      details: totalRevenue,
      breakdown: {
        courses: {
          amount: courseRevenue,
          formatted: formatMoney(courseRevenue, currency),
        },
        subscriptions: {
          amount: subscriptionRevenue,
          formatted: formatMoney(subscriptionRevenue, currency),
        },
        tickets: {
          amount: ticketRevenue,
          formatted: formatMoney(ticketRevenue, currency),
        },
        digital: {
          amount: digitalRevenue,
          formatted: formatMoney(digitalRevenue, currency),
        },
      },
    };
  }

  /**
   * Get active subscriptions for a business
   * @param prisma
   * @param businessId
   * @returns
   */
  private async getActiveSubscriptions(
    prisma: any,
    businessId: string,
  ): Promise<any> {
    const now = new Date();

    // Get active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        is_active: true,
        end_date: {
          gte: now,
        },
        subscription_plan: {
          business_id: businessId,
        },
        ...withDeleted(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        subscription_plan: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get subscription statistics
    const subscriptionStats = await Promise.all([
      // Total subscriptions
      prisma.subscription.count({
        where: {
          subscription_plan: {
            business_id: businessId,
          },
          ...withDeleted(),
        },
      }),
      // Active subscriptions count
      prisma.subscription.count({
        where: {
          is_active: true,
          end_date: {
            gte: now,
          },
          subscription_plan: {
            business_id: businessId,
          },
          ...withDeleted(),
        },
      }),
      // Expired subscriptions count
      prisma.subscription.count({
        where: {
          end_date: {
            lt: now,
          },
          subscription_plan: {
            business_id: businessId,
          },
          ...withDeleted(),
        },
      }),
    ]);

    return {
      active_subscriptions: activeSubscriptions,
      statistics: {
        total: subscriptionStats[0],
        active: subscriptionStats[1],
        expired: subscriptionStats[2],
      },
    };
  }

  /**
   * Get all clients for a business
   * @param prisma
   * @param businessId
   * @returns
   */
  private async getAllClients(prisma: any, businessId: string): Promise<any> {
    // Get all unique users who have interacted with this business
    const clients = await prisma.user.findMany({
      where: {
        OR: [
          // Users who made payments
          {
            payments: {
              some: {
                payment_status: PaymentStatus.SUCCESS,
                OR: [
                  {
                    purchase: {
                      path: ['business_id'],
                      string_contains: businessId,
                    },
                  },
                  {
                    subscription_plan: {
                      business_id: businessId,
                    },
                  },
                ],
              },
            },
          },
          // Users who are business contacts
          {
            business_contacts: {
              some: {
                role: Role.USER,
                business_id: businessId,
                status: MemberStatus.active,
              },
            },
          },
          // Users enrolled in courses
          {
            enrolled_courses: {
              some: {
                course: {
                  business_id: businessId,
                },
              },
            },
          },
        ],
        ...withDeleted(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        created_at: true,
        is_email_verified: true,
        is_phone_verified: true,
        business_contacts: {
          where: {
            business_id: businessId,
          },
          select: {
            id: true,
            role: true,
            status: true,
            joined_at: true,
          },
        },
        payments: {
          where: {
            payment_status: PaymentStatus.SUCCESS,
            OR: [
              {
                purchase: {
                  path: ['business_id'],
                  string_contains: businessId,
                },
              },
              {
                subscription_plan: {
                  business_id: businessId,
                },
              },
            ],
          },
          select: {
            id: true,
            amount: true,
            purchase_type: true,
            created_at: true,
          },
        },
        enrolled_courses: {
          where: {
            course: {
              business_id: businessId,
            },
          },
          select: {
            id: true,
            progress: true,
            status: true,
            enrolled_at: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      // take: 100
    });

    // Calculate client statistics
    const clientStats = {
      total: clients.length,
      verified_email: clients.filter((client) => client.is_email_verified)
        .length,
      verified_phone: clients.filter((client) => client.is_phone_verified)
        .length,
      with_payments: clients.filter((client) => client.payments.length > 0)
        .length,
      with_enrollments: clients.filter(
        (client) => client.enrolled_courses.length > 0,
      ).length,
      business_contacts: clients.filter(
        (client) => client.business_contacts.length > 0,
      ).length,
    };

    return {
      clients,
      statistics: clientStats,
    };
  }

  /**
   * Get course completions for a business
   * @param prisma
   * @param businessId
   * @returns
   */
  private async getCourseCompletions(
    prisma: any,
    businessId: string,
  ): Promise<any> {
    // Get all courses for this business
    const courses = await prisma.product.findMany({
      where: {
        business_id: businessId,
        type: 'COURSE',
        ...withDeleted(),
      },
      select: {
        id: true,
        title: true,
        created_at: true,
        enrolled: {
          select: {
            id: true,
            progress: true,
            status: true,
            completed_lessons: true,
            total_lessons: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        modules: {
          select: {
            id: true,
            title: true,
            contents: {
              select: {
                id: true,
                title: true,
                progress: {
                  select: {
                    id: true,
                    user_id: true,
                    completed_at: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Calculate completion statistics
    const completionStats = await Promise.all(
      courses.map(async (course) => {
        const totalEnrollments = course.enrolled.length;
        const completedEnrollments = course.enrolled.filter(
          (enrollment) => enrollment.progress === 100,
        ).length;
        const activeEnrollments = course.enrolled.filter(
          (enrollment) => enrollment.status === EnrollmentStatus.ACTIVE,
        ).length;

        // Calculate average progress
        const averageProgress =
          totalEnrollments > 0
            ? course.enrolled.reduce(
                (sum, enrollment) => sum + enrollment.progress,
                0,
              ) / totalEnrollments
            : 0;

        return {
          course_id: course.id,
          course_title: course.title,
          total_enrollments: totalEnrollments,
          completed_enrollments: completedEnrollments,
          active_enrollments: activeEnrollments,
          completion_rate:
            totalEnrollments > 0
              ? (completedEnrollments / totalEnrollments) * 100
              : 0,
          average_progress: Math.round(averageProgress),
          total_lessons: course.modules.reduce(
            (sum, module) => sum + module.contents.length,
            0,
          ),
        };
      }),
    );

    // Overall completion statistics
    const overallStats = {
      total_courses: courses.length,
      total_enrollments: courses.reduce(
        (sum, course) => sum + course.enrolled.length,
        0,
      ),
      total_completions: courses.reduce(
        (sum, course) =>
          sum +
          course.enrolled.filter((enrollment) => enrollment.progress === 100)
            .length,
        0,
      ),
      overall_completion_rate:
        courses.reduce((sum, course) => sum + course.enrolled.length, 0) > 0
          ? (courses.reduce(
              (sum, course) =>
                sum +
                course.enrolled.filter(
                  (enrollment) => enrollment.progress === 100,
                ).length,
              0,
            ) /
              courses.reduce(
                (sum, course) => sum + course.enrolled.length,
                0,
              )) *
            100
          : 0,
    };

    return {
      courses,
      completion_statistics: completionStats,
      overall_statistics: overallStats,
    };
  }

  /**
   * Get revenue breakdown for all products (Course, Ticket, Subscription, Digital)
   * @param payload
   * @returns
   */
  async getProductRevenueBreakdown(payload: AuthPayload & Request) {
    const businessId = payload['Business-Id'];
    const currency =
      this.configService.get<string>('DEFAULT_CURRENCY') || 'NGN';

    return await this.prisma.$transaction(async (prisma) => {
      // Courses revenue
      const courseRevenue = await prisma.enrolledCourse.findMany({
        where: { course: { business_id: businessId } },
        select: { course: { select: { price: true } }, quantity: true },
      });
      const course = courseRevenue.reduce(
        (sum, { course, quantity }) =>
          sum + (course.price?.toNumber() || 0) * (quantity || 1),
        0,
      );

      // Tickets revenue
      const ticketRevenue = await prisma.purchasedTicket.findMany({
        where: { ticket: { product: { business_id: businessId } } },
        include: { ticket_tier: true },
      });
      const ticket = ticketRevenue.reduce(
        (sum, purchased) =>
          sum +
          (purchased.ticket_tier.amount?.toNumber() * purchased.quantity || 0),
        0,
      );

      // Subscriptions revenue
      const subscriptionRevenue = await prisma.subscription.findMany({
        where: {
          subscription_plan: { business_id: businessId },
          is_active: true,
        },
        select: { plan_price_at_subscription: true },
      });
      const subscription = subscriptionRevenue.reduce(
        (sum, sub) => sum + (sub.plan_price_at_subscription?.toNumber() || 0),
        0,
      );

      // Digital Products revenue
      const digitalRevenue = await prisma.purchasedDigitalProduct.findMany({
        where: { product: { business_id: businessId } },
        include: { product: true },
      });
      const digital = digitalRevenue.reduce(
        (sum, purchased) =>
          sum +
          (purchased.product.price?.toNumber() || 0) *
            (purchased.quantity || 1),
        0,
      );

      return {
        statusCode: 200,
        data: {
          course: {
            amount: course,
            formatted: `${currency} ${course.toLocaleString()}`,
          },
          ticket: {
            amount: ticket,
            formatted: `${currency} ${ticket.toLocaleString()}`,
          },
          subscription: {
            amount: subscription,
            formatted: `${currency} ${subscription.toLocaleString()}`,
          },
          digital: {
            amount: digital,
            formatted: `${currency} ${digital.toLocaleString()}`,
          },
        },
      };
    });
  }

  /**
   * Get monthly revenue breakdown for all products (Course, Ticket, Subscription)
   * @param payload
   * @param year
   */
  // async getMonthlyProductRevenueBreakdown(
  //   payload: AuthPayload & Request,
  //   year?: number,
  // ) {
  //   const businessId = payload['Business-Id'];
  //   const currency =
  //     this.configService.get<string>('DEFAULT_CURRENCY') || 'NGN';
  //   const now = new Date();
  //   const targetYear = year || now.getFullYear();

  //   const getMonthRange = (month: number) => {
  //     const start = new Date(targetYear, month, 1);
  //     const end = new Date(targetYear, month + 1, 0, 23, 59, 59, 999);
  //     return { start, end };
  //   };

  //   const getRevenue = async (purchaseType: PurchaseType, month: number) => {
  //     const { start, end } = getMonthRange(month);

  //     if (purchaseType === PurchaseType.SUBSCRIPTION) {
  //       const subscriptions = await this.prisma.subscription.findMany({
  //         where: {
  //           created_at: { gte: start, lte: end },
  //           subscription_plan: { business_id: businessId },
  //           is_active: true, // only count active subs
  //         },
  //         select: {
  //           plan_price_at_subscription: true,
  //           currency: true,
  //         },
  //       });

  //       return subscriptions.reduce(
  //         (sum, sub) => sum + (sub.plan_price_at_subscription?.toNumber() || 0),
  //         0,
  //       );
  //     }

  //     if (purchaseType === PurchaseType.COURSE) {
  //       const enrolledCourses = await this.prisma.enrolledCourse.findMany({
  //         where: {
  //           created_at: { gte: start, lte: end },
  //           course: { business_id: businessId },
  //         },
  //         select: { course: { select: { price: true } }, quantity: true },
  //       });
  //       return enrolledCourses.reduce(
  //         (sum, { course, quantity }) =>
  //           sum + (course.price?.toNumber() || 0) * (quantity || 1),
  //         0,
  //       );
  //     }

  //     if (purchaseType === PurchaseType.TICKET) {
  //       const purchasedTickets = await this.prisma.purchasedTicket.findMany({
  //         where: {
  //           created_at: { gte: start, lte: end },
  //           ticket: { product: { business_id: businessId } },
  //         },
  //         include: { ticket_tier: true },
  //       });
  //       return purchasedTickets.reduce(
  //         (sum, purchased) =>
  //           sum +
  //           (purchased.ticket_tier.amount?.toNumber() * purchased.quantity ||
  //             0),
  //         0,
  //       );
  //     }

  //     if (purchaseType === PurchaseType.DIGITAL_PRODUCT) {
  //       const purchasedDigitalProducts =
  //         await this.prisma.purchasedDigitalProduct.findMany({
  //           where: {
  //             created_at: { gte: start, lte: end },
  //             product: { business_id: businessId },
  //           },
  //           select: {
  //             product: { select: { price: true } },
  //             quantity: true,
  //           },
  //         });
  //       return purchasedDigitalProducts.reduce(
  //         (sum, { product, quantity }) =>
  //           sum + (product?.price?.toNumber() || 0) * (quantity || 1),
  //         0,
  //       );
  //     }

  //     return 0;
  //   };

  //   const months = Array.from({ length: 12 }, (_, i) => i);
  //   const monthNames = [
  //     'Jan',
  //     'Feb',
  //     'Mar',
  //     'Apr',
  //     'May',
  //     'Jun',
  //     'Jul',
  //     'Aug',
  //     'Sep',
  //     'Oct',
  //     'Nov',
  //     'Dec',
  //   ];

  //   const monthlyData = await Promise.all(
  //     months.map(async (month) => {
  //       const [course, ticket, subscription, digital] = await Promise.all([
  //         getRevenue(PurchaseType.COURSE, month),
  //         getRevenue(PurchaseType.TICKET, month),
  //         getRevenue(PurchaseType.SUBSCRIPTION, month),
  //         getRevenue(PurchaseType.DIGITAL_PRODUCT, month),
  //       ]);

  //       return {
  //         month: monthNames[month],
  //         course: { amount: course, formatted: formatMoney(+course, currency) },
  //         ticket: { amount: ticket, formatted: formatMoney(+ticket, currency) },
  //         subscription: {
  //           amount: subscription,
  //           formatted: formatMoney(+subscription, currency),
  //         },
  //         digital: {
  //           amount: digital,
  //           formatted: formatMoney(+digital, currency),
  //         },
  //       };
  //     }),
  //   );

  //   return {
  //     statusCode: 200,
  //     data: {
  //       year: targetYear,
  //       months: monthlyData,
  //     },
  //   };
  // }
  /**
   * Get monthly revenue breakdown per product and currency
   */
  async getMonthlyProductRevenueBreakdown(
    payload: AuthPayload & Request,
    year?: number,
  ) {
    const businessId = payload['Business-Id'];
    const now = new Date();
    const targetYear = year || now.getFullYear();

    // Fetch all business currencies
    const currencies = await this.prisma.businessAccountCurrency.findMany({
      where: { business_id: businessId, deleted_at: null },
      select: { currency: true, currency_sign: true },
    });

    if (!currencies.length) {
      currencies.push({ currency: 'NGN', currency_sign: '₦' }); // fallback
    }

    const getMonthRange = (month: number) => {
      const start = new Date(targetYear, month, 1);
      const end = new Date(targetYear, month + 1, 0, 23, 59, 59, 999);
      return { start, end };
    };

    const getRevenue = async (
      purchaseType: PurchaseType,
      month: number,
      currency: string,
    ) => {
      const { start, end } = getMonthRange(month);

      if (purchaseType === PurchaseType.SUBSCRIPTION) {
        const subs = await this.prisma.subscriptionPayment.findMany({
          where: {
            created_at: { gte: start, lte: end },
            subscription: { business_id: businessId },
            currency,
          },
          select: { amount: true },
        });

        const sub_amount = subs.reduce(
          (sum, s) => sum + (s.amount?.toNumber() || 0),
          0,
        );

        return sub_amount;
      }

      if (purchaseType === PurchaseType.COURSE) {
        const enrolled = await this.prisma.enrolledCourse.findMany({
          where: {
            created_at: { gte: start, lte: end },
            course: { business_id: businessId },
            currency,
          },
          select: {
            amount: true,
            quantity: true,
          },
        });
        return enrolled.reduce(
          (sum, { amount, quantity }) =>
            sum + (amount.toNumber() || 0) * (quantity || 1),
          0,
        );
      }

      if (purchaseType === PurchaseType.TICKET) {
        const tickets = await this.prisma.purchasedTicket.findMany({
          where: {
            created_at: { gte: start, lte: end },
            ticket: { product: { business_id: businessId } },
            currency,
          },
        });
        return tickets.reduce(
          (sum, t) => sum + (t.amount?.toNumber() * t.quantity || 0),
          0,
        );
      }

      if (purchaseType === PurchaseType.DIGITAL_PRODUCT) {
        const digital = await this.prisma.purchasedDigitalProduct.findMany({
          where: {
            created_at: { gte: start, lte: end },
            product: { business_id: businessId },
            currency,
          },
          select: { amount: true, quantity: true },
        });
        return digital.reduce(
          (sum, { amount, quantity }) =>
            sum + (amount?.toNumber() || 0) * (quantity || 1),
          0,
        );
      }

      return 0;
    };

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const dataByCurrency = await Promise.all(
      currencies.map(async (c) => {
        const months = await Promise.all(
          monthNames.map(async (_, month) => {
            const [course, ticket, subscription, digital] = await Promise.all([
              getRevenue(PurchaseType.COURSE, month, c.currency),
              getRevenue(PurchaseType.TICKET, month, c.currency),
              getRevenue(PurchaseType.SUBSCRIPTION, month, c.currency),
              getRevenue(PurchaseType.DIGITAL_PRODUCT, month, c.currency),
            ]);

            return {
              month: monthNames[month],
              course: {
                amount: course,
                formatted: formatMoney(+course, c.currency),
              },
              ticket: {
                amount: ticket,
                formatted: formatMoney(+ticket, c.currency),
              },
              subscription: {
                amount: subscription,
                formatted: formatMoney(+subscription, c.currency),
              },
              digital: {
                amount: digital,
                formatted: formatMoney(+digital, c.currency),
              },
            };
          }),
        );

        return {
          currency: c.currency,
          currency_sign: c.currency_sign,
          months,
        };
      }),
    );

    return {
      statusCode: 200,
      data: {
        year: targetYear,
        currencies: dataByCurrency,
      },
    };
  }
}
